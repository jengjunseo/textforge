const STORAGE_KEY = "textforge.documents.v1";
const ACTIVE_KEY = "textforge.activeDocument.v1";
const SESSION_KEY = "textforge.sessionRecovery.v1";
const PROMPT_KEY = "textforge.prompts.v1";
const FOLDERS_KEY = "textforge.folders.v1";
const THEME_KEY = "textforge.theme";
const SPLIT_WORKSPACE_KEY = "textforge.splitWorkspace";
const FOCUS_MODE_KEY = "textforge.focusMode";
const DB_NAME = "textforge-personal-storage";
const DB_VERSION = 1;
const STORAGE_POINTER_KEY = "textforge.pointer.v2";
const DURABLE_SAVE_DELAY = 900;
const LONG_LINE_LIMIT = 8000;
const AUTO_SNAPSHOT_INTERVAL = 90000;
const CARD_WIDTH = 1200;
const CARD_HEIGHT = 675;
const FINDER_PAGE_SIZE = 24;
const DOC_COLORS = ["#167c80", "#576cbc", "#b24f3f", "#8a6f2a", "#4f7b45", "#7a4e9d", "#ad6a2b"];

const DEFAULT_PROMPTS = [
  {
    name: "보고서 정리",
    text: "아래 내용을 보고서 문체로 정리해줘. 핵심 주장, 근거, 한계, 결론 순서로 재구성해줘.",
  },
  {
    name: "코드 리뷰",
    text: "아래 변경사항을 코드 리뷰 관점에서 봐줘. 버그 가능성, 유지보수 위험, 빠진 테스트를 우선순위로 정리해줘.",
  },
  {
    name: "학습 힌트",
    text: "아래 내용을 학생에게 다시 설명하듯 쉽게 개념, 예시, 헷갈리는 지점, 확인 질문으로 정리해줘.",
  },
  {
    name: "문장 다듬기",
    text: "아래 문장을 자연스럽고 단단한 한국어로 다듬어줘. 과한 서식은 줄여줘.",
  },
];

const els = {
  docList: document.querySelector("#docList"),
  newDocBtn: document.querySelector("#newDocBtn"),
  searchInput: document.querySelector("#searchInput"),
  titleInput: document.querySelector("#titleInput"),
  saveState: document.querySelector("#saveState"),
  editor: document.querySelector("#editor"),
  richEditor: document.querySelector("#richEditor"),
  preview: document.querySelector("#preview"),
  editorGrid: document.querySelector("#editorGrid"),
  editorPaneLabel: document.querySelector("#editorPaneLabel"),
  statsText: document.querySelector("#statsText"),
  copyState: document.querySelector("#copyState"),
  guardBanner: document.querySelector("#guardBanner"),
  guardText: document.querySelector("#guardText"),
  wrapToggleBtn: document.querySelector("#wrapToggleBtn"),
  breakLineBtn: document.querySelector("#breakLineBtn"),
  exportTxtBtn: document.querySelector("#exportTxtBtn"),
  exportMdBtn: document.querySelector("#exportMdBtn"),
  exportHtmlBtn: document.querySelector("#exportHtmlBtn"),
  exportPdfBtn: document.querySelector("#exportPdfBtn"),
  recoverBtn: document.querySelector("#recoverBtn"),
  sessionText: document.querySelector("#sessionText"),
  cleanOutputBtn: document.querySelector("#cleanOutputBtn"),
  copyPlainBtn: document.querySelector("#copyPlainBtn"),
  copyRichBtn: document.querySelector("#copyRichBtn"),
  copyMarkdownBtn: document.querySelector("#copyMarkdownBtn"),
  copyBoardBtn: document.querySelector("#copyBoardBtn"),
  themeSelect: document.querySelector("#themeSelect"),
  appThemeSelect: document.querySelector("#appThemeSelect"),
  styleSelect: document.querySelector("#styleSelect"),
  fontSelect: document.querySelector("#fontSelect"),
  sizeSelect: document.querySelector("#sizeSelect"),
  colorInput: document.querySelector("#colorInput"),
  bgInput: document.querySelector("#bgInput"),
  linkBtn: document.querySelector("#linkBtn"),
  imageBtn: document.querySelector("#imageBtn"),
  tableBtn: document.querySelector("#tableBtn"),
  hrBtn: document.querySelector("#hrBtn"),
  spoilerBtn: document.querySelector("#spoilerBtn"),
  favoriteBtn: document.querySelector("#favoriteBtn"),
  tagInput: document.querySelector("#tagInput"),
  tocList: document.querySelector("#tocList"),
  historyList: document.querySelector("#historyList"),
  snapshotBtn: document.querySelector("#snapshotBtn"),
  foldPreviewBtn: document.querySelector("#foldPreviewBtn"),
  promptSelect: document.querySelector("#promptSelect"),
  insertPromptBtn: document.querySelector("#insertPromptBtn"),
  copyPromptBtn: document.querySelector("#copyPromptBtn"),
  savePromptBtn: document.querySelector("#savePromptBtn"),
  exportDocBtn: document.querySelector("#exportDocBtn"),
  exportEpubBtn: document.querySelector("#exportEpubBtn"),
  exportCardBtn: document.querySelector("#exportCardBtn"),
  systemList: document.querySelector("#systemList"),
  docInfoList: document.querySelector("#docInfoList"),
  logModeBtn: document.querySelector("#logModeBtn"),
  commandBtn: document.querySelector("#commandBtn"),
  focusModeBtn: document.querySelector("#focusModeBtn"),
  commandOverlay: document.querySelector("#commandOverlay"),
  commandInput: document.querySelector("#commandInput"),
  commandList: document.querySelector("#commandList"),
  viewModeSelect: document.querySelector("#viewModeSelect"),
  workModeSelect: document.querySelector("#workModeSelect"),
  inspectorToggleBtn: document.querySelector("#inspectorToggleBtn"),
  topForgeSnapshotBtn: document.querySelector("#topForgeSnapshotBtn"),
  footerForgeSnapshotBtn: document.querySelector("#footerForgeSnapshotBtn"),
  topRecoverBtn: document.querySelector("#topRecoverBtn"),
  topLogModeBtn: document.querySelector("#topLogModeBtn"),
  diagnosticsOpenBtn: document.querySelector("#diagnosticsOpenBtn"),
  splitSingleBtn: document.querySelector("#splitSingleBtn"),
  splitVerticalBtn: document.querySelector("#splitVerticalBtn"),
  splitHorizontalBtn: document.querySelector("#splitHorizontalBtn"),
  splitDuplicateBtn: document.querySelector("#splitDuplicateBtn"),
  splitOpenDocSelect: document.querySelector("#splitOpenDocSelect"),
  splitSyncBtn: document.querySelector("#splitSyncBtn"),
  referencePane: document.querySelector("#referencePane"),
  referencePaneTitle: document.querySelector("#referencePaneTitle"),
  referencePaneMode: document.querySelector("#referencePaneMode"),
  referencePaneBody: document.querySelector("#referencePaneBody"),
  referenceScrollLockBtn: document.querySelector("#referenceScrollLockBtn"),
  referenceSyncBtn: document.querySelector("#referenceSyncBtn"),
  referenceDocSelect: document.querySelector("#referenceDocSelect"),
  referenceCloseBtn: document.querySelector("#referenceCloseBtn"),
  footerHistoryBtn: document.querySelector("#footerHistoryBtn"),
  footerSnapshotBtn: document.querySelector("#footerSnapshotBtn"),
  contentArea: document.querySelector(".content-area"),
  inspector: document.querySelector(".inspector"),
  appShell: document.querySelector(".app-shell"),
  finderOpenBtn: document.querySelector("#finderOpenBtn"),
  finderView: document.querySelector("#finderView"),
  finderCloseBtn: document.querySelector("#finderCloseBtn"),
  finderSearchInput: document.querySelector("#finderSearchInput"),
  finderSortSelect: document.querySelector("#finderSortSelect"),
  finderGridBtn: document.querySelector("#finderGridBtn"),
  finderListBtn: document.querySelector("#finderListBtn"),
  finderSelectBtn: document.querySelector("#finderSelectBtn"),
  forgeSnapshotBtn: document.querySelector("#forgeSnapshotBtn"),
  finderNewDocBtn: document.querySelector("#finderNewDocBtn"),
  finderNewFolderBtn: document.querySelector("#finderNewFolderBtn"),
  finderGrid: document.querySelector("#finderGrid"),
  finderPrevBtn: document.querySelector("#finderPrevBtn"),
  finderNextBtn: document.querySelector("#finderNextBtn"),
  finderPageText: document.querySelector("#finderPageText"),
  finderBulkBar: document.querySelector("#finderBulkBar"),
  finderSelectionCount: document.querySelector("#finderSelectionCount"),
  finderBulkFolderSelect: document.querySelector("#finderBulkFolderSelect"),
  finderBulkMoveBtn: document.querySelector("#finderBulkMoveBtn"),
  finderBulkTrashBtn: document.querySelector("#finderBulkTrashBtn"),
  finderBulkCancelBtn: document.querySelector("#finderBulkCancelBtn"),
  finderTagList: document.querySelector("#finderTagList"),
  finderFolderList: document.querySelector("#finderFolderList"),
  finderCrumbs: document.querySelector("#finderCrumbs"),
  finderAllCount: document.querySelector("#finderAllCount"),
  docContextMenu: document.querySelector("#docContextMenu"),
};

let documents = normalizeDocuments(loadDocuments());
let activeId = localStorage.getItem(ACTIVE_KEY) || documents[0]?.id;
let folders = normalizeFolders(loadFolders());
let saveTimer = null;
let durableSaveTimer = null;
let durableSaveInFlight = false;
let durableStorageHydrated = false;
let customPrompts = loadPrompts();
let previewFolded = false;
let logMode = false;
let bootstrappedSample = false;
let colorAdaptTimer = null;
let inspectorOpen = localStorage.getItem("textforge.inspectorOpen") === "true";
let inspectorTab = localStorage.getItem("textforge.inspectorTab") || "toc";
let uiMode = localStorage.getItem("textforge.uiMode") || "pro";
let focusMode = localStorage.getItem(FOCUS_MODE_KEY) === "true";
let finderState = {
  query: "",
  sort: "updated",
  filter: "all",
  tag: null,
  folderId: null,
  view: "grid",
  page: 0,
  pageSize: FINDER_PAGE_SIZE,
  selecting: false,
  selectedIds: new Set(),
  contextDocId: null,
};
let finderSearchTimer = null;
let splitWorkspace = loadSplitWorkspace();
let referenceRenderTimer = null;
let postSwitchRenderTimer = null;
let postSwitchRenderFrame = null;
let splitWorkspaceRenderTimer = null;
let savedEditorSelection = null;
let pendingTypingStyle = {};
let formatDebugEnabled = localStorage.getItem("textforge.formatDebug") === "true";
let formatDebugBuffer = [];
let paneScrollSyncing = false;
let lockedReferenceGuard = null;
let splitScrollDriftWarned = false;
let activeDocumentSwitchTrace = null;
let lastDocumentSwitchTrace = null;
let documentSwitchBenchmarkResult = null;

installFormatDebugApi();

const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

function getStoredTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

function getSystemTheme() {
  return systemThemeQuery.matches ? "dark" : "light";
}

