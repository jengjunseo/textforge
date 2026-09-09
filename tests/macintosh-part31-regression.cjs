const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const app = read("app.js");
const feature = read("macintosh-experience.js");
const quickLook = read("textforge-quick-look.js");
const index = read("index.html");
const detached = read("detached-editor.js");
const detachedHtml = read("detached-editor.html");

assert.match(index, /textforge-quick-look\.js/);
assert.match(detachedHtml, /textforge-quick-look\.js/);
assert.match(quickLook, /window\.TextForgeQuickLookController = \{ create, sanitize \}/);
assert.match(quickLook, /options\.getItem\(item, config\)/);
assert.match(quickLook, /options\.onClose/);
assert.match(quickLook, /returnFocus\.focus\(\{ preventScroll: true \}\)/);
assert.match(feature, /TextForgeQuickLookController\?\.create/);
assert.match(detached, /TextForgeQuickLookController\?\.create/);

assert.match(feature, /function workspaceDocumentReferences/);
assert.match(feature, /workspace\.tabs/);
assert.match(feature, /workspace\.split\?\.panes/);
assert.match(feature, /workspace\.detached/);
assert.match(feature, /workspace:\$\{workspace\.id\}:\$\{index\}/);
assert.match(feature, /tf-workspace-doc-ref/);
const workspaceCapture = feature.slice(feature.indexOf("function captureWorkspace"), feature.indexOf("function normalizeWorkspace"));
assert.doesNotMatch(workspaceCapture, /contentHtml|plainText|\bcontent\b/);

assert.match(app, /data-backlink-doc-id/);
assert.match(feature, /function openBacklinkQuickLook/);
assert.match(feature, /backlink:\$\{index\}:\$\{button\.dataset\.backlinkDocId\}/);
assert.match(index, /data-pane-quicklook="main"/);
assert.match(index, /data-pane-quicklook="reference"/);
assert.match(feature, /function openSplitPaneQuickLook/);
assert.match(app, /splitWorkspace\.activePaneId === "main"/);
assert.match(app, /splitWorkspace\.activePaneId === "reference"/);

assert.match(detached, /previewRequestId/);
assert.match(detached, /previewRequests = new Map/);
assert.match(detached, /if \(!pending\) return/);
assert.match(detached, /Main window is unavailable/);
assert.match(app, /message\.type === "preview-request"/);
assert.match(app, /payload\.previewRequestId/);
assert.match(app, /preview-response/);
assert.match(app, /getExperiencePreview/);
assert.match(app, /lease\.windowId !== windowId/);
assert.doesNotMatch(detached, /localStorage|indexedDB/);

const fastInput = app.slice(app.indexOf("function syncRichToDocumentFast"), app.indexOf("function syncRichToDocumentFull"));
assert.doesNotMatch(fastInput, /getExperiencePreview|TextForgeQuickLook|renderSystemPanel|renderDocInfoPanel/);
assert.doesNotMatch(app, /indexedDB\.open\([^)]*,\s*[4-9]/);

process.stdout.write("TextForge Macintosh Part 3.1 regression checks passed.\n");
