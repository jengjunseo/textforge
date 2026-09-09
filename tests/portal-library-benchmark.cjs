const assert = require("node:assert/strict");
const { performance } = require("node:perf_hooks");
const core = require("../portal-library-core.js");
const { createLibraryDocuments, createPortalScaleDocuments } = require("./textforge-fixtures.cjs");

function percentile(values, ratio) {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] || 0;
}

function measure(documents, samples = 120) {
  const durations = [];
  for (let index = 0; index < samples + 20; index += 1) {
    const start = performance.now();
    const filtered = core.filterDocuments(documents, {
      smartFolder: index % 3 === 0 ? "all" : index % 3 === 1 ? "favorites" : "long",
      query: index % 2 ? "local" : "portal",
      now: Date.now(),
    });
    core.sortDocuments(filtered, index % 2 ? "updated" : "title");
    const duration = performance.now() - start;
    if (index >= 20) durations.push(duration);
  }
  const total = durations.reduce((sum, value) => sum + value, 0);
  return {
    samples: durations.length,
    avg: total / durations.length,
    p50: percentile(durations, 0.5),
    p95: percentile(durations, 0.95),
    max: Math.max(...durations),
  };
}

const localReady = createLibraryDocuments();
const scale = createPortalScaleDocuments();
const report = {
  generatedAt: new Date().toISOString(),
  runtime: process.version,
  localReady39: measure(localReady),
  scale1000: measure(scale),
};

assert.ok(report.localReady39.p95 < 30, `39-document Portal p95 exceeded 30ms: ${report.localReady39.p95}`);
assert.ok(report.scale1000.p95 < 30, `1,000-document Portal p95 exceeded 30ms: ${report.scale1000.p95}`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