function resolveTheme(theme = getStoredTheme()) {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(theme = getStoredTheme()) {
  const resolved = resolveTheme(theme);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themeMode = theme;
  if (els.appThemeSelect) els.appThemeSelect.value = theme;
  scheduleContentColorAdaptation(0);
  return resolved;
}

function setTheme(theme) {
  const next = theme === "light" || theme === "dark" || theme === "system" ? theme : "system";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

function toggleTheme() {
  setTheme(resolveTheme() === "dark" ? "light" : "dark");
}

function initTheme() {
  applyTheme(getStoredTheme());
  systemThemeQuery.addEventListener("change", () => {
    if (getStoredTheme() === "system") applyTheme("system");
  });
}

function percentile(values, percent) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * (percent / 100);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function summarizeTraceDurations(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return { count: 0, avg: null, p50: null, p95: null, max: null };
  const sum = clean.reduce((total, value) => total + value, 0);
  return {
    count: clean.length,
    avg: Number((sum / clean.length).toFixed(2)),
    p50: Number(percentile(clean, 50).toFixed(2)),
    p95: Number(percentile(clean, 95).toFixed(2)),
    max: Number(Math.max(...clean).toFixed(2)),
  };
}

function startDocumentSwitchTrace(docId, source = "unknown") {
  const doc = documents.find((item) => item.id === docId);
  activeDocumentSwitchTrace = {
    docId,
    title: doc?.title || "",
    source,
    startedAt: performance.now(),
    timestamp: Date.now(),
    marks: [],
    steps: [],
    totalToRenderActiveEndMs: null,
    totalToNextFrameMs: null,
    longTaskCount: "unsupported",
    topSlowSteps: [],
    complete: false,
  };
  markDocumentSwitch("document-switch:start");
  return activeDocumentSwitchTrace;
}

function markDocumentSwitch(stepName) {
  if (!activeDocumentSwitchTrace) return;
  const now = performance.now();
  const trace = activeDocumentSwitchTrace;
  const previous = trace.marks[trace.marks.length - 1];
  const fromStartMs = now - trace.startedAt;
  const deltaMs = previous ? now - previous.at : 0;
  trace.marks.push({ name: stepName, at: now });
  trace.steps.push({
    name: stepName,
    fromStartMs: Number(fromStartMs.toFixed(2)),
    deltaMs: Number(deltaMs.toFixed(2)),
  });
}

function measureDocumentSwitchTrace() {
  const trace = activeDocumentSwitchTrace;
  if (!trace) return null;
  trace.topSlowSteps = trace.steps
    .filter((step) => step.deltaMs > 0)
    .slice()
    .sort((a, b) => b.deltaMs - a.deltaMs)
    .slice(0, 8);
  return trace;
}

function endDocumentSwitchTrace() {
  const trace = activeDocumentSwitchTrace;
  if (!trace) return null;
  markDocumentSwitch("document-switch:next-frame");
  trace.totalToNextFrameMs = Number((performance.now() - trace.startedAt).toFixed(2));
  trace.complete = true;
  measureDocumentSwitchTrace();
  lastDocumentSwitchTrace = trace;
  activeDocumentSwitchTrace = null;
  window.dispatchEvent(new CustomEvent("textforge:document-switch-trace", { detail: trace }));
  return trace;
}

function getLastDocumentSwitchTrace() {
  return lastDocumentSwitchTrace;
}

function waitForDocumentSwitchTrace() {
  return new Promise((resolve) => {
    const existing = activeDocumentSwitchTrace;
    if (!existing) {
      resolve(lastDocumentSwitchTrace);
      return;
    }
    const onTrace = (event) => {
      window.removeEventListener("textforge:document-switch-trace", onTrace);
      resolve(event.detail);
    };
    window.addEventListener("textforge:document-switch-trace", onTrace, { once: true });
  });
}

function collectSlowStepSummary(traces) {
  const buckets = new Map();
  traces.forEach((trace) => {
    trace.steps.forEach((step) => {
      if (!step.deltaMs || step.name === "document-switch:start") return;
      if (!buckets.has(step.name)) buckets.set(step.name, []);
      buckets.get(step.name).push(step.deltaMs);
    });
  });
  return [...buckets.entries()]
    .map(([name, values]) => ({ name, ...summarizeTraceDurations(values) }))
    .sort((a, b) => (b.p95 || 0) - (a.p95 || 0))
    .slice(0, 10);
}

async function runDocumentSwitchBenchmark(options = {}) {
  const sampleCount = Math.max(1, Math.min(Number(options.samples) || 10, 30));
  const originalDocuments = documents;
  const originalActiveId = activeId;
  const candidates = documents.filter((doc) => !doc.deletedAt);
  let docs = candidates.length > 1 ? candidates : documents;
  const traces = [];
  const longTasks = [];
  let longTaskObserver = null;
  if ("PerformanceObserver" in window) {
    try {
      longTaskObserver = new PerformanceObserver((list) => {
        longTasks.push(...list.getEntries().map((entry) => ({ name: entry.name, duration: entry.duration, startTime: entry.startTime })));
      });
      longTaskObserver.observe({ entryTypes: ["longtask"] });
    } catch {
      longTaskObserver = null;
    }
  }
  if (!docs.length) return null;
  if (docs.length === 1) {
    const dummyA = createDocument("# Benchmark A\n\nTextForge document switch benchmark helper.");
    const dummyB = createDocument("# Benchmark B\n\nSecond memory-only helper document.");
    documents = [...documents, dummyA, dummyB];
    docs = [docs[0], dummyA, dummyB];
  }
  try {
    for (let index = 0; index < sampleCount; index += 1) {
      const doc = docs[index % docs.length];
      openDocumentInPane(doc.id, "main", { source: "benchmark" });
      const trace = await waitForDocumentSwitchTrace();
      if (trace) traces.push(trace);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  } finally {
    if (longTaskObserver) longTaskObserver.disconnect();
    documents = originalDocuments;
    activeId = originalActiveId;
    if (originalActiveId) safeLocalSet(ACTIVE_KEY, originalActiveId);
    renderActive();
  }
  const nextFrame = traces.map((trace) => trace.totalToNextFrameMs);
  const renderActiveDurations = traces.map((trace) => trace.totalToRenderActiveEndMs);
  documentSwitchBenchmarkResult = {
    benchmarkVersion: 1,
    type: "document-switch",
    createdAt: Date.now(),
    samples: traces.length,
    totalToNextFrame: summarizeTraceDurations(nextFrame),
    totalToRenderActiveEnd: summarizeTraceDurations(renderActiveDurations),
    longTaskCount: longTaskObserver ? longTasks.length : "unsupported",
    maxLongTaskMs: longTasks.length ? Number(Math.max(...longTasks.map((entry) => entry.duration)).toFixed(2)) : null,
    totalLongTaskMs: longTasks.length ? Number(longTasks.reduce((sum, entry) => sum + entry.duration, 0).toFixed(2)) : null,
    topSlowSteps: collectSlowStepSummary(traces),
    traces,
  };
  console.table(documentSwitchBenchmarkResult.topSlowSteps.slice(0, 5));
  console.log("[TextForge] document switch benchmark", documentSwitchBenchmarkResult);
  els.sessionText.textContent = `Document switch benchmark: ${traces.length} samples, p95 ${documentSwitchBenchmarkResult.totalToNextFrame.p95 ?? "n/a"}ms`;
  return documentSwitchBenchmarkResult;
}

function exportDocumentSwitchBenchmarkJson() {
  const data = documentSwitchBenchmarkResult || lastDocumentSwitchTrace;
  if (!data) {
    els.sessionText.textContent = "No document switch trace yet.";
    return;
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `textforge-document-switch-${Date.now()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function showLastDocumentSwitchTrace() {
  const trace = getLastDocumentSwitchTrace();
  if (!trace) {
    els.sessionText.textContent = "No document switch trace yet.";
    return;
  }
  console.log("[TextForge] last document switch trace", trace);
  els.sessionText.textContent = `Last switch: ${trace.totalToNextFrameMs}ms to next frame, ${trace.totalToRenderActiveEndMs}ms renderActive`;
}

function shortHash(value = "") {
  let hash = 0;
  const text = String(value);
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function describeNode(node) {
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) return "#text";
  return node.nodeName?.toLowerCase?.() || String(node.nodeName || "node");
}

function getSelectionDebugSummary() {
  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  return {
    rangeCount: selection?.rangeCount || 0,
    isSelectionInsideEditor: Boolean(range && els.richEditor.contains(range.commonAncestorContainer)),
    anchorNode: describeNode(selection?.anchorNode),
    focusNode: describeNode(selection?.focusNode),
    selectedTextLength: selection?.toString?.().length || 0,
  };
}

function summarizeHtmlForFormatDebug(html = "") {
  const text = String(html);
  return {
    length: text.length,
    hash: shortHash(text),
    containsFontSize: /font-size\s*:/i.test(text),
    containsFontFamily: /font-family\s*:/i.test(text),
    containsColor: /(?:^|[;"])color\s*:/i.test(text),
    containsBackgroundColor: /background-color\s*:/i.test(text),
    styledSpanCount: (text.match(/<span\b[^>]*style=/gi) || []).length,
    styleAttributeCount: (text.match(/\sstyle=/gi) || []).length,
  };
}

function formatDebugLog(label, detail = {}) {
  if (!formatDebugEnabled && window.TEXTFORGE_FORMAT_DEBUG !== true) return;
  if (window.TEXTFORGE_FORMAT_DEBUG === true) formatDebugEnabled = true;
  const entry = {
    at: new Date().toISOString(),
    label,
    ...detail,
  };
  formatDebugBuffer.push(entry);
  if (formatDebugBuffer.length > 300) formatDebugBuffer = formatDebugBuffer.slice(-300);
  console.log(`[format-debug] ${label}`, entry);
}

function setSessionText(text) {
  if (els.sessionText) els.sessionText.textContent = text;
}

function setFormatDebugEnabled(enabled) {
  formatDebugEnabled = Boolean(enabled);
  localStorage.setItem("textforge.formatDebug", formatDebugEnabled ? "true" : "false");
  window.TEXTFORGE_FORMAT_DEBUG = formatDebugEnabled;
  setSessionText(formatDebugEnabled ? "Format debug on" : "Format debug off");
  return formatDebugEnabled;
}

function showFormatDebugLog() {
  if (console.table) console.table(formatDebugBuffer);
  else console.log("[format-debug] entries", formatDebugBuffer);
  setSessionText(`Format debug log: ${formatDebugBuffer.length} entries`);
  return [...formatDebugBuffer];
}

async function copyFormatDebugLog() {
  const text = JSON.stringify(formatDebugBuffer, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    setSessionText(`Copied ${formatDebugBuffer.length} format debug entries`);
  } catch (error) {
    console.log("[format-debug] copy fallback", text);
    console.warn("[format-debug] clipboard copy failed", error);
    setSessionText("Format debug copy failed; printed to console");
  }
  return text;
}

function clearFormatDebugLog() {
  formatDebugBuffer = [];
  setSessionText("Format debug log cleared");
  return [];
}

function installFormatDebugApi() {
  window.TEXTFORGE_FORMAT_DEBUG = formatDebugEnabled;
  window.TextForgeFormatDebug = {
    enable: () => setFormatDebugEnabled(true),
    disable: () => setFormatDebugEnabled(false),
    show: showFormatDebugLog,
    copy: copyFormatDebugLog,
    getEntries: () => [...formatDebugBuffer],
    clear: clearFormatDebugLog,
  };
  return window.TextForgeFormatDebug;
}

function formatControlDebugStart(control, eventType, value) {
  formatDebugLog("event start", {
    control,
    eventType,
    value,
    activeElement: document.activeElement?.id || document.activeElement?.className || document.activeElement?.tagName,
    selection: getSelectionDebugSummary(),
    savedSelectionExists: Boolean(savedEditorSelection),
  });
}

function scheduleContentColorAdaptation(delay = 300) {
  clearTimeout(colorAdaptTimer);
  colorAdaptTimer = setTimeout(() => {
    const run = () => adaptDocumentColors();
    if ("requestIdleCallback" in window) requestIdleCallback(run, { timeout: 700 });
    else setTimeout(run, 0);
  }, delay);
}

function adaptDocumentColors() {
  const roots = [els.richEditor, els.preview].filter(Boolean);
  roots.forEach(clearDarkColorFixes);
  if (document.documentElement.dataset.theme !== "dark") return;
  roots.forEach((root) => {
    root.querySelectorAll('[style*="color" i]').forEach((element) => {
      if (shouldAdaptTextColor(element, root)) {
        element.dataset.darkColorFix = "true";
        element.style.setProperty("--tf-adapted-color", "var(--text-primary)");
      }
    });
  });
}

function clearDarkColorFixes(root) {
  root.querySelectorAll("[data-dark-color-fix]").forEach((element) => {
    element.removeAttribute("data-dark-color-fix");
    element.style.removeProperty("--tf-adapted-color");
    if (!element.getAttribute("style")?.trim()) element.removeAttribute("style");
  });
}

function stripDisplayOnlyMarkers(root) {
  root.querySelectorAll("[data-dark-color-fix]").forEach((element) => {
    element.removeAttribute("data-dark-color-fix");
  });
  root.querySelectorAll('[style*="--tf-adapted-color"]').forEach((element) => {
    element.style.removeProperty("--tf-adapted-color");
    if (!element.getAttribute("style")?.trim()) element.removeAttribute("style");
  });
}

function styleSignature(element) {
  return (element.getAttribute("style") || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function hasOnlyStyleAttribute(element) {
  return [...element.attributes].every((attr) => attr.name.toLowerCase() === "style");
}

function unwrapElement(element) {
  element.replaceWith(...element.childNodes);
}

function cleanupInlineStyleSpans(root) {
  root.querySelectorAll("[style]").forEach((element) => {
    if (!element.getAttribute("style")?.trim() || !element.style.length) {
      element.removeAttribute("style");
    }
  });
  root.querySelectorAll("span").forEach((span) => {
    if (span.childNodes.length === 1 && span.firstChild?.nodeType === Node.TEXT_NODE) {
      span.firstChild.textContent = span.firstChild.textContent.replace(/\u200b/g, "");
    }
    if (!span.textContent && !span.querySelector("img,br,hr,table")) span.remove();
  });
  [...root.querySelectorAll("span")].reverse().forEach((span) => {
    const child = span.firstElementChild;
    if (
      child &&
      child.tagName === "SPAN" &&
      span.childNodes.length === 1 &&
      hasOnlyStyleAttribute(span) &&
      hasOnlyStyleAttribute(child) &&
      styleSignature(span) === styleSignature(child)
    ) {
      unwrapElement(child);
    }
  });
  root.querySelectorAll("span").forEach((span) => {
    let next = span.nextSibling;
    while (
      next?.nodeType === Node.ELEMENT_NODE &&
      next.tagName === "SPAN" &&
      hasOnlyStyleAttribute(span) &&
      hasOnlyStyleAttribute(next) &&
      styleSignature(span) === styleSignature(next)
    ) {
      span.append(...next.childNodes);
      const consumed = next;
      next = next.nextSibling;
      consumed.remove();
    }
    if (!span.getAttribute("style") && !span.attributes.length) unwrapElement(span);
  });
}

function parseCssColor(colorString) {
  if (!colorString) return null;
  const value = String(colorString).trim().toLowerCase();
  if (!value || value === "inherit" || value === "currentcolor" || value === "transparent") return null;
  const probe = parseCssColor.probe || (parseCssColor.probe = document.createElement("span"));
  probe.style.color = "";
  probe.style.color = value;
  if (!probe.style.color) return null;
  document.body.append(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  const match = computed.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/i);
  if (!match) return null;
  const alpha = match[4] === undefined ? 1 : Number(match[4]);
  if (alpha <= 0.05) return null;
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: alpha,
  };
}

function getRelativeLuminance(r, g, b) {
  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function getColorSaturation(r, g, b) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max === min) return 0;
  const lightness = (max + min) / 2;
  return (max - min) / (1 - Math.abs(2 * lightness - 1));
}

function isDarkColor(colorString) {
  const color = parseCssColor(colorString);
  if (!color) return false;
  const luminance = getRelativeLuminance(color.r, color.g, color.b);
  const saturation = getColorSaturation(color.r, color.g, color.b);
  return luminance < 0.18 || (luminance < 0.35 && saturation < 0.45);
}

function hasLightBackground(element, root) {
  let current = element;
  let depth = 0;
  while (current && current !== root && depth < 5) {
    const inlineBg = current.style?.backgroundColor || current.style?.background;
    const computedBg = getComputedStyle(current).backgroundColor;
    const color = parseCssColor(inlineBg || computedBg);
    if (color && color.a > 0.05 && getRelativeLuminance(color.r, color.g, color.b) > 0.55) return true;
    current = current.parentElement;
    depth += 1;
  }
  return false;
}

function shouldAdaptTextColor(element, root) {
  const inlineColor = element.style?.color;
  if (!inlineColor || !isDarkColor(inlineColor)) return false;
  if (element.closest("pre, code, a, mark, .spoiler")) return false;
  return !hasLightBackground(element, root);
}

function isDarkThemeActive() {
  return document.documentElement.dataset.theme === "dark";
}

function applyDarkColorFixToFragment(root) {
  if (!root) return;
  root.querySelectorAll('[style*="color" i]').forEach((element) => {
    if (!shouldAdaptTextColor(element, root)) return;
    element.dataset.darkColorFix = "true";
    element.style.setProperty("--tf-adapted-color", "var(--text-primary)");
  });
}

function prepareHtmlForThemedRender(html) {
  const source = html || "<p></p>";
  if (!isDarkThemeActive() || !source.toLowerCase().includes("color")) return source;
  const template = document.createElement("template");
  template.innerHTML = source;
  clearDarkColorFixes(template.content);
  applyDarkColorFixToFragment(template.content);
  return template.innerHTML || "<p></p>";
}

function setRichEditorHtmlPrepared(html) {
  els.richEditor.innerHTML = prepareHtmlForThemedRender(html);
}

const COMMANDS = [
  { id: "copy-plain", title: "Plain Copy", hint: "Markdown 기호를 제거해 복사", run: () => copyAs("plain") },
  { id: "copy-rich", title: "Rich Copy", hint: "HTML 서식을 유지해 복사", run: () => copyAs("rich") },
  { id: "copy-markdown", title: "Markdown Copy", hint: "Markdown 원문 복사", run: () => copyAs("markdown") },
  { id: "copy-board", title: "Board Copy", hint: "게시판용 텍스트 복사", run: () => copyAs("board") },
  { id: "view-source", title: "원문 보기", hint: "Markdown Source 보기", run: () => setMode("source") },
  { id: "view-preview", title: "미리보기", hint: "Clean Preview 보기", run: () => setMode("clean") },
  { id: "view-split", title: "분할 보기", hint: "작성과 미리보기를 함께 표시", run: () => setMode("split") },
  { id: "export-txt", title: "TXT Export", hint: "일반 텍스트 파일 내보내기", run: () => exportFile("txt") },
  { id: "export-pdf", title: "PDF Export", hint: "프린트 화면으로 PDF 내보내기", run: () => exportFile("pdf") },
  { id: "clean-paste", title: "Clean Paste", hint: "클립보드 텍스트를 정리해 붙여넣기", run: cleanPaste },
  { id: "tidy-ai", title: "AI 출력 정리", hint: "과한 서식과 Markdown 정리", run: cleanAiOutput },
  { id: "snapshot", title: "수동 스냅샷", hint: "현재 문서 상태를 저장", run: saveManualSnapshot },
  { id: "recover-session", title: "세션 복구", hint: "이전에 저장된 세션 복구", run: recoverSession },
  { id: "inspector-open", title: "Inspector 열기", hint: "우측 검사기 패널 열기", run: () => setInspectorOpen(true, "toc") },
  { id: "history-open", title: "히스토리 열기", hint: "문서 스냅샷 보기", run: () => setInspectorOpen(true, "history") },
  { id: "prompt-open", title: "Prompt Vault 열기", hint: "프롬프트 보관함 보기", run: () => setInspectorOpen(true, "prompt") },
  { id: "system-open", title: "시스템 패널 열기", hint: "시스템 상태 보기", run: () => setInspectorOpen(true, "system") },
  { id: "log-mode", title: "로그 모드 전환", hint: "긴 줄 보호 모드 전환", run: toggleLogMode },
  { id: "theme-toggle", title: "테마 전환", hint: "라이트/다크 테마 전환", run: toggleTheme },
  { id: "focus-mode-toggle", title: "집중 모드 전환", hint: "보조 UI를 접고 본문 공간 넓히기", run: toggleFocusMode },
  { id: "ui-mode", title: "UI 모드 전환", hint: "Simple / Pro / Lab 모드 전환", run: () => setUiMode(uiMode === "lab" ? "simple" : uiMode === "simple" ? "pro" : "lab") },
  { id: "forge-snapshot", title: "Forge Snapshot 만들기", hint: "문서함을 읽기 전용 HTML 아카이브로 내보내기", run: openForgeSnapshotPanel },
  { id: "diagnostics-open", title: "진단 패널 열기", hint: "성능/신뢰성 벤치마크 보기", run: openDiagnosticsPanel },
  { id: "diagnostics-quick", title: "빠른 벤치마크 실행", hint: "핵심 지표를 빠르게 측정", run: () => openDiagnosticsPanel().then(() => window.TextForgeDiagnostics?.runQuickBenchmark()) },
  { id: "diagnostics-full", title: "전체 벤치마크 실행", hint: "더미 문서 100개 memory-only 테스트", labOnly: true, run: () => openDiagnosticsPanel().then(() => window.TextForgeDiagnostics?.runFullBenchmark()) },
  { id: "diagnostics-reliability", title: "신뢰성 반복 테스트", hint: "반복 작업 100회 MTBF-like 측정", labOnly: true, run: () => openDiagnosticsPanel().then(() => window.TextForgeDiagnostics?.runReliabilityTest()) },
  { id: "diagnostics-snapshot", title: "Forge Snapshot 벤치마크", hint: "Snapshot HTML build 성능 측정", labOnly: true, run: () => openDiagnosticsPanel().then(() => window.TextForgeDiagnostics?.runSnapshotBenchmark()) },
  { id: "diagnostics-export", title: "진단 결과 JSON 내보내기", hint: "최근 벤치마크 결과 저장", run: () => window.TextForgeDiagnostics?.exportBenchmarkJson() },
  { id: "diagnostics-real-library", title: "실제 문서함 벤치마크", hint: "실제 문서함 read-only clone으로 측정", run: () => openDiagnosticsPanel().then(() => window.TextForgeDiagnostics?.runRealLibraryBenchmark()) },
  { id: "diagnostics-mttr", title: "MTTR 복구 테스트", hint: "격리된 장애 주입으로 복구 시간 측정", labOnly: true, run: () => openDiagnosticsPanel().then(() => window.TextForgeDiagnostics?.runMttrBenchmark()) },
  { id: "document-switch-benchmark", title: "문서 전환 벤치마크 실행", hint: "문서 클릭 전환 흐름의 단계별 지연 측정", labOnly: true, run: () => runDocumentSwitchBenchmark({ samples: 10 }) },
  { id: "document-switch-trace-show", title: "최근 문서 전환 trace 보기", hint: "최근 전환의 단계별 기록을 console에 표시", labOnly: true, run: showLastDocumentSwitchTrace },
  { id: "document-switch-trace-export", title: "문서 전환 벤치마크 JSON 내보내기", hint: "최근 문서 전환 측정 결과 저장", labOnly: true, run: exportDocumentSwitchBenchmarkJson },
  { id: "split-single", title: "단일 보기", hint: "분할 작업공간 닫기", run: () => setSplitLayout("single") },
  { id: "split-vertical", title: "좌우 2분할", hint: "오른쪽에 참고창 열기", run: () => setSplitLayout("vertical-2") },
  { id: "split-horizontal", title: "상하 2분할", hint: "아래쪽에 참고창 열기", run: () => setSplitLayout("horizontal-2") },
  { id: "split-duplicate-reference", title: "현재 문서 참고창 열기", hint: "현재 문서를 읽기 전용 pane으로 열기", run: () => duplicateCurrentDocumentToReferencePane("vertical-2") },
  { id: "split-toggle-scroll-sync", title: "분할 스크롤 동기화 전환", hint: "기본은 끔, 필요할 때만 켜기", run: toggleSplitScrollSync },
  { id: "export-card", title: "PNG 카드 내보내기", hint: "문서를 이미지로 저장", run: exportCard },
  { id: "export-epub", title: "EPUB 내보내기", hint: "문서를 XHTML로 패키징", run: () => exportFile("epub") },
  { id: "new-doc", title: "새 문서", hint: "Instant Draft", run: createAndFocusDocument },
];

COMMANDS.splice(COMMANDS.findIndex((item) => item.id === "split-single"), 0,
  { id: "format-debug-on", title: "Format Debug On", hint: "Enable rich text formatting debug logs", labOnly: true, run: () => setFormatDebugEnabled(true) },
  { id: "format-debug-off", title: "Format Debug Off", hint: "Disable rich text formatting debug logs", labOnly: true, run: () => setFormatDebugEnabled(false) },
  { id: "format-debug-show", title: "Show Format Debug Log", hint: "Print recent formatting debug entries to console", labOnly: true, run: showFormatDebugLog },
  { id: "format-debug-copy", title: "Copy Format Debug Log", hint: "Copy recent formatting debug entries as JSON", labOnly: true, run: copyFormatDebugLog },
);

if (!documents.length) {
  const first = createDocument(richSampleText());
  documents = [first];
  activeId = first.id;
  bootstrappedSample = true;
  persistNow();
}

function createDocument(content = "") {
  const now = new Date();
  const html = content ? markdownToHtml(content) : "<p></p>";
  return refreshDocDerived({
    id: crypto.randomUUID(),
    title: `Untitled ${formatDateTime(now)}`,
    content,
    contentHtml: html,
    plainText: "",
    previewText: "",
    searchText: "",
    type: inferDocType("", content),
    folderId: null,
    wordCount: 0,
    charCount: 0,
    color: DOC_COLORS[Math.floor(Math.random() * DOC_COLORS.length)],
    deletedAt: null,
    theme: "modern",
    modelVersion: 3,
    tags: [],
    favorite: false,
    history: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function safeDateString(value, fallback = new Date().toISOString()) {
  const time = new Date(value || fallback).getTime();
  return Number.isFinite(time) ? new Date(time).toISOString() : fallback;
}

function normalizeDocuments(items) {
  return safeArray(items)
    .filter((doc) => doc && typeof doc === "object")
    .map((doc) =>
      refreshDocDerived({
        ...doc,
        id: safeString(doc.id) || crypto.randomUUID(),
        title: safeString(doc.title, "Untitled"),
        content: safeString(doc.content),
        contentHtml: safeString(doc.contentHtml) || markdownToHtml(safeString(doc.content)),
        type: doc.type || inferDocType(safeString(doc.title), safeString(doc.content) || safeString(doc.contentHtml)),
        folderId: doc.folderId || null,
        color: doc.color || DOC_COLORS[Math.abs(hashString(doc.id || doc.title || "")) % DOC_COLORS.length],
        deletedAt: doc.deletedAt || null,
        theme: doc.theme || "modern",
        modelVersion: doc.modelVersion || 3,
        tags: safeArray(doc.tags).map((tag) => safeString(tag).trim()).filter(Boolean).slice(0, 20),
        favorite: Boolean(doc.favorite),
        history: safeArray(doc.history).filter((item) => item && typeof item === "object"),
        createdAt: safeDateString(doc.createdAt),
        updatedAt: safeDateString(doc.updatedAt || doc.createdAt),
      }),
    );
}

function refreshDocDerived(doc) {
  doc.tags = safeArray(doc.tags);
  doc.title = safeString(doc.title, "Untitled");
  doc.content = safeString(doc.content);
  doc.contentHtml = sanitizeRichHtml(safeString(doc.contentHtml) || markdownToHtml(doc.content));
  const plain = htmlToPlain(doc.contentHtml || markdownToHtml(doc.content || ""));
  const preview = plain.replace(/\s+/g, " ").trim().slice(0, 120);
  doc.plainText = plain;
  doc.previewText = preview || "빈 문서";
  doc.searchText = `${doc.title}\n${doc.type}\n${doc.tags.join(" ")}\n${plain}`.toLowerCase();
  doc.wordCount = countWords(plain);
  doc.charCount = plain.length;
  Object.defineProperty(doc, "_summary", {
    value: doc.previewText,
    configurable: true,
  });
  Object.defineProperty(doc, "_searchText", {
    value: doc.searchText,
    configurable: true,
  });
  return doc;
}

function inferDocType(title, text) {
  const source = `${title}\n${text}`.toLowerCase();
  if (source.includes("prompt") || source.includes("프롬프트")) return "prompt";
  if (source.includes("report") || source.includes("보고서")) return "report";
  if (source.includes("board") || source.includes("게시글") || source.includes("게시판")) return "board";
  if (source.includes("log") || source.includes("로그")) return "log";
  return "note";
}

function countWords(text) {
  const koreanChars = (text.match(/[\uAC00-\uD7A3]/g) || []).length;
  const words = text.replace(/[\uAC00-\uD7A3]/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return words + Math.ceil(koreanChars / 2);
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash << 5) - hash + value.charCodeAt(i);
  return hash;
}

function loadDocuments() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function loadPrompts() {
  try {
    return JSON.parse(localStorage.getItem(PROMPT_KEY) || "[]");
  } catch {
    return [];
  }
}

function loadFolders() {
  try {
    return JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function normalizeFolders(items) {
  return safeArray(items)
    .filter((folder) => folder && typeof folder === "object")
    .map((folder) => ({
      id: safeString(folder.id) || crypto.randomUUID(),
      name: safeString(folder.name, "새 폴더"),
      parentId: folder.parentId || null,
      createdAt: safeDateString(folder.createdAt),
      updatedAt: safeDateString(folder.updatedAt || folder.createdAt),
    }));
}

function persistPrompts() {
  safeLocalSet(PROMPT_KEY, JSON.stringify(customPrompts));
  scheduleDurableSave();
}

function openPersonalDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("state")) db.createObjectStore("state");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function persistToDurableStorage() {
  if (durableSaveInFlight) {
    scheduleDurableSave();
    return;
  }
  durableSaveInFlight = true;
  let db = null;
  try {
    db = await openPersonalDb();
    const previousSnapshot = await new Promise((resolve, reject) => {
      const tx = db.transaction("state", "readonly");
      const request = tx.objectStore("state").get("snapshot");
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    const previousCount = previousSnapshot?.documents?.length || 0;
    if (previousCount > documents.length) {
      throw new Error(`Refusing destructive document shrink: ${previousCount} -> ${documents.length}`);
    }
    await new Promise((resolve, reject) => {
      const tx = db.transaction("state", "readwrite");
      const store = tx.objectStore("state");
      if (previousSnapshot?.documents?.length) store.put(previousSnapshot, "snapshot-backup");
      store.put({
        documents,
        folders,
        activeId,
        customPrompts,
        savedAt: new Date().toISOString(),
      }, "snapshot");
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore local cleanup failures; IndexedDB remains the source of truth.
    }
    els.sessionText.textContent = "영구 저장소에 저장했습니다.";
  } catch (error) {
    console.warn("[TextForge] durable save blocked or failed", error);
    els.sessionText.textContent = "안전 장치가 문서함 덮어쓰기를 막았습니다.";
  } finally {
    db?.close();
    durableSaveInFlight = false;
  }
}

function scheduleDurableSave(delay = DURABLE_SAVE_DELAY) {
  if (!durableStorageHydrated) return;
  clearTimeout(durableSaveTimer);
  durableSaveTimer = setTimeout(persistToDurableStorage, delay);
}

function safeLocalSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

async function hydrateFromDurableStorage() {
  try {
    const db = await openPersonalDb();
    const snapshot = await new Promise((resolve, reject) => {
      const tx = db.transaction("state", "readonly");
      const store = tx.objectStore("state");
      const currentRequest = store.get("snapshot");
      const backupRequest = store.get("snapshot-backup");
      tx.oncomplete = () => {
        const current = currentRequest.result || null;
        const backup = backupRequest.result || null;
        const currentCount = current?.documents?.length || 0;
        const backupCount = backup?.documents?.length || 0;
        resolve(backupCount > currentCount ? backup : current);
      };
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    if (!snapshot?.documents?.length) return;

    const localUpdated = latestUpdatedAt(documents);
    const durableUpdated = latestUpdatedAt(snapshot.documents);
    if (durableUpdated > localUpdated || bootstrappedSample) {
      documents = normalizeDocuments(snapshot.documents);
      folders = normalizeFolders(snapshot.folders || folders);
      activeId = snapshot.activeId || documents[0]?.id;
      customPrompts = Array.isArray(snapshot.customPrompts) ? snapshot.customPrompts : customPrompts;
      bootstrappedSample = false;
      safeLocalSet(ACTIVE_KEY, activeId || "");
      safeLocalSet(PROMPT_KEY, JSON.stringify(customPrompts));
      safeLocalSet(FOLDERS_KEY, JSON.stringify(folders));
      safeLocalSet(STORAGE_POINTER_KEY, JSON.stringify({ activeId, count: documents.length, restoredAt: new Date().toISOString() }));
      renderActive();
    els.sessionText.textContent = "영구 저장소에서 문서를 복구했습니다.";
    }
  } catch {
    els.sessionText.textContent = "영구 저장소를 읽지 못했습니다.";
  } finally {
    durableStorageHydrated = true;
  }
}

function latestUpdatedAt(items) {
  return Math.max(0, ...items.map((doc) => new Date(doc.updatedAt || doc.createdAt || 0).getTime()));
}

function activeDoc() {
  return documents.find((doc) => doc.id === activeId) || documents[0];
}

function defaultSplitWorkspace() {
  return {
    layout: "single",
    activePaneId: "main",
    syncScrollEnabled: false,
    panes: [
      { id: "main", documentId: activeId || null, mode: "write", scrollTop: 0, lockedScroll: false, readonly: false, syncScrollGroup: null, widthRatio: 0.5, lastUserScrollAt: 0, lastProgrammaticRestoreAt: 0, lockedScrollTop: 0 },
      { id: "reference", documentId: activeId || null, mode: "readonly", scrollTop: 0, lockedScroll: true, readonly: true, syncScrollGroup: null, widthRatio: 0.5, lastUserScrollAt: 0, lastProgrammaticRestoreAt: 0, lockedScrollTop: 0 },
    ],
  };
}

function loadSplitWorkspace() {
  try {
    const stored = JSON.parse(localStorage.getItem(SPLIT_WORKSPACE_KEY) || "null");
    if (!stored || typeof stored !== "object") return defaultSplitWorkspace();
    const base = defaultSplitWorkspace();
    const storedPanes = safeArray(stored.panes);
    const panes = base.panes.map((fallback) => {
      const storedPane = storedPanes.find((pane) => pane?.id === fallback.id) || {};
      const docExists = !storedPane.documentId || documents.some((doc) => doc.id === storedPane.documentId);
      return {
        ...fallback,
        ...storedPane,
        documentId: docExists ? storedPane.documentId || fallback.documentId : activeId || null,
        mode: ["write", "source", "preview", "clean", "readonly"].includes(storedPane.mode) ? storedPane.mode : fallback.mode,
        scrollTop: Number.isFinite(storedPane.scrollTop) ? storedPane.scrollTop : 0,
        lockedScrollTop: Number.isFinite(storedPane.lockedScrollTop) ? storedPane.lockedScrollTop : Number.isFinite(storedPane.scrollTop) ? storedPane.scrollTop : 0,
        lastUserScrollAt: 0,
        lastProgrammaticRestoreAt: 0,
        lockedScroll: Boolean(storedPane.lockedScroll ?? fallback.lockedScroll),
        readonly: fallback.id === "main" ? false : true,
      };
    });
    const layout = ["single", "vertical-2", "horizontal-2"].includes(stored.layout) ? stored.layout : "single";
    return {
      ...base,
      ...stored,
      layout,
      activePaneId: panes.some((pane) => pane.id === stored.activePaneId) ? stored.activePaneId : "main",
      panes,
      syncScrollEnabled: Boolean(stored.syncScrollEnabled),
    };
  } catch {
    return defaultSplitWorkspace();
  }
}

function persistSplitWorkspace() {
  try {
    localStorage.setItem(SPLIT_WORKSPACE_KEY, JSON.stringify(splitWorkspace));
  } catch {
    // Split layout is convenience state; editing data is saved elsewhere.
  }
}

function getActivePane() {
  return splitWorkspace.panes.find((pane) => pane.id === splitWorkspace.activePaneId) || splitWorkspace.panes[0];
}

function getPane(paneId) {
  return splitWorkspace.panes.find((pane) => pane.id === paneId);
}

function getActiveDocumentId() {
  return getActivePane()?.id === "main" ? activeId : getActivePane()?.documentId || activeId;
}

function getActiveDocument() {
  return documents.find((doc) => doc.id === getActiveDocumentId()) || activeDoc();
}

function setActivePane(paneId) {
  if (!getPane(paneId)) return;
  splitWorkspace.activePaneId = paneId;
  persistSplitWorkspace();
  applySplitWorkspaceUi();
}

function focusWithoutScroll(element) {
  if (!element) return;
  const beforeSelection = getSelectionDebugSummary();
  const beforeActive = document.activeElement?.id || document.activeElement?.className || document.activeElement?.tagName;
  try {
    element.focus({ preventScroll: true });
  } catch {
    element.focus();
  }
  const afterSelection = getSelectionDebugSummary();
  formatDebugLog("focusWithoutScroll", {
    target: element.id || element.className || element.tagName,
    before: { activeElement: beforeActive, selection: beforeSelection },
    after: {
      activeElement: document.activeElement?.id || document.activeElement?.className || document.activeElement?.tagName,
      selection: afterSelection,
    },
    selectionChanged: JSON.stringify(beforeSelection) !== JSON.stringify(afterSelection),
  });
}

function openDocumentInPane(documentId, paneId = "main", options = {}) {
  if (paneId === "main") startDocumentSwitchTrace(documentId, options.source || "unknown");
  markDocumentSwitch("openDocumentInPane:start");
  const doc = documents.find((item) => item.id === documentId);
  if (!doc) {
    markDocumentSwitch("openDocumentInPane:missing-document");
    endDocumentSwitchTrace();
    return;
  }
  if (paneId === "main") {
    savePaneScroll("main");
    activeId = doc.id;
    splitWorkspace.panes[0].documentId = doc.id;
    splitWorkspace.activePaneId = "main";
    safeLocalSet(ACTIVE_KEY, activeId);
    renderActive();
    markDocumentSwitch("openDocumentInPane:end");
    return;
  }
  const pane = getPane(paneId);
  if (!pane) return;
  savePaneScroll(paneId);
  pane.documentId = doc.id;
  pane.mode = options.mode || pane.mode || "readonly";
  pane.readonly = true;
  pane.scrollTop = 0;
  pane.lockedScroll = options.lockedScroll ?? pane.lockedScroll ?? true;
  splitWorkspace.layout = options.layout || splitWorkspace.layout || "vertical-2";
  splitWorkspace.activePaneId = paneId;
  persistSplitWorkspace();
  renderSplitWorkspace();
  markDocumentSwitch("openDocumentInPane:end");
}

function openDocumentInNewPane(documentId, options = {}) {
  splitWorkspace.layout = options.layout || "vertical-2";
  openDocumentInPane(documentId, "reference", { mode: options.mode || "readonly", lockedScroll: options.lockedScroll ?? true, layout: splitWorkspace.layout });
}

function duplicateCurrentDocumentToReferencePane(layout = "vertical-2") {
  if (!activeId) return;
  splitWorkspace.layout = layout;
  openDocumentInPane(activeId, "reference", { mode: "readonly", lockedScroll: true, layout });
  setActivePane("main");
}

function closePane(paneId) {
  if (paneId === "main") return;
  savePaneScroll(paneId);
  splitWorkspace.layout = "single";
  splitWorkspace.activePaneId = "main";
  persistSplitWorkspace();
  renderSplitWorkspace();
}

function setSplitLayout(layout) {
  if (!["single", "vertical-2", "horizontal-2"].includes(layout)) return;
  savePaneScroll("reference");
  splitWorkspace.layout = layout;
  if (layout === "single") splitWorkspace.activePaneId = "main";
  if (layout !== "single" && !getPane("reference").documentId) getPane("reference").documentId = activeId;
  persistSplitWorkspace();
  renderSplitWorkspace();
}

function setPaneScrollLocked(paneId, locked) {
  const pane = getPane(paneId);
  if (!pane) return;
  pane.lockedScroll = locked;
  if (locked) {
    const scroller = getPaneScrollElement(paneId);
    pane.lockedScrollTop = scroller?.scrollTop || pane.scrollTop || 0;
  }
  persistSplitWorkspace();
  applySplitWorkspaceUi();
}

function toggleSplitScrollSync() {
  splitWorkspace.syncScrollEnabled = !splitWorkspace.syncScrollEnabled;
  splitWorkspace.panes.forEach((pane) => {
    pane.syncScrollGroup = splitWorkspace.syncScrollEnabled ? "main" : null;
  });
  persistSplitWorkspace();
  applySplitWorkspaceUi();
}

function savePaneScroll(paneId) {
  const pane = getPane(paneId);
  const scroller = getPaneScrollElement(paneId);
  if (pane && scroller) pane.scrollTop = scroller.scrollTop;
}

function restorePaneScroll(paneId) {
  const pane = getPane(paneId);
  const scroller = getPaneScrollElement(paneId);
  if (!pane || !scroller) return;
  scroller.scrollTop = Math.max(0, pane.scrollTop || 0);
}

function restorePaneScrollStable(paneId, savedScrollTop = getPane(paneId)?.scrollTop || 0, snapshot = null) {
  const pane = getPane(paneId);
  const scroller = getPaneScrollElement(paneId);
  if (!pane || !scroller) return;
  const restore = () => {
    if (Date.now() - (pane.lastUserScrollAt || 0) < 180) return;
    pane.lastProgrammaticRestoreAt = Date.now();
    scroller.scrollTop = Math.max(0, savedScrollTop || 0);
    if (snapshot) restoreParentScrollSnapshot(snapshot);
  };
  restore();
  requestAnimationFrame(() => {
    restore();
    requestAnimationFrame(restore);
  });
  setTimeout(restore, 50);
  setTimeout(restore, 180);
}

function getPaneScrollElement(paneId) {
  return paneId === "main" ? currentMainScroller() : els.referencePaneBody;
}

function currentMainScroller() {
  if (els.editorGrid.classList.contains("source-mode")) return els.editor;
  if (els.editorGrid.classList.contains("clean-mode")) return els.preview;
  return els.richEditor;
}

function getSplitScrollContainers() {
  return [
    ["referenceBody", els.referencePaneBody],
    ["referencePane", els.referencePane],
    ["editorGrid", els.editorGrid],
    ["contentArea", els.contentArea],
    ["appShell", els.appShell],
    ["document", document.scrollingElement],
  ].filter(([, element]) => element);
}

function captureParentScrollSnapshot() {
  return getSplitScrollContainers().map(([name, element]) => ({ name, element, scrollTop: element.scrollTop || 0 }));
}

function restoreParentScrollSnapshot(snapshot) {
  snapshot?.forEach((item) => {
    if (item.name === "referenceBody") return;
    if (Math.abs((item.element.scrollTop || 0) - item.scrollTop) > 1) item.element.scrollTop = item.scrollTop;
  });
}

function beginLockedReferenceGuard(reason = "main-input", duration = 700) {
  const pane = getPane("reference");
  const scroller = els.referencePaneBody;
  if (!pane?.lockedScroll || splitWorkspace.layout === "single" || !scroller) return null;
  const snapshot = {
    reason,
    startedAt: Date.now(),
    until: Date.now() + duration,
    scrollTop: scroller.scrollTop,
    parents: captureParentScrollSnapshot(),
  };
  pane.lockedScrollTop = scroller.scrollTop;
  lockedReferenceGuard = snapshot;
  return snapshot;
}

function restoreLockedReferenceGuard(snapshot = lockedReferenceGuard) {
  const pane = getPane("reference");
  if (!pane?.lockedScroll || !snapshot) return;
  restorePaneScrollStable("reference", snapshot.scrollTop, snapshot.parents);
}

function markReferenceUserScroll() {
  const pane = getPane("reference");
  if (!pane) return;
  pane.lastUserScrollAt = Date.now();
}

function handleReferenceScroll() {
  const pane = getPane("reference");
  const scroller = els.referencePaneBody;
  if (!pane || !scroller) return;
  if (Date.now() - (pane.lastProgrammaticRestoreAt || 0) < 90) return;
  const isUserScroll = Date.now() - (pane.lastUserScrollAt || 0) < 500;
  if (pane.lockedScroll && !isUserScroll) {
    const target = lockedReferenceGuard?.scrollTop ?? pane.lockedScrollTop ?? pane.scrollTop ?? 0;
    if (Math.abs(scroller.scrollTop - target) > 1) {
      if (!splitScrollDriftWarned) {
        console.warn("[TextForge split] locked reference scroll drift restored", {
          element: "referencePaneBody",
          before: target,
          after: scroller.scrollTop,
          cause: lockedReferenceGuard?.reason || "layout-shift",
        });
        splitScrollDriftWarned = true;
      }
      restorePaneScrollStable("reference", target, lockedReferenceGuard?.parents);
    }
    return;
  }
  pane.scrollTop = scroller.scrollTop;
  pane.lockedScrollTop = scroller.scrollTop;
}

function syncPaneScroll(sourcePaneId) {
  if (!splitWorkspace.syncScrollEnabled || paneScrollSyncing) return;
  const source = sourcePaneId === "main" ? currentMainScroller() : els.referencePaneBody;
  const targetPaneId = sourcePaneId === "main" ? "reference" : "main";
  const targetPane = getPane(targetPaneId);
  const target = targetPaneId === "main" ? currentMainScroller() : els.referencePaneBody;
  if (!source || !target || targetPane?.lockedScroll) return;
  const maxSource = Math.max(1, source.scrollHeight - source.clientHeight);
  const maxTarget = Math.max(1, target.scrollHeight - target.clientHeight);
  paneScrollSyncing = true;
  target.scrollTop = (source.scrollTop / maxSource) * maxTarget;
  savePaneScroll(targetPaneId);
  requestAnimationFrame(() => {
    paneScrollSyncing = false;
  });
}

function disableAutoScrollForPane(paneId) {
  const pane = getPane(paneId);
  if (!pane) return;
  pane.syncScrollGroup = null;
  pane.lockedScroll = true;
  persistSplitWorkspace();
}

function renderSplitWorkspace(options = {}) {
  if (!els.referencePane) return;
  const preserveScroll = options.preserveScroll !== false;
  const refPane = getPane("reference");
  const guard = refPane?.lockedScroll ? beginLockedReferenceGuard(options.reason || "split-render", 800) : null;
  if (preserveScroll) {
    savePaneScroll("main");
    if (!refPane?.lockedScroll) savePaneScroll("reference");
  }
  applySplitWorkspaceUi();
  renderReferencePane();
  requestAnimationFrame(() => {
    restorePaneScroll("main");
    if (refPane?.lockedScroll) restoreLockedReferenceGuard(guard);
    else restorePaneScrollStable("reference");
  });
}

function scheduleReferencePaneRender(delay = 80) {
  clearTimeout(referenceRenderTimer);
  const pane = getPane("reference");
  const safeDelay = pane?.lockedScroll && splitWorkspace.layout !== "single" ? Math.max(delay, 900) : delay;
  referenceRenderTimer = setTimeout(() => renderSplitWorkspace({ preserveScroll: true, reason: "delayed-reference-refresh" }), safeDelay);
}

function renderReferencePane() {
  const pane = getPane("reference");
  const visible = splitWorkspace.layout !== "single";
  els.referencePane?.classList.toggle("hidden", !visible);
  if (!visible || !pane) return;
  const doc = documents.find((item) => item.id === pane.documentId) || activeDoc();
  if (!doc) {
    els.referencePaneBody.innerHTML = '<p class="empty-note">열 문서가 없습니다.</p>';
    return;
  }
  pane.documentId = doc.id;
  els.referencePaneTitle.textContent = doc.title || "Untitled";
  if (els.referencePaneMode) els.referencePaneMode.value = pane.mode || "readonly";
  if (els.referenceDocSelect) els.referenceDocSelect.value = doc.id;
  const html = doc.contentHtml || markdownToHtml(doc.content || "");
  const previousSignature = els.referencePaneBody.dataset.renderSignature || "";
  const signature = `${doc.id}:${doc.updatedAt || ""}:${pane.mode || "readonly"}`;
  if (pane.lockedScroll && previousSignature === signature) {
    restorePaneScrollStable("reference", pane.lockedScrollTop ?? pane.scrollTop ?? 0);
    return;
  }
  if (pane.mode === "source") {
    els.referencePaneBody.innerHTML = `<pre><code>${escapeHtml(doc.content || htmlToMarkdown(html))}</code></pre>`;
  } else {
    els.referencePaneBody.innerHTML = prepareHtmlForThemedRender(html);
  }
  els.referencePaneBody.dataset.renderSignature = signature;
  els.referencePaneBody.setAttribute("contenteditable", "false");
  scheduleContentColorAdaptation(0);
}

function applySplitWorkspaceUi() {
  if (!els.editorGrid) return;
  const layout = splitWorkspace.layout || "single";
  els.editorGrid.classList.toggle("workspace-active", layout !== "single");
  els.editorGrid.classList.toggle("workspace-vertical", layout === "vertical-2");
  els.editorGrid.classList.toggle("workspace-horizontal", layout === "horizontal-2");
  els.editorGrid.classList.toggle("active-main-pane", splitWorkspace.activePaneId === "main");
  els.editorGrid.classList.toggle("active-reference-pane", splitWorkspace.activePaneId === "reference");
  els.referencePane?.classList.toggle("active-pane", splitWorkspace.activePaneId === "reference");
  els.editorGrid.querySelector(".editor-pane")?.classList.toggle("active-pane", splitWorkspace.activePaneId === "main");
  const ref = getPane("reference");
  if (els.referenceScrollLockBtn) els.referenceScrollLockBtn.textContent = ref?.lockedScroll ? "Locked" : "Lock";
  if (els.referenceSyncBtn) els.referenceSyncBtn.textContent = splitWorkspace.syncScrollEnabled ? "Sync On" : "Sync Off";
  if (els.splitSyncBtn) els.splitSyncBtn.textContent = splitWorkspace.syncScrollEnabled ? "스크롤 동기화 켜짐" : "스크롤 동기화 꺼짐";
}

function refreshSplitDocumentSelectors() {
  const options = documents.map((doc) => `<option value="${escapeAttr(doc.id)}">${escapeHtml(doc.title || "Untitled")}</option>`).join("");
  if (els.splitOpenDocSelect) {
    els.splitOpenDocSelect.innerHTML = `<option value="">오른쪽에 열 문서</option>${options}`;
  }
  if (els.referenceDocSelect) {
    els.referenceDocSelect.innerHTML = options;
  }
}

function persistSoon() {
  els.saveState.textContent = "저장 중...";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persistNow, 250);
}

function persistNow() {
  safeLocalSet(ACTIVE_KEY, activeId || "");
  safeLocalSet(FOLDERS_KEY, JSON.stringify(folders));
  safeLocalSet(SESSION_KEY, JSON.stringify({ id: activeId, title: activeDoc()?.title || "", updatedAt: activeDoc()?.updatedAt || "" }));
  safeLocalSet(STORAGE_POINTER_KEY, JSON.stringify({ activeId, count: documents.length, updatedAt: new Date().toISOString() }));
  scheduleDurableSave();
  els.saveState.textContent = `저장됨 ${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
  renderDocList();
  if (els.appShell.classList.contains("finder-active")) renderFinder();
}

function updateActive(mutator) {
  const doc = activeDoc();
  if (!doc) return;
  const before = doc.content;
  mutator(doc);
  doc.updatedAt = new Date().toISOString();
  refreshDocDerived(doc);
  maybeAutoSnapshot(doc, before);
  persistSoon();
}

function cancelPendingPostSwitchRender() {
  if (postSwitchRenderTimer) clearTimeout(postSwitchRenderTimer);
  if (postSwitchRenderFrame) cancelAnimationFrame(postSwitchRenderFrame);
  postSwitchRenderTimer = null;
  postSwitchRenderFrame = null;
}

function isInspectorVisible() {
  return inspectorOpen && !els.inspector?.classList.contains("collapsed");
}

function isPanelTabActive(tabName) {
  return isInspectorVisible() && inspectorTab === tabName;
}

function isPreviewPaneVisible() {
  return els.editorGrid?.classList.contains("clean-mode") || els.editorGrid?.classList.contains("split-mode");
}

function updateActiveDocListItemOnly(previousId, nextId) {
  if (!els.docList) return false;
  let touched = false;
  if (!previousId) {
    els.docList.querySelectorAll(".doc-item.active").forEach((item) => {
      item.classList.remove("active");
      touched = true;
    });
  }
  [previousId, nextId].filter(Boolean).forEach((id) => {
    const item = els.docList.querySelector(`[data-doc-id="${CSS.escape(id)}"]`);
    if (!item) return;
    item.classList.toggle("active", id === nextId);
    touched = true;
  });
  return touched;
}

function updateFinderActiveCardOnly(previousId, nextId) {
  if (!els.finderGrid) return false;
  let touched = false;
  if (!previousId) {
    els.finderGrid.querySelectorAll(".doc-card.active").forEach((item) => {
      item.classList.remove("active");
      touched = true;
    });
  }
  [previousId, nextId].filter(Boolean).forEach((id) => {
    const item = els.finderGrid.querySelector(`[data-doc-id="${CSS.escape(id)}"]`);
    if (!item) return;
    item.classList.toggle("active", id === nextId);
    touched = true;
  });
  return touched;
}

function scheduleSplitWorkspaceRender(delay = 80) {
  if (splitWorkspace.layout === "single") {
    applySplitWorkspaceUi();
    return;
  }
  clearTimeout(splitWorkspaceRenderTimer);
  splitWorkspaceRenderTimer = setTimeout(() => {
    renderSplitWorkspace({ preserveScroll: true, reason: "post-switch" });
  }, delay);
}

function renderActiveDeferred(docId) {
  if (docId !== activeId) return;
  markDocumentSwitch("renderActiveDeferred:start");
  renderPreview({ panels: false, split: false, color: false });
  markDocumentSwitch("after deferred renderPreview");
  if (docId !== activeId) return;
  if (isPanelTabActive("toc")) renderToc();
  markDocumentSwitch("after deferred visible toc");
  if (docId !== activeId) return;
  if (isPanelTabActive("history")) renderHistory();
  markDocumentSwitch("after deferred visible history");
  if (docId !== activeId) return;
  if (isPanelTabActive("prompt")) renderPromptVault();
  markDocumentSwitch("after deferred visible prompt vault");
  if (docId !== activeId) return;
  if (isPanelTabActive("system")) renderSystemPanel();
  markDocumentSwitch("after deferred visible system panel");
  if (docId !== activeId) return;
  if (isPanelTabActive("info")) renderDocInfoPanel();
  markDocumentSwitch("after deferred visible doc info panel");
  updateStats();
  markDocumentSwitch("after deferred updateStats");
  refreshSplitDocumentSelectors();
  markDocumentSwitch("after deferred refreshSplitDocumentSelectors");
  scheduleContentColorAdaptation(80);
  scheduleSplitWorkspaceRender(80);
  markDocumentSwitch("renderActiveDeferred:end");
}

function schedulePostSwitchRender(docId, delay = 80) {
  cancelPendingPostSwitchRender();
  postSwitchRenderFrame = requestAnimationFrame(() => {
    postSwitchRenderFrame = null;
    postSwitchRenderTimer = setTimeout(() => {
      postSwitchRenderTimer = null;
      renderActiveDeferred(docId);
    }, delay);
  });
}

function renderActive() {
  markDocumentSwitch("renderActive:start");
  const doc = activeDoc();
  if (!doc) return;
  cancelPendingPostSwitchRender();
  splitWorkspace.panes[0].documentId = doc.id;
  els.titleInput.value = doc.title;
  els.editor.value = doc.content;
  markDocumentSwitch("after title/source/editor update");
  setRichEditorHtmlPrepared(doc.contentHtml || markdownToHtml(doc.content || ""));
  markDocumentSwitch("after richEditor.innerHTML");
  els.themeSelect.value = doc.theme || "modern";
  applyDocumentTheme(doc.theme || "modern");
  markDocumentSwitch("after apply document theme");
  els.tagInput.value = doc.tags.join(", ");
  els.favoriteBtn.classList.toggle("active", doc.favorite);
  els.favoriteBtn.textContent = doc.favorite ? "★" : "☆";
  markDocumentSwitch("after tag/favorite UI update");
  if (isPreviewPaneVisible()) {
    markDocumentSwitch("before fast visible preview render");
    renderPreview({ panels: false, split: false, color: false });
    markDocumentSwitch("after fast visible preview render");
  }
  markDocumentSwitch("before fast doc list active update");
  updateActiveDocListItemOnly(null, doc.id);
  updateFinderActiveCardOnly(null, doc.id);
  markDocumentSwitch("after fast doc list active update");
  markDocumentSwitch("before schedule post switch render");
  schedulePostSwitchRender(doc.id);
  markDocumentSwitch("after schedule post switch render");
  if (activeDocumentSwitchTrace) {
    activeDocumentSwitchTrace.totalToRenderActiveEndMs = Number((performance.now() - activeDocumentSwitchTrace.startedAt).toFixed(2));
    markDocumentSwitch("document-switch:before-next-frame");
    requestAnimationFrame(() => endDocumentSwitchTrace());
  }
}

function renderDocList() {
  markDocumentSwitch("renderDocList:start");
  const query = els.searchInput.value.trim().toLowerCase();
  const visible = documents
    .map((doc) => ({ doc, score: searchScore(doc, query) }))
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        Number(b.doc.favorite) - Number(a.doc.favorite) ||
        b.score - a.score ||
        new Date(b.doc.updatedAt) - new Date(a.doc.updatedAt),
    );
  markDocumentSwitch("after filter/sort");

  els.docList.innerHTML = "";
  markDocumentSwitch("after clear list DOM");
  visible.forEach(({ doc }) => {
    const item = document.createElement("button");
    item.className = `doc-item${doc.id === activeId ? " active" : ""}`;
    item.type = "button";
    item.dataset.docId = doc.id;
    const tags = doc.tags.length ? `<span class="doc-tags">${doc.tags.map((tag) => `#${escapeHtml(tag)}`).join(" ")}</span>` : "";
    item.innerHTML = `<strong>${doc.favorite ? "★ " : ""}${escapeHtml(doc.title)}</strong><span>${escapeHtml(doc._summary || "빈 문서")}</span>${tags}`;
    item.addEventListener("click", () => {
      const pane = getActivePane();
      if (splitWorkspace.layout !== "single" && pane?.id === "reference") {
        openDocumentInPane(doc.id, "reference", { mode: pane.mode || "readonly", lockedScroll: pane.lockedScroll, source: "doc-list" });
      } else {
        openDocumentInPane(doc.id, "main", { source: "doc-list" });
      }
    });
    els.docList.append(item);
  });
  markDocumentSwitch("after create document buttons");
  markDocumentSwitch("renderDocList:end");
}

function openFinder() {
  els.appShell.classList.add("finder-active");
  finderState.page = 0;
  renderFinder();
  focusWithoutScroll(els.finderSearchInput);
}

function openForgeSnapshotPanel() {
  window.ForgeSnapshot?.openForgeSnapshotDialog({
    getDocuments: () => documents.map((doc) => ({ ...doc })),
    getFolders: () => folders.map((folder) => ({ ...folder })),
    getSelectedIds: () => [...finderState.selectedIds],
    getCurrentFolderId: () => finderState.folderId,
  });
}

async function openDiagnosticsPanel() {
  window.TextForgeDiagnostics?.configure?.(getDiagnosticsContext());
  window.TextForgeDiagnostics?.openDiagnosticsPanel(getDiagnosticsContext());
}

function getDiagnosticsContext() {
  return {
    getDocuments: () => documents.map((doc) => ({ ...doc })),
    getFolders: () => folders.map((folder) => ({ ...folder })),
    getActiveDocument: () => ({ ...activeDoc() }),
  };
}

function configureDiagnosticsContext() {
  window.TextForgeDiagnostics?.configure?.(getDiagnosticsContext());
}

function setInspectorOpen(open, tab = inspectorTab) {
  inspectorOpen = open;
  inspectorTab = tab || inspectorTab;
  localStorage.setItem("textforge.inspectorOpen", String(inspectorOpen));
  localStorage.setItem("textforge.inspectorTab", inspectorTab);
  renderInspectorState();
  if (!inspectorOpen) return;
  if (inspectorTab === "toc") renderToc();
  if (inspectorTab === "history") renderHistory();
  if (inspectorTab === "prompt") renderPromptVault();
  if (inspectorTab === "system") renderSystemPanel();
  if (inspectorTab === "info") renderDocInfoPanel();
}

function renderInspectorState() {
  els.inspector?.classList.toggle("collapsed", !inspectorOpen);
  els.contentArea?.classList.toggle("inspector-collapsed", !inspectorOpen);
  els.inspectorToggleBtn?.classList.toggle("active", inspectorOpen);
  document.querySelectorAll(".inspector-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.inspectorTab === inspectorTab);
  });
  document.querySelectorAll(".inspector-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.inspectorPanel === inspectorTab);
  });
}

function setUiMode(mode) {
  uiMode = ["simple", "pro", "lab"].includes(mode) ? mode : "pro";
  localStorage.setItem("textforge.uiMode", uiMode);
  document.documentElement.dataset.uiMode = uiMode;
}

function loadFocusModeState() {
  return localStorage.getItem(FOCUS_MODE_KEY) === "true";
}

function saveFocusModeState() {
  localStorage.setItem(FOCUS_MODE_KEY, String(focusMode));
}

function updateFocusModeUi() {
  document.documentElement.classList.toggle("focus-mode", focusMode);
  els.focusModeBtn?.classList.toggle("active", focusMode);
  if (els.focusModeBtn) els.focusModeBtn.textContent = focusMode ? "집중 모드 종료" : "집중 모드";
}

function applyFocusMode(enabled) {
  focusMode = Boolean(enabled);
  saveFocusModeState();
  updateFocusModeUi();
}

function toggleFocusMode() {
  applyFocusMode(!focusMode);
}

function initPwaInstallHints() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    document.documentElement.dataset.pwaInstallReady = "true";
    window.textforgeInstallPrompt = event;
  });
}

