const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const core = require("../portal-library-core.js");
const fixtures = require("./textforge-fixtures.cjs");

const root = path.resolve(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const appSource = read("app.js");
const indexSource = read("index.html");
const portalSource = read("portal-library.js");
const portalHtmlSource = read("portal-library.html");
const portalCssSource = read("portal-library.css");
const stylesSource = read("styles.css");
const serverSource = read("dev-server.js");

function getFunctionSource(source, name, nextName) {
  const start = source.indexOf(`function ${name}`);
  const end = nextName ? source.indexOf(`function ${nextName}`, start) : source.length;
  assert.ok(start >= 0 && end > start, `${name} source not found`);
  return source.slice(start, end);
}

const now = Date.now();
const documents = [
  { id: "a", title: "Alpha", previewText: "release notes", contentHtml: "<p>Alpha</p>", folderId: null, tags: ["release"], favorite: true, charCount: 1200, historyCount: 1, updatedAt: new Date(now).toISOString(), createdAt: new Date(now - 1000).toISOString() },
  { id: "b", title: "Beta", previewText: "long document", contentHtml: "<p>Beta</p>", folderId: "f1", tags: ["writing"], favorite: false, charCount: 17000, historyCount: 0, updatedAt: new Date(now - 2 * 86400000).toISOString(), createdAt: new Date(now - 2 * 86400000).toISOString() },
  { id: "c", title: "Untitled 1", previewText: "draft", contentHtml: "<p>Draft</p>", folderId: null, tags: [], favorite: false, charCount: 30, historyCount: 0, updatedAt: new Date(now - 40 * 86400000).toISOString(), createdAt: new Date(now - 40 * 86400000).toISOString() },
  { id: "d", title: "Deleted", previewText: "trash", contentHtml: "<p>Deleted</p>", folderId: null, tags: [], favorite: false, charCount: 7, historyCount: 0, deletedAt: now, updatedAt: new Date(now).toISOString(), createdAt: new Date(now).toISOString() },
];
const folders = [
  { id: "f1", name: "Writing", parentId: null },
  { id: "f2", name: "Drafts", parentId: "f1" },
  { id: "f3", name: "Archive", parentId: "f2" },
];

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    process.stderr.write(`FAIL ${name}\n${error.stack}\n`);
    process.exitCode = 1;
  }
}

test("view filters preserve source document hash", () => {
  const before = core.documentsHash(documents);
  core.filterDocuments(documents, { smartFolder: "favorites", query: "release", now });
  core.filterDocuments(documents, { smartFolder: "long", now });
  core.sortDocuments(documents, "title");
  assert.equal(core.documentsHash(documents), before);
});

test("isolated fixtures cover required long and legacy document shapes", () => {
  const editor = fixtures.createEditorFixtures();
  assert.equal(editor.empty.charCount, 0);
  assert.equal(editor.long17k.charCount, 17000);
  assert.equal(editor.long100k.charCount, 100000);
  assert.equal(editor.oneLine50k.charCount, 50000);
  assert.match(editor.nestedFormatting.contentHtml, /<blockquote>/);
  assert.equal(Object.hasOwn(editor.legacy, "contentHtml"), false);
  const library = fixtures.createLibraryDocuments();
  assert.equal(library.length, 39);
  assert.equal(library.reduce((sum, doc) => sum + doc.charCount, 0), 228622);
});

test("Portal filtering and sorting preserve all isolated fixture sources", () => {
  const documents = [...Object.values(fixtures.createEditorFixtures()).filter((doc) => doc.contentHtml), ...fixtures.createLibraryDocuments()];
  const before = core.documentsHash(documents);
  core.filterDocuments(documents, { smartFolder: "recent", query: "local" });
  core.filterDocuments(documents, { smartFolder: "recovery" });
  core.sortDocuments(documents, "chars");
  assert.equal(core.documentsHash(documents), before);
});

test("smart folders return expected documents", () => {
  assert.deepEqual(core.filterDocuments(documents, { smartFolder: "favorites", now }).map((doc) => doc.id), ["a"]);
  assert.deepEqual(core.filterDocuments(documents, { smartFolder: "long", now }).map((doc) => doc.id), ["b"]);
  assert.deepEqual(core.filterDocuments(documents, { smartFolder: "untitled", now }).map((doc) => doc.id), ["c"]);
  assert.deepEqual(core.filterDocuments(documents, { smartFolder: "trash", now }).map((doc) => doc.id), ["d"]);
  assert.deepEqual(core.filterDocuments(documents, { smartFolder: "inbox", now }).map((doc) => doc.id), ["a", "c"]);
});

test("search uses metadata and not document HTML parsing", () => {
  assert.deepEqual(core.filterDocuments(documents, { smartFolder: "all", query: "writing", now }).map((doc) => doc.id), ["b"]);
  assert.equal(core.filterDocuments(documents, { smartFolder: "all", query: "<p>Alpha", now }).length, 0);
});

test("shift and ctrl selection are deterministic", () => {
  const visible = ["a", "b", "c", "d"];
  assert.deepEqual(core.updateSelection([], visible, "b"), ["b"]);
  assert.deepEqual(core.updateSelection(["b"], visible, "d", { shift: true, anchorId: "b" }), ["b", "c", "d"]);
  assert.deepEqual(core.updateSelection(["b", "c"], visible, "c", { additive: true }), ["b"]);
});

