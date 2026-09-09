const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { performance } = require("node:perf_hooks");
const core = require("../textforge-universal-command.js");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const mac = fs.readFileSync(path.join(root, "macintosh-experience.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

function test(name, callback) {
  try { callback(); process.stdout.write(`PASS ${name}\n`); }
  catch (error) { process.stderr.write(`FAIL ${name}\n${error.stack}\n`); process.exitCode = 1; }
}

test("Resume v2 stores document-specific view state and reads legacy payloads", () => {
  assert.match(app, /version: 2/);
  assert.match(app, /previousDocuments/);
  assert.match(app, /resume\.version === 2/);
  assert.match(app, /documents\.find\(\(doc\) => !doc\.deletedAt\)/);
});

test("Contextual Inspector uses editor-owned formatting and structural safety", () => {
  assert.match(app, /function getContextualInspectorState/);
  assert.match(app, /function runContextualInspectorCommand/);
  assert.match(app, /createSafetySnapshot\(`before-\$\{action\}`\)/);
  assert.match(mac, /setTimeout\(render, 70\)/);
  assert.match(mac, /host\.isComposing\(\)/);
  assert.match(html, /id="contextInspectorPanel"/);
});

test("Universal Command has one registry path and IME-safe keyboard execution", () => {
  assert.match(app, /function universalCommandItems/);
  assert.match(app, /universalCommandComposing/);
  assert.match(app, /event\.keyCode !== 229/);
  assert.match(app, /setAttribute\("role", "option"\)/);
  assert.doesNotMatch(core.search.toString(), /innerHTML|DOMParser/);
});

test("1,000 metadata search p95 stays below 30ms", () => {
  const items = Array.from({ length: 1000 }, (_, index) => ({ id: `doc-${index}`, title: `프로젝트 문서 ${index}`, aliases: `tag-${index % 20}`, searchText: `프로젝트 문서 ${index} release metadata tag-${index % 20}`, recentScore: 0 }));
  const samples = [];
  for (let run = 0; run < 80; run += 1) {
    const start = performance.now();
    const result = core.search(items, `문서 ${run % 20}`, 48);
    samples.push(performance.now() - start);
    assert.ok(result.length > 0);
  }
  samples.sort((a, b) => a - b);
  const p95 = samples[Math.floor(samples.length * 0.95)];
  assert.ok(p95 < 30, `p95 ${p95.toFixed(2)}ms`);
  process.stdout.write(`Universal Command 1,000 metadata p95 ${p95.toFixed(2)}ms.\n`);
});

if (!process.exitCode) process.stdout.write("TextForge Macintosh Part 1 regression checks passed.\n");