function closeFinder() {
  els.appShell.classList.remove("finder-active");
  hideDocContextMenu();
}

function renderFinder() {
  renderFinderSidebar();
  const all = getFinderDocuments();
  const maxPage = Math.max(0, Math.ceil(all.length / finderState.pageSize) - 1);
  finderState.page = Math.min(finderState.page, maxPage);
  const start = finderState.page * finderState.pageSize;
  const visible = all.slice(start, start + finderState.pageSize);
  els.finderAllCount.textContent = String(documents.filter((doc) => !doc.deletedAt).length);
  els.finderCrumbs.textContent = getFinderCrumbText(all.length);
  els.finderGrid.classList.toggle("list-view", finderState.view === "list");
  els.finderGrid.classList.toggle("selecting", finderState.selecting);
  els.finderGrid.innerHTML = "";

  if (!documents.length) {
    els.finderGrid.innerHTML = '<div class="empty-library">새 문서를 만들어 TextForge를 시작하세요.</div>';
  } else if (!all.length) {
    els.finderGrid.innerHTML = '<div class="empty-library">검색 결과가 없습니다.</div>';
  } else {
    const fragment = document.createDocumentFragment();
    visible.forEach((doc) => fragment.append(createDocCard(doc)));
    els.finderGrid.append(fragment);
  }

  els.finderPageText.textContent = `${all.length ? finderState.page + 1 : 0} / ${Math.max(1, maxPage + 1)}`;
  els.finderPrevBtn.disabled = finderState.page <= 0;
  els.finderNextBtn.disabled = finderState.page >= maxPage;
  renderBulkBar();
}

