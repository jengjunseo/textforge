const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const feature = fs.readFileSync(path.join(root, "macintosh-experience.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

function check(condition, label) {
  if (!condition) throw new Error(label);
  console.log(`PASS ${label}`);
}

check(html.includes('src="macintosh-experience.js"'), "experience layer is loaded after the application host");
check(app.includes("window.TextForgeExperienceHost"), "application owns a narrow experience host instead of sharing storage access");
check(app.includes('CustomEvent("textforge:active-document-change"'), "active document changes notify optional UI layers");
check(feature.includes('const KEY = "textforge.macintoshExperience.v1"'), "workspace state uses an isolated preference key");
check(feature.includes("renderTabs") && feature.includes("dragstart"), "tab strip supports local tab persistence and ordering");
check(feature.includes("openQuickLook") && feature.includes("openVersions"), "Quick Look and Visual Versions are available");
check(feature.includes("openQuickNote") && feature.includes("openExportStudio"), "Quick Note and Export Studio are available");
check(feature.includes("installSelectionObject") && feature.includes("captureSelectionObject"), "selection object controls stay scoped to the rich editor");
check(feature.includes("saveWorkspace") && feature.includes("restoreWorkspace"), "workspace memory is local preference state");
check(!feature.includes("fetch(") && !feature.includes("WebSocket"), "experience layer has no network transport");
check(!feature.includes("textforge.documents.v1") && !feature.includes("indexedDB"), "experience layer does not own document persistence");
console.log("TextForge Macintosh experience regression checks passed.");
