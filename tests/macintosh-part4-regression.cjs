const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const experience = fs.readFileSync(path.join(root, "macintosh-experience.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");

function includes(source, value, message) {
  assert.ok(source.includes(value), message);
}

includes(experience, 'const QUICK_NOTE_DRAFT_KEY = "textforge.quickNoteDraft.v1"', "Quick Note uses an isolated draft key");
includes(experience, "QUICK_NOTE_DRAFT_VERSION = 1", "Quick Note draft is versioned");
includes(experience, "sessionStorage.setItem(QUICK_NOTE_DRAFT_KEY", "Quick Note draft is session scoped");
includes(experience, "sessionStorage.removeItem(QUICK_NOTE_DRAFT_KEY", "Quick Note draft can be explicitly discarded");
includes(experience, 'target: "new-inbox"', "Inbox is the default Quick Note target");
includes(experience, 'value="new-document"', "Quick Note supports a regular new document");
includes(experience, 'value="append-current"', "Quick Note supports appending to the active document");
includes(experience, 'value="append:${esc(doc.id)}"', "Quick Note supports a selected existing target");
includes(experience, "quickNoteRecentTargets", "Quick Note remembers recent metadata-only targets");
includes(experience, "let submitting = false", "Quick Note guards duplicate submission");
includes(experience, "event.isComposing", "Quick Note guards IME composition");
includes(experience, "body.requestSubmit()", "Quick Note has an explicit keyboard save chord");
includes(experience, "host.saveQuickNote", "Quick Note delegates writes to the main writer");
includes(app, 'const QUICK_NOTE_OPERATION_KEY = "textforge.quickNoteOperations.v1"', "Quick Note requests are idempotent across repeated responses");
includes(app, "quickNoteOperationResults.get(requestId)", "Quick Note deduplicates a repeated request ID");
includes(app, "quickNoteOperationsInFlight.get(requestId)", "Concurrent duplicate Quick Note requests share one in-flight write");
includes(app, 'addSnapshot(doc, "Safety: append Quick Note")', "Quick Note append creates a Safety Snapshot");
includes(app, 'pushExperienceOperation("quick-note-append"', "Quick Note append participates in operation Undo");
includes(app, "restoreExperienceDocumentState(before)", "Quick Note append rolls back after a failed save");
includes(app, "isDocumentDetached(doc.id)", "Quick Note respects detached writer ownership");
includes(app, "request.targetRevision !== doc.updatedAt", "Quick Note rejects stale targets");
includes(app, 'persistExperienceOperationDurably()', "Quick Note saves through durable storage");
includes(app, "const EXPORT_CAPABILITIES = Object.freeze", "Export Studio exposes explicit format capabilities");
for (const format of ["txt", "md", "html", "doc", "pdf", "epub", "card"]) {
  includes(app, `${format}: { label:`, `Export Studio supports the existing ${format} format`);
}
includes(app, "function buildExportArtifact(request = {})", "Preview and output share one export representation");
includes(app, "function getExportPreview(request = {})", "Export Studio has a read-only preview boundary");
includes(app, "function exportDocument(request = {})", "Export Studio has one save boundary");
includes(app, "function copyExportDocument(request = {})", "Export Studio can copy its generated representation");
includes(app, "setTimeout(() => URL.revokeObjectURL(url), 1000)", "Export object URLs are cleaned after download starts");
includes(app, "20, 0, 0, 0, 0, crc", "EPUB local ZIP headers use the required field count");
includes(app, "20, 20, 0, 0, 0, 0, crc", "EPUB central ZIP headers use the required field count");
includes(app, "sanitizeRichHtml(doc.contentHtml", "Export representation sanitizes rich source HTML");
includes(experience, "function normalizeExportPreferences", "Export preferences have a safe normalization path");
includes(experience, "return { version: 1, format, byFormat }", "Per-format export preferences are versioned");
includes(experience, "host.getExportPreview", "Export preview uses the main export pipeline");
includes(experience, "host.exportDocument", "Export action uses the main export pipeline");
includes(experience, "host.copyExportDocument", "Export copy uses the main export pipeline");
includes(experience, "exportQuickLookController", "Export preview reuses the shared Quick Look controller");
assert.ok(!/name="scope"/.test(experience), "Forge Snapshot is not presented as an Export Studio format or scope");
assert.ok(!/openForgeSnapshotPanel\(\).*Export Studio/.test(experience), "Export Studio does not alter Forge Snapshot behavior");
assert.equal((app.match(/const DB_VERSION = 1;/g) || []).length, 1, "IndexedDB version remains unchanged");
assert.ok(index.indexOf('src="app.js"') < index.indexOf('src="macintosh-experience.js"'), "The single document writer loads before the experience layer");

console.log("TextForge Macintosh Part 4 contract checks passed.");