function getFinderDocuments() {
  const query = finderState.query.trim().toLowerCase();
  return documents
    .filter((doc) => {
      if (finderState.filter === "trash") return Boolean(doc.deletedAt);
      if (doc.deletedAt) return false;
      if (finderState.filter === "favorites" && !doc.favorite) return false;
      if (finderState.filter === "prompts" && doc.type !== "prompt") return false;
      if (finderState.filter === "recent" && Date.now() - new Date(doc.updatedAt).getTime() > 1000 * 60 * 60 * 24 * 30) return false;
      if (finderState.tag && !doc.tags.includes(finderState.tag)) return false;
      if (finderState.folderId !== undefined && finderState.folderId !== null && doc.folderId !== finderState.folderId) return false;
      if (!query) return true;
      return (doc.searchText || doc._searchText || "").includes(query);
    })
    .sort(sortFinderDocs);
}

function sortFinderDocs(a, b) {
  if (finderState.sort === "created") return new Date(b.createdAt) - new Date(a.createdAt);
  if (finderState.sort === "title") return a.title.localeCompare(b.title, "ko");
  if (finderState.sort === "favorite") return Number(b.favorite) - Number(a.favorite) || new Date(b.updatedAt) - new Date(a.updatedAt);
  if (finderState.sort === "chars") return (b.charCount || 0) - (a.charCount || 0);
  return new Date(b.updatedAt) - new Date(a.updatedAt);
}

