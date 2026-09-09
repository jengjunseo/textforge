const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "textforge-migration.js"), "utf8");
const context = {
  window: {},
  crypto: crypto.webcrypto,
  TextEncoder,
  Blob,
  URL,
  setTimeout,
  clearTimeout,
};
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "textforge-migration.js" });

const bridge = context.window.TextForgeMigration;
assert.equal(typeof bridge, "object");
assert.equal(bridge.FORMAT_ID, "textforge-migration");
assert.equal(bridge.SCHEMA_VERSION, 1);

const input = {
  sourceVersion: "1.0.0",
  activeDocumentId: "doc-1",
  documents: [{
    id: "doc-1",
    title: "한국어 Rich 문서",
    content: "마지막 입력",
    contentHtml: "<p><strong>마지막 입력</strong></p>",
    type: "note",
    folderId: "folder-child",
    color: "#167c80",
    deletedAt: null,
    theme: "modern",
    modelVersion: 3,
    tags: ["중요", "rich"],
    favorite: true,
    history: [{ id: "history-1", label: "보호본", content: "이전", contentHtml: "<p>이전</p>", createdAt: "2026-01-01T00:00:00.000Z" }],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  }],
  folders: [
    { id: "folder-root", name: "프로젝트", parentId: null, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
    { id: "folder-child", name: "초안", parentId: "folder-root", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  ],
  prompts: [{ name: "요약", text: "요약해줘" }],
  collections: [{ id: "collection-1", name: "이번 주", docIds: ["doc-1"] }],
  workspaces: [{
    id: "workspace-1",
    name: "집중 작업",
    savedAt: "2026-01-02T00:00:00.000Z",
    activeTab: "doc-1",
    tabs: [{ docId: "doc-1", viewState: { scrollTop: 99, selection: { start: 2, end: 2 } } }],
    split: { layout: "single", dividerRatio: 0.5, panes: [{ id: "main", documentId: "doc-1", mode: "rich", lockedScroll: false, scrollTop: 99 }] },
    inspector: { open: true, tab: "toc" },
    focus: true,
    sidebarOpen: true,
  }],
};

(async () => {
  const payload = bridge.buildPayload(input);
  const text = await bridge.serialize(payload);
  const parsed = await bridge.parse(text);
  assert.equal(JSON.stringify(parsed.data), JSON.stringify(payload.data));
  assert.equal(parsed.format, "textforge-migration");
  assert.equal(parsed.schemaVersion, 1);
  assert.equal(parsed.source.version, "1.0.0");
  assert.match(parsed.exportedAt, /^20\d\d-/);
  assert.equal(parsed.integrity.algorithm, "SHA-256");
  assert.equal(parsed.data.workspaces[0].tabs[0].docId, "doc-1");
  assert.equal("viewState" in parsed.data.workspaces[0].tabs[0], false);
  assert.equal("scrollTop" in parsed.data.workspaces[0].split.panes[0], false);

  await assert.rejects(() => bridge.parse(text.replace("마지막 입력", "변조된 입력")), /integrity check failed/);
  await assert.rejects(() => bridge.parse(JSON.stringify({ format: "other", schemaVersion: 1 })), /not a TextForge migration file/);
  await assert.rejects(() => bridge.parse(JSON.stringify({ format: "textforge-migration", schemaVersion: 99 })), /Unsupported TextForge migration schema/);
  await assert.rejects(() => bridge.parse("{"), /not valid JSON/);
  assert.throws(() => bridge.buildPayload({ ...input, documents: [{ ...input.documents[0], id: "" }] }), /documents\[0\]\.id is invalid/);
  console.log("textforge-migration-regression: ok");
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
