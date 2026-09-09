const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.resolve(__dirname, "..", "app.js"), "utf8");

function functionSource(name, nextName) {
  const start = appSource.indexOf(`function ${name}`);
  const end = appSource.indexOf(`function ${nextName}`, start);
  assert.ok(start >= 0 && end > start, `${name} source not found`);
  return appSource.slice(start, end);
}

function test(name, callback) {
  try {
    callback();
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    process.stderr.write(`FAIL ${name}\n${error.stack}\n`);
    process.exitCode = 1;
  }
}

test("resume state stays inside the existing session payload", () => {
  assert.match(appSource, /const SESSION_KEY = "textforge\.sessionRecovery\.v1"/);
  assert.match(appSource, /resume:\s*\{\s*version: 2/);
  assert.match(appSource, /documents:\s*activeId \? \{ \.\.\.previousDocuments, \[activeId\]: currentState \}/);
  assert.match(appSource, /function readSessionRecoverySnapshot/);
  assert.match(appSource, /function persistSessionRecoveryState/);
});

test("rich selection is stored as bounded DOM paths and restored defensively", () => {
  const serialize = functionSource("serializeEditorBoundary", "resolveEditorBoundary");
  const restore = functionSource("restoreRichEditorSelection", "placeCaretAtEditorEnd");
  assert.match(serialize, /path\.length >= 64/);
  assert.match(restore, /try \{/);
  assert.match(restore, /catch \{/);
  assert.match(appSource, /function placeCaretAtEditorEnd/);
});

test("startup fallback skips missing or deleted active documents", () => {
  const resolver = functionSource("resolveStartupActiveDocument", "currentEditorMode");
  assert.match(resolver, /!doc\.deletedAt/);
  assert.match(resolver, /documents\.find\(\(doc\) => !doc\.deletedAt\)/);
  assert.match(appSource, /const first = createDocument\(""\);/);
});

test("resume persistence stays out of the rich input fast path", () => {
  const start = appSource.indexOf("function syncRichToDocumentFast");
  const end = appSource.indexOf("function syncRichToDocumentFull", start);
  const fastPath = appSource.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.equal(fastPath.includes("persistSessionRecoveryState"), false);
  assert.equal(fastPath.includes("scheduleSessionRecoverySave"), false);
});

test("IME composition skips persisted rich selection and resume does not edit content", () => {
  const selection = functionSource("serializeRichEditorSelection", "restoreRichEditorSelection");
  const focus = functionSource("restoreStartupFocus", "scheduleStartupResume");
  assert.match(selection, /if \(compositionActive\) return null;/);
  assert.equal(focus.includes("syncRichToDocument"), false);
  assert.equal(focus.includes("updateActive"), false);
});

test("focus follows viewport and selection restoration with safe fallbacks", () => {
  const focus = functionSource("restoreStartupFocus", "scheduleStartupResume");
  assert.match(focus, /restoreSessionViewport/);
  assert.match(focus, /restoreRichEditorSelection/);
  assert.match(focus, /placeCaretAtEditorEnd/);
  assert.match(focus, /focusWithoutScroll\(els\.richEditor\)/);
  assert.match(focus, /focusWithoutScroll\(els\.editor\)/);
});

test("manual session recovery validates a missing saved document", () => {
  const recover = functionSource("recoverSession", "saveManualSnapshot");
  assert.match(recover, /documents\.some\(\(doc\) => doc\.id === snapshot\.id && !doc\.deletedAt\)/);
  assert.match(recover, /resolveStartupActiveDocument\(snapshot\)/);
});

if (!process.exitCode) process.stdout.write("TextForge session-resume regression checks passed.\n");