function getFinderCrumbText(count) {
  if (finderState.filter === "trash") return `휴지통 · ${count}`;
  if (finderState.tag) return `태그 #${finderState.tag} · ${count}`;
  if (finderState.folderId) return `${folders.find((folder) => folder.id === finderState.folderId)?.name || "폴더"} · ${count}`;
  if (finderState.filter === "favorites") return `즐겨찾기 · ${count}`;
  if (finderState.filter === "prompts") return `프롬프트 보관함 · ${count}`;
  if (finderState.filter === "recent") return `최근 문서 · ${count}`;
  return `전체 문서 · ${count}`;
}

function createDocCard(doc) {
  const card = document.createElement("button");
  card.type = "button";
  const typeLabels = { note: "메모", prompt: "프롬프트", report: "보고서", board: "게시글", log: "로그" };
  card.className = `doc-card${doc.id === activeId ? " active" : ""}${finderState.selectedIds.has(doc.id) ? " selected" : ""}`;
  card.draggable = true;
  card.dataset.docId = doc.id;
  card.style.setProperty("--card-color", doc.color || DOC_COLORS[0]);
  const tagHtml = doc.tags.slice(0, 4).map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("");
  card.innerHTML = `
    <span class="doc-check">${finderState.selectedIds.has(doc.id) ? "✓" : ""}</span>
    <div class="doc-card-head">
      <span class="doc-type">${escapeHtml(typeLabels[doc.type] || "메모")}</span>
      <span class="doc-star">${doc.favorite ? "★" : "☆"}</span>
    </div>
    <div class="doc-card-title">${escapeHtml(doc.title)}</div>
    <div class="doc-card-preview">${highlightSnippet(doc.previewText || doc._summary || "", finderState.query)}</div>
    <div class="doc-card-tags">${tagHtml}</div>
    <div class="doc-card-meta"><span>${formatHistoryTime(doc.updatedAt)}</span><span>${(doc.charCount || 0).toLocaleString("ko-KR")}자</span></div>
  `;
  card.addEventListener("click", () => {
    if (finderState.selecting) {
      toggleFinderSelection(doc.id);
      return;
    }
    openDocumentFromFinder(doc.id);
  });
  card.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", doc.id);
    event.dataTransfer.effectAllowed = "move";
  });
  card.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    showDocContextMenu(event, doc.id);
  });
  return card;
}
function highlightSnippet(text, query) {
  const safe = escapeHtml(text || "빈 문서");
  if (!query.trim()) return safe;
  const term = escapeRegex(query.trim().split(/\s+/)[0]);
  return safe.replace(new RegExp(`(${term})`, "ig"), "<mark>$1</mark>");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function openDocumentFromFinder(docId) {
  if (splitWorkspace.layout !== "single" && splitWorkspace.activePaneId === "reference") {
    openDocumentInPane(docId, "reference", { mode: getPane("reference")?.mode || "readonly", lockedScroll: getPane("reference")?.lockedScroll, source: "finder" });
  } else {
    openDocumentInPane(docId, "main", { source: "finder" });
  }
  closeFinder();
}

function renderFinderSidebar() {
  document.querySelectorAll(".finder-nav").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === finderState.filter && !finderState.tag && finderState.folderId === null);
  });

  const tags = [...new Set(documents.flatMap((doc) => (doc.deletedAt ? [] : doc.tags)))].sort((a, b) => a.localeCompare(b, "ko"));
  els.finderTagList.innerHTML = tags.length
    ? tags.map((tag) => `<button class="tag-filter${finderState.tag === tag ? " active" : ""}" data-tag="${escapeHtml(tag)}" type="button">#${escapeHtml(tag)}</button>`).join("")
    : '<span class="empty-note">제목을 쓰면 목차가 생깁니다.</span>';

  els.finderFolderList.innerHTML = folders.length
    ? folders.map((folder) => `<button class="folder-drop${finderState.folderId === folder.id ? " active" : ""}" data-folder-id="${folder.id}" type="button">${escapeHtml(folder.name)}<span>${documents.filter((doc) => !doc.deletedAt && doc.folderId === folder.id).length}</span></button>`).join("")
    : '<span class="empty-note">폴더 없음</span>';
}

function scheduleFinderRender() {
  clearTimeout(finderSearchTimer);
  finderSearchTimer = setTimeout(() => {
    finderState.query = els.finderSearchInput.value;
    finderState.page = 0;
    requestAnimationFrame(renderFinder);
  }, 180);
}

function toggleFinderSelection(docId) {
  if (finderState.selectedIds.has(docId)) finderState.selectedIds.delete(docId);
  else finderState.selectedIds.add(docId);
  renderFinder();
}

function setFinderSelecting(enabled) {
  finderState.selecting = enabled;
  if (!enabled) finderState.selectedIds.clear();
  els.finderSelectBtn.classList.toggle("active", enabled);
  renderFinder();
}

function renderBulkBar() {
  const count = finderState.selectedIds.size;
  els.finderBulkBar.classList.toggle("hidden", !finderState.selecting);
    els.finderSelectionCount.textContent = `${count}개 선택됨`;
  els.finderBulkFolderSelect.innerHTML = `<option value="">폴더 없음</option>${folders
    .map((folder) => `<option value="${folder.id}">${escapeHtml(folder.name)}</option>`)
    .join("")}`;
  els.finderBulkMoveBtn.disabled = count === 0;
  els.finderBulkTrashBtn.disabled = count === 0;
}

function bulkMoveSelected() {
  if (!finderState.selectedIds.size) return;
  const folderId = els.finderBulkFolderSelect.value || null;
  documents.forEach((doc) => {
    if (finderState.selectedIds.has(doc.id)) {
      doc.folderId = folderId;
      doc.updatedAt = new Date().toISOString();
      refreshDocDerived(doc);
    }
  });
  finderState.selectedIds.clear();
  persistNow();
  renderFinder();
}

function bulkTrashSelected() {
  if (!finderState.selectedIds.size) return;
  documents.forEach((doc) => {
    if (finderState.selectedIds.has(doc.id)) {
      doc.deletedAt = Date.now();
      doc.updatedAt = new Date().toISOString();
    }
  });
  finderState.selectedIds.clear();
  persistNow();
  renderFinder();
}

function createFolder() {
  const name = prompt("폴더 이름");
  if (!name?.trim()) return;
  folders.push({ id: crypto.randomUUID(), name: name.trim(), parentId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  persistNow();
  renderFinder();
}

function editFolder(folderId) {
  const folder = folders.find((item) => item.id === folderId);
  if (!folder) return;
  const next = prompt("폴더 이름을 바꿀까요? 비우면 삭제합니다.", folder.name);
  if (next === null) return;
  if (!next.trim()) {
    folders = folders.filter((item) => item.id !== folderId);
    documents.forEach((doc) => {
      if (doc.folderId === folderId) {
        doc.folderId = null;
        doc.updatedAt = new Date().toISOString();
        refreshDocDerived(doc);
      }
    });
    if (finderState.folderId === folderId) finderState.folderId = null;
  } else {
    folder.name = next.trim();
    folder.updatedAt = new Date().toISOString();
  }
  persistNow();
  renderFinder();
}

function moveDocumentToFolder(docId, folderId) {
  const doc = documents.find((item) => item.id === docId);
  if (!doc) return;
  doc.folderId = folderId;
  doc.updatedAt = new Date().toISOString();
  refreshDocDerived(doc);
  persistNow();
  renderFinder();
}

function showDocContextMenu(event, docId) {
  finderState.contextDocId = docId;
  els.docContextMenu.style.left = `${event.clientX}px`;
  els.docContextMenu.style.top = `${event.clientY}px`;
  els.docContextMenu.classList.remove("hidden");
}

function hideDocContextMenu() {
  els.docContextMenu.classList.add("hidden");
}

function closeOpenToolbarMenus(except = null) {
  document.querySelectorAll("details.menu-wrap[open]").forEach((menu) => {
    if (menu !== except) menu.removeAttribute("open");
  });
}

function closeFloatingUi(exceptMenu = null) {
  closeOpenToolbarMenus(exceptMenu);
  hideDocContextMenu();
}

function initFloatingUiDismiss() {
  document.addEventListener("pointerdown", (event) => {
    if (els.docContextMenu.contains(event.target)) return;
    const openMenu = event.target.closest?.("details.menu-wrap");
    closeFloatingUi(openMenu || null);
  });
  document.addEventListener("toggle", (event) => {
    const menu = event.target;
    if (!(menu instanceof HTMLDetailsElement) || !menu.classList.contains("menu-wrap") || !menu.open) return;
    closeOpenToolbarMenus(menu);
  }, true);
}

async function runDocContextAction(action) {
  const doc = documents.find((item) => item.id === finderState.contextDocId);
  if (!doc) return;
  if (action === "open") openDocumentFromFinder(doc.id);
  if (action === "open-right") {
    openDocumentInNewPane(doc.id, { mode: "readonly", lockedScroll: true });
    closeFinder();
  }
  if (action === "rename") {
    const title = prompt("문서 제목", doc.title);
    if (title?.trim()) {
      doc.title = title.trim();
      doc.updatedAt = new Date().toISOString();
      refreshDocDerived(doc);
      persistNow();
      renderFinder();
    }
  }
  if (action === "duplicate") {
    const copy = refreshDocDerived({ ...doc, id: crypto.randomUUID(), title: `${doc.title} copy`, favorite: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    documents.unshift(copy);
    persistNow();
    renderFinder();
  }
  if (action === "favorite") {
    doc.favorite = !doc.favorite;
    doc.updatedAt = new Date().toISOString();
    refreshDocDerived(doc);
    persistNow();
    renderFinder();
  }
  if (action === "tags") {
    const tags = prompt("태그를 쉼표로 구분해 입력하세요.", doc.tags.join(", "));
    if (tags !== null) {
      doc.tags = tags.split(",").map((tag) => tag.trim().replace(/^#/, "")).filter(Boolean).slice(0, 8);
      doc.updatedAt = new Date().toISOString();
      refreshDocDerived(doc);
      persistNow();
      renderFinder();
    }
  }
  if (action === "plain") await navigator.clipboard.writeText(doc.plainText || "");
  if (action === "markdown") await navigator.clipboard.writeText(doc.content || htmlToMarkdown(doc.contentHtml || ""));
  if (action === "board") await navigator.clipboard.writeText(htmlToPlain(doc.contentHtml || "", "board"));
  if (action === "html") {
    activeId = doc.id;
    exportFile("html");
  }
  if (action === "trash") {
    doc.deletedAt = Date.now();
    doc.updatedAt = new Date().toISOString();
    persistNow();
    renderFinder();
  }
}

function renderPreview(options = {}) {
  const renderPanels = options.panels !== false;
  const renderSplit = options.split !== false;
  const renderColor = options.color !== false;
  markDocumentSwitch("renderPreview:start");
  els.preview.innerHTML = prepareHtmlForThemedRender(currentHtml());
  markDocumentSwitch("after preview innerHTML");
  els.preview.classList.toggle("folded", previewFolded);
  markDocumentSwitch("before renderToc in renderPreview");
  if (renderPanels && isPanelTabActive("toc")) renderToc();
  markDocumentSwitch("after renderToc in renderPreview");
  markDocumentSwitch("before renderDocInfoPanel in renderPreview");
  if (renderPanels && isPanelTabActive("info")) renderDocInfoPanel();
  markDocumentSwitch("after renderDocInfoPanel in renderPreview");
  markDocumentSwitch("before renderSystemPanel in renderPreview");
  if (renderPanels && isPanelTabActive("system")) renderSystemPanel();
  markDocumentSwitch("after renderSystemPanel in renderPreview");
  if (renderColor) scheduleContentColorAdaptation(0);
  markDocumentSwitch("after schedule dark color fix");
  if (renderSplit && splitWorkspace.layout !== "single") scheduleReferencePaneRender(60);
  markDocumentSwitch("after schedule reference pane render");
  markDocumentSwitch("renderPreview:end");
}

function currentHtml() {
  const doc = activeDoc();
  return doc?.contentHtml || markdownToHtml(doc?.content || els.editor.value || "");
}

function currentMarkdown() {
  const doc = activeDoc();
  return doc?.content || htmlToMarkdown(currentHtml());
}

function currentPlainText() {
  return htmlToPlain(currentHtml());
}

function syncRichToDocument() {
  const guard = beginLockedReferenceGuard("rich-input", 900);
  const beforeEditorHtml = els.richEditor.innerHTML;
  const beforeDocHtml = activeDoc()?.contentHtml || "";
  const html = sanitizeRichHtml(els.richEditor.innerHTML);
  updateActive((doc) => {
    doc.contentHtml = html;
    doc.content = htmlToMarkdown(html);
  });
  formatDebugLog("syncRichToDocument", {
    beforeEditorHTML: summarizeHtmlForFormatDebug(beforeEditorHtml),
    beforeDocHTML: summarizeHtmlForFormatDebug(beforeDocHtml),
    afterDocHTML: summarizeHtmlForFormatDebug(activeDoc()?.contentHtml || ""),
    docHTMLChanged: beforeDocHtml !== activeDoc()?.contentHtml,
  });
  els.editor.value = activeDoc().content;
  renderPreview();
  updateStats();
  restoreLockedReferenceGuard(guard);
}

function syncSourceToDocument() {
  const guard = beginLockedReferenceGuard("source-input", 900);
  updateActive((doc) => {
    doc.content = els.editor.value;
    doc.contentHtml = markdownToHtml(els.editor.value);
  });
  setRichEditorHtmlPrepared(activeDoc().contentHtml);
  renderPreview();
  updateStats();
  restoreLockedReferenceGuard(guard);
}

function sanitizeRichHtml(html) {
  const template = document.createElement("template");
  const beforeSummary = summarizeHtmlForFormatDebug(html);
  template.innerHTML = html;
  stripDisplayOnlyMarkers(template.content);
  cleanupInlineStyleSpans(template.content);
  template.content.querySelectorAll("script,style,iframe,object,embed").forEach((node) => node.remove());
  template.content.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attr) => {
      if (/^on/i.test(attr.name)) node.removeAttribute(attr.name);
      if (/^(href|src)$/i.test(attr.name) && /^\s*javascript:/i.test(attr.value || "")) node.removeAttribute(attr.name);
      if (attr.name.toLowerCase() === "contenteditable") node.removeAttribute(attr.name);
    });
  });
  const result = template.innerHTML || "<p></p>";
  const afterSummary = summarizeHtmlForFormatDebug(result);
  formatDebugLog("sanitizeRichHtml", {
    before: beforeSummary,
    after: afterSummary,
    removedStyleCount: Math.max(0, beforeSummary.styleAttributeCount - afterSummary.styleAttributeCount),
  });
  return result;
}

function searchScore(doc, query) {
  if (!query) return 1;
  const haystack = doc._searchText || `${doc.title}\n${doc.tags.join(" ")}\n${doc.content || ""}`.toLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);
  let score = 0;
  for (const term of terms) {
    if (doc.title.toLowerCase().includes(term)) score += 12;
    if (doc.tags.some((tag) => tag.toLowerCase().includes(term.replace(/^#/, "")))) score += 8;
    if (haystack.includes(term)) score += 1;
  }
  return score;
}

function maybeAutoSnapshot(doc, previousContent) {
  if (previousContent === doc.content) return;
  const last = doc.history[0];
  const lastTime = last ? new Date(last.createdAt).getTime() : 0;
  if (!last || Date.now() - lastTime > AUTO_SNAPSHOT_INTERVAL) {
    addSnapshot(doc, "자동 저장");
  }
}

function addSnapshot(doc, label = "자동 스냅샷") {
  doc.history = [
    {
      id: crypto.randomUUID(),
      label,
      title: doc.title,
      content: doc.content,
      contentHtml: doc.contentHtml,
      createdAt: new Date().toISOString(),
    },
    ...doc.history,
  ].slice(0, 20);
}

function renderHistory() {
  const doc = activeDoc();
  els.historyList.innerHTML = "";
  if (!doc?.history.length) {
    els.historyList.innerHTML = '<span class="empty-note">아직 스냅샷이 없습니다.</span>';
    return;
  }

  doc.history.forEach((snapshot) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "history-item";
    item.innerHTML = `${escapeHtml(snapshot.label)}<span>${formatHistoryTime(snapshot.createdAt)} · ${(snapshot.content || "").length.toLocaleString("ko-KR")}자</span>`;
    item.addEventListener("click", () => restoreSnapshot(snapshot.id));
    els.historyList.append(item);
  });
}
function restoreSnapshot(snapshotId) {
  const doc = activeDoc();
  const snapshot = doc?.history.find((item) => item.id === snapshotId);
  if (!doc || !snapshot) return;

  addSnapshot(doc, "복구 직전");
  doc.title = snapshot.title;
  doc.content = snapshot.content;
  doc.contentHtml = snapshot.contentHtml || markdownToHtml(snapshot.content || "");
  doc.updatedAt = new Date().toISOString();
  persistNow();
  renderActive();
}

function extractHeadings(markdown) {
  return markdown.split("\n").reduce((items, line, index) => {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      items.push({
        level: match[1].length,
        text: markdownToPlain(match[2]),
        line: index,
      });
    }
    return items;
  }, []);
}

function renderToc() {
  const headings = extractHeadings(currentMarkdown());
  els.tocList.innerHTML = "";

  if (!headings.length) {
    els.tocList.innerHTML = '<span class="empty-note">제목을 쓰면 목차가 생깁니다.</span>';
    return;
  }

  headings.forEach((heading) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `toc-item level-${heading.level}`;
    item.textContent = heading.text;
    item.addEventListener("click", () => jumpToLine(heading.line));
    els.tocList.append(item);
  });
}

function jumpToLine(lineNumber) {
  const lines = els.editor.value.split("\n");
  const position = lines.slice(0, lineNumber).join("\n").length + (lineNumber > 0 ? 1 : 0);
  setMode("source");
  focusWithoutScroll(els.editor);
  els.editor.setSelectionRange(position, position);
}

function renderPromptVault() {
  const prompts = [...DEFAULT_PROMPTS, ...customPrompts];
  els.promptSelect.innerHTML = "";
  prompts.forEach((prompt, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = prompt.name;
    els.promptSelect.append(option);
  });
}

function selectedPromptText() {
  const prompts = [...DEFAULT_PROMPTS, ...customPrompts];
  return prompts[Number(els.promptSelect.value)]?.text || "";
}

function renderSystemPanel() {
  markDocumentSwitch("renderSystemPanel:start");
  if (!els.systemList) return;
  const doc = activeDoc();
  if (!doc) return;
  const source = doc.content || htmlToMarkdown(doc.contentHtml || "");
  const links = extractWikiLinks(source);
  markDocumentSwitch("before backlinks scan");
  const backlinks = documents.filter((item) => item.id !== doc.id && extractWikiLinks(item.content || htmlToMarkdown(item.contentHtml || "")).includes(doc.title));
  markDocumentSwitch("after backlinks scan");
  markDocumentSwitch("before storage/system info render");
  const storageBytes = JSON.stringify(documents).length + JSON.stringify(customPrompts).length;
  const storagePercent = Math.min(100, Math.round((storageBytes / 4_500_000) * 100));
  const longLine = longestLine(htmlToPlain(doc.contentHtml || markdownToHtml(doc.content || "")));
  const pluginNames = textPipelines.map((pipe) => pipe.name).join(", ");

  els.systemList.innerHTML = `
    <button class="system-item" type="button" data-system-action="links">문서 링크<span>${links.length ? links.map(escapeHtml).join(", ") : "없음"}</span></button>
    <button class="system-item" type="button" data-system-action="backlinks">백링크<span>${backlinks.length ? backlinks.map((item) => escapeHtml(item.title)).join(", ") : "없음"}</span></button>
    <div class="system-item">긴 줄<span>${longLine.toLocaleString("ko-KR")}자 · ${logMode ? "로그 모드" : "일반 모드"}</span></div>
    <div class="system-item">변환 파이프라인<span>${pluginNames}</span></div>
    <div class="system-item">로컬 저장소<span>${(storageBytes / 1024).toFixed(1)} KB</span><div class="system-meter"><i style="width:${storagePercent}%"></i></div></div>
  `;
  markDocumentSwitch("after storage/system info render");
  markDocumentSwitch("renderSystemPanel:end");
}

function renderDocInfoPanel() {
  markDocumentSwitch("renderDocInfoPanel:start");
  if (!els.docInfoList) return;
  const doc = activeDoc();
  if (!doc) return;
  const plain = htmlToPlain(doc.contentHtml || markdownToHtml(doc.content || ""));
  const source = doc.content || htmlToMarkdown(doc.contentHtml || "");
  markDocumentSwitch("before wiki links extraction");
  const links = extractWikiLinks(source);
  markDocumentSwitch("after wiki links extraction");
  markDocumentSwitch("before backlinks calculation");
  const backlinks = documents.filter((item) => item.id !== doc.id && extractWikiLinks(item.content || htmlToMarkdown(item.contentHtml || "")).includes(doc.title));
  markDocumentSwitch("after backlinks calculation");
  els.docInfoList.innerHTML = `
    <div class="system-item">글자 수<span>${plain.length.toLocaleString("ko-KR")}자</span></div>
    <div class="system-item">생성일<span>${formatHistoryTime(doc.createdAt)}</span></div>
    <div class="system-item">수정일<span>${formatHistoryTime(doc.updatedAt)}</span></div>
    <div class="system-item">태그<span>${doc.tags?.length ? doc.tags.map(escapeHtml).join(", ") : "없음"}</span></div>
    <div class="system-item">문서 링크<span>${links.length ? links.map(escapeHtml).join(", ") : "없음"}</span></div>
    <div class="system-item">백링크<span>${backlinks.length ? backlinks.map((item) => escapeHtml(item.title)).join(", ") : "없음"}</span></div>
  `;
  markDocumentSwitch("renderDocInfoPanel:end");
}

function extractWikiLinks(markdown) {
  return [...markdown.matchAll(/\[\[([^\]]+)\]\]/g)].map((match) => match[1].trim()).filter(Boolean);
}

function openDocByTitle(title) {
  const found = documents.find((doc) => doc.title.toLowerCase() === title.toLowerCase());
  if (!found) {
    const doc = createDocument(`# ${title}\n\n`);
    doc.title = title;
    documents.unshift(doc);
    activeId = doc.id;
  } else {
    activeId = found.id;
  }
  persistNow();
  renderActive();
}

const textPipelines = [
  { name: "Markdown 정리", run: markdownToPlain },
  { name: "Clean Paste", run: cleanText },
  { name: "Prompt 정리", run: (text) => cleanText(markdownToPlain(text, "prompt")) },
];

function cleanText(text) {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^(of course|below is|here is)[^\n]*\n?/gim, "")
    .replace(/^---+$/gm, "")
    .trim();
}

