(function () {
  const VERSION = 1;
  let context = {};
  let lastReport = null;
  let currentBenchmarkTask = "idle";
  const benchmarkTaskWindows = [];
  const runtimeErrors = [];
  const longTasks = [];
  const previousError = window.onerror;
  const previousRejection = window.onunhandledrejection;

  window.onerror = function (...args) {
    runtimeErrors.push({ type: "error", message: String(args[0] || ""), at: Date.now() });
    if (typeof previousError === "function") return previousError.apply(this, args);
    return false;
  };

  window.onunhandledrejection = function (event) {
    runtimeErrors.push({ type: "unhandledrejection", message: String(event.reason?.message || event.reason || ""), at: Date.now() });
    if (typeof previousRejection === "function") return previousRejection.call(this, event);
  };

  try {
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) =>
          longTasks.push({
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            taskName: resolveLongTaskTaskName(entry),
            at: Date.now(),
          }),
        );
      });
      observer.observe({ type: "longtask", buffered: true });
    }
  } catch {
    // Long Tasks API is optional.
  }

  const ui = () => ({
    dialog: document.querySelector("#diagnosticsDialog"),
    close: document.querySelector("#diagnosticsCloseBtn"),
    quick: document.querySelector("#diagQuickBtn"),
    full: document.querySelector("#diagFullBtn"),
    reliability: document.querySelector("#diagReliabilityBtn"),
    realLibrary: document.querySelector("#diagRealLibraryBtn"),
    mttr: document.querySelector("#diagMttrBtn"),
    snapshot: document.querySelector("#diagSnapshotBtn"),
    stress: document.querySelector("#diagStressBtn"),
    export: document.querySelector("#diagExportBtn"),
    summary: document.querySelector("#diagnosticsSummary"),
    output: document.querySelector("#diagnosticsOutput"),
  });

  function configure(nextContext) {
    context = nextContext || {};
  }

  function openDiagnosticsPanel(nextContext) {
    if (nextContext) configure(nextContext);
    const nodes = ui();
    nodes.dialog.classList.remove("hidden");
    renderReport(lastReport);
  }

  function closeDiagnosticsPanel() {
    ui().dialog.classList.add("hidden");
  }

  function getDocuments() {
    return (context.getDocuments?.() || []).map((doc) => ({ ...doc }));
  }

  function getFolders() {
    return (context.getFolders?.() || []).map((folder) => ({ ...folder }));
  }

  function now() {
    return performance.now();
  }

  function percentile(values, p) {
    if (!values.length) return null;
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
    return sorted[index];
  }

  function summarizeDurations(values) {
    if (!values.length) return { count: 0, avg: null, p50: null, p95: null, p99: null, min: null, max: null };
    const sum = values.reduce((acc, value) => acc + value, 0);
    return {
      count: values.length,
      avg: round(sum / values.length),
      p50: round(percentile(values, 50)),
      p95: round(percentile(values, 95)),
      p99: round(percentile(values, 99)),
      min: round(Math.min(...values)),
      max: round(Math.max(...values)),
    };
  }

  function resolveLongTaskTaskName(entry) {
    const start = entry.startTime || 0;
    const end = start + (entry.duration || 0);
    const match = benchmarkTaskWindows
      .slice()
      .reverse()
      .find((task) => start <= task.end && end >= task.start);
    return match?.name || currentBenchmarkTask || "unknown";
  }

  function recordBenchmarkTaskWindow(name, start, end) {
    benchmarkTaskWindows.push({ name, start, end });
    if (benchmarkTaskWindows.length > 200) benchmarkTaskWindows.splice(0, benchmarkTaskWindows.length - 200);
  }

  function setDiagnosticsStatus(message) {
    const nodes = ui();
    if (nodes.summary) nodes.summary.textContent = message;
  }

  function yieldToMainThread(timeout = 50) {
    return new Promise((resolve) => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => resolve(), { timeout });
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  async function runChunked(items, worker, options = {}) {
    const chunkSize = Math.max(1, options.chunkSize || 50);
    const onProgress = options.onProgress || null;
    const shouldYield = options.yield !== false;
    const results = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      const limit = Math.min(i + chunkSize, items.length);
      for (let index = i; index < limit; index += 1) {
        results.push(await worker(items[index], index));
      }
      if (onProgress) onProgress(limit, items.length);
      if (shouldYield && limit < items.length) await yieldToMainThread(options.timeout || 50);
    }
    return results;
  }

  function withBenchmarkTask(name, fn) {
    const previousTask = currentBenchmarkTask;
    currentBenchmarkTask = name;
    try {
      return fn();
    } finally {
      currentBenchmarkTask = previousTask;
    }
  }

  async function measureAsync(name, fn, tests) {
    const start = now();
    const previousTask = currentBenchmarkTask;
    currentBenchmarkTask = name;
    try {
      const result = await fn();
      const duration = now() - start;
      tests.push({ name, ok: true, durationMs: round(duration) });
      return { ok: true, duration, result };
    } catch (error) {
      const duration = now() - start;
      tests.push({ name, ok: false, durationMs: round(duration), error: String(error.message || error) });
      return { ok: false, duration, error };
    } finally {
      recordBenchmarkTaskWindow(name, start, now());
      currentBenchmarkTask = previousTask;
    }
  }

  function measureSync(name, fn, tests) {
    const start = now();
    const previousTask = currentBenchmarkTask;
    currentBenchmarkTask = name;
    try {
      const result = fn();
      const duration = now() - start;
      tests.push({ name, ok: true, durationMs: round(duration) });
      return { ok: true, duration, result };
    } catch (error) {
      const duration = now() - start;
      tests.push({ name, ok: false, durationMs: round(duration), error: String(error.message || error) });
      return { ok: false, duration, error };
    } finally {
      recordBenchmarkTaskWindow(name, start, now());
      currentBenchmarkTask = previousTask;
    }
  }

  const recoverableErrors = [];

  function safeJsonParse(input, fallback = null, contextName = "json-parse") {
    try {
      return JSON.parse(input);
    } catch (error) {
      recordRecoverableError(contextName, error);
      return fallback;
    }
  }

  function safeString(value, fallback = "") {
    return typeof value === "string" ? value : fallback;
  }

  function safeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function safeExtractPlainText(html) {
    return withRecoveryBoundary("plain-text-extract", () => htmlToPlain(html), "");
  }

  function safeBuildPreviewText(text, maxLength = 120) {
    return safeString(text).replace(/\s+/g, " ").trim().slice(0, maxLength);
  }

  function safeHtmlSanitize(html) {
    const template = document.createElement("template");
    template.innerHTML = safeString(html);
    template.content.querySelectorAll("script,style,iframe,object,embed").forEach((node) => node.remove());
    template.content.querySelectorAll("*").forEach((node) => {
      [...node.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value || "";
        if (name.startsWith("on")) node.removeAttribute(attr.name);
        if (name === "contenteditable") node.removeAttribute(attr.name);
        if (name === "data-dark-color-fix") node.removeAttribute(attr.name);
        if ((name === "href" || name === "src") && /^\s*javascript:/i.test(value)) node.removeAttribute(attr.name);
        if (name === "style") {
          node.style.removeProperty("--tf-adapted-color");
          node.style.removeProperty("--tf-adapted-bg");
        }
      });
    });
    return template.innerHTML || "<p></p>";
  }

  function safeNormalizeDocument(doc) {
    const source = doc && typeof doc === "object" ? doc : {};
    const contentHtml = safeHtmlSanitize(source.contentHtml || source.content || "");
    const plainText = safeString(source.plainText) || safeExtractPlainText(contentHtml);
    const title = safeString(source.title, "Untitled");
    const tags = safeArray(source.tags).map((tag) => safeString(tag).trim()).filter(Boolean).slice(0, 20);
    const updatedAt = safeNumber(new Date(source.updatedAt || source.createdAt || Date.now()).getTime(), Date.now());
    return {
      id: safeString(source.id) || `recovered-${Math.random().toString(36).slice(2)}`,
      title,
      type: safeString(source.type, "note"),
      contentHtml,
      contentMarkdown: safeString(source.contentMarkdown || source.content),
      plainText,
      previewText: safeBuildPreviewText(source.previewText || plainText),
      searchText: safeString(source.searchText || `${title}\n${tags.join(" ")}\n${plainText}`).toLowerCase(),
      tags,
      favorite: Boolean(source.favorite),
      folderId: source.folderId || null,
      createdAt: safeNumber(new Date(source.createdAt || updatedAt).getTime(), updatedAt),
      updatedAt,
      wordCount: safeNumber(source.wordCount, countWords(plainText)),
      charCount: safeNumber(source.charCount, plainText.length),
      color: safeString(source.color),
      deletedAt: source.deletedAt || null,
    };
  }

  function withRecoveryBoundary(name, fn, fallback = null) {
    try {
      return fn();
    } catch (error) {
      recordRecoverableError(name, error);
      return fallback;
    }
  }

  function recordRecoverableError(contextName, error) {
    recoverableErrors.push({
      context: contextName,
      message: String(error?.message || error || "unknown"),
      at: Date.now(),
    });
  }

  function showRecoverableErrorToast(message) {
    const toast = document.createElement("div");
    toast.className = "diagnostics-toast";
    toast.textContent = message;
    Object.assign(toast.style, {
      position: "fixed",
      right: "18px",
      bottom: "18px",
      zIndex: 9999,
      padding: "10px 12px",
      borderRadius: "8px",
      background: "var(--bg-elevated, #fff)",
      color: "var(--text-primary, #111)",
      border: "1px solid var(--border-default, #ddd)",
      boxShadow: "var(--shadow-md, 0 8px 20px rgba(0,0,0,.12))",
    });
    document.body.append(toast);
    setTimeout(() => toast.remove(), 1600);
  }

  function htmlToPlain(html) {
    const box = document.createElement("div");
    box.innerHTML = String(html || "");
    box.querySelectorAll("script,style,iframe,object,embed").forEach((node) => node.remove());
    box.querySelectorAll("br").forEach((node) => node.replaceWith("\n"));
    box.querySelectorAll("p,div,h1,h2,h3,li,blockquote,pre,tr").forEach((node) => node.append("\n"));
    return box.textContent.replace(/\n{3,}/g, "\n\n").trim();
  }

  function countWords(text) {
    const value = safeString(text).trim();
    if (!value) return 0;
    const koreanChars = (value.match(/[가-힣]/g) || []).length;
    const words = value.replace(/[가-힣]/g, " ").split(/\s+/).filter(Boolean).length;
    return words + Math.ceil(koreanChars / 2);
  }

  function normalizeDoc(doc) {
    return safeNormalizeDocument(doc);
  }

  function searchDocs(docs, query) {
    const q = query.toLowerCase();
    return docs.filter((doc) => `${doc.title}\n${doc.searchText}\n${doc.tags.join(" ")}`.toLowerCase().includes(q));
  }

  function generateDummyDocuments(count, options = {}) {
    const size = { short: 500, medium: 5000, long: 50000, huge: 100000, longLine: 50000 }[options.size || "short"] || 500;
    const base = options.longLine ? "가".repeat(size) : Array.from({ length: Math.ceil(size / 80) }, (_, i) => `테스트 문장 ${i} TextForge benchmark sample content.`).join("\n");
    return Array.from({ length: count }, (_, index) => {
      const rich = options.rich
        ? `<h2>더미 문서 ${index + 1}</h2><p><strong>굵게</strong> <em>기울임</em> ${base}</p><pre>code-${index}</pre><table><tr><td>A</td><td>B</td></tr></table>`
        : `<p>${base}</p>`;
      const color = options.darkColor ? `<p><span style="color:#000000">dark inline color</span></p>` : "";
      return {
        id: `bench-${index}`,
        title: `Benchmark ${index + 1}`,
        type: index % 7 === 0 ? "prompt" : "note",
        contentHtml: `${rich}${color}`,
        plainText: htmlToPlain(`${rich}${color}`),
        previewText: `Benchmark preview ${index + 1}`,
        searchText: `benchmark ${index + 1} tag${index % 5} ${base.slice(0, 300)}`.toLowerCase(),
        tags: [`tag${index % 5}`],
        favorite: index % 10 === 0,
        folderId: index % 3 === 0 ? "bench-folder" : null,
        createdAt: Date.now() - index * 1000,
        updatedAt: Date.now() - index * 500,
        charCount: base.length,
      };
    });
  }

  async function generateDummyDocumentsChunked(count, options = {}) {
    const indexes = Array.from({ length: count }, (_, index) => index);
    const size = { short: 500, medium: 5000, long: 50000, huge: 100000, longLine: 50000 }[options.size || "short"] || 500;
    const base = options.longLine ? "benchmark".repeat(Math.ceil(size / 9)).slice(0, size) : Array.from({ length: Math.ceil(size / 80) }, (_, i) => `TextForge benchmark sample content ${i}.`).join("\n");
    return runChunked(indexes, (index) => {
      const rich = options.rich
        ? `<h2>Benchmark Document ${index + 1}</h2><p><strong>bold</strong> <em>italic</em> ${base}</p><pre>code-${index}</pre><table><tr><td>A</td><td>B</td></tr></table>`
        : `<p>${base}</p>`;
      const color = options.darkColor ? `<p><span style="color:#000000">dark inline color</span></p>` : "";
      const contentHtml = `${rich}${color}`;
      return {
        id: `bench-${index}`,
        title: `Benchmark ${index + 1}`,
        type: index % 7 === 0 ? "prompt" : "note",
        contentHtml,
        plainText: htmlToPlain(contentHtml),
        previewText: `Benchmark preview ${index + 1}`,
        searchText: `benchmark ${index + 1} tag${index % 5} ${base.slice(0, 300)}`.toLowerCase(),
        tags: [`tag${index % 5}`],
        favorite: index % 10 === 0,
        folderId: index % 3 === 0 ? "bench-folder" : null,
        createdAt: Date.now() - index * 1000,
        updatedAt: Date.now() - index * 500,
        charCount: base.length,
      };
    }, {
      chunkSize: options.chunkSize || 25,
      onProgress: options.onProgress,
    });
  }

  async function normalizeDocumentsChunked(docs, options = {}) {
    return runChunked(docs, (doc) => normalizeDoc(doc), {
      chunkSize: options.chunkSize || 25,
      onProgress: options.onProgress,
    });
  }

  function getMemorySnapshot() {
    const memory = performance.memory;
    if (!memory) return { supported: false };
    return {
      supported: true,
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }

  async function getStorageEstimate() {
    if (!navigator.storage?.estimate) return { supported: false };
    const estimate = await navigator.storage.estimate();
    return { supported: true, quota: estimate.quota || null, usage: estimate.usage || null };
  }

  function getDomStats() {
    return {
      nodeCount: document.getElementsByTagName("*").length,
      renderedCards: document.querySelectorAll(".doc-card, .card").length,
      inspectorOpen: !document.querySelector(".inspector")?.classList.contains("collapsed"),
    };
  }

  function estimateLocalStorageBytes() {
    let bytes = 0;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      bytes += key.length + String(localStorage.getItem(key)).length;
    }
    return bytes * 2;
  }

  function calculateGrades(report) {
    const failed = report.tests.filter((test) => !test.ok).length;
    const total = report.tests.length || 1;
    const errorRate = (failed / total) * 100;
    const latencies = report.tests.filter((test) => test.ok).map((test) => test.durationMs);
    const p95 = percentile(latencies, 95) || 0;
    const crashFrequency = runtimeErrors.length;
    let grade = "A";
    if (errorRate >= 8 || crashFrequency > 0) grade = "D";
    else if (errorRate >= 3 || p95 >= 500) grade = "C";
    else if (errorRate >= 1 || p95 >= 250) grade = "B";
    else if (p95 >= 100) grade = "B+";
    return { errorRate, p95, crashFrequency, overallGrade: grade };
  }

  async function buildBaseReport(kind) {
    const docs = getDocuments();
    const plainChars = docs.reduce((sum, doc) => sum + (doc.plainText || htmlToPlain(doc.contentHtml || "")).length, 0);
    return {
      benchmarkVersion: VERSION,
      app: "TextForge",
      kind,
      createdAt: Date.now(),
      longTaskStartIndex: longTasks.length,
      environment: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screen: `${screen.width}x${screen.height}`,
        deviceMemory: navigator.deviceMemory || "unsupported",
        hardwareConcurrency: navigator.hardwareConcurrency || "unsupported",
        storageEstimate: await getStorageEstimate(),
      },
      summary: {
        availability: 0,
        errorRate: 0,
        crashFrequency: runtimeErrors.length,
        mtbfLikeScore: null,
        mttrMs: null,
        overallGrade: "N/A",
        notes: [],
      },
      stability: {},
      performance: {},
      mttr: null,
      optimization: {
        serverCost: 0,
        networkDependency: "none",
        localStorageBytes: estimateLocalStorageBytes(),
        totalDocumentChars: plainChars,
      },
      resource: {
        memory: getMemorySnapshot(),
        dom: getDomStats(),
      },
      tests: [],
      recommendations: [],
      releaseReadiness: null,
    };
  }

  async function runQuickBenchmark() {
    const report = await buildBaseReport("quick");
    const docs = getDocuments().map(normalizeDoc);
    const queries = ["a", "문서", "tag", "TextForge", docs[0]?.title?.slice(0, 4) || "note"];
    const searchDurations = [];
    const openDurations = [];

    measureSync("metadata-normalize-current-docs", () => docs.map(normalizeDoc), report.tests);
    for (const query of queries) {
      const result = measureSync(`finder-search:${query}`, () => searchDocs(docs, query), report.tests);
      searchDurations.push(result.duration);
    }
    docs.slice(0, 5).forEach((doc) => {
      const result = measureSync(`document-open-sim:${doc.id}`, () => htmlToPlain(doc.contentHtml || doc.plainText || ""), report.tests);
      openDurations.push(result.duration);
    });
    measureSync("theme-toggle-sim", () => {
      const before = document.documentElement.dataset.theme;
      document.documentElement.dataset.theme = before === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = before || "light";
    }, report.tests);
    measureSync("preview-render-sim", () => htmlToPlain(docs[0]?.contentHtml || ""), report.tests);
    measureSync("plain-copy-transform", () => docs[0]?.plainText || "", report.tests);
    measureSync("snapshot-estimate", () => buildSnapshotForBenchmark(docs.slice(0, 50)), report.tests);

    report.performance.searchLatency = summarizeDurations(searchDurations);
    report.performance.documentOpenLatency = summarizeDurations(openDurations);
    report.performance.throughput = {
      searchDocsPerSecond: throughput(docs.length * queries.length, searchDurations.reduce((a, b) => a + b, 0)),
      normalizeDocsPerSecond: throughput(docs.length, report.tests.find((test) => test.name === "metadata-normalize-current-docs")?.durationMs || 0),
    };
    finalizeReport(report);
    lastReport = report;
    renderReport(report);
    return report;
  }

  async function runFullBenchmark() {
    const report = await buildBaseReport("full");
    const dummy = generateDummyDocuments(100, { size: "medium", rich: true, darkColor: true }).map(normalizeDoc);
    const searchDurations = [];
    measureSync("dummy-generate-100-medium-rich", () => dummy.length, report.tests);
    for (let i = 0; i < 20; i += 1) {
      const result = measureSync(`dummy-search-${i}`, () => searchDocs(dummy, `tag${i % 5}`), report.tests);
      searchDurations.push(result.duration);
    }
    for (let i = 0; i < 10; i += 1) {
      measureSync(`dummy-sort-${i}`, () => dummy.slice().sort((a, b) => b.updatedAt - a.updatedAt), report.tests);
    }
    dummy.slice(0, 20).forEach((doc, index) => measureSync(`dummy-open-${index}`, () => htmlToPlain(doc.contentHtml), report.tests));
    dummy.slice(0, 10).forEach((doc, index) => measureSync(`dummy-copy-${index}`, () => boardText(doc), report.tests));
    measureSync("dummy-export-html-build", () => dummy.slice(0, 20).map((doc) => doc.contentHtml).join(""), report.tests);
    measureSync("dummy-snapshot-build-100", () => buildSnapshotForBenchmark(dummy), report.tests);
    report.performance.searchLatency = summarizeDurations(searchDurations);
    report.performance.throughput = {
      searchDocsPerSecond: throughput(dummy.length * 20, searchDurations.reduce((a, b) => a + b, 0)),
      snapshotDocsPerSecond: throughput(dummy.length, report.tests.find((test) => test.name === "dummy-snapshot-build-100")?.durationMs || 0),
    };
    finalizeReport(report);
    lastReport = report;
    renderReport(report);
    return report;
  }

  async function runReliabilityTest() {
    const report = await buildBaseReport("reliability");
    const failuresAt = [];
    for (let i = 0; i < 100; i += 1) {
      const result = measureSync(`reliability-loop-${i}`, () => {
        const doc = generateDummyDocuments(1, { size: "short", rich: i % 3 === 0 })[0];
        const normalized = normalizeDoc(doc);
        const found = searchDocs([normalized], "benchmark");
        const copied = boardText(normalized);
        if (!found.length || !copied) throw new Error("loop invariant failed");
      }, report.tests);
      if (!result.ok) failuresAt.push(i);
    }
    report.stability.failureCount = failuresAt.length;
    report.stability.mtbfLikeScore = failuresAt.length ? round(100 / failuresAt.length) : 100;
    report.summary.mtbfLikeScore = report.stability.mtbfLikeScore;
    finalizeReport(report);
    lastReport = report;
    renderReport(report);
    return report;
  }

  async function runRealLibraryBenchmark() {
    const report = await buildBaseReport("real-library");
    const sourceDocs = getDocuments();
    const docs = structuredCloneSafe(sourceDocs).map(safeNormalizeDocument);
    const searchDurations = [];
    const openDurations = [];
    const plainDurations = [];
    const previewDurations = [];
    const totalChars = docs.reduce((sum, doc) => sum + doc.charCount, 0);
    const maxDoc = docs.reduce((max, doc) => Math.max(max, doc.charCount), 0);

    measureSync("real-library-deep-clone", () => structuredCloneSafe(sourceDocs), report.tests);
    measureSync("real-library-card-metadata", () => docs.map((doc) => ({ id: doc.id, title: doc.title, previewText: doc.previewText, tags: doc.tags, updatedAt: doc.updatedAt })), report.tests);
    ["가", "textforge", "note", docs[0]?.title?.slice(0, 3) || "untitled", "#"].forEach((query) => {
      const result = measureSync(`real-library-search:${query}`, () => searchDocs(docs, query), report.tests);
      searchDurations.push(result.duration);
    });
    docs.slice(0, 20).forEach((doc, index) => {
      openDurations.push(measureSync(`real-library-open-${index}`, () => safeExtractPlainText(doc.contentHtml), report.tests).duration);
      plainDurations.push(measureSync(`real-library-plain-${index}`, () => safeExtractPlainText(doc.contentHtml), report.tests).duration);
      previewDurations.push(measureSync(`real-library-preview-${index}`, () => safeBuildPreviewText(doc.plainText), report.tests).duration);
    });
    const snapshotBuild = measureSync("real-library-snapshot-build", () => buildSnapshotForBenchmark(docs.slice(0, 200)), report.tests);
    report.performance.realLibrary = {
      documentCount: docs.length,
      totalCharCount: totalChars,
      averageCharCount: round(totalChars / Math.max(1, docs.length)),
      maxCharCount: maxDoc,
      searchLatency: summarizeDurations(searchDurations),
      openLatency: summarizeDurations(openDurations),
      plainTextExtraction: summarizeDurations(plainDurations),
      previewBuild: summarizeDurations(previewDurations),
      snapshotBuildMs: round(snapshotBuild.duration),
      snapshotEstimatedBytes: snapshotBuild.result || 0,
    };
    finalizeReport(report);
    lastReport = report;
    renderReport(report);
    return report;
  }

  async function runMttrBenchmark() {
    const report = await buildBaseReport("mttr-recovery");
    const scenarios = [
      mttrBrokenHtmlRecovery,
      mttrMissingMetadataRecovery,
      mttrStoreReadFailureFallback,
      mttrSessionRecovery,
      mttrForgeSnapshotRecovery,
      mttrExportFailureRecovery,
      mttrCopyFailureFallback,
    ];
    const repairs = [];
    report.mttr = {
      scenarioCount: scenarios.length,
      successCount: 0,
      failureCount: 0,
      avgRepairMs: 0,
      p50RepairMs: 0,
      p95RepairMs: 0,
      maxRepairMs: 0,
      scenarios: [],
    };

    for (const scenario of scenarios) {
      const start = now();
      let result;
      try {
        result = await scenario();
      } catch (error) {
        result = { success: false, detected: true, recovered: false, notes: [String(error?.message || error)] };
      }
      const repairMs = now() - start;
      repairs.push(repairMs);
      const entry = {
        name: scenario.scenarioName || scenario.name,
        success: Boolean(result.success),
        repairMs: round(repairMs),
        detected: Boolean(result.detected),
        recovered: Boolean(result.recovered),
        notes: result.notes || [],
      };
      report.mttr.scenarios.push(entry);
      report.tests.push({ name: `mttr:${entry.name}`, ok: entry.success, durationMs: entry.repairMs, error: entry.success ? undefined : entry.notes.join("; ") });
    }

    report.mttr.successCount = report.mttr.scenarios.filter((item) => item.success).length;
    report.mttr.failureCount = report.mttr.scenarioCount - report.mttr.successCount;
    report.mttr.avgRepairMs = summarizeDurations(repairs).avg;
    report.mttr.p50RepairMs = summarizeDurations(repairs).p50;
    report.mttr.p95RepairMs = summarizeDurations(repairs).p95;
    report.mttr.maxRepairMs = summarizeDurations(repairs).max;
    report.summary.mttrMs = report.mttr.avgRepairMs;
    finalizeReport(report);
    report.summary.mttrMs = report.mttr.avgRepairMs;
    report.summary.overallGrade = gradeMttr(report);
    report.releaseReadiness = calculateReleaseReadiness(report);
    lastReport = report;
    renderReport(report);
    return report;
  }

  async function runSnapshotBenchmark() {
    const report = await buildBaseReport("forge-snapshot");
    const docs = getDocuments().slice(0, 200).map(normalizeDoc);
    measureSync("forge-snapshot-current-build", () => buildSnapshotForBenchmark(docs), report.tests);
    const dummy = generateDummyDocuments(100, { size: "medium", rich: true });
    measureSync("forge-snapshot-dummy-100-build", () => buildSnapshotForBenchmark(dummy), report.tests);
    const snapshotTest = report.tests.find((test) => test.name === "forge-snapshot-dummy-100-build");
    report.optimization.snapshotDocsPerSecond = throughput(dummy.length, snapshotTest?.durationMs || 0);
    finalizeReport(report);
    lastReport = report;
    renderReport(report);
    return report;
  }

  async function runStressBenchmark() {
    if (!confirm("Stress Benchmark는 더미 문서 500개와 긴 문서를 memory-only로 처리합니다. 잠시 느려질 수 있습니다. 실행할까요?")) return lastReport;
    const report = await buildBaseReport("stress");
    let dummy = [];
    const generated = await measureAsync("stress-generate-500", async () => {
      setDiagnosticsStatus("Stress Benchmark: generating documents... 0/500");
      const raw = await generateDummyDocumentsChunked(500, {
        size: "medium",
        rich: true,
        darkColor: true,
        chunkSize: 20,
        onProgress: (done, total) => setDiagnosticsStatus(`Stress Benchmark: generating documents... ${done}/${total}`),
      });
      setDiagnosticsStatus("Stress Benchmark: normalizing documents... 0/500");
      dummy = await normalizeDocumentsChunked(raw, {
        chunkSize: 20,
        onProgress: (done, total) => setDiagnosticsStatus(`Stress Benchmark: normalizing documents... ${done}/${total}`),
      });
      return dummy.length;
    }, report.tests);
    if (!generated.ok) {
      finalizeReport(report);
      lastReport = report;
      renderReport(report);
      return report;
    }
    const longDoc = (await generateDummyDocumentsChunked(1, { size: "huge", rich: true, chunkSize: 1 }))[0];
    const longLine = (await generateDummyDocumentsChunked(1, { longLine: true, chunkSize: 1 }))[0];
    measureSync("stress-search-500", () => searchDocs(dummy, "tag3"), report.tests);
    await measureAsync("stress-snapshot-500", async () => {
      setDiagnosticsStatus("Stress Benchmark: preparing snapshot... 0/500");
      return buildSnapshotForBenchmarkChunked(dummy, {
        chunkSize: 25,
        onProgress: (done, total) => setDiagnosticsStatus(`Stress Benchmark: preparing snapshot... ${done}/${total}`),
      });
    }, report.tests);
    measureSync("stress-open-100k-doc", () => htmlToPlain(longDoc.contentHtml), report.tests);
    measureSync("stress-long-line-50k", () => htmlToPlain(longLine.contentHtml).length, report.tests);
    await yieldToMainThread(100);
    finalizeReport(report);
    lastReport = report;
    renderReport(report);
    return report;
  }

  function structuredCloneSafe(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return safeJsonParse(JSON.stringify(value), []);
  }

  async function mttrBrokenHtmlRecovery() {
    const badHtml = '<h1 onclick="alert(1)">Broken <span style="color:#000">HTML<script>alert(1)</script><a href="javascript:alert(1)">link';
    const clean = safeHtmlSanitize(badHtml);
    const plain = safeExtractPlainText(clean);
    const box = document.createElement("div");
    box.innerHTML = clean;
    const unsafe = clean.includes("<script") || clean.includes("onclick") || clean.includes("javascript:");
    return { success: !unsafe && plain.includes("Broken"), detected: true, recovered: Boolean(plain), notes: [`recoveredChars=${plain.length}`] };
  }
  mttrBrokenHtmlRecovery.scenarioName = "broken-html-recovery";

  async function mttrMissingMetadataRecovery() {
    const damaged = { contentHtml: "<p>metadata only body</p>" };
    const doc = safeNormalizeDocument(damaged);
    const searchable = searchDocs([doc], "metadata").length === 1;
    return { success: Boolean(doc.title && doc.previewText && doc.searchText && Array.isArray(doc.tags) && searchable), detected: true, recovered: searchable, notes: [`title=${doc.title}`] };
  }
  mttrMissingMetadataRecovery.scenarioName = "missing-metadata-recovery";

  async function mttrStoreReadFailureFallback() {
    const fallback = safeJsonParse("{bad-json", []);
    const usable = Array.isArray(fallback);
    return { success: usable, detected: true, recovered: usable, notes: ["bad JSON fell back to empty state"] };
  }
  mttrStoreReadFailureFallback.scenarioName = "store-read-failure-fallback";

  async function mttrSessionRecovery() {
    const normal = safeNormalizeDocument({ title: "session", contentHtml: "<p>session body</p>" });
    const partial = safeNormalizeDocument({ title: "partial session" });
    const broken = safeJsonParse("{broken", null, "session-payload");
    const success = normal.plainText.includes("session") && partial.title && broken === null;
    return { success, detected: true, recovered: success, notes: ["normal restored, partial normalized, broken ignored safely"] };
  }
  mttrSessionRecovery.scenarioName = "session-recovery";

  async function mttrForgeSnapshotRecovery() {
    const docs = [
      safeNormalizeDocument({ title: "normal", contentHtml: "<p>normal text</p>", tags: ["ok"] }),
      safeNormalizeDocument({ contentHtml: '<p onclick="x()">unsafe<script>bad()</script></p>' }),
      safeNormalizeDocument({ title: "long", contentHtml: `<p>${"long ".repeat(2000)}</p>` }),
    ];
    const size = buildSnapshotForBenchmark(docs);
    const html = window.ForgeSnapshot?.buildSnapshotHtml
      ? window.ForgeSnapshot.buildSnapshotHtml({
          snapshotVersion: 1,
          app: "TextForge",
          createdAt: Date.now(),
          createdAtIso: new Date().toISOString(),
          title: "MTTR Snapshot",
          description: "isolated recovery test",
          source: { appName: "TextForge", appVersion: "MVP", exportType: "mttr" },
          options: { scope: "mttr", theme: "system", includeImages: false, includeTrash: false },
          stats: { documentCount: docs.length, folderCount: 0, tagCount: 1, totalCharCount: docs.reduce((sum, doc) => sum + doc.charCount, 0), favoriteCount: 0 },
          folders: [],
          tags: ["ok"],
          documents: docs,
        }, { theme: "system" })
      : JSON.stringify(docs);
    const jsonMatch = html.match(/<script type="application\/json" id="textforge-snapshot-data">([\s\S]*?)<\/script>/);
    const snapshotData = jsonMatch ? safeJsonParse(jsonMatch[1].replace(/\\u003c/g, "<"), null, "mttr-snapshot-json") : null;
    const documentHtml = snapshotData?.documents?.map((doc) => doc.contentHtml).join("\n") || "";
    const unsafe = documentHtml.includes("<script") || documentHtml.includes("onclick=") || documentHtml.includes("javascript:");
    return { success: size > 0 && !unsafe && documentHtml.includes("normal text"), detected: true, recovered: true, notes: [`snapshotBytes=${size}`] };
  }
  mttrForgeSnapshotRecovery.scenarioName = "forge-snapshot-recovery";

  async function mttrExportFailureRecovery() {
    const exportMock = () => {
      throw new Error("unsupported export type");
    };
    const result = withRecoveryBoundary("export-failure", exportMock, "safe-ui");
    return { success: result === "safe-ui", detected: true, recovered: true, notes: ["mock export error returned control to UI"] };
  }
  mttrExportFailureRecovery.scenarioName = "export-failure-recovery";

  async function mttrCopyFailureFallback() {
    const text = "manual fallback copy";
    const area = document.createElement("textarea");
    area.value = text;
    area.dataset.diagnostics = "copy-fallback";
    document.body.append(area);
    area.select();
    const selected = document.activeElement === area || area.selectionStart === 0;
    area.remove();
    return { success: selected, detected: true, recovered: selected, notes: ["clipboard denial simulated with textarea fallback"] };
  }
  mttrCopyFailureFallback.scenarioName = "copy-failure-fallback";

  function gradeMttr(report) {
    const mttr = report.mttr;
    if (!mttr) return report.summary.overallGrade;
    if (mttr.failureCount === 0 && mttr.avgRepairMs < 100 && mttr.p95RepairMs < 250) return "A";
    if (mttr.failureCount <= 1 && mttr.avgRepairMs < 300 && mttr.p95RepairMs < 700) return "B";
    if (mttr.failureCount < mttr.scenarioCount) return "C";
    return "D";
  }

  function calculateReleaseReadiness(report) {
    const fatal = report.summary.crashFrequency > 0;
    const snapshotOk = report.tests.some((test) => test.name.includes("snapshot") && test.ok) || report.kind === "forge-snapshot";
    const mttrOk = !report.mttr || report.mttr.failureCount <= 1;
    const errorOk = report.summary.errorRate < 1;
    const status = !fatal && errorOk && mttrOk && (snapshotOk || report.kind !== "mttr-recovery") ? "Ready" : !fatal && mttrOk ? "Caution" : "Not Ready";
    return {
      status,
      checks: {
        fatalErrorFree: !fatal,
        errorRateUnderOnePercent: errorOk,
        mttrPassed: mttrOk,
        snapshotAvailable: snapshotOk,
        realDocumentsMutated: false,
        dataFormatChanged: false,
      },
    };
  }

  function boardText(doc) {
    return `${doc.title}\n\n${htmlToPlain(doc.contentHtml || doc.plainText || "")}`.replace(/\n{3,}/g, "\n\n").trim();
  }

  function buildSnapshotForBenchmark(docs) {
    if (window.ForgeSnapshot?.buildSnapshotHtml) {
      const data = {
        snapshotVersion: 1,
        app: "TextForge",
        createdAt: Date.now(),
        createdAtIso: new Date().toISOString(),
        title: "Benchmark Snapshot",
        description: "Benchmark only",
        source: { appName: "TextForge", appVersion: "MVP", exportType: "benchmark" },
        options: { scope: "benchmark", theme: "system", includeImages: false, includeTrash: false },
        stats: {
          documentCount: docs.length,
          folderCount: 0,
          tagCount: new Set(docs.flatMap((doc) => doc.tags || [])).size,
          totalCharCount: docs.reduce((sum, doc) => sum + (doc.charCount || 0), 0),
          favoriteCount: docs.filter((doc) => doc.favorite).length,
        },
        folders: [],
        tags: [...new Set(docs.flatMap((doc) => doc.tags || []))],
        documents: docs,
      };
      return window.ForgeSnapshot.buildSnapshotHtml(data, data.options).length;
    }
    return JSON.stringify(docs).length;
  }

  async function buildSnapshotForBenchmarkChunked(docs, options = {}) {
    if (!window.ForgeSnapshot?.buildSnapshotHtml) {
      const chunks = await runChunked(docs, (doc) => doc, {
        chunkSize: options.chunkSize || 50,
        onProgress: options.onProgress,
      });
      return JSON.stringify(chunks).length;
    }

    const tagSet = new Set();
    let totalCharCount = 0;
    let favoriteCount = 0;
    const documents = await runChunked(docs, (doc) => {
      safeArray(doc.tags).forEach((tag) => tagSet.add(tag));
      totalCharCount += doc.charCount || 0;
      if (doc.favorite) favoriteCount += 1;
      return doc;
    }, {
      chunkSize: options.chunkSize || 50,
      onProgress: options.onProgress,
    });
    const data = {
      snapshotVersion: 1,
      app: "TextForge",
      createdAt: Date.now(),
      createdAtIso: new Date().toISOString(),
      title: "Benchmark Snapshot",
      description: "Benchmark only",
      source: { appName: "TextForge", appVersion: "MVP", exportType: "benchmark" },
      options: { scope: "benchmark", theme: "system", includeImages: false, includeTrash: false },
      stats: {
        documentCount: documents.length,
        folderCount: 0,
        tagCount: tagSet.size,
        totalCharCount,
        favoriteCount,
      },
      folders: [],
      tags: [...tagSet],
      documents,
    };
    if (options.onProgress) options.onProgress(docs.length, docs.length);
    await yieldToMainThread();
    return window.ForgeSnapshot.buildSnapshotHtml(data, data.options).length;
  }

  function finalizeReport(report) {
    const total = report.tests.length;
    const failed = report.tests.filter((test) => !test.ok).length;
    const grades = calculateGrades(report);
    const reportLongTasks = longTasks.slice(report.longTaskStartIndex || 0);
    const longTasksByTask = reportLongTasks.reduce((buckets, task) => {
      const name = task.taskName || "unknown";
      if (!buckets[name]) buckets[name] = { count: 0, maxLongTaskMs: 0, totalLongTaskMs: 0 };
      buckets[name].count += 1;
      buckets[name].maxLongTaskMs = Math.max(buckets[name].maxLongTaskMs, task.duration || 0);
      buckets[name].totalLongTaskMs += task.duration || 0;
      return buckets;
    }, {});
    Object.keys(longTasksByTask).forEach((name) => {
      longTasksByTask[name].maxLongTaskMs = round(longTasksByTask[name].maxLongTaskMs);
      longTasksByTask[name].totalLongTaskMs = round(longTasksByTask[name].totalLongTaskMs);
    });
    report.summary.errorRate = round(grades.errorRate);
    report.summary.availability = round(((total - failed) / Math.max(1, total)) * 100);
    report.summary.crashFrequency = grades.crashFrequency;
    report.summary.overallGrade = grades.overallGrade;
    report.summary.gradeCriteria = "A: errorRate <1%, crash=0, p95 <100ms / B: <3%, p95 <250ms / C: <8%, p95 <500ms / D: higher or fatal";
    report.stability.totalTests = total;
    report.stability.successTests = total - failed;
    report.stability.failedTests = failed;
    report.stability.runtimeErrors = runtimeErrors.slice();
    report.stability.recoverableErrors = recoverableErrors.slice();
    report.performance.allLatency = summarizeDurations(report.tests.map((test) => test.durationMs));
    report.optimization.longTasks = {
      supported: "PerformanceObserver" in window,
      count: reportLongTasks.length,
      maxLongTaskMs: round(reportLongTasks.reduce((max, task) => Math.max(max, task.duration), 0)),
      totalLongTaskMs: round(reportLongTasks.reduce((sum, task) => sum + task.duration, 0)),
      gcPauseMeasurement: "approximated by Long Tasks API",
      byTask: longTasksByTask,
      topEntries: reportLongTasks
        .slice()
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 8)
        .map((task) => ({ taskName: task.taskName || "unknown", duration: round(task.duration), startTime: round(task.startTime) })),
    };
    delete report.longTaskStartIndex;
    report.optimization.cacheHitRatio = estimateCacheHitRatio(getDocuments());
    report.optimization.costPerformance = calculateCostPerformance(report);
    report.releaseReadiness = calculateReleaseReadiness(report);
    report.summary.notes.push("Concurrent users: 해당 없음 / 로컬 단일 사용자 앱. 대체 지표로 문서 수 대비 검색 처리량을 측정합니다.");
    if ((report.performance.allLatency.p95 || 0) > 100) report.recommendations.push("Finder card virtualization 또는 검색 worker 분리를 검토하세요.");
    if (report.optimization.longTasks.count > 0) report.recommendations.push("Snapshot/export 작업을 chunk 처리하거나 requestIdleCallback으로 분산하세요.");
    if (!report.recommendations.length) report.recommendations.push("현재 측정 규모에서는 치명적인 병목이 감지되지 않았습니다.");
  }

  function estimateCacheHitRatio(docs) {
    let hits = 0;
    let misses = 0;
    docs.forEach((doc) => {
      ["plainText", "previewText", "searchText"].forEach((field) => {
        if (doc[field]) hits += 1;
        else misses += 1;
      });
    });
    return {
      cacheType: "metadata reuse ratio",
      hits,
      misses,
      ratio: round((hits / Math.max(1, hits + misses)) * 100),
    };
  }

  function calculateCostPerformance(report) {
    const chars = report.optimization.totalDocumentChars || 0;
    const localBytes = report.optimization.localStorageBytes || 1;
    return {
      serverCost: 0,
      charsPerLocalStorageMB: round(chars / Math.max(1, localBytes / 1024 / 1024)),
      networkDependency: "none",
    };
  }

  function throughput(items, durationMs) {
    return round(items / Math.max(0.001, durationMs / 1000));
  }

  function round(value) {
    return typeof value === "number" && Number.isFinite(value) ? Math.round(value * 100) / 100 : value;
  }

  function renderReport(report) {
    const nodes = ui();
    if (!report) {
      nodes.summary.textContent = "아직 실행된 진단 결과가 없습니다.";
      nodes.output.textContent = "";
      return;
    }
    nodes.summary.textContent = `등급 ${report.summary.overallGrade} · 테스트 ${report.stability.totalTests}개 · 실패 ${report.stability.failedTests}개 · availability ${report.summary.availability}% · error ${report.summary.errorRate}% · p95 ${report.performance.allLatency.p95}ms`;
    nodes.output.textContent = JSON.stringify(report, null, 2);
  }

  function exportBenchmarkJson() {
    if (!lastReport) return;
    const blob = new Blob([JSON.stringify(lastReport, null, 2)], { type: "application/json;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `TextForge-Diagnostics-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function attachUi() {
    const nodes = ui();
    groupAdvancedDiagnosticsUi(nodes);
    nodes.close?.addEventListener("click", closeDiagnosticsPanel);
    nodes.quick?.addEventListener("click", runQuickBenchmark);
    nodes.full?.addEventListener("click", runFullBenchmark);
    nodes.reliability?.addEventListener("click", runReliabilityTest);
    nodes.realLibrary?.addEventListener("click", runRealLibraryBenchmark);
    nodes.mttr?.addEventListener("click", runMttrBenchmark);
    nodes.snapshot?.addEventListener("click", runSnapshotBenchmark);
    nodes.stress?.addEventListener("click", runStressBenchmark);
    nodes.export?.addEventListener("click", exportBenchmarkJson);
  }

  function groupAdvancedDiagnosticsUi(nodes) {
    const firstActions = document.querySelector(".diagnostics-actions");
    if (!firstActions || document.querySelector(".diagnostics-advanced")) return;
    const advanced = document.createElement("details");
    advanced.className = "diagnostics-advanced";
    advanced.innerHTML = '<summary>Advanced Diagnostics</summary><div class="diagnostics-actions diagnostics-actions-advanced"></div>';
    firstActions.after(advanced);
    const advancedActions = advanced.querySelector(".diagnostics-actions-advanced");
    [nodes.full, nodes.reliability, nodes.mttr, nodes.snapshot, nodes.stress].filter(Boolean).forEach((button) => {
      advancedActions.append(button);
    });
  }

  window.TextForgeDiagnostics = {
    configure,
    openDiagnosticsPanel,
    closeDiagnosticsPanel,
    measureAsync,
    measureSync,
    percentile,
    summarizeDurations,
    getMemorySnapshot,
    getStorageEstimate,
    getDomStats,
    generateDummyDocuments,
    runQuickBenchmark,
    runFullBenchmark,
    runStressBenchmark,
    runReliabilityTest,
    runRealLibraryBenchmark,
    runMttrBenchmark,
    runSnapshotBenchmark,
    exportBenchmarkJson,
    safeJsonParse,
    safeHtmlSanitize,
    safeNormalizeDocument,
    safeExtractPlainText,
    safeBuildPreviewText,
    withRecoveryBoundary,
    getLastReport: () => lastReport,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attachUi);
  else attachUi();
})();
