const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const index = read("index.html");
const app = read("app.js");
const mac = read("macintosh-experience.js");
const portalHtml = read("portal-library.html");
const portal = read("portal-library.js");
const styles = read("styles.css");

function test(name, callback) {
  try { callback(); process.stdout.write(`PASS ${name}\n`); }
  catch (error) { process.stderr.write(`FAIL ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

test("default toolbar exposes six canonical controls", () => {
  const toolbar = index.slice(index.indexOf('<div class="toolbar"'), index.indexOf("</header>", index.indexOf('<div class="toolbar"')));
  ["sidebarToggleBtn", "quickNoteBtn", "exportStudioBtn", "inspectorToggleBtn"].forEach((id) => assert.match(toolbar, new RegExp(`id="${id}"`)));
  assert.match(toolbar, /class="segmented view-segmented"/);
  assert.match(toolbar, /class="menu-wrap more-menu"/);
  assert.doesNotMatch(toolbar, /workModeSelect|legacy-mode-buttons|diagnosticsOpenBtn/);
});

test("duplicate and developer surfaces are absent from normal DOM", () => {
  assert.doesNotMatch(index, /id="workModeSelect"|class="segmented legacy-mode-buttons"/);
  assert.doesNotMatch(index, /id="export(?:Txt|Md|Html|Pdf|Doc|Epub|Card)Btn"/);
  assert.doesNotMatch(index, /id="diagnosticsOpenBtn"|id="topRecoverBtn"|id="topLogModeBtn"|id="logModeBtn"/);
  assert.doesNotMatch(index, /id="finderView"|id="docContextMenu"/);
  assert.doesNotMatch(app, /function openFinder|function renderFinder|finderState/);
  assert.doesNotMatch(portalHtml, /quickCapture|Quick Capture/);
  assert.match(portalHtml, /id="quickNoteBtn"[^>]*>Quick Note</);
});

test("advanced features keep canonical entry points", () => {
  ["versionsBtn", "documentInfoBtn", "sourceModeBtn", "workspaceBtn", "detachedEditorBtn", "moreLibraryBtn", "topForgeSnapshotBtn"].forEach((id) => assert.match(index, new RegExp(`id="${id}"`)));
  assert.match(app, /id: "view-source", title: "소스 편집"/);
  assert.match(app, /id: "forge-snapshot", title: "문서함 백업"/);
  assert.match(mac, /id: "mac-versions", title: "이전 버전"/);
});

test("Portal Quick Note reuses the main Macintosh flow", () => {
  assert.match(portal, /postToMain\("open-quick-note"\)/);
  assert.match(app, /message\.type === "open-quick-note"/);
  assert.match(app, /TextForgeMacintoshExperience\?\.openQuickNote/);
  assert.doesNotMatch(app, /message\.type === "quick-capture"/);
  assert.doesNotMatch(portal, /quickCapture|Quick Capture/);
});

test("developer commands require Lab preference", () => {
  for (const id of ["ui-mode", "diagnostics-open", "diagnostics-quick", "diagnostics-export", "diagnostics-real-library", "diagnostics-writer-readiness", "diagnostics-release-gate"]) {
    assert.match(app, new RegExp(`id: "${id}"[^\n]+labOnly: true`));
  }
  assert.match(app, /item\.labOnly && uiMode !== "lab"/);
});

test("Macintosh duplicate chrome is removed without deleting feature APIs", () => {
  assert.doesNotMatch(mac, /context\.id = "tfContextBar"|tf-tab-add/);
  assert.match(mac, /window\.TextForgeMacintoshExperience = \{ openQuickLook, openVersions, openQuickNote, openExportStudio, openDetached/);
  assert.match(styles, /\.app-shell\.sidebar-collapsed/);
  assert.match(styles, /@media \(max-width: 860px\)/);
});

test("storage and export contracts remain unchanged", () => {
  assert.equal((app.match(/const DB_VERSION = 1;/g) || []).length, 1);
  for (const format of ["txt", "md", "html", "doc", "pdf", "epub", "card"]) assert.match(app, new RegExp(`${format}: \\{ label:`));
  assert.match(app, /function persistSoon/);
  assert.match(app, /function recoverSession/);
  assert.match(app, /function openForgeSnapshotPanel/);
});

if (!process.exitCode) process.stdout.write("TextForge Macintosh Surface Cleanup checks passed.\n");