function updateStats() {
  const value = currentPlainText();
  const chars = value.length.toLocaleString("ko-KR");
  const lines = value.split("\n").length.toLocaleString("ko-KR");
  const longest = longestLine(value);
  els.statsText.textContent = `${lines} lines / ${chars} chars`;

  if (longest > LONG_LINE_LIMIT) {
    els.guardBanner.classList.remove("hidden");
    els.guardText.textContent = `긴 줄이 ${longest.toLocaleString("ko-KR")}자입니다. 성능 보호 모드를 활성화합니다.`;
  } else {
    els.guardBanner.classList.add("hidden");
  }
}
function setMode(mode) {
  savePaneScroll("main");
  savePaneScroll("reference");
  if (!els.editorGrid.classList.contains("source-mode")) {
    els.editor.value = currentMarkdown();
  }
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
  if (els.viewModeSelect) els.viewModeSelect.value = mode;
  els.editorGrid.className = `editor-grid ${mode}-mode`;
  els.editorPaneLabel.textContent = mode === "source" ? "Markdown 원문" : "리치 문서";
  if (mode !== "source") renderPreview();
  renderSplitWorkspace({ preserveScroll: true });
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  let inList = false;

  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      closeList();
      const code = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      out.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      i += 1;
      continue;
    }

    if (!line.trim()) {
      closeList();
      out.push("");
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      out.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    if (isTableStart(lines, i)) {
      closeList();
      const headers = splitTableRow(lines[i]);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      out.push(renderTable(headers, rows));
      continue;
    }

    const quote = line.match(/^>\s?(.+)$/);
    if (quote) {
      closeList();
      out.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
      i += 1;
      continue;
    }

    const list = line.match(/^\s*[-*]\s+(.+)$/);
    if (list) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inlineMarkdown(list[1])}</li>`);
      i += 1;
      continue;
    }

    closeList();
    out.push(`<p>${inlineMarkdown(line)}</p>`);
    i += 1;
  }

  closeList();
  return out.join("\n");
}

function inlineMarkdown(text) {
  const codeStore = [];
  const protectedText = escapeHtml(text).replace(/`([^`]+)`/g, (_, code) => {
    codeStore.push(`<code>${code}</code>`);
    return `@@CODE${codeStore.length - 1}@@`;
  });

  return protectedText
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[\[([^\]]+)\]\]/g, '<button class="doc-link" data-doc-title="$1">$1</button>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\$([^$]+)\$/g, '<code class="math">$1</code>')
    .replace(/@@CODE(\d+)@@/g, (_, index) => codeStore[Number(index)]);
}

function isTableStart(lines, index) {
  return (
    /^\|.*\|$/.test(lines[index]?.trim() || "") &&
    /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[index + 1]?.trim() || "")
  );
}

function splitTableRow(row) {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderTable(headers, rows) {
  const head = headers.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function markdownToPlain(markdown, preset = "plain") {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const output = [];
  let inCode = false;

  for (const line of lines) {
    if (/^```/.test(line)) {
      inCode = !inCode;
      if (preset === "prompt") output.push("```");
      continue;
    }

    if (inCode) {
      output.push(line);
      continue;
    }

    const codeStore = [];
    const protectedLine = line.replace(/`([^`]+)`/g, (_, code) => {
      codeStore.push(code);
      return `@@CODE${codeStore.length - 1}@@`;
    });

    let clean = protectedLine
      .replace(/^#{1,6}\s+/, "")
      .replace(/^>\s?/, "")
      .replace(/^\s*[-*]\s+/, "- ")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");

    clean = clean.replace(/@@CODE(\d+)@@/g, (_, index) => codeStore[Number(index)]);

    if (preset === "korean") {
      clean = clean.replace(/\s+/g, " ").trim();
    }
    output.push(clean);
  }

  let text = output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (preset === "prompt") {
    text = cleanText(text);
  }
  return text;
}

function htmlToPlain(html, preset = "plain") {
  const container = document.createElement("div");
  container.innerHTML = sanitizeRichHtml(html);
  container.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  container.querySelectorAll("hr").forEach((hr) => hr.replaceWith("\n---\n"));
  container.querySelectorAll("blockquote").forEach((quote) => {
    quote.prepend("[인용] ");
  });
  container.querySelectorAll("img").forEach((img) => {
    img.replaceWith(`[이미지: ${img.alt || img.src || "image"}]`);
  });
  container.querySelectorAll("a").forEach((link) => {
    const text = link.textContent.trim();
    const href = link.getAttribute("href");
    link.replaceWith(href && href !== text ? `${text} (${href})` : text);
  });
  container.querySelectorAll("h1,h2,h3,p,li,pre,div,table").forEach((node) => {
    node.append("\n");
  });
  let text = container.textContent.replace(/\n{3,}/g, "\n\n").trim();
  if (preset === "board") {
    text = text.replace(/^#{1,6}\s*/gm, "").replace(/\t/g, " ").replace(/[ ]{2,}/g, " ");
  }
  return text;
}

function htmlToMarkdown(html) {
  const container = document.createElement("div");
  container.innerHTML = sanitizeRichHtml(html);

  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const tag = node.tagName.toLowerCase();
    const children = [...node.childNodes].map(walk).join("");

    if (tag === "strong" || tag === "b") return `**${children}**`;
    if (tag === "em" || tag === "i") return `*${children}*`;
    if (tag === "u") return children;
    if (tag === "s" || tag === "strike") return `~~${children}~~`;
    if (tag === "code") return `\`${children}\``;
    if (tag === "a") return `[${children}](${node.getAttribute("href") || ""})`;
    if (tag === "img") return `![${node.getAttribute("alt") || "image"}](${node.getAttribute("src") || ""})`;
    if (tag === "br") return "\n";
    if (tag === "hr") return "\n---\n";
    if (tag === "h1") return `# ${children.trim()}\n\n`;
    if (tag === "h2") return `## ${children.trim()}\n\n`;
    if (tag === "h3") return `### ${children.trim()}\n\n`;
    if (tag === "blockquote") return `> ${children.trim().replace(/\n/g, "\n> ")}\n\n`;
    if (tag === "pre") return `\`\`\`\n${node.textContent.trim()}\n\`\`\`\n\n`;
    if (tag === "li") return `- ${children.trim()}\n`;
    if (tag === "ul" || tag === "ol") return `${children}\n`;
    if (tag === "table") return tableToMarkdown(node);
    if (tag === "p" || tag === "div") return `${children.trim()}\n\n`;
    return children;
  };

  return [...container.childNodes].map(walk).join("").replace(/\n{3,}/g, "\n\n").trim();
}

function tableToMarkdown(table) {
  const rows = [...table.querySelectorAll("tr")].map((row) =>
    [...row.children].map((cell) => cell.textContent.trim().replace(/\|/g, "\\|")),
  );
  if (!rows.length) return "";
  const widths = rows[0].map((_, index) => Math.max(...rows.map((row) => row[index]?.length || 0), 3));
  const line = (row) => `| ${widths.map((width, index) => (row[index] || "").padEnd(width, " ")).join(" | ")} |`;
  return `${line(rows[0])}\n| ${widths.map((width) => "-".repeat(width)).join(" | ")} |\n${rows.slice(1).map(line).join("\n")}\n\n`;
}

async function copyAs(type) {
  const selection = getSelectionFormats();
  const markdown = selection.markdown;
  const html = selection.html;
  const plain =
    type === "markdown"
      ? markdown
      : type === "board"
        ? htmlToPlain(html, "board")
        : htmlToPlain(html);

  try {
    if (type === "rich" && navigator.clipboard?.write && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([htmlToPlain(html)], { type: "text/plain" }),
          "text/html": new Blob([html], { type: "text/html" }),
        }),
      ]);
    } else {
      await navigator.clipboard.writeText(plain);
    }
    flashCopyState(type);
  } catch {
    fallbackCopy(plain);
    flashCopyState(type);
  }
}

function getSelectionOrAll() {
  if (els.editorGrid.classList.contains("source-mode")) {
    const start = els.editor.selectionStart;
    const end = els.editor.selectionEnd;
    return start !== end ? els.editor.value.slice(start, end) : els.editor.value;
  }
  const formats = getSelectionFormats();
  return formats.markdown;
}

function getSelectionFormats() {
  if (els.editorGrid.classList.contains("source-mode")) {
    const markdown = getSelectionOrAll();
    return { markdown, html: markdownToHtml(markdown), plain: markdownToPlain(markdown) };
  }

  const selection = window.getSelection();
  if (selection && selection.rangeCount && els.richEditor.contains(selection.anchorNode)) {
    const fragment = selection.getRangeAt(0).cloneContents();
    if (fragment.textContent.trim()) {
      const box = document.createElement("div");
      box.append(fragment);
      const html = sanitizeRichHtml(box.innerHTML);
      return { html, markdown: htmlToMarkdown(html), plain: htmlToPlain(html) };
    }
  }
  const html = currentHtml();
  return { html, markdown: htmlToMarkdown(html), plain: htmlToPlain(html) };
}

function getTextareaSelectionOrAll() {
  const start = els.editor.selectionStart;
  const end = els.editor.selectionEnd;
  return start !== end ? els.editor.value.slice(start, end) : els.editor.value;
}

