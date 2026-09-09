const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const feature = fs.readFileSync(path.join(root, "macintosh-experience.js"), "utf8");
const portal = fs.readFileSync(path.join(root, "portal-library.js"), "utf8");
const portalHtml = fs.readFileSync(path.join(root, "portal-library.html"), "utf8");
const quickLook = fs.readFileSync(path.join(root, "textforge-quick-look.js"), "utf8");

assert.match(app, /getPreview: getExperiencePreview/);
assert.match(app, /getDocumentMetadata/);
assert.match(feature, /function openQuickLook/);
assert.match(feature, /TextForgeQuickLookController\?\.create/);
assert.match(feature, /getItem: \(item\) => host\.getPreview\(item\)/);
assert.match(feature, /sanitizePreview/);
assert.match(quickLook, /tf-quicklook-search/);
assert.match(quickLook, /data-quick-nav/);
assert.match(quickLook, /function sanitize/);
assert.match(portal, /request-preview/);
assert.match(portal, /navigateQuickLookMatch/);
assert.match(portalHtml, /quickLookMatchStatus/);

assert.match(feature, /function alignVersionBlocks/);
assert.match(feature, /Uint16Array/);
assert.match(feature, /tf-diff-row/);
assert.match(feature, /Previous change/);
assert.match(feature, /선택 블록 삽입/);
assert.doesNotMatch(feature, /Insert checked blocks/);
assert.match(app, /createSafetySnapshot\("before-version-insert"\)/);
assert.match(app, /pushBulkOperationUndoState\("restore-version"/);

assert.match(app, /function classifyExperienceSelection/);
assert.match(app, /IME composition is active/);
assert.match(app, /The selection is stale/);
assert.match(app, /detached writer/);
assert.match(app, /function runLocalSelectionOperation/);
assert.match(app, /function runCrossDocumentSelectionOperation/);
assert.match(app, /simulateFailure === "target-save"/);
assert.match(app, /simulateFailure === "source-save"/);
assert.ok(app.indexOf("appendExperienceHtml(target, fragmentHtml)") < app.indexOf('if (action === "move")'), "move copies to target before deleting source");
assert.match(app, /rolledBack: true/);
assert.match(app, /function undoExperienceOperation/);
assert.match(app, /Use History or a Safety Snapshot instead/);
assert.match(feature, /Placement: document end/);
assert.match(feature, /data-send="copy"/);
assert.match(feature, /data-send="move"/);
assert.match(feature, /data-send="link"/);

const fastInput = app.slice(app.indexOf("function syncRichToDocumentFast"), app.indexOf("function syncRichToDocumentFull"));
assert.doesNotMatch(fastInput, /getExperiencePreview|captureExperienceSelection|alignVersionBlocks|runCrossDocumentSelectionOperation/);
assert.doesNotMatch(app, /indexedDB\.open\([^)]*,\s*[4-9]/);

process.stdout.write("TextForge Macintosh Part 3 regression checks passed.\n");
