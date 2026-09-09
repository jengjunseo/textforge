const fs = require("fs");
const path = require("path");
const assert = require("assert").strict;

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const feature = fs.readFileSync(path.join(root, "macintosh-experience.js"), "utf8");
const detached = fs.readFileSync(path.join(root, "detached-editor.js"), "utf8");
const detachedHtml = fs.readFileSync(path.join(root, "detached-editor.html"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

function functionSource(source, name, nextName) {
  const start = source.indexOf(`function ${name}`);
  const end = source.indexOf(`function ${nextName}`, start + 1);
  assert.ok(start >= 0 && end > start, `${name} source is available`);
  return source.slice(start, end);
}

assert.match(feature, /SCHEMA_VERSION = 2/);
assert.match(feature, /recentlyClosed/);
assert.match(feature, /closeOtherTabs/);
assert.match(feature, /closeTabsToRight/);
assert.match(feature, /reopenClosedTab/);
assert.match(feature, /role", "tablist/);
assert.match(feature, /aria-selected/);
assert.match(feature, /event\.altKey && event\.shiftKey/);

assert.match(html, /id="referencePaneBody"[^>]+contenteditable="true"/);
assert.match(html, /id="referenceSourceEditor"/);
assert.match(html, /id="splitDivider"[^>]+role="separator"/);
assert.match(app, /function syncReferenceDocumentFast/);
assert.match(app, /function flushReferenceDocumentNow/);
assert.match(app, /function swapDocumentPanes/);
assert.match(app, /dividerRatio/);
assert.doesNotMatch(functionSource(app, "syncReferenceDocumentFast", "flushReferenceDocumentNow"), /renderActive\(/);

assert.match(app, /DETACHED_CHANNEL_NAME = "textforge\.detached-editor\.v1"/);
assert.match(app, /const detachedEditorLeases = new Map/);
assert.match(app, /baseUpdatedAt/);
assert.match(app, /rememberDetachedRequest/);
assert.match(app, /ownership-denied/);
assert.match(detachedHtml, /id="reattachBtn"/);
assert.match(detached, /sessionStorage/);
assert.doesNotMatch(detached, /localStorage|indexedDB/);
assert.doesNotMatch(detached, /textforge\.documents\.v1/);
assert.doesNotMatch(detached, /fetch\(|WebSocket/);

assert.match(feature, /function openWorkspaceManager/);
assert.match(feature, /function createWorkspaceSnapshot/);
assert.match(feature, /MAX_WORKSPACES = 20/);
assert.match(feature, /sameWorkspaceName/);
assert.match(feature, /restore rolled back/);
assert.match(feature, /detachedFallback/);
assert.doesNotMatch(functionSource(feature, "createWorkspaceSnapshot", "sameWorkspaceName"), /contentHtml|content:/);
assert.doesNotMatch(feature, /indexedDB|textforge\.documents\.v1/);

process.stdout.write("TextForge Macintosh Part 2 regression checks passed.\n");