function fallbackCopy(text) {
  const area = document.createElement("textarea");
  area.value = text;
  document.body.append(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

function flashCopyState(type) {
  const labels = { plain: "Plain", rich: "Rich", markdown: "Markdown", board: "Board" };
  els.copyState.textContent = `${labels[type] || "Text"} copied`;
  setTimeout(() => {
    els.copyState.textContent = "";
  }, 1800);
}
function cleanAiOutput() {
  const cleaned = cleanText(currentPlainText());
  updateActive((doc) => {
    doc.content = cleaned;
    doc.contentHtml = markdownToHtml(cleaned);
  });
  els.editor.value = cleaned;
  setRichEditorHtmlPrepared(activeDoc().contentHtml);
  renderPreview();
  updateStats();
}

function exportFile(kind) {
  const doc = activeDoc();
  if (!doc) {
    els.copyState.textContent = "내보낼 문서가 없습니다.";
    return;
  }
  if (!["txt", "md", "html", "pdf", "doc", "epub"].includes(kind)) {
    els.copyState.textContent = "지원하지 않는 내보내기 형식입니다.";
    return;
  }
  const base = sanitizeFileName(doc.title || "textforge-note");
  if (kind === "epub") {
    try {
      exportEpub(doc, base);
    } catch {
      els.copyState.textContent = "EPUB 내보내기에 실패했습니다.";
    }
    return;
  }
  const contentByKind = {
    txt: htmlToPlain(doc.contentHtml),
    md: htmlToMarkdown(doc.contentHtml),
    html: `<!doctype html><html lang="ko"><meta charset="utf-8"><title>${escapeHtml(doc.title)}</title><body>${doc.contentHtml}</body></html>`,
    doc: `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${escapeHtml(doc.title)}</title><style>body{font-family:Malgun Gothic,Arial,sans-serif;line-height:1.65}pre{white-space:pre-wrap;background:#f0f3f6;padding:12px}</style></head><body>${doc.contentHtml}</body></html>`,
  };

  if (kind === "pdf") {
    const win = window.open("", "_blank");
    if (!win) {
      els.copyState.textContent = "팝업이 차단되어 PDF 내보내기를 실행할 수 없습니다.";
      return;
    }
    win.document.write(`<html><head><title>${escapeHtml(doc.title)}</title><style>body{font-family:system-ui;line-height:1.7;padding:40px;max-width:820px;margin:auto}pre{white-space:pre-wrap;background:#f0f3f6;padding:12px}</style></head><body>${doc.contentHtml}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    return;
  }

  try {
    const mime = kind === "html" || kind === "doc" ? "text/html" : "text/plain";
    const blob = new Blob([contentByKind[kind]], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${base}.${kind}`;
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    els.copyState.textContent = "내보내기에 실패했습니다. 문서는 그대로 보존됩니다.";
  }
}

function exportEpub(doc, base) {
  const content = `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" lang="ko">
<head><title>${escapeHtml(doc.title)}</title><style>body{font-family:serif;line-height:1.7;padding:1rem}pre{white-space:pre-wrap;background:#f0f0f0;padding:.75rem}</style></head>
<body>${doc.contentHtml}</body>
</html>`;
  const files = [
    { name: "mimetype", content: "application/epub+zip" },
    { name: "META-INF/container.xml", content: `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>` },
    { name: "OEBPS/package.opf", content: `<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="bookid">textforge-${doc.id}</dc:identifier><dc:title>${escapeHtml(doc.title)}</dc:title><dc:language>ko</dc:language></metadata><manifest><item id="content" href="content.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="content"/></spine></package>` },
    { name: "OEBPS/content.xhtml", content },
  ];
  const blob = new Blob([makeZip(files)], { type: "application/epub+zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${base}.epub`;
  link.click();
  URL.revokeObjectURL(url);
}

function makeZip(files) {
  const encoder = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const local = zipHeader(0x04034b50, [
      20, 0, 0, 0, 0, 0, crc, data.length, data.length, name.length, 0,
    ]);
    chunks.push(local, name, data);
    central.push({
      offset,
      name,
      data,
      crc,
      header: zipHeader(0x02014b50, [
        20, 20, 0, 0, 0, 0, 0, crc, data.length, data.length, name.length, 0, 0, 0, 0, 0, offset,
      ]),
    });
    offset += local.length + name.length + data.length;
  }

  const centralStart = offset;
  for (const file of central) {
    chunks.push(file.header, file.name);
    offset += file.header.length + file.name.length;
  }
  const centralSize = offset - centralStart;
  chunks.push(zipHeader(0x06054b50, [0, 0, files.length, files.length, centralSize, centralStart, 0]));
  return concatBytes(chunks);
}

function zipHeader(signature, values) {
  const sizes = signature === 0x02014b50 ? [4, 2, 2, 2, 2, 2, 2, 4, 4, 4, 2, 2, 2, 2, 2, 4, 4] : signature === 0x06054b50 ? [4, 2, 2, 2, 2, 4, 4, 2] : [4, 2, 2, 2, 2, 2, 4, 4, 4, 2, 2];
  const bytes = new Uint8Array(sizes.reduce((sum, size) => sum + size, 0));
  const view = new DataView(bytes.buffer);
  let cursor = 0;
  [signature, ...values].forEach((value, index) => {
    const size = sizes[index];
    if (size === 2) view.setUint16(cursor, value, true);
    else view.setUint32(cursor, value, true);
    cursor += size;
  });
  return bytes;
}

function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}

function concatBytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function recoverSession() {
  try {
    const snapshot = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (!snapshot || typeof snapshot !== "object") return;
    if (snapshot.id && !snapshot.content && !snapshot.contentHtml) {
      activeId = snapshot.id;
      persistNow();
      renderActive();
      return;
    }
    const recovered = refreshDocDerived({
      ...snapshot,
      id: crypto.randomUUID(),
      title: `${safeString(snapshot.title, "Untitled")} recovered`,
      content: safeString(snapshot.content),
      contentHtml: safeString(snapshot.contentHtml) || markdownToHtml(safeString(snapshot.content)),
      tags: safeArray(snapshot.tags),
      history: safeArray(snapshot.history),
      favorite: Boolean(snapshot.favorite),
      folderId: snapshot.folderId || null,
      createdAt: safeDateString(snapshot.createdAt),
      updatedAt: new Date().toISOString(),
    });
    documents.unshift(recovered);
    activeId = recovered.id;
    persistNow();
    renderActive();
  } catch {
    els.sessionText.textContent = "세션 복구에 실패했습니다.";
  }
}

function saveManualSnapshot() {
  const doc = activeDoc();
  if (!doc) return;
  addSnapshot(doc, "수동 스냅샷");
  persistNow();
  renderHistory();
}

function setTagsFromInput() {
  updateActive((doc) => {
    doc.tags = els.tagInput.value
      .split(",")
      .map((tag) => tag.trim().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 8);
  });
}

function toggleFavorite() {
  updateActive((doc) => {
    doc.favorite = !doc.favorite;
  });
  renderActive();
}

async function copySelectedPrompt() {
  const text = selectedPromptText();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    fallbackCopy(text);
  }
    els.sessionText.textContent = "프롬프트를 복사했습니다.";
}

function insertSelectedPrompt() {
  const text = selectedPromptText();
  if (!text) return;
  if (!els.editorGrid.classList.contains("source-mode")) {
    insertHtmlAtCursor(`<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`);
    return;
  }
  const start = els.editor.selectionStart;
  const end = els.editor.selectionEnd;
  const prefix = els.editor.value.slice(0, start);
  const suffix = els.editor.value.slice(end);
  const insertion = `${text}\n\n`;
  updateActive((doc) => {
    doc.content = `${prefix}${insertion}${suffix}`;
    doc.contentHtml = markdownToHtml(doc.content);
  });
  els.editor.value = activeDoc().content;
  focusWithoutScroll(els.editor);
  els.editor.setSelectionRange(start + insertion.length, start + insertion.length);
  renderPreview();
  updateStats();
}

function saveCurrentAsPrompt() {
  const doc = activeDoc();
  const text = getSelectionOrAll().trim();
  if (!doc || !text) return;
  customPrompts = [{ name: doc.title || "새 프롬프트", text }, ...customPrompts].slice(0, 20);
  persistPrompts();
  renderPromptVault();
  els.promptSelect.value = "4";
    els.sessionText.textContent = "현재 내용을 프롬프트로 저장했습니다.";
}

async function cleanPaste() {
  let text = "";
  try {
    text = await navigator.clipboard.readText();
  } catch {
    els.sessionText.textContent = "클립보드를 읽지 못했습니다.";
    return;
  }
  if (!text.trim()) return;
  insertTextAtCursor(cleanText(text));
    els.sessionText.textContent = "정리해서 붙여넣었습니다.";
}

function insertTextAtCursor(text) {
  if (!els.editorGrid.classList.contains("source-mode")) {
    insertHtmlAtCursor(`<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`);
    return;
  }
  const start = els.editor.selectionStart;
  const end = els.editor.selectionEnd;
  const prefix = els.editor.value.slice(0, start);
  const suffix = els.editor.value.slice(end);
  const insertion = `${text}\n`;
  updateActive((doc) => {
    doc.content = `${prefix}${insertion}${suffix}`;
  });
  els.editor.value = activeDoc().content;
  focusWithoutScroll(els.editor);
  els.editor.setSelectionRange(start + insertion.length, start + insertion.length);
  renderPreview();
  updateStats();
}

function toggleLogMode() {
  logMode = !logMode;
  document.body.classList.toggle("log-mode", logMode);
  els.editor.classList.toggle("no-wrap", logMode);
  els.logModeBtn.textContent = logMode ? "일반" : "로그";
  renderSystemPanel();
}

function createAndFocusDocument() {
  const doc = createDocument("");
  documents.unshift(doc);
  activeId = doc.id;
  persistNow();
  renderActive();
  focusWithoutScroll(els.editor);
}

function openCommandPalette() {
  els.commandOverlay.classList.remove("hidden");
  els.commandInput.value = "";
  renderCommands();
  focusWithoutScroll(els.commandInput);
}

function closeCommandPalette() {
  els.commandOverlay.classList.add("hidden");
}

function renderCommands() {
  const query = els.commandInput.value.trim().toLowerCase();
  const docCommands = documents.map((doc) => ({
    id: `doc-${doc.id}`,
    title: doc.title,
    hint: `문서 열기 · ${doc.tags.map((tag) => `#${tag}`).join(" ") || "태그 없음"}`,
    run: () => {
      activeId = doc.id;
      persistNow();
      renderActive();
    },
  }));

  const items = [...COMMANDS, ...docCommands].filter((item) => {
    if (item.labOnly && uiMode !== "lab") return false;
    return `${item.title} ${item.hint}`.toLowerCase().includes(query);
  });

  els.commandList.innerHTML = "";
  items.slice(0, 18).forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "command-item";
    button.innerHTML = `<strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.hint)}</span>`;
    button.addEventListener("click", async () => {
      closeCommandPalette();
      await item.run();
    });
    els.commandList.append(button);
  });
}

function exportCard() {
  const doc = activeDoc();
  if (!doc) return;
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f6f7f9";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 58, 50, CARD_WIDTH - 116, CARD_HEIGHT - 100, 22);
  ctx.fill();

  ctx.fillStyle = "#167c80";
  ctx.font = "700 28px Segoe UI, sans-serif";
  ctx.fillText("TextForge", 92, 104);

  ctx.fillStyle = "#17212b";
  ctx.font = "800 48px Segoe UI, sans-serif";
  wrapCanvasText(ctx, doc.title, 92, 176, CARD_WIDTH - 184, 58, 2);

  ctx.fillStyle = "#485867";
  ctx.font = "30px Segoe UI, sans-serif";
  wrapCanvasText(ctx, htmlToPlain(doc.contentHtml), 92, 300, CARD_WIDTH - 184, 44, 6);

  ctx.fillStyle = "#607080";
  ctx.font = "22px Segoe UI, sans-serif";
  ctx.fillText(`${doc.content.length.toLocaleString("ko-KR")}자 · ${formatDateTime(new Date())}`, 92, CARD_HEIGHT - 88);

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${sanitizeFileName(doc.title)}.png`;
  link.click();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = cleanText(text).split(/\s+/);
  let line = "";
  let lines = 0;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(lines === maxLines - 1 ? `${line}...` : line, x, y);
      y += lineHeight;
      lines += 1;
      line = word;
      if (lines >= maxLines) return;
    } else {
      line = testLine;
    }
  }
  if (line && lines < maxLines) ctx.fillText(line, x, y);
}

function insertHardBreaks() {
  const value = els.editor.value
    .split("\n")
    .map((line) => (line.length > 120 ? line.match(/.{1,100}(?:\s|$)|.{1,100}/g).join("\n") : line))
    .join("\n");
  updateActive((doc) => {
    doc.content = value;
    doc.contentHtml = markdownToHtml(value);
  });
  els.editor.value = value;
  setRichEditorHtmlPrepared(activeDoc().contentHtml);
  renderPreview();
  updateStats();
}

function applyFormat(command, value = null) {
  formatDebugLog("applyFormat:start", {
    command,
    value,
    activeElement: document.activeElement?.id || document.activeElement?.className || document.activeElement?.tagName,
    selection: getSelectionDebugSummary(),
    savedSelectionExists: Boolean(savedEditorSelection),
  });
  const beforeHtml = els.richEditor.innerHTML;
  restoreEditorSelection();
  focusWithoutScroll(els.richEditor);
  document.execCommand(command, false, value);
  saveEditorSelection();
  formatDebugLog("applyFormat:after-dom", {
    command,
    value,
    editorHTMLChanged: beforeHtml !== els.richEditor.innerHTML,
    changedLengthDelta: els.richEditor.innerHTML.length - beforeHtml.length,
    afterEditorHTML: summarizeHtmlForFormatDebug(els.richEditor.innerHTML),
  });
  syncRichToDocument();
}

function applyBlockStyle(tag) {
  restoreEditorSelection();
  focusWithoutScroll(els.richEditor);
  document.execCommand("formatBlock", false, tag);
  saveEditorSelection();
  syncRichToDocument();
}

function getEditorRangeFromSelection() {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  if (!els.richEditor.contains(range.commonAncestorContainer)) return null;
  return range;
}

function saveEditorSelection() {
  const range = getEditorRangeFromSelection();
  if (range) savedEditorSelection = range.cloneRange();
  formatDebugLog("saveEditorSelection", {
    activeElement: document.activeElement?.id || document.activeElement?.className || document.activeElement?.tagName,
    selection: getSelectionDebugSummary(),
    saved: Boolean(range),
    savedSelectionExists: Boolean(savedEditorSelection),
  });
}

function restoreEditorSelection() {
  formatDebugLog("restoreEditorSelection:before", {
    selection: getSelectionDebugSummary(),
    savedSelectionExists: Boolean(savedEditorSelection),
  });
  if (!savedEditorSelection) {
    formatDebugLog("restoreEditorSelection:after", { restored: false, reason: "missing-saved-selection", selection: getSelectionDebugSummary() });
    return false;
  }
  if (!els.richEditor.contains(savedEditorSelection.commonAncestorContainer)) {
    formatDebugLog("restoreEditorSelection:after", { restored: false, reason: "saved-selection-outside-editor", selection: getSelectionDebugSummary() });
    return false;
  }
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(savedEditorSelection.cloneRange());
  formatDebugLog("restoreEditorSelection:after", {
    restored: true,
    selection: getSelectionDebugSummary(),
  });
  return true;
}

function setPendingTypingStyle(property, value) {
  if (value) pendingTypingStyle[property] = value;
  else delete pendingTypingStyle[property];
  formatDebugLog("pendingTypingStyle:set", {
    styleName: property,
    value,
    pendingTypingStyle: { ...pendingTypingStyle },
  });
}

function hasPendingTypingStyle() {
  return Object.keys(pendingTypingStyle).length > 0;
}

function applyStyleMapToSpan(span, styleMap) {
  Object.entries(styleMap).forEach(([property, value]) => {
    if (value) span.style[property] = value;
  });
}

function countInlineStyleProperty(root, property) {
  return [...root.querySelectorAll("[style]")].filter((element) => Boolean(element.style[property])).length;
}

function getSelectedTextNodes(range) {
  const nodes = [];
  const walker = document.createTreeWalker(els.richEditor, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
      try {
        return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      } catch {
        return NodeFilter.FILTER_REJECT;
      }
    },
  });
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

function getSelectedTextNodeSegment(range, node) {
  let start = node === range.startContainer ? range.startOffset : 0;
  let end = node === range.endContainer ? range.endOffset : node.nodeValue.length;
  start = Math.max(0, Math.min(start, node.nodeValue.length));
  end = Math.max(start, Math.min(end, node.nodeValue.length));
  return { node, start, end };
}

function rangeContainsBlock(range) {
  const fragment = range.cloneContents();
  return Boolean(fragment.querySelector?.("p,div,h1,h2,h3,h4,h5,h6,li,blockquote,pre,td,th,table,ul,ol"));
}

function isWholeEditorSelection(range) {
  const selectionText = range.toString().replace(/\s+/g, "");
  const editorText = els.richEditor.innerText.replace(/\s+/g, "");
  return Boolean(selectionText && selectionText === editorText);
}

function isComplexRange(range) {
  if (!range || range.collapsed) return false;
  if (isWholeEditorSelection(range) || rangeContainsBlock(range)) return true;
  return getSelectedTextNodes(range).length > 1;
}

function wrapOrUpdateTextNodeSegment(segment, styleMap) {
  const { node, start, end } = segment;
  if (!node.isConnected || start >= end) return null;
  let target = node;
  if (end < target.nodeValue.length) target.splitText(end);
  if (start > 0) target = target.splitText(start);
  const parent = target.parentElement;
  if (parent?.tagName === "SPAN" && parent.childNodes.length === 1 && parent.firstChild === target) {
    applyStyleMapToSpan(parent, styleMap);
    return parent;
  }
  const span = document.createElement("span");
  applyStyleMapToSpan(span, styleMap);
  target.replaceWith(span);
  span.append(target);
  return span;
}

function cleanupNestedInlineStyles(root, styleKeys) {
  root.querySelectorAll("span[style]").forEach((span) => {
    const child = span.firstElementChild;
    if (
      child?.tagName === "SPAN" &&
      span.childNodes.length === 1 &&
      hasOnlyStyleAttribute(span) &&
      hasOnlyStyleAttribute(child)
    ) {
      styleKeys.forEach((property) => {
        if (child.style[property] && span.style[property]) span.style[property] = "";
      });
      if (!span.getAttribute("style")?.trim()) unwrapElement(span);
    }
  });
  cleanupInlineStyleSpans(root);
}

function applyStyleToTextNodesInRange(range, styleMap) {
  const segments = getSelectedTextNodes(range)
    .map((node) => getSelectedTextNodeSegment(range, node))
    .filter((segment) => segment.start < segment.end);
  const styledNodes = [];
  segments.forEach((segment) => {
    const styled = wrapOrUpdateTextNodeSegment(segment, styleMap);
    if (styled) styledNodes.push(styled);
  });
  if (!styledNodes.length) return false;
  cleanupNestedInlineStyles(els.richEditor, Object.keys(styleMap));
  const connectedStyledNodes = styledNodes.filter((node) => node.isConnected);
  if (!connectedStyledNodes.length) return true;
  const nextRange = document.createRange();
  nextRange.setStartBefore(connectedStyledNodes[0]);
  nextRange.setEndAfter(connectedStyledNodes[connectedStyledNodes.length - 1]);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(nextRange);
  savedEditorSelection = nextRange.cloneRange();
  return true;
}

function applyInlineStyleToComplexSelection(styleMap, range) {
  return applyStyleToTextNodesInRange(range, styleMap);
}

function applyInlineStyleToSelection(styleMap, range = getEditorRangeFromSelection()) {
  if (!range || range.collapsed) return false;
  if (isComplexRange(range)) return applyInlineStyleToComplexSelection(styleMap, range);
  const span = document.createElement("span");
  applyStyleMapToSpan(span, styleMap);
  span.append(range.extractContents());
  range.insertNode(span);
  range.selectNodeContents(span);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  savedEditorSelection = range.cloneRange();
  return true;
}

function insertStyledTextAtSelection(text, styleMap) {
  const range = getEditorRangeFromSelection();
  if (!range) return false;
  if (!text) return false;
  const span = document.createElement("span");
  applyStyleMapToSpan(span, styleMap);
  span.textContent = text;
  range.deleteContents();
  range.insertNode(span);
  range.setStartAfter(span);
  range.setEndAfter(span);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  savedEditorSelection = range.cloneRange();
  return true;
}

function applyPendingTypingStyleOnBeforeInput(event) {
  formatDebugLog("beforeinput", {
    inputType: event.inputType,
    hasData: Boolean(event.data),
    dataLength: event.data?.length || 0,
    isComposing: event.isComposing,
    pendingTypingStyle: { ...pendingTypingStyle },
    selection: getSelectionDebugSummary(),
  });
  if (!hasPendingTypingStyle() || event.isComposing || event.inputType !== "insertText" || !event.data) return;
  restoreEditorSelection();
  focusWithoutScroll(els.richEditor);
  const applied = insertStyledTextAtSelection(event.data, pendingTypingStyle);
  formatDebugLog("pendingTypingStyle:applied", {
    success: applied,
    pendingTypingStyle: { ...pendingTypingStyle },
    selection: getSelectionDebugSummary(),
  });
  if (!applied) return;
  event.preventDefault();
  syncRichToDocument();
  focusWithoutScroll(els.richEditor);
}

function applyInlineStyle(property, value) {
  const beforeHtml = els.richEditor.innerHTML;
  formatDebugLog("applyInlineStyle:start", {
    styleName: property,
    value,
    activeElement: document.activeElement?.id || document.activeElement?.className || document.activeElement?.tagName,
    selection: getSelectionDebugSummary(),
    savedSelectionExists: Boolean(savedEditorSelection),
    beforeEditorHTML: summarizeHtmlForFormatDebug(beforeHtml),
  });
  restoreEditorSelection();
  formatDebugLog("applyInlineStyle:after-restore", {
    selection: getSelectionDebugSummary(),
    savedSelectionExists: Boolean(savedEditorSelection),
  });
  focusWithoutScroll(els.richEditor);
  const range = getEditorRangeFromSelection();
  if (!range) {
    formatDebugLog("applyInlineStyle:after-dom", {
      styleName: property,
      value,
      path: "no-range",
      editorHTMLChanged: false,
      changedLengthDelta: 0,
      createdStyledSpanCount: 0,
      afterEditorHTML: summarizeHtmlForFormatDebug(els.richEditor.innerHTML),
    });
    return;
  }
  const styleMap = { [property]: value };
  if (range.collapsed) {
    setPendingTypingStyle(property, value);
    savedEditorSelection = range.cloneRange();
    focusWithoutScroll(els.richEditor);
    formatDebugLog("applyInlineStyle:after-dom", {
      styleName: property,
      value,
      path: "pendingTypingStyle",
      editorHTMLChanged: beforeHtml !== els.richEditor.innerHTML,
      changedLengthDelta: els.richEditor.innerHTML.length - beforeHtml.length,
      createdStyledSpanCount: summarizeHtmlForFormatDebug(els.richEditor.innerHTML).styledSpanCount - summarizeHtmlForFormatDebug(beforeHtml).styledSpanCount,
      afterEditorHTML: summarizeHtmlForFormatDebug(els.richEditor.innerHTML),
    });
    return;
  }
  setPendingTypingStyle(property, value);
  const complexSelection = isComplexRange(range);
  if (applyInlineStyleToSelection(styleMap, range)) {
    const afterHtml = els.richEditor.innerHTML;
    formatDebugLog("applyInlineStyle:after-dom", {
      styleName: property,
      value,
      path: complexSelection ? "complex-selection" : "selection",
      editorHTMLChanged: beforeHtml !== afterHtml,
      changedLengthDelta: afterHtml.length - beforeHtml.length,
      createdStyledSpanCount: summarizeHtmlForFormatDebug(afterHtml).styledSpanCount - summarizeHtmlForFormatDebug(beforeHtml).styledSpanCount,
      selectedStylePropertyCount: countInlineStyleProperty(els.richEditor, property),
      afterEditorHTML: summarizeHtmlForFormatDebug(afterHtml),
    });
    syncRichToDocument();
    focusWithoutScroll(els.richEditor);
  }
}

function applyFontSize(value) {
  const range = getEditorRangeFromSelection();
  formatDebugLog("applyFontSize", {
    value,
    path: range?.collapsed ? "pendingTypingStyle" : range ? "selection" : "no-range",
    selection: getSelectionDebugSummary(),
  });
  applyInlineStyle("fontSize", value);
}

function applyDocumentTheme(theme) {
  els.richEditor.classList.remove("theme-modern", "theme-report", "theme-board", "theme-essay", "theme-code");
  els.richEditor.classList.add(`theme-${theme}`);
  els.preview.classList.remove("theme-modern", "theme-report", "theme-board", "theme-essay", "theme-code");
  els.preview.classList.add(`theme-${theme}`);
}

function insertTable() {
  insertHtmlAtCursor("<table><tbody><tr><th>항목</th><th>내용</th></tr><tr><td></td><td></td></tr><tr><td></td><td></td></tr></tbody></table><p></p>");
}

function insertHtmlAtCursor(html) {
  focusWithoutScroll(els.richEditor);
  document.execCommand("insertHTML", false, html);
  syncRichToDocument();
}

function handleRichPaste(event) {
  formatDebugLog("paste", {
    itemCount: event.clipboardData?.items?.length || 0,
    types: [...(event.clipboardData?.types || [])],
    pendingTypingStyle: { ...pendingTypingStyle },
    selection: getSelectionDebugSummary(),
  });
  const items = [...(event.clipboardData?.items || [])];
  const image = items.find((item) => item.type.startsWith("image/"));
  if (!image) return;
  event.preventDefault();
  const file = image.getAsFile();
  const reader = new FileReader();
  reader.onload = () => insertHtmlAtCursor(`<p><img src="${reader.result}" alt="pasted image" style="max-width:100%;"></p>`);
  reader.readAsDataURL(file);
}

function longestLine(value) {
  return value.split("\n").reduce((max, line) => Math.max(max, line.length), 0);
}

function summarize(content) {
  const doc = documents.find((item) => item.content === content);
  if (doc?._summary) return escapeHtml(doc._summary);
  const text = markdownToPlain(content).replace(/\s+/g, " ").trim();
  return escapeHtml(text.slice(0, 80) || "빈 문서");
}

function formatDateTime(date) {
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatHistoryTime(value) {
  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sanitizeFileName(name) {
  return name.replace(/[\\/:*?"<>|]/g, "-").slice(0, 80) || "textforge-note";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function sampleText() {
  return `# TextForge MVP

Markdown은 입력 방식이고, 출력은 선택입니다.

학생은 **인류 역상 가장 강력한 요약** 중 하나입니다.

- Markdown 작성
- 정리 미리보기
- Markdown 제거 복사
- HTML 서식 복사
- TXT / MD / HTML / PDF 내보내기

\`\`\`txt
코드블록 안의 **별표**는 보존합니다.
\`\`\`
`;
}