test("folder cycles are rejected", () => {
  assert.equal(core.canMoveFolder(folders, "f1", "f3"), false);
  assert.equal(core.canMoveFolder(folders, "f2", "f2"), false);
  assert.equal(core.canMoveFolder(folders, "f3", "f1"), true);
  assert.deepEqual(core.buildFolderPath(folders, "f3").map((folder) => folder.id), ["f1", "f2", "f3"]);
});

test("Portal bridge does not write document content during metadata operations", () => {
  const start = appSource.indexOf("async function handlePortalLibraryMessage");
  const end = appSource.indexOf("function initPortalLibraryBridge", start);
  const bridge = appSource.slice(start, end);
  assert.ok(start > 0 && end > start);
  assert.equal(/\.contentHtml\s*=/.test(bridge), false);
  assert.equal(/\.content\s*=/.test(bridge), false);
  assert.match(bridge, /before-portal-operation/);
});

test("Sidebar and Portal keep distinct library roles", () => {
  assert.match(indexSource, /id="docList"/);
  assert.match(indexSource, /id="portalLibraryBtn"/);
  assert.doesNotMatch(indexSource, /id="finderView"|id="docContextMenu"/);
  assert.doesNotMatch(appSource, /function openFinder|function renderFinder|finderState/);
  assert.match(portalHtmlSource, /id="librarySurface"/);
  assert.match(portalHtmlSource, /aria-multiselectable="true"/);
});

test("Portal Quick Note uses the canonical Macintosh flow", () => {
  assert.match(portalSource, /quickNoteBtn\.addEventListener\("click", \(\) => postToMain\("open-quick-note"\)\)/);
  assert.match(appSource, /message\.type === "open-quick-note"/);
  assert.doesNotMatch(appSource, /message\.type === "quick-capture"/);
  assert.doesNotMatch(portalSource, /quickCapture|Quick Capture/);
});

test("typing fast path remains free of full derived refresh", () => {
  const start = appSource.indexOf("function syncRichToDocumentFast");
  const end = appSource.indexOf("function syncRichToDocumentFull", start);
  const fastPath = appSource.slice(start, end);
  assert.ok(start > 0 && end > start);
  assert.equal(fastPath.includes("refreshDocDerived"), false);
  assert.equal(fastPath.includes("sanitizeRichHtml"), false);
  assert.match(fastPath, /scheduleSanitizedSync/);
});

test("storage keys and durable storage model remain compatible", () => {
  ["textforge.documents.v1", "textforge.activeDocument.v1", "textforge.sessionRecovery.v1", "textforge.folders.v1", "textforge.pointer.v2"].forEach((key) => assert.ok(appSource.includes(key), key));
  assert.match(appSource, /DB_NAME = "textforge-personal-storage"/);
  assert.match(appSource, /DB_VERSION = 1/);
});

test("Portal has no network or cloud transport", () => {
  const clientSources = [appSource, portalSource, read("portal-library-core.js"), read("forge-snapshot.js"), read("textforge-diagnostics.js")].join("\n");
  assert.equal(/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|supabase|vercel|firebase/i.test(clientSources), false);
  assert.match(portalSource, /BroadcastChannel/);
});

test("Portal assets are wired and document ids remain unique", () => {
  assert.match(indexSource, /id="portalLibraryBtn"/);
  assert.match(indexSource, /portal-library-core\.js/);
  const ids = [...indexSource.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  ["portal-library.html", "portal-library.css", "portal-library.js", "portal-library-core.js"].forEach((name) => assert.ok(fs.existsSync(path.join(root, name)), name));
  const portalIds = [...portalHtmlSource.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(portalIds).size, portalIds.length);
  assert.match(portalHtmlSource, /role="listbox"/);
  assert.match(portalHtmlSource, /aria-multiselectable="true"/);
  assert.match(portalHtmlSource, /id="moveSelectionBtn"/);
  assert.match(portalHtmlSource, /id="moveDialog"[^>]+aria-labelledby="moveDialogTitle"/);
  assert.match(portalSource, /function submitMove/);
});

test("4K and reduced-motion safeguards are present", () => {
  assert.match(stylesSource, /@media \(min-width: 2200px\)/);
  assert.match(portalCssSource, /@media \(min-width: 2200px\)/);
  assert.match(stylesSource, /prefers-reduced-motion: reduce/);
  assert.match(portalCssSource, /prefers-reduced-motion: reduce/);
});

test("modal focus trapping and restoration are initialized", () => {
  assert.match(appSource, /initModalAccessibility\(\);/);
  const modalSource = getFunctionSource(appSource, "initModalAccessibility", "renderPreview");
  assert.match(modalSource, /returnFocusByDialog/);
  assert.match(modalSource, /event\.key === "Escape"/);
  assert.match(modalSource, /event\.key !== "Tab"/);
});

test("diagnostics cleanup guard checks clone safety without requiring body drift", () => {
  const diagnosticsSource = read("textforge-diagnostics.js");
  assert.match(diagnosticsSource, /cleanupClone !== cleanupSource/);
  assert.match(diagnosticsSource, /!cleanupClone\.contentHtml\.includes\("<script"\)/);
});

test("dev server resolves query strings without treating them as filenames", () => {
  assert.match(serverSource, /new URL\(req\.url/);
  assert.match(serverSource, /requestUrl\.pathname/);
  assert.match(serverSource, /path\.relative\(root, filePath\)/);
});

test("Windows app launchers remain available", () => {
  ["Start TextForge.cmd", "launch-textforge-app.bat", "manifest.json", "TextForge.ico"].forEach((name) => assert.ok(fs.existsSync(path.join(root, name)), name));
});

if (!process.exitCode) process.stdout.write("TextForge regression checks passed.\n");