function richSampleText() {
  return `# TextForge 리치 레이어
이제 원본은 **리치 텍스트 문서 모델**이고, Markdown은 여러 출력 중 하나입니다.

- 글꼴, 크기, 색상, 배경색
- 표, 링크, 이미지, 구분선
- 서식 유지 복사 / Markdown 복사 / 게시판용 복사

> 서식은 풍부하게, 출력은 깔끔하게.
`;
}

els.newDocBtn.addEventListener("click", createAndFocusDocument);

els.searchInput.addEventListener("input", renderDocList);
els.finderOpenBtn.addEventListener("click", openFinder);
els.finderCloseBtn.addEventListener("click", closeFinder);
els.finderSearchInput.addEventListener("input", scheduleFinderRender);
els.finderSortSelect.addEventListener("change", () => {
  finderState.sort = els.finderSortSelect.value;
  finderState.page = 0;
  renderFinder();
});
els.finderGridBtn.addEventListener("click", () => {
  finderState.view = "grid";
  els.finderGridBtn.classList.add("active");
  els.finderListBtn.classList.remove("active");
  renderFinder();
});
els.finderListBtn.addEventListener("click", () => {
  finderState.view = "list";
  els.finderListBtn.classList.add("active");
  els.finderGridBtn.classList.remove("active");
  renderFinder();
});
els.finderSelectBtn.addEventListener("click", () => setFinderSelecting(!finderState.selecting));
els.forgeSnapshotBtn?.addEventListener("click", openForgeSnapshotPanel);
els.finderNewDocBtn.addEventListener("click", () => {
  createAndFocusDocument();
  closeFinder();
});
els.finderNewFolderBtn.addEventListener("click", createFolder);
els.finderPrevBtn.addEventListener("click", () => {
  finderState.page = Math.max(0, finderState.page - 1);
  renderFinder();
});
els.finderNextBtn.addEventListener("click", () => {
  finderState.page += 1;
  renderFinder();
});
els.finderBulkMoveBtn.addEventListener("click", bulkMoveSelected);
els.finderBulkTrashBtn.addEventListener("click", bulkTrashSelected);
els.finderBulkCancelBtn.addEventListener("click", () => setFinderSelecting(false));
document.querySelectorAll(".finder-nav").forEach((button) => {
  button.addEventListener("click", () => {
    finderState.filter = button.dataset.filter || "all";
    finderState.tag = null;
    finderState.folderId = null;
    finderState.page = 0;
    renderFinder();
  });
});
els.finderTagList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-tag]");
  if (!button) return;
  finderState.filter = "all";
  finderState.tag = button.dataset.tag;
  finderState.folderId = null;
  finderState.page = 0;
  renderFinder();
});
els.finderFolderList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-folder-id]");
  if (!button) return;
  finderState.filter = "all";
  finderState.tag = null;
  finderState.folderId = button.dataset.folderId;
  finderState.page = 0;
  renderFinder();
});
els.finderFolderList.addEventListener("dragover", (event) => {
  const button = event.target.closest("[data-folder-id]");
  if (!button) return;
  event.preventDefault();
  button.classList.add("drag-over");
});
els.finderFolderList.addEventListener("dragleave", (event) => {
  const button = event.target.closest("[data-folder-id]");
  if (button) button.classList.remove("drag-over");
});
els.finderFolderList.addEventListener("drop", (event) => {
  const button = event.target.closest("[data-folder-id]");
  if (!button) return;
  event.preventDefault();
  button.classList.remove("drag-over");
  const docId = event.dataTransfer.getData("text/plain");
  moveDocumentToFolder(docId, button.dataset.folderId);
});
els.finderFolderList.addEventListener("contextmenu", (event) => {
  const button = event.target.closest("[data-folder-id]");
  if (!button) return;
  event.preventDefault();
  editFolder(button.dataset.folderId);
});
els.docContextMenu.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  hideDocContextMenu();
  runDocContextAction(action);
});
document.addEventListener("click", (event) => {
  if (!els.docContextMenu.contains(event.target)) hideDocContextMenu();
});

els.titleInput.addEventListener("input", () => {
  updateActive((doc) => {
    doc.title = els.titleInput.value || "Untitled";
  });
});

els.favoriteBtn.addEventListener("click", toggleFavorite);
els.tagInput.addEventListener("change", setTagsFromInput);
els.tagInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    setTagsFromInput();
    focusWithoutScroll(els.editor);
  }
});

els.editor.addEventListener("input", () => {
  syncSourceToDocument();
});

els.richEditor.addEventListener("input", (event) => {
  formatDebugLog("input", {
    inputType: event.inputType,
    isComposing: event.isComposing,
    pendingTypingStyle: { ...pendingTypingStyle },
    editorHTML: summarizeHtmlForFormatDebug(els.richEditor.innerHTML),
  });
  syncRichToDocument();
});
els.richEditor.addEventListener("beforeinput", applyPendingTypingStyleOnBeforeInput);
els.richEditor.addEventListener("paste", handleRichPaste);
els.richEditor.addEventListener("compositionstart", () => formatDebugLog("compositionstart", { selection: getSelectionDebugSummary() }));
els.richEditor.addEventListener("compositionend", () => formatDebugLog("compositionend", { selection: getSelectionDebugSummary(), pendingTypingStyle: { ...pendingTypingStyle } }));
els.richEditor.addEventListener("keyup", saveEditorSelection);
els.richEditor.addEventListener("mouseup", saveEditorSelection);
els.richEditor.addEventListener("focus", saveEditorSelection);
document.querySelector(".rich-toolbar")?.addEventListener("pointerdown", saveEditorSelection, true);

document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});
els.viewModeSelect?.addEventListener("change", () => setMode(els.viewModeSelect.value));
els.splitSingleBtn?.addEventListener("click", () => setSplitLayout("single"));
els.splitVerticalBtn?.addEventListener("click", () => {
  if (!getPane("reference")?.documentId) getPane("reference").documentId = activeId;
  setSplitLayout("vertical-2");
});
els.splitHorizontalBtn?.addEventListener("click", () => {
  if (!getPane("reference")?.documentId) getPane("reference").documentId = activeId;
  setSplitLayout("horizontal-2");
});
els.splitDuplicateBtn?.addEventListener("click", () => duplicateCurrentDocumentToReferencePane("vertical-2"));
els.splitOpenDocSelect?.addEventListener("change", () => {
  if (els.splitOpenDocSelect.value) openDocumentInNewPane(els.splitOpenDocSelect.value, { mode: "readonly" });
  els.splitOpenDocSelect.value = "";
});
els.splitSyncBtn?.addEventListener("click", toggleSplitScrollSync);
els.referencePane?.addEventListener("click", () => setActivePane("reference"));
["wheel", "touchstart", "pointerdown"].forEach((eventName) => {
  els.referencePaneBody?.addEventListener(eventName, markReferenceUserScroll, { passive: true });
});
els.referencePaneBody?.addEventListener("keydown", markReferenceUserScroll);
els.editorGrid.querySelector(".editor-pane")?.addEventListener("click", () => setActivePane("main"));
els.referencePaneMode?.addEventListener("change", () => {
  const pane = getPane("reference");
  pane.mode = els.referencePaneMode.value;
  persistSplitWorkspace();
  renderSplitWorkspace({ preserveScroll: true });
});
els.referenceScrollLockBtn?.addEventListener("click", () => setPaneScrollLocked("reference", !getPane("reference")?.lockedScroll));
els.referenceSyncBtn?.addEventListener("click", toggleSplitScrollSync);
els.referenceDocSelect?.addEventListener("change", () => openDocumentInPane(els.referenceDocSelect.value, "reference", { mode: getPane("reference")?.mode || "readonly", lockedScroll: getPane("reference")?.lockedScroll }));
els.referenceCloseBtn?.addEventListener("click", () => closePane("reference"));
els.richEditor?.addEventListener("scroll", () => {
  savePaneScroll("main");
  syncPaneScroll("main");
});
els.editor?.addEventListener("scroll", () => {
  savePaneScroll("main");
  syncPaneScroll("main");
});
els.preview?.addEventListener("scroll", () => {
  savePaneScroll("main");
  syncPaneScroll("main");
});
els.referencePaneBody?.addEventListener("scroll", () => {
  handleReferenceScroll();
  syncPaneScroll("reference");
});
els.workModeSelect?.addEventListener("change", () => {
  const value = els.workModeSelect.value;
  if (value === "plain") copyAs("plain");
  if (value === "rich") copyAs("rich");
  if (value === "markdown") copyAs("markdown");
  if (value === "board") copyAs("board");
  if (value === "tidy") cleanAiOutput();
  if (value === "system") setInspectorOpen(true, "system");
  if (value === "modern") setMode("rich");
  els.workModeSelect.value = "modern";
});
els.inspectorToggleBtn?.addEventListener("click", () => setInspectorOpen(!inspectorOpen, inspectorTab));
document.querySelectorAll(".inspector-tab").forEach((button) => {
  button.addEventListener("click", () => setInspectorOpen(true, button.dataset.inspectorTab));
});
els.topForgeSnapshotBtn?.addEventListener("click", openForgeSnapshotPanel);
els.footerForgeSnapshotBtn?.addEventListener("click", openForgeSnapshotPanel);
els.diagnosticsOpenBtn?.addEventListener("click", openDiagnosticsPanel);
els.topRecoverBtn?.addEventListener("click", recoverSession);
els.topLogModeBtn?.addEventListener("click", toggleLogMode);
els.footerHistoryBtn?.addEventListener("click", () => setInspectorOpen(true, "history"));
els.footerSnapshotBtn?.addEventListener("click", saveManualSnapshot);

document.querySelectorAll(".format-btn[data-command]").forEach((btn) => {
  btn.addEventListener("click", (event) => {
    formatControlDebugStart(btn.dataset.command, event.type, btn.dataset.command);
    applyFormat(btn.dataset.command);
  });
});
els.styleSelect.addEventListener("change", (event) => {
  formatControlDebugStart("styleSelect", event.type, els.styleSelect.value);
  applyBlockStyle(els.styleSelect.value);
});
els.fontSelect.addEventListener("change", (event) => {
  formatControlDebugStart("fontSelect", event.type, els.fontSelect.value);
  applyInlineStyle("fontFamily", els.fontSelect.value);
});
els.sizeSelect.addEventListener("change", (event) => {
  formatControlDebugStart("sizeSelect", event.type, els.sizeSelect.value);
  applyFontSize(els.sizeSelect.value);
});
els.colorInput.addEventListener("input", (event) => {
  formatControlDebugStart("colorInput", event.type, els.colorInput.value);
  applyInlineStyle("color", els.colorInput.value);
});
els.bgInput.addEventListener("input", (event) => {
  formatControlDebugStart("bgInput", event.type, els.bgInput.value);
  applyInlineStyle("backgroundColor", els.bgInput.value);
});
els.themeSelect.addEventListener("change", () => {
  updateActive((doc) => {
    doc.theme = els.themeSelect.value;
  });
  applyDocumentTheme(els.themeSelect.value);
});
els.appThemeSelect?.addEventListener("change", () => setTheme(els.appThemeSelect.value));
els.linkBtn.addEventListener("click", () => {
  const href = prompt("링크 URL");
  if (href) applyFormat("createLink", href);
});
els.imageBtn.addEventListener("click", () => {
  const src = prompt("이미지 URL");
  if (src) insertHtmlAtCursor(`<p><img src="${escapeHtml(src)}" alt="image" style="max-width:100%;"></p>`);
});
els.tableBtn.addEventListener("click", insertTable);
els.hrBtn.addEventListener("click", () => insertHtmlAtCursor("<hr><p></p>"));
els.spoilerBtn.addEventListener("click", () => applyInlineStyle("backgroundColor", "#17212b"));

els.copyPlainBtn.addEventListener("click", () => copyAs("plain"));
els.copyRichBtn.addEventListener("click", () => copyAs("rich"));
els.copyMarkdownBtn.addEventListener("click", () => copyAs("markdown"));
els.copyBoardBtn.addEventListener("click", () => copyAs("board"));
els.cleanOutputBtn.addEventListener("click", cleanAiOutput);
els.exportTxtBtn.addEventListener("click", () => exportFile("txt"));
els.exportMdBtn.addEventListener("click", () => exportFile("md"));
els.exportHtmlBtn.addEventListener("click", () => exportFile("html"));
els.exportPdfBtn.addEventListener("click", () => exportFile("pdf"));
els.exportDocBtn.addEventListener("click", () => exportFile("doc"));
els.exportEpubBtn.addEventListener("click", () => exportFile("epub"));
els.exportCardBtn.addEventListener("click", exportCard);
els.recoverBtn.addEventListener("click", recoverSession);
els.snapshotBtn.addEventListener("click", saveManualSnapshot);
els.foldPreviewBtn.addEventListener("click", () => {
  previewFolded = !previewFolded;
  els.foldPreviewBtn.textContent = previewFolded ? "펼치기" : "접기";
  renderPreview();
});
els.insertPromptBtn.addEventListener("click", insertSelectedPrompt);
els.copyPromptBtn.addEventListener("click", copySelectedPrompt);
els.savePromptBtn.addEventListener("click", saveCurrentAsPrompt);
els.logModeBtn.addEventListener("click", toggleLogMode);
els.commandBtn.addEventListener("click", openCommandPalette);
els.focusModeBtn?.addEventListener("click", toggleFocusMode);
els.commandInput.addEventListener("input", renderCommands);
els.commandOverlay.addEventListener("click", (event) => {
  if (event.target === els.commandOverlay) closeCommandPalette();
});
els.preview.addEventListener("click", (event) => {
  const link = event.target.closest(".doc-link");
  if (link) openDocByTitle(link.dataset.docTitle || link.textContent);
});
els.systemList.addEventListener("click", (event) => {
  const item = event.target.closest("[data-system-action]");
  if (!item) return;
  const doc = activeDoc();
  if (!doc) return;
  if (item.dataset.systemAction === "links") {
    const first = extractWikiLinks(doc.content)[0];
    if (first) openDocByTitle(first);
  }
  if (item.dataset.systemAction === "backlinks") {
    const first = documents.find((candidate) => candidate.id !== doc.id && extractWikiLinks(candidate.content).includes(doc.title));
    if (first) {
      activeId = first.id;
      persistNow();
      renderActive();
    }
  }
});
els.breakLineBtn.addEventListener("click", insertHardBreaks);
els.wrapToggleBtn.addEventListener("click", () => {
  els.editor.classList.toggle("no-wrap");
  els.wrapToggleBtn.textContent = els.editor.classList.contains("no-wrap") ? "줄바꿈 켜기" : "줄바꿈 꺼기";
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeFloatingUi();
    if (!els.commandOverlay.classList.contains("hidden")) closeCommandPalette();
  } else if (event.ctrlKey && event.code === "KeyK") {
    event.preventDefault();
    openCommandPalette();
  } else if (event.ctrlKey && event.shiftKey && event.altKey && event.code === "KeyC") {
    event.preventDefault();
    copyAs("rich");
  } else if (event.ctrlKey && event.shiftKey && event.code === "KeyC") {
    event.preventDefault();
    copyAs("plain");
  } else if (event.ctrlKey && event.altKey && event.code === "KeyC") {
    event.preventDefault();
    copyAs("rich");
  } else if (event.ctrlKey && event.shiftKey && event.code === "KeyV") {
    event.preventDefault();
    cleanPaste();
  }
});

window.TextForgeDocumentSwitchPerf = {
  runDocumentSwitchBenchmark,
  getLastDocumentSwitchTrace,
  exportDocumentSwitchBenchmarkJson,
  showLastDocumentSwitchTrace,
};

initTheme();
initFloatingUiDismiss();
setUiMode(uiMode);
focusMode = loadFocusModeState();
updateFocusModeUi();
initPwaInstallHints();
renderInspectorState();
renderActive();
renderDocList();
configureDiagnosticsContext();
(async () => {
  await hydrateFromDurableStorage();
  renderDocList();
  scheduleDurableSave(1200);
})();
