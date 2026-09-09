const STORAGE_KEY = "textforge.documents.v1";
const ACTIVE_KEY = "textforge.activeDocument.v1";
const SESSION_KEY = "textforge.sessionRecovery.v1";
const PROMPT_KEY = "textforge.prompts.v1";
const FOLDERS_KEY = "textforge.folders.v1";
const THEME_KEY = "textforge.theme";
const SPLIT_WORKSPACE_KEY = "textforge.splitWorkspace";
const FOCUS_MODE_KEY = "textforge.focusMode";
const FOCUS_WIDTH_KEY = "textforge.focusCanvasWidth";
const WORD_WRAP_KEY = "textforge.wordWrap";
const PORTAL_CHANNEL_NAME = "textforge.portal-library.v1";
const DETACHED_CHANNEL_NAME = "textforge.detached-editor.v1";
const UNIVERSAL_COMMAND_KEY = "textforge.universalCommand.v1";
const QUICK_NOTE_OPERATION_KEY = "textforge.quickNoteOperations.v1";
const DB_NAME = "textforge-personal-storage";
const DB_VERSION = 1;
const STORAGE_POINTER_KEY = "textforge.pointer.v2";
const DURABLE_SAVE_DELAY = 900;
const LONG_LINE_LIMIT = 8000;
const AUTO_SNAPSHOT_INTERVAL = 90000;
const CARD_WIDTH = 1200;
const CARD_HEIGHT = 675;
const FOCUS_WIDTH_DEFAULT = 860;
const FOCUS_WIDTH_MIN = 640;
const FOCUS_WIDTH_MAX = 1200;
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

let activeTypingTrace = null;
let formatDebugEnabled = localStorage.getItem("textforge.formatDebug") === "true";
let formatDebugBuffer = [];

const els = {
  docList: document.querySelector("#docList"),
  newDocBtn: document.querySelector("#newDocBtn"),
  searchInput: document.querySelector("#searchInput"),
  sidebarFavoritesBtn: document.querySelector("#sidebarFavoritesBtn"),
  sidebarFoldersBtn: document.querySelector("#sidebarFoldersBtn"),
  sidebarToggleBtn: document.querySelector("#sidebarToggleBtn"),
  titleInput: document.querySelector("#titleInput"),
  saveState: document.querySelector("#saveState"),
  editor: document.querySelector("#editor"),
  richEditor: document.querySelector("#richEditor"),
  focusResizeLeft: document.querySelector("#focusResizeLeft"),
  focusResizeRight: document.querySelector("#focusResizeRight"),
  preview: document.querySelector("#preview"),
  editorGrid: document.querySelector("#editorGrid"),
  editorPaneLabel: document.querySelector("#editorPaneLabel"),
  mainPaneQuickLookBtn: document.querySelector("#mainPaneQuickLookBtn"),
  statsText: document.querySelector("#statsText"),
  copyState: document.querySelector("#copyState"),
  guardBanner: document.querySelector("#guardBanner"),
  guardText: document.querySelector("#guardText"),
  breakLineBtn: document.querySelector("#breakLineBtn"),
  sessionText: document.querySelector("#sessionText"),
  cleanOutputBtn: document.querySelector("#cleanOutputBtn"),
  copyPlainBtn: document.querySelector("#copyPlainBtn"),
  copyRichBtn: document.querySelector("#copyRichBtn"),
  copyMarkdownBtn: document.querySelector("#copyMarkdownBtn"),
  copyBoardBtn: document.querySelector("#copyBoardBtn"),
  themeSelect: document.querySelector("#themeSelect"),
  appThemeSelect: document.querySelector("#appThemeSelect"),
  styleSelect: document.querySelector("#styleSelect"),
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
  systemList: document.querySelector("#systemList"),
  docInfoList: document.querySelector("#docInfoList"),
  commandBtn: document.querySelector("#commandBtn"),
  focusModeBtn: document.querySelector("#focusModeBtn"),
  commandOverlay: document.querySelector("#commandOverlay"),
  commandInput: document.querySelector("#commandInput"),
  commandList: document.querySelector("#commandList"),
  quickNoteBtn: document.querySelector("#quickNoteBtn"),
  exportStudioBtn: document.querySelector("#exportStudioBtn"),
  versionsBtn: document.querySelector("#versionsBtn"),
  documentInfoBtn: document.querySelector("#documentInfoBtn"),
  sourceModeBtn: document.querySelector("#sourceModeBtn"),
  duplicateDocBtn: document.querySelector("#duplicateDocBtn"),
  trashDocBtn: document.querySelector("#trashDocBtn"),
  workspaceBtn: document.querySelector("#workspaceBtn"),
  detachedEditorBtn: document.querySelector("#detachedEditorBtn"),
  moreLibraryBtn: document.querySelector("#moreLibraryBtn"),
  tocToolsBtn: document.querySelector("#tocToolsBtn"),
  promptToolsBtn: document.querySelector("#promptToolsBtn"),
  systemToolsBtn: document.querySelector("#systemToolsBtn"),
  inspectorToggleBtn: document.querySelector("#inspectorToggleBtn"),
  topForgeSnapshotBtn: document.querySelector("#topForgeSnapshotBtn"),
  splitSingleBtn: document.querySelector("#splitSingleBtn"),
  splitVerticalBtn: document.querySelector("#splitVerticalBtn"),
  splitHorizontalBtn: document.querySelector("#splitHorizontalBtn"),
  splitDuplicateBtn: document.querySelector("#splitDuplicateBtn"),
  splitOpenDocSelect: document.querySelector("#splitOpenDocSelect"),
  splitSyncBtn: document.querySelector("#splitSyncBtn"),
  referencePane: document.querySelector("#referencePane"),
  referencePaneTitle: document.querySelector("#referencePaneTitle"),
  referencePaneQuickLookBtn: document.querySelector("#referencePaneQuickLookBtn"),
  referencePaneMode: document.querySelector("#referencePaneMode"),
  referencePaneBody: document.querySelector("#referencePaneBody"),
  referenceSourceEditor: document.querySelector("#referenceSourceEditor"),
  referencePreview: document.querySelector("#referencePreview"),
  referencePaneStatus: document.querySelector("#referencePaneStatus"),
  splitDivider: document.querySelector("#splitDivider"),
  referenceSwapBtn: document.querySelector("#referenceSwapBtn"),
  referenceScrollLockBtn: document.querySelector("#referenceScrollLockBtn"),
  referenceSyncBtn: document.querySelector("#referenceSyncBtn"),
  referenceDocSelect: document.querySelector("#referenceDocSelect"),
  referenceCloseBtn: document.querySelector("#referenceCloseBtn"),
  contentArea: document.querySelector(".content-area"),
  inspector: document.querySelector(".inspector"),
  appShell: document.querySelector(".app-shell"),
  portalLibraryBtn: document.querySelector("#portalLibraryBtn"),
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
let focusCanvasWidth = Number(localStorage.getItem(FOCUS_WIDTH_KEY)) || FOCUS_WIDTH_DEFAULT;
let wordWrapEnabled = localStorage.getItem(WORD_WRAP_KEY) !== "false";
let splitWorkspace = loadSplitWorkspace();
let referenceRenderTimer = null;
let postSwitchRenderTimer = null;
let postSwitchRenderFrame = null;
let splitWorkspaceRenderTimer = null;
let richFullSyncTimer = null;
let previewUpdateTimer = null;
let statsUpdateTimer = null;
let sessionStateTimer = null;
let richDocumentDirty = false;
let referenceDocumentDirty = false;
let referenceDirtyDocumentId = null;
let referenceFullSyncTimer = null;
let referenceCompositionActive = false;
let compositionActive = false;
let savedEditorSelection = null;
let startupResumeFocusApplied = false;
let pendingTypingStyle = {};
let typingDebugEnabled = localStorage.getItem("textforge.typingDebug") === "true";
let typingDebugBuffer = [];
let typingTraceSequence = 0;
let typingLongTaskObserver = null;
let typingLongTaskEntries = [];
let bulkUndoStack = [];
let bulkRedoStack = [];
let bulkUndoPending = false;
let experienceSelectionLease = null;
let experienceOperationUndoStack = [];
let paneScrollSyncing = false;
let lockedReferenceGuard = null;
let splitScrollDriftWarned = false;
let activeDocumentSwitchTrace = null;
let lastDocumentSwitchTrace = null;
let documentSwitchBenchmarkResult = null;
let portalLibraryWindow = null;
let portalLibraryChannel = null;
let detachedEditorChannel = null;
let detachedEditorHeartbeatTimer = null;
const detachedEditorLeases = new Map();
const detachedSeenRequestIds = new Set();
let portalLibraryConnected = false;
let portalStateBroadcastTimer = null;
let portalOperationUndoStack = [];
let universalCommandResults = [];
let universalCommandIndex = 0;
let universalCommandComposing = false;
let universalCommandReturnFocus = null;
const portalSeenRequestIds = new Set();

installFormatDebugApi();
installTypingDebugApi();

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
  schedulePortalStateBroadcast(0);
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

function isFormatDebugActive() {
  return formatDebugEnabled || window.TEXTFORGE_FORMAT_DEBUG === true;
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

function getTypingEnvironmentSummary() {
  return {
    mode: document.documentElement.dataset.mode || "rich",
    focusMode,
    splitOn: splitWorkspace.layout !== "single",
    previewVisible: isPreviewPaneVisible(),
    inspectorOpen,
    inspectorTab,
    theme: document.documentElement.dataset.theme,
  };
}

function getTypingDocumentSummary() {
  const doc = activeDoc();
  const html = els.richEditor?.innerHTML || "";
  return {
    docId: doc?.id || null,
    htmlLength: html.length,
    htmlHash: shortHash(html),
    plainLength: doc?.plainText?.length || htmlToPlain(html).length,
    domNodeCount: els.richEditor ? els.richEditor.querySelectorAll("*").length : 0,
  };
}

function observeTypingLongTasks() {
  if (typingLongTaskObserver || !("PerformanceObserver" in window)) return;
  try {
    typingLongTaskObserver = new PerformanceObserver((list) => {
      typingLongTaskEntries.push(...list.getEntries().map((entry) => ({
        startTime: entry.startTime,
        duration: entry.duration,
      })));
      if (typingLongTaskEntries.length > 200) typingLongTaskEntries = typingLongTaskEntries.slice(-200);
    });
    typingLongTaskObserver.observe({ entryTypes: ["longtask"] });
  } catch {
    typingLongTaskObserver = "unsupported";
  }
}

function setTypingDebugEnabled(enabled) {
  typingDebugEnabled = Boolean(enabled);
  localStorage.setItem("textforge.typingDebug", typingDebugEnabled ? "true" : "false");
  window.TEXTFORGE_TYPING_DEBUG = typingDebugEnabled;
  if (typingDebugEnabled) observeTypingLongTasks();
  setSessionText(typingDebugEnabled ? "Typing debug on" : "Typing debug off");
  return typingDebugEnabled;
}

function createTypingTrace(event, source = "input") {
  if (!typingDebugEnabled && window.TEXTFORGE_TYPING_DEBUG !== true) return null;
  if (window.TEXTFORGE_TYPING_DEBUG === true) typingDebugEnabled = true;
  observeTypingLongTasks();
  const now = performance.now();
  const docSummary = getTypingDocumentSummary();
  activeTypingTrace = {
    traceId: `typing-${Date.now()}-${++typingTraceSequence}`,
    at: new Date().toISOString(),
    source,
    inputType: event?.inputType || event?.type || source,
    dataLength: event?.data?.length || 0,
    isComposing: Boolean(event?.isComposing),
    ...getTypingEnvironmentSummary(),
    ...docSummary,
    steps: [],
    startMs: now,
    inputStartMs: source === "input" ? now : null,
    lastMarkMs: now,
    totalInputHandlerMs: 0,
    toNextFrameMs: null,
    toSecondFrameMs: null,
    longTaskCount: 0,
    maxLongTaskMs: 0,
    totalLongTaskMs: 0,
  };
  return activeTypingTrace;
}

function markTypingTrace(label, detail = {}) {
  if (!activeTypingTrace || (!typingDebugEnabled && window.TEXTFORGE_TYPING_DEBUG !== true)) return;
  const now = performance.now();
  activeTypingTrace.steps.push({
    label,
    atMs: Number((now - activeTypingTrace.startMs).toFixed(3)),
    sincePreviousMs: Number((now - activeTypingTrace.lastMarkMs).toFixed(3)),
    ...detail,
  });
  activeTypingTrace.lastMarkMs = now;
}

function finishTypingTrace() {
  const trace = activeTypingTrace;
  if (!trace) return;
  const inputEndMs = performance.now();
  trace.totalInputHandlerMs = trace.inputStartMs ? Number((inputEndMs - trace.inputStartMs).toFixed(3)) : 0;
  markTypingTrace("typing:input:end");
  if (activeTypingTrace === trace) activeTypingTrace = null;
  const appendFrameMark = (label) => {
    const now = performance.now();
    trace.steps.push({
      label,
      atMs: Number((now - trace.startMs).toFixed(3)),
      sincePreviousMs: Number((now - trace.lastMarkMs).toFixed(3)),
    });
    trace.lastMarkMs = now;
  };
  requestAnimationFrame(() => {
    trace.toNextFrameMs = trace.inputStartMs ? Number((performance.now() - trace.inputStartMs).toFixed(3)) : null;
    appendFrameMark("typing:next-frame");
    requestAnimationFrame(() => {
      trace.toSecondFrameMs = trace.inputStartMs ? Number((performance.now() - trace.inputStartMs).toFixed(3)) : null;
      appendFrameMark("typing:second-frame");
      const traceEnd = performance.now();
      const longTasks = typingLongTaskEntries.filter((entry) => entry.startTime >= trace.startMs && entry.startTime <= traceEnd);
      trace.longTaskCount = longTasks.length;
      trace.maxLongTaskMs = longTasks.length ? Math.max(...longTasks.map((entry) => entry.duration)) : 0;
      trace.totalLongTaskMs = longTasks.reduce((sum, entry) => sum + entry.duration, 0);
      trace.steps = trace.steps.map((step) => ({ ...step }));
      delete trace.startMs;
      delete trace.inputStartMs;
      delete trace.lastMarkMs;
      typingDebugBuffer.push(trace);
      if (typingDebugBuffer.length > 300) typingDebugBuffer = typingDebugBuffer.slice(-300);
    });
  });
}

function recordTypingEvent(label, event) {
  if (!typingDebugEnabled && window.TEXTFORGE_TYPING_DEBUG !== true) return;
  const entry = {
    traceId: `event-${Date.now()}-${++typingTraceSequence}`,
    at: new Date().toISOString(),
    source: label,
    inputType: event?.inputType || event?.type || label,
    dataLength: event?.data?.length || 0,
    isComposing: Boolean(event?.isComposing),
    ...getTypingEnvironmentSummary(),
    ...getTypingDocumentSummary(),
    steps: [{ label, atMs: 0, sincePreviousMs: 0 }],
    totalInputHandlerMs: 0,
    toNextFrameMs: null,
    toSecondFrameMs: null,
    longTaskCount: 0,
    maxLongTaskMs: 0,
    totalLongTaskMs: 0,
  };
  typingDebugBuffer.push(entry);
  if (typingDebugBuffer.length > 300) typingDebugBuffer = typingDebugBuffer.slice(-300);
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p));
  return Number(sorted[index].toFixed(3));
}

function statsFor(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return { avg: 0, p50: 0, p95: 0, max: 0 };
  return {
    avg: Number((clean.reduce((sum, value) => sum + value, 0) / clean.length).toFixed(3)),
    p50: percentile(clean, 0.5),
    p95: percentile(clean, 0.95),
    max: Number(Math.max(...clean).toFixed(3)),
  };
}

function collectPairedStepDurations(steps, startLabel, endLabel) {
  const starts = [];
  const durations = [];
  steps.forEach((step) => {
    if (step.label === startLabel) {
      starts.push(step.atMs);
    } else if (step.label === endLabel && starts.length) {
      const startMs = starts.shift();
      durations.push(Number((step.atMs - startMs).toFixed(3)));
    }
  });
  return durations;
}

function typingLatencySummary() {
  const traces = typingDebugBuffer.filter((trace) => trace.steps?.some((step) => step.label === "typing:input:end"));
  const stepDurations = new Map();
  const stagePairs = [
    ["syncRichToDocumentFast", "syncRichToDocumentFast:start", "syncRichToDocumentFast:end"],
    ["syncRichToDocument", "syncRichToDocument:start", "syncRichToDocument:end"],
    ["sanitizeRichHtml", "sanitizeRichHtml:start", "sanitizeRichHtml:end"],
    ["htmlToMarkdown", "before htmlToMarkdown", "after htmlToMarkdown"],
    ["refreshDocDerived", "before refreshDocDerived", "after refreshDocDerived"],
    ["htmlToPlain", "before htmlToPlain", "after htmlToPlain"],
    ["renderPreview", "before renderPreview", "after renderPreview"],
    ["updateStats", "before updateStats", "after updateStats"],
    ["persistSoon", "before persistSoon", "after persistSoon"],
    ["maybeAutoSnapshot", "before maybeAutoSnapshot", "after maybeAutoSnapshot"],
  ];
  const stageDurations = new Map(stagePairs.map(([name]) => [name, []]));
  traces.forEach((trace) => {
    trace.steps.forEach((step) => {
      const list = stepDurations.get(step.label) || [];
      list.push(step.sincePreviousMs || 0);
      stepDurations.set(step.label, list);
    });
    stagePairs.forEach(([name, startLabel, endLabel]) => {
      stageDurations.get(name).push(...collectPairedStepDurations(trace.steps, startLabel, endLabel));
    });
  });
  const stepStats = [...stepDurations.entries()].map(([label, values]) => ({
    label,
    ...statsFor(values),
  })).sort((a, b) => b.p95 - a.p95);
  const stageStats = [...stageDurations.entries()].map(([label, values]) => ({
    label,
    ...statsFor(values),
  })).sort((a, b) => b.p95 - a.p95);
  const summary = {
    samples: traces.length,
    inputHandler: statsFor(traces.map((trace) => trace.totalInputHandlerMs)),
    inputToNextFrame: statsFor(traces.map((trace) => trace.toNextFrameMs)),
    inputToSecondFrame: statsFor(traces.map((trace) => trace.toSecondFrameMs)),
    longTaskCount: traces.reduce((sum, trace) => sum + (trace.longTaskCount || 0), 0),
    maxLongTaskMs: Number(Math.max(0, ...traces.map((trace) => trace.maxLongTaskMs || 0)).toFixed(3)),
    totalLongTaskMs: Number(traces.reduce((sum, trace) => sum + (trace.totalLongTaskMs || 0), 0).toFixed(3)),
    stepStats,
    topSlowSteps: stepStats.slice(0, 10),
    stageStats,
    topSlowStages: stageStats.slice(0, 10),
    environment: getTypingEnvironmentSummary(),
    document: getTypingDocumentSummary(),
  };
  console.log("[typing-debug] summary", summary);
  setSessionText(`Typing debug: ${summary.samples} samples, input p95 ${summary.inputHandler.p95}ms`);
  return summary;
}

function showTypingDebugLog() {
  console.log("[typing-debug] entries", typingDebugBuffer);
  setSessionText(`Typing debug log: ${typingDebugBuffer.length} entries`);
  return [...typingDebugBuffer];
}

async function copyTypingDebugLog() {
  const text = JSON.stringify({ entries: typingDebugBuffer, summary: typingLatencySummary() }, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    setSessionText(`Copied ${typingDebugBuffer.length} typing debug entries`);
  } catch (error) {
    console.log("[typing-debug] copy fallback", text);
    console.warn("[typing-debug] clipboard copy failed", error);
    setSessionText("Typing debug copy failed; printed to console");
  }
  return text;
}

function installTypingDebugApi() {
  window.TEXTFORGE_TYPING_DEBUG = typingDebugEnabled;
  window.TextForgeTypingDebug = {
    enable: () => setTypingDebugEnabled(true),
    disable: () => setTypingDebugEnabled(false),
    clear: () => {
      typingDebugBuffer = [];
      typingLongTaskEntries = [];
      activeTypingTrace = null;
      setSessionText("Typing debug log cleared");
      return [];
    },
    show: showTypingDebugLog,
    copy: copyTypingDebugLog,
    getEntries: () => [...typingDebugBuffer],
    summary: typingLatencySummary,
  };
  if (typingDebugEnabled) observeTypingLongTasks();
  return window.TextForgeTypingDebug;
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
  { id: "portal-library", title: "전체 문서함 열기", hint: "별도 창에서 문서와 폴더를 탐색하고 정리", run: openPortalLibrary },
  { id: "copy-plain", title: "Plain Copy", hint: "Markdown 기호를 제거해 복사", run: () => copyAs("plain") },
  { id: "copy-rich", title: "Rich Copy", hint: "HTML 서식을 유지해 복사", run: () => copyAs("rich") },
  { id: "copy-markdown", title: "Markdown Copy", hint: "Markdown 원문 복사", run: () => copyAs("markdown") },
  { id: "copy-board", title: "Board Copy", hint: "게시판용 텍스트 복사", run: () => copyAs("board") },
  { id: "view-source", title: "소스 편집", hint: "Markdown 원문 편집", run: () => setMode("source") },
  { id: "view-preview", title: "미리보기", hint: "Clean Preview 보기", run: () => setMode("clean") },
  { id: "view-split", title: "분할 보기", hint: "작성과 미리보기를 함께 표시", run: () => setMode("split") },
  { id: "clean-paste", title: "Clean Paste", hint: "클립보드 텍스트를 정리해 붙여넣기", run: cleanPaste },
  { id: "tidy-ai", title: "AI 출력 정리", hint: "과한 서식과 Markdown 정리", run: cleanAiOutput },
  { id: "snapshot", title: "수동 스냅샷", hint: "현재 문서 상태를 저장", run: saveManualSnapshot },
  { id: "recover-session", title: "세션 복구", hint: "이전에 저장된 세션 복구", run: recoverSession },
  { id: "inspector-open", title: "Inspector 열기", hint: "우측 검사기 패널 열기", run: () => setInspectorOpen(true, "toc") },
  { id: "history-open", title: "보호본 보기", hint: "문서 보호본 보기", run: () => setInspectorOpen(true, "history") },
  { id: "prompt-open", title: "Prompt Vault 열기", hint: "프롬프트 보관함 보기", run: () => setInspectorOpen(true, "prompt") },
  { id: "system-open", title: "문서 도구 열기", hint: "문서 상태와 연결 정보 보기", run: () => setInspectorOpen(true, "system") },
  { id: "log-mode", title: "로그 모드 전환", hint: "긴 줄 보호 모드 전환", labOnly: true, run: toggleLogMode },
  { id: "theme-toggle", title: "테마 전환", hint: "라이트/다크 테마 전환", run: toggleTheme },
  { id: "focus-mode-toggle", title: "집중 모드 전환", hint: "보조 UI를 접고 본문 공간 넓히기", run: toggleFocusMode },
  { id: "ui-mode", title: "UI 모드 전환", hint: "Simple / Pro / Lab 모드 전환", labOnly: true, run: () => setUiMode(uiMode === "lab" ? "simple" : uiMode === "simple" ? "pro" : "lab") },
  { id: "forge-snapshot", title: "문서함 백업", hint: "문서함을 읽기 전용 HTML 아카이브로 내보내기", run: openForgeSnapshotPanel },
  { id: "diagnostics-open", title: "진단 패널 열기", hint: "성능/신뢰성 벤치마크 보기", labOnly: true, run: openDiagnosticsPanel },
  { id: "diagnostics-quick", title: "빠른 벤치마크 실행", hint: "핵심 지표를 빠르게 측정", labOnly: true, run: () => openDiagnosticsPanel().then(() => window.TextForgeDiagnostics?.runQuickBenchmark()) },
  { id: "diagnostics-full", title: "전체 벤치마크 실행", hint: "더미 문서 100개 memory-only 테스트", labOnly: true, run: () => openDiagnosticsPanel().then(() => window.TextForgeDiagnostics?.runFullBenchmark()) },
  { id: "diagnostics-reliability", title: "신뢰성 반복 테스트", hint: "반복 작업 100회 MTBF-like 측정", labOnly: true, run: () => openDiagnosticsPanel().then(() => window.TextForgeDiagnostics?.runReliabilityTest()) },
  { id: "diagnostics-snapshot", title: "Forge Snapshot 벤치마크", hint: "Snapshot HTML build 성능 측정", labOnly: true, run: () => openDiagnosticsPanel().then(() => window.TextForgeDiagnostics?.runSnapshotBenchmark()) },
  { id: "diagnostics-export", title: "진단 결과 JSON 내보내기", hint: "최근 벤치마크 결과 저장", labOnly: true, run: () => window.TextForgeDiagnostics?.exportBenchmarkJson() },
  { id: "diagnostics-real-library", title: "실제 문서함 벤치마크", hint: "실제 문서함 read-only clone으로 측정", labOnly: true, run: () => openDiagnosticsPanel().then(() => window.TextForgeDiagnostics?.runRealLibraryBenchmark()) },
  { id: "diagnostics-mttr", title: "MTTR 복구 테스트", hint: "격리된 장애 주입으로 복구 시간 측정", labOnly: true, run: () => openDiagnosticsPanel().then(() => window.TextForgeDiagnostics?.runMttrBenchmark()) },
  { id: "diagnostics-writer-readiness", title: "Writer Readiness 실행", hint: "Typing Debug와 현재 문서 쓰기 상태 점검", labOnly: true, run: () => openDiagnosticsPanel().then(() => window.TextForgeDiagnostics?.runWriterReadiness()) },
  { id: "diagnostics-release-gate", title: "Release Gate 실행", hint: "릴리즈 준비도 v2 종합 점검", labOnly: true, run: () => openDiagnosticsPanel().then(() => window.TextForgeDiagnostics?.runReleaseGate()) },
  { id: "document-switch-benchmark", title: "문서 전환 벤치마크 실행", hint: "문서 클릭 전환 흐름의 단계별 지연 측정", labOnly: true, run: () => runDocumentSwitchBenchmark({ samples: 10 }) },
  { id: "document-switch-trace-show", title: "최근 문서 전환 trace 보기", hint: "최근 전환의 단계별 기록을 console에 표시", labOnly: true, run: showLastDocumentSwitchTrace },
  { id: "document-switch-trace-export", title: "문서 전환 벤치마크 JSON 내보내기", hint: "최근 문서 전환 측정 결과 저장", labOnly: true, run: exportDocumentSwitchBenchmarkJson },
  { id: "split-single", title: "단일 보기", hint: "분할 작업공간 닫기", run: () => setSplitLayout("single") },
  { id: "split-vertical", title: "좌우 2분할", hint: "오른쪽에 참고창 열기", run: () => setSplitLayout("vertical-2") },
  { id: "split-horizontal", title: "상하 2분할", hint: "아래쪽에 참고창 열기", run: () => setSplitLayout("horizontal-2") },
  { id: "split-duplicate-reference", title: "현재 문서 참고창 열기", hint: "현재 문서를 읽기 전용 pane으로 열기", run: () => duplicateCurrentDocumentToReferencePane("vertical-2") },
  { id: "split-toggle-scroll-sync", title: "분할 스크롤 동기화 전환", hint: "기본은 끔, 필요할 때만 켜기", run: toggleSplitScrollSync },
  { id: "new-doc", title: "새 문서", hint: "Instant Draft", run: createAndFocusDocument },
];

COMMANDS.splice(COMMANDS.findIndex((item) => item.id === "clean-paste") + 1, 0,
  { id: "clear-formatting", title: "Clear Format", hint: "Reset selected text to TextForge default 18px body style", run: clearFormattingToDefault },
  { id: "default-formatting", title: "Default Formatting", hint: "Apply default 18px body style to the selection", run: clearFormattingToDefault },
);

COMMANDS.splice(COMMANDS.findIndex((item) => item.id === "split-single"), 0,
  { id: "format-debug-on", title: "Format Debug On", hint: "Enable rich text formatting debug logs", labOnly: true, run: () => setFormatDebugEnabled(true) },
  { id: "format-debug-off", title: "Format Debug Off", hint: "Disable rich text formatting debug logs", labOnly: true, run: () => setFormatDebugEnabled(false) },
  { id: "format-debug-show", title: "Show Format Debug Log", hint: "Print recent formatting debug entries to console", labOnly: true, run: showFormatDebugLog },
  { id: "format-debug-copy", title: "Copy Format Debug Log", hint: "Copy recent formatting debug entries as JSON", labOnly: true, run: copyFormatDebugLog },
  { id: "typing-debug-on", title: "Typing Debug On", hint: "Enable typing latency instrumentation", labOnly: true, run: () => setTypingDebugEnabled(true) },
  { id: "typing-debug-off", title: "Typing Debug Off", hint: "Disable typing latency instrumentation", labOnly: true, run: () => setTypingDebugEnabled(false) },
  { id: "typing-debug-show", title: "Show Typing Debug Log", hint: "Print recent typing latency entries to console", labOnly: true, run: showTypingDebugLog },
  { id: "typing-debug-copy", title: "Copy Typing Debug Log", hint: "Copy recent typing latency entries as JSON", labOnly: true, run: copyTypingDebugLog },
  { id: "typing-debug-summary", title: "Typing Latency Summary", hint: "Summarize typing latency samples and slow steps", labOnly: true, run: typingLatencySummary },
);

function openAdjacentDocument(direction) {
  const available = documents.filter((doc) => !doc.deletedAt);
  if (available.length < 2) return;
  const index = available.findIndex((doc) => doc.id === activeId);
  const next = available[(Math.max(0, index) + direction + available.length) % available.length];
  if (next) openDocumentInPane(next.id, "main", { source: "universal-command-adjacent" });
}

COMMANDS.push(
  { id: "view-rich", title: "쓰기 보기", hint: "리치 텍스트 편집기로 전환", aliases: ["write", "rich", "편집"], category: "view", run: () => setMode("rich") },
  { id: "theme-light", title: "라이트 테마", hint: "앱 테마를 밝게 설정", aliases: ["light", "밝게"], category: "settings", run: () => setTheme("light") },
  { id: "theme-dark", title: "다크 테마", hint: "앱 테마를 어둡게 설정", aliases: ["dark", "어둡게"], category: "settings", run: () => setTheme("dark") },
  { id: "theme-system", title: "시스템 테마", hint: "Windows 테마 설정을 따름", aliases: ["system", "자동"], category: "settings", run: () => setTheme("system") },
  { id: "context-inspector-open", title: "선택 Inspector 열기", hint: "현재 caret 또는 선택 항목의 도구 표시", aliases: ["format", "selection", "context"], category: "view", run: () => setInspectorOpen(true, "context") },
  { id: "context-inspector-close", title: "Inspector 닫기", hint: "현재 Inspector 패널 닫기", aliases: ["hide inspector"], category: "view", enabled: () => inspectorOpen, run: () => setInspectorOpen(false) },
  { id: "document-previous", title: "이전 문서", hint: "문서 목록의 이전 문서 열기", aliases: ["previous", "prev"], category: "document-command", enabled: () => documents.filter((doc) => !doc.deletedAt).length > 1, run: () => openAdjacentDocument(-1) },
  { id: "document-next", title: "다음 문서", hint: "문서 목록의 다음 문서 열기", aliases: ["next"], category: "document-command", enabled: () => documents.filter((doc) => !doc.deletedAt).length > 1, run: () => openAdjacentDocument(1) },
);

if (!documents.length) {
  const first = createDocument("");
  documents = [first];
  activeId = first.id;
  bootstrappedSample = true;
  persistNow();
}

resolveStartupActiveDocument(readSessionRecoverySnapshot());

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
  markTypingTrace("refreshDocDerived:start");
  doc.tags = safeArray(doc.tags);
  doc.title = safeString(doc.title, "Untitled");
  doc.content = safeString(doc.content);
  markTypingTrace("before refresh sanitizeRichHtml");
  doc.contentHtml = sanitizeRichHtml(safeString(doc.contentHtml) || markdownToHtml(doc.content));
  markTypingTrace("after refresh sanitizeRichHtml", { htmlLength: doc.contentHtml.length });
  markTypingTrace("before htmlToPlain");
  const plain = htmlToPlain(doc.contentHtml || markdownToHtml(doc.content || ""));
  markTypingTrace("after htmlToPlain", { plainLength: plain.length });
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
  markTypingTrace("refreshDocDerived:end", { wordCount: doc.wordCount, charCount: doc.charCount });
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
    return false;
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
    setSessionText("");
    return true;
  } catch (error) {
    console.warn("[TextForge] durable save blocked or failed", error);
    els.sessionText.textContent = "안전 장치가 문서함 덮어쓰기를 막았습니다.";
    return false;
  } finally {
    db?.close();
    durableSaveInFlight = false;
  }
}

async function persistExperienceOperationDurably() {
  if (!durableStorageHydrated) return true;
  for (let attempt = 0; durableSaveInFlight && attempt < 80; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  if (durableSaveInFlight) return false;
  clearTimeout(durableSaveTimer);
  durableSaveTimer = null;
  return persistToDurableStorage();
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
      resolveStartupActiveDocument(readSessionRecoverySnapshot());
      safeLocalSet(ACTIVE_KEY, activeId || "");
      safeLocalSet(PROMPT_KEY, JSON.stringify(customPrompts));
      safeLocalSet(FOLDERS_KEY, JSON.stringify(folders));
      safeLocalSet(STORAGE_POINTER_KEY, JSON.stringify({ activeId, count: documents.length, restoredAt: new Date().toISOString() }));
      renderActive();
      restoreSessionViewport(readSessionRecoverySnapshot());
    setSessionText("");
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

function readSessionRecoverySnapshot() {
  try {
    const snapshot = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    return snapshot && typeof snapshot === "object" ? snapshot : null;
  } catch {
    return null;
  }
}

function resolveStartupActiveDocument(snapshot = readSessionRecoverySnapshot()) {
  const requestedIds = [
    snapshot?.resume?.documentId,
    activeId,
    snapshot?.id,
  ].filter((id) => typeof id === "string" && id);
  const active = requestedIds
    .map((id) => documents.find((doc) => doc.id === id && !doc.deletedAt))
    .find(Boolean) || documents.find((doc) => !doc.deletedAt) || null;
  if (!active) {
    const fallback = createDocument("");
    documents.unshift(fallback);
    activeId = fallback.id;
    persistNow({ flushRich: false });
  } else {
    activeId = active.id;
  }
  const mainPane = getPane("main");
  if (mainPane) mainPane.documentId = activeId;
  if (activeId) safeLocalSet(ACTIVE_KEY, activeId);
  return documents.find((doc) => doc.id === activeId) || null;
}

function currentEditorMode() {
  if (els.editorGrid.classList.contains("source-mode")) return "source";
  if (els.editorGrid.classList.contains("clean-mode")) return "clean";
  if (els.editorGrid.classList.contains("split-mode")) return "split";
  return "rich";
}

function serializeEditorBoundary(node, offset) {
  const path = [];
  let current = node;
  while (current && current !== els.richEditor) {
    const parent = current.parentNode;
    if (!parent) return null;
    const index = Array.prototype.indexOf.call(parent.childNodes, current);
    if (index < 0 || path.length >= 64) return null;
    path.unshift(index);
    current = parent;
  }
  if (current !== els.richEditor || !Number.isInteger(offset) || offset < 0) return null;
  return { path, offset };
}

function resolveEditorBoundary(boundary) {
  if (!boundary || !Array.isArray(boundary.path) || !Number.isInteger(boundary.offset) || boundary.offset < 0 || boundary.path.length > 64) return null;
  let node = els.richEditor;
  for (const index of boundary.path) {
    if (!Number.isInteger(index) || index < 0 || index >= node.childNodes.length) return null;
    node = node.childNodes[index];
  }
  const limit = node.nodeType === Node.TEXT_NODE ? node.data.length : node.childNodes.length;
  if (boundary.offset > limit) return null;
  return { node, offset: boundary.offset };
}

function serializeRichEditorSelection() {
  if (compositionActive) return null;
  const range = getEditorRangeFromSelection();
  if (!range) return null;
  const start = serializeEditorBoundary(range.startContainer, range.startOffset);
  const end = serializeEditorBoundary(range.endContainer, range.endOffset);
  return start && end ? { kind: "rich", start, end } : null;
}

function restoreRichEditorSelection(selectionState) {
  if (!selectionState || selectionState.kind !== "rich") return false;
  const start = resolveEditorBoundary(selectionState.start);
  const end = resolveEditorBoundary(selectionState.end);
  if (!start || !end) return false;
  try {
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    savedEditorSelection = range.cloneRange();
    return true;
  } catch {
    return false;
  }
}

function placeCaretAtEditorEnd() {
  try {
    const range = document.createRange();
    range.selectNodeContents(els.richEditor);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    savedEditorSelection = range.cloneRange();
    return true;
  } catch {
    return false;
  }
}

function createSessionRecoveryPayload() {
  const doc = activeDoc();
  const mode = currentEditorMode();
  const mainPane = getPane("main");
  const scroller = getPaneScrollElement("main");
  const sourceSelection = mode === "source" && Number.isInteger(els.editor.selectionStart) && Number.isInteger(els.editor.selectionEnd)
    ? { kind: "source", start: els.editor.selectionStart, end: els.editor.selectionEnd }
    : null;
  const currentState = {
    mode,
    scrollTop: Math.min(10000000, Math.max(0, Number(scroller?.scrollTop ?? mainPane?.scrollTop) || 0)),
    selection: sourceSelection || serializeRichEditorSelection(),
  };
  const previous = readSessionRecoverySnapshot()?.resume;
  const previousDocuments = previous?.version === 2 && previous.documents && typeof previous.documents === "object"
    ? previous.documents
    : {};
  return {
    id: activeId,
    title: doc?.title || "",
    updatedAt: doc?.updatedAt || "",
    resume: {
      version: 2,
      documentId: activeId,
      ...currentState,
      documents: activeId ? { ...previousDocuments, [activeId]: currentState } : previousDocuments,
    },
  };
}

function persistSessionRecoveryState() {
  clearTimeout(sessionStateTimer);
  sessionStateTimer = null;
  safeLocalSet(SESSION_KEY, JSON.stringify(createSessionRecoveryPayload()));
}

function scheduleSessionRecoverySave(delay = 220) {
  clearTimeout(sessionStateTimer);
  sessionStateTimer = setTimeout(persistSessionRecoveryState, delay);
}

function getSessionResumeState(snapshot = readSessionRecoverySnapshot()) {
  const resume = snapshot?.resume;
  if (!resume || typeof resume !== "object" || resume.documentId !== activeId) return null;
  const stored = resume.version === 2 && resume.documents && typeof resume.documents === "object"
    ? resume.documents[activeId] || resume
    : resume;
  const mode = ["rich", "source", "clean", "split"].includes(stored?.mode) ? stored.mode : "rich";
  return {
    mode,
    scrollTop: Math.min(10000000, Math.max(0, Number(stored?.scrollTop) || 0)),
    selection: stored?.selection && typeof stored.selection === "object" ? stored.selection : null,
  };
}

function restoreSessionViewport(snapshot = readSessionRecoverySnapshot()) {
  const resume = getSessionResumeState(snapshot);
  if (!resume) return null;
  if (resume.mode !== currentEditorMode()) setMode(resume.mode);
  const mainPane = getPane("main");
  if (mainPane) mainPane.scrollTop = resume.scrollTop;
  restorePaneScrollStable("main", resume.scrollTop);
  return resume;
}

function canRestoreStartupFocus() {
  return document.visibilityState === "visible" && !getTopOpenModal();
}

function restoreStartupFocus(snapshot = readSessionRecoverySnapshot()) {
  if (startupResumeFocusApplied || !canRestoreStartupFocus()) return;
  const resume = restoreSessionViewport(snapshot) || { mode: currentEditorMode(), selection: null };
  if (resume.mode === "source") {
    focusWithoutScroll(els.editor);
    const start = Number(resume.selection?.start);
    const end = Number(resume.selection?.end);
    const length = els.editor.value.length;
    if (resume.selection?.kind === "source" && Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end >= start && end <= length) els.editor.setSelectionRange(start, end);
    else els.editor.setSelectionRange(length, length);
  } else if (resume.mode === "rich" || resume.mode === "split") {
    focusWithoutScroll(els.richEditor);
    if (!restoreRichEditorSelection(resume.selection)) placeCaretAtEditorEnd();
  } else {
    focusWithoutScroll(document.querySelector(".mode-btn.active") || els.richEditor);
  }
  startupResumeFocusApplied = true;
}

function scheduleStartupResume(snapshot = readSessionRecoverySnapshot()) {
  requestAnimationFrame(() => {
    restoreSessionViewport(snapshot);
    requestAnimationFrame(() => restoreStartupFocus(snapshot));
  });
}

function defaultSplitWorkspace() {
  return {
    version: 2,
    layout: "single",
    activePaneId: "main",
    syncScrollEnabled: false,
    dividerRatio: 0.5,
    panes: [
      { id: "main", documentId: activeId || null, mode: "rich", scrollTop: 0, selection: null, lockedScroll: false, readonly: false, syncScrollGroup: null, widthRatio: 0.5, lastUserScrollAt: 0, lastProgrammaticRestoreAt: 0, lockedScrollTop: 0 },
      { id: "reference", documentId: activeId || null, mode: "rich", suspendedMode: null, scrollTop: 0, selection: null, lockedScroll: false, readonly: false, syncScrollGroup: null, widthRatio: 0.5, lastUserScrollAt: 0, lastProgrammaticRestoreAt: 0, lockedScrollTop: 0 },
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
      const docExists = !storedPane.documentId || documents.some((doc) => doc.id === storedPane.documentId && !doc.deletedAt);
      const storedMode = storedPane.mode === "readonly" ? "preview" : storedPane.mode;
      return {
        ...fallback,
        ...storedPane,
        documentId: docExists ? storedPane.documentId || fallback.documentId : activeId || null,
        mode: ["rich", "write", "source", "preview", "clean"].includes(storedMode) ? (storedMode === "write" ? "rich" : storedMode) : fallback.mode,
        scrollTop: Number.isFinite(storedPane.scrollTop) ? storedPane.scrollTop : 0,
        lockedScrollTop: Number.isFinite(storedPane.lockedScrollTop) ? storedPane.lockedScrollTop : Number.isFinite(storedPane.scrollTop) ? storedPane.scrollTop : 0,
        lastUserScrollAt: 0,
        lastProgrammaticRestoreAt: 0,
        lockedScroll: Boolean(storedPane.lockedScroll ?? fallback.lockedScroll),
        selection: storedPane.selection && typeof storedPane.selection === "object" ? storedPane.selection : null,
        readonly: Boolean(storedPane.readonly),
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
      dividerRatio: Math.min(0.8, Math.max(0.2, Number(stored.dividerRatio) || 0.5)),
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

function serializeBoundaryForRoot(root, node, offset) {
  const path = [];
  let current = node;
  while (current && current !== root) {
    const parent = current.parentNode;
    if (!parent || path.length >= 64) return null;
    const index = Array.prototype.indexOf.call(parent.childNodes, current);
    if (index < 0) return null;
    path.unshift(index);
    current = parent;
  }
  return current === root && Number.isInteger(offset) && offset >= 0 ? { path, offset } : null;
}

function resolveBoundaryForRoot(root, boundary) {
  if (!root || !boundary || !Array.isArray(boundary.path) || boundary.path.length > 64 || !Number.isInteger(boundary.offset) || boundary.offset < 0) return null;
  let node = root;
  for (const index of boundary.path) {
    if (!Number.isInteger(index) || index < 0 || index >= node.childNodes.length) return null;
    node = node.childNodes[index];
  }
  const limit = node.nodeType === Node.TEXT_NODE ? node.data.length : node.childNodes.length;
  return boundary.offset <= limit ? { node, offset: boundary.offset } : null;
}

function captureSelectionForRoot(root) {
  if (!root) return null;
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const start = serializeBoundaryForRoot(root, range.startContainer, range.startOffset);
  const end = serializeBoundaryForRoot(root, range.endContainer, range.endOffset);
  return start && end ? { kind: "rich", start, end } : null;
}

function restoreSelectionForRoot(root, selectionState) {
  if (!root || selectionState?.kind !== "rich") return false;
  const start = resolveBoundaryForRoot(root, selectionState.start);
  const end = resolveBoundaryForRoot(root, selectionState.end);
  if (!start || !end) return false;
  try {
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  } catch {
    return false;
  }
}

function captureMainViewState() {
  const mode = currentEditorMode();
  const selection = mode === "source"
    ? { kind: "source", start: els.editor.selectionStart || 0, end: els.editor.selectionEnd || 0 }
    : serializeRichEditorSelection();
  return { mode, scrollTop: Math.max(0, Number(currentMainScroller()?.scrollTop) || 0), selection };
}

function restoreMainViewState(viewState, options = {}) {
  if (!viewState || typeof viewState !== "object") return false;
  const mode = ["rich", "source", "clean", "split"].includes(viewState.mode) ? viewState.mode : "rich";
  if (mode !== currentEditorMode()) setMode(mode);
  const main = getPane("main");
  if (main) main.scrollTop = Math.max(0, Number(viewState.scrollTop) || 0);
  requestAnimationFrame(() => {
    restorePaneScrollStable("main", main?.scrollTop || 0);
    if (options.focus === false) return;
    if (mode === "source") {
      focusWithoutScroll(els.editor);
      const start = Number(viewState.selection?.start);
      const end = Number(viewState.selection?.end);
      if (viewState.selection?.kind === "source" && Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end >= start && end <= els.editor.value.length) els.editor.setSelectionRange(start, end);
    } else if (mode === "rich" || mode === "split") {
      focusWithoutScroll(els.richEditor);
      restoreRichEditorSelection(viewState.selection);
    }
  });
  return true;
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
  if (paneId === "main") {
    const previousId = activeId;
    const viewState = captureMainViewState();
    flushRichDocumentNow("before-document-switch");
    flushReferenceDocumentNow("before-main-document-switch");
    window.dispatchEvent(new CustomEvent("textforge:before-active-document-change", { detail: { id: previousId, viewState } }));
  }
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
    persistSessionRecoveryState();
    activeId = doc.id;
    splitWorkspace.panes[0].documentId = doc.id;
    splitWorkspace.activePaneId = "main";
    safeLocalSet(ACTIVE_KEY, activeId);
    renderActive();
    if (options.viewState) restoreMainViewState(options.viewState, { focus: options.focus !== false });
    scheduleSessionRecoverySave(0);
    schedulePortalStateBroadcast(0);
    markDocumentSwitch("openDocumentInPane:end");
    return;
  }
  const pane = getPane(paneId);
  if (!pane) return;
  savePaneScroll(paneId);
  pane.documentId = doc.id;
  flushReferenceDocumentNow("before-reference-document-switch");
  pane.mode = options.mode === "readonly" ? "preview" : options.mode || pane.mode || "rich";
  pane.suspendedMode = null;
  pane.readonly = doc.id === activeId || isDocumentDetached(doc.id);
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
  openDocumentInPane(documentId, "reference", { mode: options.mode || "rich", lockedScroll: options.lockedScroll ?? false, layout: splitWorkspace.layout });
}

function duplicateCurrentDocumentToReferencePane(layout = "vertical-2") {
  if (!activeId) return;
  splitWorkspace.layout = layout;
  openDocumentInPane(activeId, "reference", { mode: "preview", lockedScroll: true, layout });
  setActivePane("main");
}

function closePane(paneId) {
  if (paneId === "main") return;
  flushReferenceDocumentNow("close-reference-pane");
  savePaneScroll(paneId);
  splitWorkspace.layout = "single";
  splitWorkspace.activePaneId = "main";
  persistSplitWorkspace();
  renderSplitWorkspace();
}

function swapDocumentPanes() {
  const reference = getPane("reference");
  if (!reference?.documentId || reference.documentId === activeId) return false;
  flushRichDocumentNow("before-pane-swap");
  flushReferenceDocumentNow("before-pane-swap");
  const previousMainId = activeId;
  const previousMainView = captureMainViewState();
  const previousReference = { documentId: reference.documentId, mode: reference.mode, scrollTop: reference.scrollTop, selection: reference.selection };
  reference.documentId = previousMainId;
  reference.mode = previousMainView.mode === "split" ? "rich" : previousMainView.mode;
  reference.scrollTop = previousMainView.scrollTop;
  reference.selection = previousMainView.selection;
  openDocumentInPane(previousReference.documentId, "main", {
    source: "split-swap",
    viewState: { mode: previousReference.mode === "preview" ? "rich" : previousReference.mode, scrollTop: previousReference.scrollTop, selection: previousReference.selection },
  });
  splitWorkspace.activePaneId = "main";
  persistSplitWorkspace();
  renderSplitWorkspace({ preserveScroll: false, reason: "pane-swap" });
  return true;
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

function restoreSplitWorkspaceState(snapshot) {
  const backup = splitWorkspace;
  try {
    if (!snapshot || typeof snapshot !== "object") throw new Error("Invalid split workspace");
    const base = defaultSplitWorkspace();
    const validDocs = new Set(documents.filter((doc) => !doc.deletedAt).map((doc) => doc.id));
    const sourcePanes = safeArray(snapshot.panes);
    const panes = base.panes.map((fallback) => {
      const source = sourcePanes.find((pane) => pane?.id === fallback.id) || {};
      const documentId = validDocs.has(source.documentId)
        ? source.documentId
        : fallback.id === "main"
          ? activeId
          : documents.find((doc) => !doc.deletedAt && doc.id !== activeId)?.id || activeId;
      return {
        ...fallback,
        documentId,
        mode: ["rich", "source", "preview", "clean"].includes(source.mode) ? source.mode : fallback.mode,
        scrollTop: Math.max(0, Number(source.scrollTop) || 0),
        selection: source.selection && typeof source.selection === "object" ? source.selection : null,
        lockedScroll: Boolean(source.lockedScroll),
      };
    });
    splitWorkspace = {
      ...base,
      version: 2,
      layout: ["single", "vertical-2", "horizontal-2"].includes(snapshot.layout) ? snapshot.layout : "single",
      activePaneId: snapshot.activePaneId === "reference" ? "reference" : "main",
      syncScrollEnabled: Boolean(snapshot.syncScrollEnabled),
      dividerRatio: Math.min(0.8, Math.max(0.2, Number(snapshot.dividerRatio) || 0.5)),
      panes,
    };
    const mainDocumentId = panes[0].documentId;
    if (mainDocumentId && mainDocumentId !== activeId) openDocumentInPane(mainDocumentId, "main", { source: "workspace-split-restore", focus: false });
    persistSplitWorkspace();
    renderSplitWorkspace({ preserveScroll: false, reason: "workspace-restore" });
    return true;
  } catch {
    splitWorkspace = backup;
    renderSplitWorkspace({ preserveScroll: false, reason: "workspace-rollback" });
    return false;
  }
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
  if (paneId === "main") return currentMainScroller();
  return getPane("reference")?.mode === "source" ? els.referenceSourceEditor : getPane("reference")?.mode === "preview" || getPane("reference")?.mode === "clean" ? els.referencePreview : els.referencePaneBody;
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
  const scroller = getPaneScrollElement("reference");
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
  els.splitDivider?.classList.toggle("hidden", !visible);
  if (!visible || !pane) return;
  const doc = documents.find((item) => item.id === pane.documentId && !item.deletedAt) || documents.find((item) => item.id !== activeId && !item.deletedAt) || activeDoc();
  if (!doc) {
    els.referencePaneBody.innerHTML = '<p class="empty-note">열 문서가 없습니다.</p>';
    return;
  }
  pane.documentId = doc.id;
  const duplicate = doc.id === activeId;
  const detached = isDocumentDetached(doc.id);
  pane.readonly = duplicate || detached;
  if (pane.readonly && pane.mode === "rich") {
    pane.suspendedMode = "rich";
    pane.mode = "preview";
  } else if (!pane.readonly && pane.suspendedMode) {
    pane.mode = pane.suspendedMode;
    pane.suspendedMode = null;
  }
  els.referencePaneTitle.textContent = doc.title || "Untitled";
  if (els.referencePaneQuickLookBtn) els.referencePaneQuickLookBtn.dataset.docId = doc.id;
  if (els.referencePaneMode) els.referencePaneMode.value = pane.mode || "rich";
  if (els.referenceDocSelect) els.referenceDocSelect.value = doc.id;
  const html = doc.contentHtml || markdownToHtml(doc.content || "");
  const signature = `${doc.id}:${doc.updatedAt || ""}:${pane.mode || "rich"}:${pane.readonly}`;
  const activeEditor = pane.mode === "source" ? els.referenceSourceEditor : pane.mode === "rich" ? els.referencePaneBody : els.referencePreview;
  const previousSignature = activeEditor?.dataset.renderSignature || "";
  if ((pane.lockedScroll || referenceDocumentDirty) && previousSignature === signature) {
    restorePaneScrollStable("reference", pane.lockedScrollTop ?? pane.scrollTop ?? 0);
    return;
  }
  els.referencePaneBody.classList.toggle("hidden", pane.mode !== "rich");
  els.referenceSourceEditor?.classList.toggle("hidden", pane.mode !== "source");
  els.referencePreview?.classList.toggle("hidden", pane.mode !== "preview" && pane.mode !== "clean");
  if (pane.mode === "source") {
    if (document.activeElement !== els.referenceSourceEditor || !referenceDocumentDirty) els.referenceSourceEditor.value = doc.content || htmlToMarkdown(html);
    els.referenceSourceEditor.readOnly = pane.readonly;
    els.referenceSourceEditor.dataset.renderSignature = signature;
  } else if (pane.mode === "rich") {
    if (document.activeElement !== els.referencePaneBody || !referenceDocumentDirty) els.referencePaneBody.innerHTML = prepareHtmlForThemedRender(html);
    els.referencePaneBody.setAttribute("contenteditable", pane.readonly ? "false" : "true");
    els.referencePaneBody.dataset.renderSignature = signature;
  } else {
    els.referencePreview.innerHTML = prepareHtmlForThemedRender(html);
    els.referencePreview.dataset.renderSignature = signature;
  }
  const status = duplicate
    ? "This document is already editable in the main pane. Choose another document to edit here."
    : detached
      ? "Editing is owned by a detached window."
      : "";
  if (els.referencePaneStatus) {
    els.referencePaneStatus.textContent = status;
    els.referencePaneStatus.classList.toggle("hidden", !status);
  }
  requestAnimationFrame(() => {
    restorePaneScrollStable("reference", pane.scrollTop || 0);
    if (!pane.readonly && pane.mode === "rich") restoreSelectionForRoot(els.referencePaneBody, pane.selection);
    if (!pane.readonly && pane.mode === "source" && pane.selection?.kind === "source") {
      const start = Math.min(els.referenceSourceEditor.value.length, Math.max(0, Number(pane.selection.start) || 0));
      const end = Math.min(els.referenceSourceEditor.value.length, Math.max(start, Number(pane.selection.end) || start));
      els.referenceSourceEditor.setSelectionRange(start, end);
    }
  });
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
  if (els.mainPaneQuickLookBtn) {
    els.mainPaneQuickLookBtn.dataset.docId = activeId || "";
    els.mainPaneQuickLookBtn.disabled = layout === "single" || splitWorkspace.activePaneId === "main";
  }
  if (els.referencePaneQuickLookBtn) {
    els.referencePaneQuickLookBtn.dataset.docId = ref?.documentId || "";
    els.referencePaneQuickLookBtn.disabled = layout === "single" || splitWorkspace.activePaneId === "reference";
  }
  const ratio = Math.min(0.8, Math.max(0.2, Number(splitWorkspace.dividerRatio) || 0.5));
  els.editorGrid.style.setProperty("--tf-split-ratio", `${ratio * 100}%`);
  if (els.splitDivider) {
    els.splitDivider.setAttribute("aria-orientation", layout === "horizontal-2" ? "horizontal" : "vertical");
    els.splitDivider.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
  }
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

function persistSoon(options = {}) {
  els.saveState.textContent = "저장 중...";
  clearTimeout(saveTimer);
  const delay = options.delay ?? 250;
  const flushRich = options.flushRich !== false;
  saveTimer = setTimeout(() => persistNow({ flushRich }), delay);
}

function persistNow(options = {}) {
  if (options.flushRich !== false) flushRichDocumentNow("persist");
  safeLocalSet(ACTIVE_KEY, activeId || "");
  safeLocalSet(FOLDERS_KEY, JSON.stringify(folders));
  persistSessionRecoveryState();
  safeLocalSet(STORAGE_POINTER_KEY, JSON.stringify({ activeId, count: documents.length, updatedAt: new Date().toISOString() }));
  scheduleDurableSave();
  els.saveState.textContent = `저장됨 ${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
  renderDocList();
  schedulePortalStateBroadcast();
}

function updateActive(mutator) {
  const doc = activeDoc();
  if (!doc) return;
  const before = doc.content;
  mutator(doc);
  doc.updatedAt = new Date().toISOString();
  markTypingTrace("before refreshDocDerived");
  refreshDocDerived(doc);
  markTypingTrace("after refreshDocDerived");
  markTypingTrace("before maybeAutoSnapshot");
  maybeAutoSnapshot(doc, before);
  markTypingTrace("after maybeAutoSnapshot");
  markTypingTrace("before persistSoon");
  persistSoon();
  markTypingTrace("after persistSoon");
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
    const isActive = id === nextId;
    item.classList.toggle("active", isActive);
    item.setAttribute("aria-current", isActive ? "page" : "false");
    touched = true;
  });
  return touched;
}

function revealActiveDocListItem(documentId = activeId) {
  if (!els.docList || !documentId) return;
  const item = els.docList.querySelector(`[data-doc-id="${CSS.escape(documentId)}"]`);
  item?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
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
  revealActiveDocListItem(docId);
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
  window.dispatchEvent(new CustomEvent("textforge:active-document-change", { detail: { id: doc.id } }));
  cancelPendingPostSwitchRender();
  splitWorkspace.panes[0].documentId = doc.id;
  els.titleInput.value = doc.title;
  els.editor.value = doc.content;
  markDocumentSwitch("after title/source/editor update");
  setRichEditorHtmlPrepared(doc.contentHtml || markdownToHtml(doc.content || ""));
  applyDetachedOwnershipUi();
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
    item.setAttribute("aria-current", doc.id === activeId ? "page" : "false");
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

function getPortalLibrarySnapshot() {
  return {
    documents: documents.map((doc) => ({
      id: doc.id,
      title: doc.title || "Untitled",
      previewText: doc.previewText || doc._summary || "",
      type: doc.type || "note",
      folderId: doc.folderId || null,
      tags: safeArray(doc.tags).slice(0, 20),
      favorite: Boolean(doc.favorite),
      deletedAt: doc.deletedAt || null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      charCount: Number(doc.charCount || 0),
      color: doc.color || DOC_COLORS[0],
      historyCount: safeArray(doc.history).length,
    })),
    folders: folders.map((folder) => ({ ...folder })),
    activeId,
    theme: getStoredTheme(),
    resolvedTheme: resolveTheme(),
    updatedAt: new Date().toISOString(),
    authority: "main-window",
  };
}

function refreshPortalSearchMetadata(doc) {
  const plain = safeString(doc.plainText);
  doc.searchText = `${doc.title}\n${doc.type}\n${safeArray(doc.tags).join(" ")}\n${plain}`.toLowerCase();
  Object.defineProperty(doc, "_searchText", { value: doc.searchText, configurable: true });
  Object.defineProperty(doc, "_summary", { value: doc.previewText || "", configurable: true });
  return doc;
}

function sendPortalLibraryMessage(type, payload = {}, targetWindow = null) {
  const message = { source: "textforge-main", type, payload };
  if (targetWindow && !targetWindow.closed) {
    targetWindow.postMessage(message, location.origin);
    return;
  }
  if (portalLibraryChannel) portalLibraryChannel.postMessage(message);
  else if (portalLibraryWindow && !portalLibraryWindow.closed) portalLibraryWindow.postMessage(message, location.origin);
}

function schedulePortalStateBroadcast(delay = 40) {
  if (!portalLibraryConnected) return;
  clearTimeout(portalStateBroadcastTimer);
  portalStateBroadcastTimer = setTimeout(() => {
    sendPortalLibraryMessage("state", getPortalLibrarySnapshot());
  }, delay);
}

function openPortalLibrary(options = {}) {
  const locationOptions = typeof options === "string" ? { smartFolder: options } : options;
  const query = new URLSearchParams();
  if (locationOptions.smartFolder && locationOptions.smartFolder !== "all") query.set("smart", locationOptions.smartFolder);
  if (locationOptions.folderId) query.set("folder", locationOptions.folderId);
  const portalUrl = `portal-library.html${query.size ? `?${query}` : ""}`;
  portalLibraryConnected = true;
  const features = "popup=yes,width=1480,height=940,resizable=yes,scrollbars=no";
  portalLibraryWindow = window.open(portalUrl, "textforge-portal-library", features);
  if (!portalLibraryWindow) {
    setSessionText("Portal Library popup was blocked. Allow popups for 127.0.0.1.");
    return null;
  }
  portalLibraryWindow.focus();
  setSessionText("Portal Library opened");
  schedulePortalStateBroadcast(120);
  return portalLibraryWindow;
}

function rememberPortalRequest(requestId) {
  if (!requestId) return true;
  if (portalSeenRequestIds.has(requestId)) return false;
  portalSeenRequestIds.add(requestId);
  if (portalSeenRequestIds.size > 300) {
    const oldest = portalSeenRequestIds.values().next().value;
    portalSeenRequestIds.delete(oldest);
  }
  return true;
}

function pushPortalOperationSnapshot(reason) {
  portalOperationUndoStack.push({
    reason,
    activeId,
    documents: documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      folderId: doc.folderId || null,
      deletedAt: doc.deletedAt || null,
      favorite: Boolean(doc.favorite),
      updatedAt: doc.updatedAt,
    })),
    folders: folders.map((folder) => ({ ...folder })),
  });
  portalOperationUndoStack = portalOperationUndoStack.slice(-20);
}

function restorePortalOperation() {
  const snapshot = portalOperationUndoStack.pop();
  if (!snapshot) return false;
  flushRichDocumentNow("before-portal-undo");
  const metadataById = new Map(snapshot.documents.map((doc) => [doc.id, doc]));
  documents.forEach((doc) => {
    const before = metadataById.get(doc.id);
    if (!before) return;
    doc.title = before.title;
    doc.folderId = before.folderId;
    doc.deletedAt = before.deletedAt;
    doc.favorite = before.favorite;
    doc.updatedAt = before.updatedAt;
    refreshPortalSearchMetadata(doc);
  });
  folders = normalizeFolders(snapshot.folders);
  if (snapshot.activeId && documents.some((doc) => doc.id === snapshot.activeId)) activeId = snapshot.activeId;
  persistNow({ flushRich: false });
  renderActive();
  setSessionText(`Portal operation restored: ${snapshot.reason}`);
  return true;
}

function portalFolderMoveAllowed(folderId, parentId) {
  if (window.TextForgePortalCore?.canMoveFolder) return window.TextForgePortalCore.canMoveFolder(folders, folderId, parentId);
  if (!parentId) return folderId !== parentId;
  const descendants = new Set();
  const queue = [folderId];
  while (queue.length) {
    const current = queue.shift();
    folders.forEach((folder) => {
      if (folder.parentId === current && !descendants.has(folder.id)) {
        descendants.add(folder.id);
        queue.push(folder.id);
      }
    });
  }
  return folderId !== parentId && !descendants.has(parentId);
}

function portalOperationResult(message, options = {}, targetWindow = null) {
  sendPortalLibraryMessage("operation-result", {
    message,
    undoAvailable: Boolean(options.undoAvailable),
    movedDocumentIds: options.movedDocumentIds || [],
  }, targetWindow);
  schedulePortalStateBroadcast(0);
}

function portalOperationError(error, targetWindow = null) {
  const message = String(error?.message || error || "Portal operation failed");
  sendPortalLibraryMessage("error", { message }, targetWindow);
  setSessionText(message);
}

async function handlePortalLibraryMessage(message, targetWindow = null) {
  if (!message || message.source !== "textforge-portal" || !rememberPortalRequest(message.requestId)) return;
  portalLibraryConnected = true;
  if (targetWindow && !targetWindow.closed) portalLibraryWindow = targetWindow;
  const payload = message.payload || {};
  try {
    if (message.type === "request-state") {
      sendPortalLibraryMessage("state", getPortalLibrarySnapshot(), targetWindow);
      return;
    }
    if (message.type === "request-preview") {
      if (payload.docId === activeId) flushRichDocumentNow("portal-preview");
      const doc = documents.find((item) => item.id === payload.docId);
      if (!doc) throw new Error("Preview document not found");
      sendPortalLibraryMessage("preview", {
        docId: doc.id,
        title: doc.title,
        contentHtml: sanitizeRichHtml(doc.contentHtml || markdownToHtml(doc.content || "")),
        updatedAt: doc.updatedAt,
        charCount: doc.charCount || 0,
        folder: folders.find((item) => item.id === doc.folderId)?.name || "Inbox",
        favorite: Boolean(doc.favorite),
        deleted: Boolean(doc.deletedAt),
      }, targetWindow);
      return;
    }
    if (message.type === "open-quick-note") {
      window.focus();
      const opened = window.TextForgeMacintoshExperience?.openQuickNote?.();
      if (opened === false || !window.TextForgeMacintoshExperience) throw new Error("Quick Note is not ready");
      portalOperationResult("Quick Note를 열었습니다.", {}, targetWindow);
      return;
    }
    if (message.type === "open-document") {
      openDocumentInPane(payload.docId, "main", { source: "portal-library" });
      window.focus();
      schedulePortalStateBroadcast(0);
      return;
    }
    if (message.type === "undo-portal-operation") {
      if (!restorePortalOperation()) throw new Error("No Portal operation to restore");
      portalOperationResult("이전 Portal 작업을 되돌렸습니다.", { undoAvailable: portalOperationUndoStack.length > 0 }, targetWindow);
      return;
    }

    flushRichDocumentNow("before-portal-operation");
    const nowIso = new Date().toISOString();
    if (message.type === "move-documents") {
      const targetFolder = payload.folderId ? folders.find((folder) => folder.id === payload.folderId) : null;
      if (payload.folderId && !targetFolder) throw new Error("Target folder not found");
      const ids = new Set(safeArray(payload.docIds));
      const affected = documents.filter((doc) => ids.has(doc.id));
      if (!affected.length) throw new Error("No documents selected for move");
      pushPortalOperationSnapshot("move-documents");
      affected.forEach((doc) => {
        doc.folderId = targetFolder?.id || null;
        doc.updatedAt = nowIso;
      });
      persistNow({ flushRich: false });
      portalOperationResult(`${affected.length}개 문서를 ${targetFolder?.name || "루트"}(으)로 이동했습니다.`, { undoAvailable: true, movedDocumentIds: affected.map((doc) => doc.id) }, targetWindow);
      return;
    }
    if (message.type === "move-folders") {
      const targetParent = payload.parentId ? folders.find((folder) => folder.id === payload.parentId) : null;
      if (payload.parentId && !targetParent) throw new Error("Target folder not found");
      const ids = safeArray(payload.folderIds).filter((id) => folders.some((folder) => folder.id === id));
      if (!ids.length || ids.some((id) => !portalFolderMoveAllowed(id, targetParent?.id || null))) throw new Error("A folder cannot be moved into itself or its child");
      pushPortalOperationSnapshot("move-folders");
      folders.forEach((folder) => {
        if (ids.includes(folder.id)) {
          folder.parentId = targetParent?.id || null;
          folder.updatedAt = nowIso;
        }
      });
      persistNow({ flushRich: false });
      portalOperationResult(`${ids.length}개 폴더를 이동했습니다.`, { undoAvailable: true }, targetWindow);
      return;
    }
    if (message.type === "rename-document") {
      const doc = documents.find((item) => item.id === payload.docId);
      if (!doc || !String(payload.title || "").trim()) throw new Error("Document rename request is invalid");
      pushPortalOperationSnapshot("rename-document");
      doc.title = String(payload.title).trim();
      doc.updatedAt = nowIso;
      refreshPortalSearchMetadata(doc);
      persistNow({ flushRich: false });
      if (doc.id === activeId) renderActive();
      portalOperationResult("문서 이름을 변경했습니다.", { undoAvailable: true }, targetWindow);
      return;
    }
    if (message.type === "toggle-favorite") {
      const ids = new Set(safeArray(payload.docIds));
      const affected = documents.filter((doc) => ids.has(doc.id));
      if (!affected.length) throw new Error("No documents selected");
      pushPortalOperationSnapshot("toggle-favorite");
      const next = !affected.every((doc) => doc.favorite);
      affected.forEach((doc) => { doc.favorite = next; doc.updatedAt = nowIso; });
      persistNow({ flushRich: false });
      portalOperationResult(`${affected.length}개 문서의 즐겨찾기를 변경했습니다.`, { undoAvailable: true }, targetWindow);
      return;
    }
    if (message.type === "trash-documents" || message.type === "restore-documents") {
      const ids = new Set(safeArray(payload.docIds));
      const affected = documents.filter((doc) => ids.has(doc.id));
      if (!affected.length) throw new Error("No documents selected");
      const restoring = message.type === "restore-documents";
      pushPortalOperationSnapshot(restoring ? "restore-documents" : "trash-documents");
      affected.forEach((doc) => { doc.deletedAt = restoring ? null : Date.now(); doc.updatedAt = nowIso; });
      if (!restoring && ids.has(activeId)) {
        const next = documents.find((doc) => !doc.deletedAt);
        if (next) activeId = next.id;
      }
      persistNow({ flushRich: false });
      renderActive();
      portalOperationResult(restoring ? `${affected.length}개 문서를 복원했습니다.` : `${affected.length}개 문서를 휴지통으로 이동했습니다.`, { undoAvailable: true }, targetWindow);
      return;
    }
    if (message.type === "create-folder") {
      const name = String(payload.name || "").trim();
      const parentId = payload.parentId && folders.some((folder) => folder.id === payload.parentId) ? payload.parentId : null;
      if (!name) throw new Error("Folder name is required");
      pushPortalOperationSnapshot("create-folder");
      folders.push({ id: crypto.randomUUID(), name, parentId, createdAt: nowIso, updatedAt: nowIso });
      persistNow({ flushRich: false });
      portalOperationResult("새 폴더를 만들었습니다.", { undoAvailable: true }, targetWindow);
      return;
    }
    if (message.type === "rename-folder") {
      const folder = folders.find((item) => item.id === payload.folderId);
      const name = String(payload.name || "").trim();
      if (!folder || !name) throw new Error("Folder rename request is invalid");
      pushPortalOperationSnapshot("rename-folder");
      folder.name = name;
      folder.updatedAt = nowIso;
      persistNow({ flushRich: false });
      portalOperationResult("폴더 이름을 변경했습니다.", { undoAvailable: true }, targetWindow);
      return;
    }
  } catch (error) {
    portalOperationError(error, targetWindow);
  }
}

function initPortalLibraryBridge() {
  if ("BroadcastChannel" in window) {
    portalLibraryChannel = new BroadcastChannel(PORTAL_CHANNEL_NAME);
    portalLibraryChannel.addEventListener("message", (event) => handlePortalLibraryMessage(event.data));
  }
  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin) return;
    handlePortalLibraryMessage(event.data, event.source);
  });
}

function rememberDetachedRequest(requestId) {
  if (!requestId) return true;
  if (detachedSeenRequestIds.has(requestId)) return false;
  detachedSeenRequestIds.add(requestId);
  if (detachedSeenRequestIds.size > 300) detachedSeenRequestIds.delete(detachedSeenRequestIds.values().next().value);
  return true;
}

function isDocumentDetached(documentId) {
  return Boolean(documentId && detachedEditorLeases.has(documentId));
}

function getDetachedDocumentSnapshot(documentId, lease = detachedEditorLeases.get(documentId)) {
  const doc = documents.find((item) => item.id === documentId && !item.deletedAt);
  if (!doc) return null;
  return {
    documentId: doc.id,
    windowId: lease?.windowId || null,
    title: doc.title || "Untitled",
    content: doc.content || htmlToMarkdown(doc.contentHtml || ""),
    contentHtml: sanitizeRichHtml(doc.contentHtml || markdownToHtml(doc.content || "")),
    updatedAt: doc.updatedAt,
    theme: getStoredTheme(),
    viewState: lease?.viewState || null,
    authority: "main-window",
  };
}

function sendDetachedEditorMessage(type, payload = {}, targetWindow = null) {
  const message = { source: "textforge-main", type, payload };
  if (targetWindow && !targetWindow.closed) {
    targetWindow.postMessage(message, location.origin);
    return;
  }
  if (detachedEditorChannel) detachedEditorChannel.postMessage(message);
}

function applyDetachedOwnershipUi() {
  const lease = detachedEditorLeases.get(activeId);
  const locked = Boolean(lease);
  els.richEditor?.setAttribute("contenteditable", locked ? "false" : "true");
  if (els.editor) els.editor.readOnly = locked;
  if (els.titleInput) els.titleInput.readOnly = locked;
  els.editorGrid?.classList.toggle("detached-readonly", locked);
  els.editorGrid?.setAttribute("data-detached-owner", locked ? "detached-window" : "main-window");
  renderReferencePane();
}

function releaseDetachedLease(documentId, windowId, options = {}) {
  const lease = detachedEditorLeases.get(documentId);
  if (!lease || (windowId && lease.windowId !== windowId)) return false;
  detachedEditorLeases.delete(documentId);
  applyDetachedOwnershipUi();
  if (options.reattach) {
    window.dispatchEvent(new CustomEvent("textforge:detached-reattach", {
      detail: { documentId, originalTabIndex: lease.originalTabIndex, viewState: options.viewState || lease.viewState || null },
    }));
    window.focus();
  }
  window.dispatchEvent(new CustomEvent("textforge:detached-state-change", { detail: { documentId, detached: false } }));
  return true;
}

function openDetachedEditor(documentId = activeId, options = {}) {
  flushRichDocumentNow("before-detach");
  flushReferenceDocumentNow("before-detach");
  const doc = documents.find((item) => item.id === documentId && !item.deletedAt);
  if (!doc) return { ok: false, reason: "missing-document" };
  const existing = detachedEditorLeases.get(doc.id);
  if (existing?.window && !existing.window.closed) {
    existing.window.focus();
    setSessionText("This document is already open in a detached editor.");
    return { ok: false, reason: "already-detached", windowId: existing.windowId };
  }
  if (doc.id === getPane("reference")?.documentId && referenceDocumentDirty) flushReferenceDocumentNow("before-detach-reference");
  const windowId = crypto.randomUUID();
  const url = `detached-editor.html?documentId=${encodeURIComponent(doc.id)}&windowId=${encodeURIComponent(windowId)}`;
  const popup = window.open(url, `textforge-detached-${doc.id}`, "popup=yes,width=980,height=760,resizable=yes,scrollbars=no");
  if (!popup) {
    setSessionText("Detached editor popup was blocked. Allow popups for 127.0.0.1.");
    return { ok: false, reason: "popup-blocked" };
  }
  const lease = {
    documentId: doc.id,
    windowId,
    window: popup,
    originalTabIndex: Number.isInteger(options.originalTabIndex) ? options.originalTabIndex : null,
    viewState: options.viewState || null,
    lastSeenAt: Date.now(),
  };
  detachedEditorLeases.set(doc.id, lease);
  applyDetachedOwnershipUi();
  popup.focus();
  setSessionText(`Editing ownership moved to detached window: ${doc.title || "Untitled"}`);
  window.dispatchEvent(new CustomEvent("textforge:detached-state-change", { detail: { documentId: doc.id, detached: true, windowId } }));
  setTimeout(() => sendDetachedEditorMessage("document-state", getDetachedDocumentSnapshot(doc.id, lease), popup), 160);
  return { ok: true, documentId: doc.id, windowId };
}

async function handleDetachedEditorMessage(message, targetWindow = null) {
  if (!message || message.source !== "textforge-detached" || !rememberDetachedRequest(message.requestId)) return;
  const payload = message.payload || {};
  const documentId = String(payload.documentId || "");
  const windowId = String(payload.windowId || "");
  const doc = documents.find((item) => item.id === documentId && !item.deletedAt);
  if (!doc) {
    sendDetachedEditorMessage("error", { documentId, windowId, message: "Document is no longer available." }, targetWindow);
    return;
  }
  let lease = detachedEditorLeases.get(documentId);
  if (message.type === "hello" || message.type === "request-state") {
    if (lease && lease.windowId !== windowId) {
      sendDetachedEditorMessage("ownership-denied", { documentId, windowId, message: "Another detached window owns this document." }, targetWindow);
      return;
    }
    if (!lease) {
      lease = { documentId, windowId, window: targetWindow, originalTabIndex: null, viewState: payload.viewState || null, lastSeenAt: Date.now() };
      detachedEditorLeases.set(documentId, lease);
      applyDetachedOwnershipUi();
    }
    lease.window = targetWindow || lease.window;
    lease.lastSeenAt = Date.now();
    sendDetachedEditorMessage("document-state", getDetachedDocumentSnapshot(documentId, lease), targetWindow);
    return;
  }
  if (!lease || lease.windowId !== windowId) {
    sendDetachedEditorMessage("ownership-denied", { documentId, windowId, message: "Editing ownership is not available." }, targetWindow);
    return;
  }
  lease.lastSeenAt = Date.now();
  if (message.type === "heartbeat") {
    sendDetachedEditorMessage("heartbeat", { documentId, windowId, updatedAt: doc.updatedAt }, targetWindow);
    return;
  }
  if (message.type === "preview-request") {
    const previewRequestId = safeString(payload.previewRequestId);
    const item = payload.item && typeof payload.item === "object" ? payload.item : null;
    const itemId = safeString(item?.id || item?.docId || item?.snapshotId);
    if (!previewRequestId || !item || !itemId || !["document", "version"].includes(item.type || "document")) {
      sendDetachedEditorMessage("preview-response", { documentId, windowId, previewRequestId, preview: { available: false, title: "Unavailable", contentHtml: "<p>Invalid preview request.</p>" } }, targetWindow);
      return;
    }
    const preview = getExperiencePreview({ ...item, source: "detached" });
    sendDetachedEditorMessage("preview-response", { documentId, windowId, previewRequestId, preview }, targetWindow);
    return;
  }
  if (message.type === "save-document") {
    if (payload.baseUpdatedAt && payload.baseUpdatedAt !== doc.updatedAt) {
      sendDetachedEditorMessage("stale", getDetachedDocumentSnapshot(documentId, lease), targetWindow);
      return;
    }
    const before = doc.content;
    if (payload.mode === "source") {
      doc.content = safeString(payload.content);
      doc.contentHtml = markdownToHtml(doc.content);
    } else {
      doc.contentHtml = sanitizeRichHtml(safeString(payload.contentHtml) || "<p></p>");
      doc.content = htmlToMarkdown(doc.contentHtml);
    }
    const title = safeString(payload.title).trim();
    if (title) doc.title = title.slice(0, 300);
    doc.updatedAt = new Date().toISOString();
    refreshDocDerived(doc);
    maybeAutoSnapshot(doc, before);
    lease.viewState = payload.viewState && typeof payload.viewState === "object" ? payload.viewState : lease.viewState;
    persistNow({ flushRich: false });
    if (doc.id === activeId) {
      els.titleInput.value = doc.title;
      els.editor.value = doc.content;
      setRichEditorHtmlPrepared(doc.contentHtml);
      applyDetachedOwnershipUi();
    }
    scheduleReferencePaneRender(0);
    sendDetachedEditorMessage("save-ack", getDetachedDocumentSnapshot(documentId, lease), targetWindow);
    window.dispatchEvent(new CustomEvent("textforge:document-content-change", { detail: { id: doc.id, source: "detached-window" } }));
    return;
  }
  if (message.type === "reattach") {
    sendDetachedEditorMessage("reattach-ack", { documentId, windowId }, targetWindow);
    releaseDetachedLease(documentId, windowId, { reattach: true, viewState: payload.viewState });
    return;
  }
  if (message.type === "release") releaseDetachedLease(documentId, windowId, { viewState: payload.viewState });
}

function initDetachedEditorBridge() {
  if ("BroadcastChannel" in window) {
    detachedEditorChannel = new BroadcastChannel(DETACHED_CHANNEL_NAME);
    detachedEditorChannel.addEventListener("message", (event) => handleDetachedEditorMessage(event.data));
  }
  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin) return;
    handleDetachedEditorMessage(event.data, event.source);
  });
  detachedEditorHeartbeatTimer = setInterval(() => {
    const now = Date.now();
    detachedEditorLeases.forEach((lease, documentId) => {
      if (lease.window?.closed || now - lease.lastSeenAt > 9000) {
        releaseDetachedLease(documentId, lease.windowId);
        return;
      }
      sendDetachedEditorMessage("main-heartbeat", { documentId, windowId: lease.windowId, updatedAt: documents.find((doc) => doc.id === documentId)?.updatedAt || null }, lease.window);
    });
  }, 2000);
}

function openForgeSnapshotPanel() {
  window.ForgeSnapshot?.openForgeSnapshotDialog({
    getDocuments: () => documents.map((doc) => ({ ...doc })),
    getFolders: () => folders.map((folder) => ({ ...folder })),
    getSelectedIds: () => activeId ? [activeId] : [],
    getCurrentFolderId: () => activeDoc()?.folderId || null,
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
  window.dispatchEvent(new CustomEvent("textforge:inspector-change", { detail: { open: inspectorOpen, tab: inspectorTab } }));
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
  els.inspectorToggleBtn?.setAttribute("aria-expanded", String(inspectorOpen));
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

function clampFocusCanvasWidth(value) {
  const viewportLimit = Math.max(FOCUS_WIDTH_MIN, Math.min(FOCUS_WIDTH_MAX, window.innerWidth - 96));
  return Math.round(Math.max(FOCUS_WIDTH_MIN, Math.min(viewportLimit, value || FOCUS_WIDTH_DEFAULT)));
}

function applyFocusCanvasWidth(width = focusCanvasWidth) {
  focusCanvasWidth = clampFocusCanvasWidth(width);
  document.documentElement.style.setProperty("--tf-focus-width", `${focusCanvasWidth}px`);
  document.documentElement.style.setProperty("--tf-focus-half-width", `${Math.round(focusCanvasWidth / 2)}px`);
}

function saveFocusCanvasWidth() {
  localStorage.setItem(FOCUS_WIDTH_KEY, String(focusCanvasWidth));
}

function resetFocusCanvasWidth() {
  applyFocusCanvasWidth(FOCUS_WIDTH_DEFAULT);
  saveFocusCanvasWidth();
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

function initFocusResizeHandles() {
  const handles = [els.focusResizeLeft, els.focusResizeRight].filter(Boolean);
  if (!handles.length) return;
  handles.forEach((handle) => {
    handle.addEventListener("dblclick", resetFocusCanvasWidth);
    handle.addEventListener("pointerdown", (event) => {
      if (!focusMode) return;
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = focusCanvasWidth;
      const side = handle.dataset.side || (handle === els.focusResizeLeft ? "left" : "right");
      handle.setPointerCapture?.(event.pointerId);
      document.documentElement.classList.add("focus-resizing");
      const move = (moveEvent) => {
        const delta = moveEvent.clientX - startX;
        const nextWidth = side === "left" ? startWidth - delta * 2 : startWidth + delta * 2;
        applyFocusCanvasWidth(nextWidth);
      };
      const stop = () => {
        document.documentElement.classList.remove("focus-resizing");
        saveFocusCanvasWidth();
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
        window.removeEventListener("pointercancel", stop);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop);
      window.addEventListener("pointercancel", stop);
    });
  });
  window.addEventListener("resize", () => {
    applyFocusCanvasWidth(focusCanvasWidth);
    saveFocusCanvasWidth();
  });
}

function initPwaInstallHints() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    document.documentElement.dataset.pwaInstallReady = "true";
    window.textforgeInstallPrompt = event;
  });
}

function closeOpenToolbarMenus(except = null) {
  document.querySelectorAll("details.menu-wrap[open]").forEach((menu) => {
    if (menu !== except) menu.removeAttribute("open");
  });
}

function closeFloatingUi(exceptMenu = null) {
  closeOpenToolbarMenus(exceptMenu);
}

function initFloatingUiDismiss() {
  document.addEventListener("pointerdown", (event) => {
    const openMenu = event.target.closest?.("details.menu-wrap");
    closeFloatingUi(openMenu || null);
  });
  document.addEventListener("toggle", (event) => {
    const menu = event.target;
    if (!(menu instanceof HTMLDetailsElement) || !menu.classList.contains("menu-wrap") || !menu.open) return;
    closeOpenToolbarMenus(menu);
  }, true);
}

function getTopOpenModal() {
  return [...document.querySelectorAll(".snapshot-dialog:not(.hidden)")].at(-1) || null;
}

function closeModalOverlay(dialog = getTopOpenModal()) {
  if (!dialog) return false;
  if (dialog.id === "forgeSnapshotDialog") window.ForgeSnapshot?.closeForgeSnapshotDialog?.();
  else if (dialog.id === "diagnosticsDialog") window.TextForgeDiagnostics?.closeDiagnosticsPanel?.();
  else dialog.classList.add("hidden");
  return true;
}

function initModalAccessibility() {
  const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
  const returnFocusByDialog = new WeakMap();
  document.querySelectorAll(".snapshot-dialog").forEach((dialog) => {
    dialog.addEventListener("pointerdown", (event) => {
      if (event.target === dialog) closeModalOverlay(dialog);
    });
    const observer = new MutationObserver(() => {
      if (!dialog.classList.contains("hidden")) {
        if (document.activeElement && !dialog.contains(document.activeElement)) returnFocusByDialog.set(dialog, document.activeElement);
        requestAnimationFrame(() => dialog.querySelector(focusableSelector)?.focus({ preventScroll: true }));
        return;
      }
      const returnTarget = returnFocusByDialog.get(dialog);
      returnFocusByDialog.delete(dialog);
      if (returnTarget?.isConnected) requestAnimationFrame(() => returnTarget.focus({ preventScroll: true }));
    });
    observer.observe(dialog, { attributes: true, attributeFilter: ["class"] });
  });
  document.addEventListener("keydown", (event) => {
    const dialog = getTopOpenModal();
    if (!dialog) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeModalOverlay(dialog);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...dialog.querySelectorAll(focusableSelector)].filter((node) => !node.hidden && node.getClientRects().length > 0);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!dialog.contains(document.activeElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, true);
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
  flushRichDocumentNow("current-html");
  const doc = activeDoc();
  return doc?.contentHtml || markdownToHtml(doc?.content || els.editor.value || "");
}

function currentMarkdown() {
  flushRichDocumentNow("current-markdown");
  const doc = activeDoc();
  return doc?.content || htmlToMarkdown(currentHtml());
}

function currentPlainText() {
  flushRichDocumentNow("current-plain-text");
  return htmlToPlain(currentHtml());
}

function scheduleSanitizedSync(reason = "typing", delay = 1000) {
  clearTimeout(richFullSyncTimer);
  richFullSyncTimer = setTimeout(() => {
    flushRichDocumentNow(reason, { renderPreviewNow: isPreviewPaneVisible(), updateStatsNow: false });
  }, delay);
}

function schedulePreviewUpdate(delay = 500) {
  if (!isPreviewPaneVisible() && splitWorkspace.layout === "single") return;
  clearTimeout(previewUpdateTimer);
  previewUpdateTimer = setTimeout(() => {
    flushRichDocumentNow("preview-update");
    renderPreview();
  }, delay);
}

function scheduleStatsUpdate(delay = 500) {
  clearTimeout(statsUpdateTimer);
  statsUpdateTimer = setTimeout(() => {
    flushRichDocumentNow("stats-update");
    updateStats();
  }, delay);
}

function flushRichDocumentNow(reason = "manual", options = {}) {
  if (!richDocumentDirty) return activeDoc();
  clearTimeout(richFullSyncTimer);
  richFullSyncTimer = null;
  return syncRichToDocumentFull({
    reason,
    renderPreviewNow: options.renderPreviewNow ?? false,
    updateStatsNow: options.updateStatsNow ?? false,
  });
}

function captureReferenceViewState() {
  const pane = getPane("reference");
  if (!pane) return null;
  savePaneScroll("reference");
  if (pane.mode === "source") {
    pane.selection = { kind: "source", start: els.referenceSourceEditor?.selectionStart || 0, end: els.referenceSourceEditor?.selectionEnd || 0 };
  } else if (pane.mode === "rich" && !referenceCompositionActive) {
    pane.selection = captureSelectionForRoot(els.referencePaneBody);
  }
  return { mode: pane.mode, scrollTop: pane.scrollTop || 0, selection: pane.selection || null };
}

function scheduleReferenceDocumentSync(reason = "reference-input", delay = 900) {
  clearTimeout(referenceFullSyncTimer);
  referenceFullSyncTimer = setTimeout(() => flushReferenceDocumentNow(reason), delay);
}

function syncReferenceDocumentFast(mode = getPane("reference")?.mode) {
  const pane = getPane("reference");
  const doc = documents.find((item) => item.id === pane?.documentId && !item.deletedAt);
  if (!pane || !doc || pane.readonly || doc.id === activeId || isDocumentDetached(doc.id)) return null;
  if (mode === "source") doc.content = els.referenceSourceEditor.value;
  else doc.contentHtml = els.referencePaneBody.innerHTML;
  doc.updatedAt = new Date().toISOString();
  referenceDocumentDirty = true;
  referenceDirtyDocumentId = doc.id;
  els.saveState.textContent = "Saving...";
  captureReferenceViewState();
  scheduleReferenceDocumentSync("reference-input", 900);
  persistSoon({ delay: 1400, flushRich: false });
  return doc;
}

function flushReferenceDocumentNow(reason = "manual") {
  if (!referenceDocumentDirty) return documents.find((item) => item.id === referenceDirtyDocumentId) || null;
  clearTimeout(referenceFullSyncTimer);
  referenceFullSyncTimer = null;
  const pane = getPane("reference");
  const doc = documents.find((item) => item.id === referenceDirtyDocumentId && item.id === pane?.documentId && !item.deletedAt);
  if (!doc || pane.readonly || doc.id === activeId || isDocumentDetached(doc.id)) {
    referenceDocumentDirty = false;
    referenceDirtyDocumentId = null;
    return doc || null;
  }
  const before = doc.content;
  if (pane.mode === "source") {
    doc.content = els.referenceSourceEditor.value;
    doc.contentHtml = markdownToHtml(doc.content);
  } else {
    doc.contentHtml = sanitizeRichHtml(els.referencePaneBody.innerHTML);
    doc.content = htmlToMarkdown(doc.contentHtml);
  }
  doc.updatedAt = new Date().toISOString();
  refreshDocDerived(doc);
  maybeAutoSnapshot(doc, before);
  referenceDocumentDirty = false;
  referenceDirtyDocumentId = null;
  captureReferenceViewState();
  persistSoon({ delay: reason === "beforeunload" ? 0 : 250, flushRich: false });
  window.dispatchEvent(new CustomEvent("textforge:document-content-change", { detail: { id: doc.id, source: "reference-pane" } }));
  return doc;
}

function syncRichToDocumentFast(event = null) {
  markTypingTrace("syncRichToDocumentFast:start");
  const guard = beginLockedReferenceGuard("rich-input-fast", 900);
  markTypingTrace("before read innerHTML");
  const html = els.richEditor.innerHTML;
  markTypingTrace("after read innerHTML", { htmlLength: html.length });
  const doc = activeDoc();
  if (!doc) {
    restoreLockedReferenceGuard(guard);
    return null;
  }
  const beforeDocHtml = doc.contentHtml || "";
  doc.contentHtml = html;
  doc.updatedAt = new Date().toISOString();
  richDocumentDirty = true;
  els.saveState.textContent = "저장 중...";
  if (isFormatDebugActive()) {
    formatDebugLog("syncRichToDocumentFast", {
      inputType: event?.inputType || null,
      beforeDocHTML: summarizeHtmlForFormatDebug(beforeDocHtml),
      afterDocHTML: summarizeHtmlForFormatDebug(html),
      docHTMLChanged: beforeDocHtml !== html,
    });
  }
  scheduleSanitizedSync(compositionActive || event?.isComposing ? "composition-idle" : "typing-idle", compositionActive || event?.isComposing ? 1400 : 1000);
  schedulePreviewUpdate(splitWorkspace.layout !== "single" ? 600 : 400);
  scheduleStatsUpdate(450);
  persistSoon({ delay: 1400, flushRich: true });
  markTypingTrace("syncRichToDocumentFast:end");
  restoreLockedReferenceGuard(guard);
  return doc;
}

function syncRichToDocumentFull(options = {}) {
  markTypingTrace("syncRichToDocument:start");
  const guard = beginLockedReferenceGuard("rich-input", 900);
  markTypingTrace("before read innerHTML");
  const beforeEditorHtml = els.richEditor.innerHTML;
  markTypingTrace("after read innerHTML", { htmlLength: beforeEditorHtml.length });
  const beforeDocHtml = activeDoc()?.contentHtml || "";
  markTypingTrace("before sanitizeRichHtml");
  const html = sanitizeRichHtml(els.richEditor.innerHTML);
  markTypingTrace("after sanitizeRichHtml", { htmlLength: html.length });
  markTypingTrace("before updateActive");
  updateActive((doc) => {
    doc.contentHtml = html;
    markTypingTrace("before htmlToMarkdown");
    doc.content = htmlToMarkdown(html);
    markTypingTrace("after htmlToMarkdown", { markdownLength: doc.content.length });
  });
  richDocumentDirty = false;
  markTypingTrace("after updateActive");
  formatDebugLog("syncRichToDocument", {
    beforeEditorHTML: summarizeHtmlForFormatDebug(beforeEditorHtml),
    beforeDocHTML: summarizeHtmlForFormatDebug(beforeDocHtml),
    afterDocHTML: summarizeHtmlForFormatDebug(activeDoc()?.contentHtml || ""),
    docHTMLChanged: beforeDocHtml !== activeDoc()?.contentHtml,
  });
  els.editor.value = activeDoc().content;
  if (options.renderPreviewNow !== false) {
    markTypingTrace("before renderPreview");
    renderPreview();
    markTypingTrace("after renderPreview");
  }
  if (options.updateStatsNow !== false) {
    markTypingTrace("before updateStats");
    updateStats();
    markTypingTrace("after updateStats");
  }
  markTypingTrace("syncRichToDocument:end");
  restoreLockedReferenceGuard(guard);
  return activeDoc();
}

function syncRichToDocument() {
  return syncRichToDocumentFull({ renderPreviewNow: true, updateStatsNow: true });
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
  markTypingTrace("sanitizeRichHtml:start", { htmlLength: safeString(html).length });
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
  markTypingTrace("sanitizeRichHtml:end", {
    htmlLength: result.length,
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

function createSafetySnapshot(reason = "before-bulk-edit") {
  const doc = activeDoc();
  if (!doc) return null;
  const label = `Safety: ${reason}`;
  const last = doc.history?.[0];
  const htmlLength = (doc.contentHtml || "").length;
  if (last?.label === label && last?.contentHtml === doc.contentHtml) return last;
  addSnapshot(doc, label);
  setSessionText(`Safety snapshot created: ${reason} (${htmlLength.toLocaleString("ko-KR")} HTML chars)`);
  return doc.history[0];
}

function createWholeDocumentSafetySnapshot(reason, range = getEditorRangeFromSelection()) {
  if (!range || !isWholeEditorSelection(range)) return null;
  return createSafetySnapshot(reason);
}

function captureActiveDocumentState(reason = "bulk-edit") {
  const doc = activeDoc();
  if (!doc) return null;
  return {
    reason,
    docId: doc.id,
    title: doc.title,
    content: doc.content,
    contentHtml: doc.contentHtml,
    updatedAt: doc.updatedAt,
  };
}

function pushBulkOperationUndoState(reason, beforeState) {
  const doc = activeDoc();
  if (!doc || !beforeState || beforeState.docId !== doc.id) return;
  if (beforeState.contentHtml === doc.contentHtml && beforeState.content === doc.content) return;
  bulkUndoStack.push({
    reason,
    before: beforeState,
    after: captureActiveDocumentState(reason),
  });
  bulkUndoStack = bulkUndoStack.slice(-20);
  bulkRedoStack = [];
  bulkUndoPending = true;
}

function applyDocumentStateSnapshot(state) {
  if (!state) return false;
  const doc = documents.find((item) => item.id === state.docId);
  if (!doc) return false;
  doc.title = state.title;
  doc.content = state.content;
  doc.contentHtml = state.contentHtml;
  doc.updatedAt = new Date().toISOString();
  refreshDocDerived(doc);
  activeId = doc.id;
  persistNow({ flushRich: false });
  renderActive();
  renderDocList();
  return true;
}

function restoreLastBulkOperation() {
  const entry = bulkUndoStack.pop();
  if (!entry) return false;
  if (!applyDocumentStateSnapshot(entry.before)) return false;
  bulkRedoStack.push(entry);
  bulkUndoPending = false;
  setSessionText(`Restored bulk operation: ${entry.reason}`);
  return true;
}

function redoLastBulkOperation() {
  const entry = bulkRedoStack.pop();
  if (!entry) return false;
  if (!applyDocumentStateSnapshot(entry.after)) return false;
  bulkUndoStack.push(entry);
  bulkUndoPending = true;
  setSessionText(`Redid bulk operation: ${entry.reason}`);
  return true;
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
    item.dataset.snapshotId = snapshot.id;
    item.dataset.docId = doc.id;
    item.innerHTML = `${escapeHtml(snapshot.label)}<span>${formatHistoryTime(snapshot.createdAt)} · ${(snapshot.content || "").length.toLocaleString("ko-KR")}자</span>`;
    item.addEventListener("click", () => restoreSnapshot(snapshot.id));
    els.historyList.append(item);
  });
}
function restoreSnapshot(snapshotId) {
  const doc = activeDoc();
  const snapshot = doc?.history.find((item) => item.id === snapshotId);
  if (!doc || !snapshot) return;

  const before = captureActiveDocumentState("restore-version");
  addSnapshot(doc, "복구 직전");
  doc.title = snapshot.title;
  doc.content = snapshot.content;
  doc.contentHtml = snapshot.contentHtml || markdownToHtml(snapshot.content || "");
  doc.updatedAt = new Date().toISOString();
  refreshDocDerived(doc);
  persistNow();
  renderActive();
  pushBulkOperationUndoState("restore-version", before);
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

  const backlinkItems = backlinks.length
    ? backlinks.map((item, index) => `<button class="backlink-item" type="button" data-backlink-doc-id="${escapeAttr(item.id)}" data-backlink-index="${index}" aria-label="${escapeAttr(item.title || "Untitled")} 백링크 출처">${escapeHtml(item.title || "Untitled")}${item.deletedAt ? " · 삭제됨" : ""}</button>`).join("")
    : '<span class="empty-note">없음</span>';
  els.systemList.innerHTML = `
    <button class="system-item" type="button" data-system-action="links">문서 링크<span>${links.length ? links.map(escapeHtml).join(", ") : "없음"}</span></button>
    <div class="system-item backlink-group"><strong>백링크</strong><div class="backlink-list" role="list" aria-label="백링크 출처 문서">${backlinkItems}</div></div>
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
  const backlinkItems = backlinks.length
    ? backlinks.map((item, index) => `<button class="backlink-item" type="button" data-backlink-doc-id="${escapeAttr(item.id)}" data-backlink-index="${index}" aria-label="${escapeAttr(item.title || "Untitled")} 백링크 출처">${escapeHtml(item.title || "Untitled")}${item.deletedAt ? " · 삭제됨" : ""}</button>`).join("")
    : '<span class="empty-note">없음</span>';
  els.docInfoList.innerHTML = `
    <div class="system-item">글자 수<span>${plain.length.toLocaleString("ko-KR")}자</span></div>
    <div class="system-item">생성일<span>${formatHistoryTime(doc.createdAt)}</span></div>
    <div class="system-item">수정일<span>${formatHistoryTime(doc.updatedAt)}</span></div>
    <div class="system-item">태그<span>${doc.tags?.length ? doc.tags.map(escapeHtml).join(", ") : "없음"}</span></div>
    <div class="system-item">문서 링크<span>${links.length ? links.map(escapeHtml).join(", ") : "없음"}</span></div>
    <div class="system-item backlink-group"><strong>백링크</strong><div class="backlink-list" role="list" aria-label="백링크 출처 문서">${backlinkItems}</div></div>
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

function updateStats(options = {}) {
  const doc = activeDoc();
  const value = options.fast
    ? els.richEditor.textContent || doc?.plainText || ""
    : doc?.plainText || currentPlainText();
  const chars = value.length.toLocaleString("ko-KR");
  const lines = value.split("\n").length.toLocaleString("ko-KR");
  const longest = longestLine(value);
  const longLineText = longest > LONG_LINE_LIMIT ? ` / long line ${longest.toLocaleString("ko-KR")}` : "";
  els.statsText.textContent = `${lines} lines / ${chars} chars${longLineText}`;
  els.guardBanner.classList.add("hidden");
}
function setMode(mode) {
  savePaneScroll("main");
  savePaneScroll("reference");
  if (!els.editorGrid.classList.contains("source-mode")) {
    els.editor.value = currentMarkdown();
  }
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
    btn.setAttribute("aria-selected", String(btn.dataset.mode === mode));
  });
  els.editorGrid.className = `editor-grid ${mode}-mode`;
  els.editorPaneLabel.textContent = mode === "source" ? "Markdown 원문" : "리치 문서";
  if (mode !== "source") renderPreview();
  renderSplitWorkspace({ preserveScroll: true });
  if (!compositionActive) scheduleSessionRecoverySave();
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
  const sourceDoc = activeDoc();
  if (!sourceDoc) return;
  const confirmed = confirm("AI 출력 정리는 현재 문서 전체를 plain text 기준으로 정리합니다. 원본은 유지하고 정리 결과를 새 문서로 만듭니다. 계속할까요?");
  if (!confirmed) return;
  createSafetySnapshot("before-ai-cleanup");
  const cleaned = cleanText(currentPlainText());
  const now = new Date();
  const cleanedDoc = createDocument(cleaned);
  cleanedDoc.title = `${sourceDoc.title || "Untitled"} - cleaned`;
  cleanedDoc.tags = [...new Set([...(sourceDoc.tags || []), "cleaned"])];
  cleanedDoc.folderId = sourceDoc.folderId || null;
  cleanedDoc.color = sourceDoc.color;
  cleanedDoc.createdAt = now.toISOString();
  cleanedDoc.updatedAt = now.toISOString();
  refreshDocDerived(cleanedDoc);
  documents.unshift(cleanedDoc);
  openDocumentInPane(cleanedDoc.id, "main", { source: "ai-cleanup" });
  persistNow();
  setSessionText("AI cleanup created a new document; original kept unchanged.");
}

const EXPORT_CAPABILITIES = Object.freeze({
  txt: { label: "TXT", extension: "txt", mime: "text/plain;charset=utf-8", limitation: "Plain text only." },
  md: { label: "Markdown", extension: "md", mime: "text/markdown;charset=utf-8", limitation: "Rich styling is represented as Markdown." },
  html: { label: "HTML", extension: "html", mime: "text/html;charset=utf-8", limitation: "A self-contained document without external assets." },
  doc: { label: "DOC", extension: "doc", mime: "application/msword", limitation: "HTML-based DOC for compatible word processors." },
  pdf: { label: "PDF", extension: "pdf", mime: "application/pdf", limitation: "Uses the browser print dialog; choose Save as PDF." },
  epub: { label: "EPUB", extension: "epub", mime: "application/epub+zip", limitation: "Uncompressed EPUB 3 package." },
  card: { label: "PNG Card", extension: "png", mime: "image/png", limitation: "A 1200 x 675 summary card." },
});

function getExportCapabilities() {
  return Object.entries(EXPORT_CAPABILITIES).map(([format, value]) => ({ format, ...value, available: true, canPreview: true, canSave: true, canCopy: true }));
}

function normalizeExportOptions(value = {}) {
  return { includeTitle: value.includeTitle !== false, includeMetadata: value.includeMetadata === true };
}

function exportMetadataHtml(doc) {
  return `<dl class="textforge-export-meta"><dt>Created</dt><dd>${escapeHtml(new Date(doc.createdAt).toLocaleString())}</dd><dt>Updated</dt><dd>${escapeHtml(new Date(doc.updatedAt).toLocaleString())}</dd><dt>Characters</dt><dd>${Number(doc.charCount || 0).toLocaleString()}</dd></dl>`;
}

function exportMetadataText(doc) {
  return `Created: ${new Date(doc.createdAt).toLocaleString()}\nUpdated: ${new Date(doc.updatedAt).toLocaleString()}\nCharacters: ${Number(doc.charCount || 0).toLocaleString()}`;
}

function buildExportArtifact(request = {}) {
  const format = EXPORT_CAPABILITIES[request.format] ? request.format : "md";
  const doc = documents.find((item) => item.id === (request.documentId || activeId) && !item.deletedAt);
  if (!doc) return { ok: false, reason: "The export document is unavailable." };
  const options = normalizeExportOptions(request.options);
  const cleanHtml = sanitizeRichHtml(doc.contentHtml || markdownToHtml(doc.content || ""));
  const plainBody = htmlToPlain(cleanHtml);
  const markdownBody = htmlToMarkdown(cleanHtml);
  const titleHtml = options.includeTitle ? `<h1>${escapeHtml(doc.title || "Untitled")}</h1>` : "";
  const metadataHtml = options.includeMetadata ? exportMetadataHtml(doc) : "";
  const richBody = `${titleHtml}${metadataHtml}${cleanHtml}`;
  const textPrefix = [options.includeTitle ? doc.title || "Untitled" : "", options.includeMetadata ? exportMetadataText(doc) : ""].filter(Boolean).join("\n\n");
  const textContent = [textPrefix, plainBody].filter(Boolean).join("\n\n") || "\n";
  const markdownPrefix = [options.includeTitle ? `# ${doc.title || "Untitled"}` : "", options.includeMetadata ? exportMetadataText(doc).split("\n").map((line) => `> ${line}`).join("\n") : ""].filter(Boolean).join("\n\n");
  const markdownContent = [markdownPrefix, markdownBody].filter(Boolean).join("\n\n") || "\n";
  const baseInput = String(request.fileName || doc.title || "textforge-note").replace(/\.[a-z0-9]{1,8}$/i, "");
  const base = sanitizeFileName(baseInput.trim() || "textforge-note");
  const capability = EXPORT_CAPABILITIES[format];
  const commonStyle = "body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.7;padding:40px;max-width:820px;margin:auto}pre{white-space:pre-wrap;background:#f0f3f6;padding:12px}.textforge-export-meta{display:grid;grid-template-columns:max-content 1fr;gap:4px 12px;color:#586675;font-size:13px}.textforge-export-meta dd{margin:0}";
  const htmlDocument = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${escapeHtml(doc.title || "Untitled")}</title><style>${commonStyle}</style></head><body>${richBody}</body></html>`;
  const docDocument = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${escapeHtml(doc.title || "Untitled")}</title><style>${commonStyle}</style></head><body>${richBody}</body></html>`;
  const epubContent = `<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml" lang="ko"><head><title>${escapeHtml(doc.title || "Untitled")}</title><style>${commonStyle}</style></head><body>${richBody}</body></html>`;
  const contentByFormat = { txt: textContent, md: markdownContent, html: htmlDocument, doc: docDocument, pdf: htmlDocument, epub: epubContent };
  const previewHtml = format === "txt" || format === "md"
    ? `<pre>${escapeHtml(contentByFormat[format])}</pre>`
    : format === "card"
      ? `<section class="tf-export-card-preview">${titleHtml}<p>${escapeHtml(plainBody.slice(0, 900))}</p>${options.includeMetadata ? `<small>${Number(doc.charCount || 0).toLocaleString()} characters</small>` : ""}</section>`
      : richBody;
  const artifact = {
    ok: true, format, documentId: doc.id, revision: doc.updatedAt, title: doc.title || "Untitled", fileName: `${base}.${capability.extension}`,
    mime: capability.mime, limitation: capability.limitation, options, previewHtml: sanitizeRichHtml(previewHtml), copyText: format === "md" ? markdownContent : textContent,
    content: contentByFormat[format] || "", card: format === "card", sourceHash: `${doc.id}:${doc.updatedAt}:${doc.contentHtml.length}`,
  };
  if (format === "epub") artifact.files = [
    { name: "mimetype", content: "application/epub+zip" },
    { name: "META-INF/container.xml", content: `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>` },
    { name: "OEBPS/package.opf", content: `<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="bookid">textforge-${escapeHtml(doc.id)}</dc:identifier><dc:title>${escapeHtml(doc.title || "Untitled")}</dc:title><dc:language>ko</dc:language></metadata><manifest><item id="content" href="content.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="content"/></spine></package>` },
    { name: "OEBPS/content.xhtml", content: epubContent },
  ];
  return artifact;
}

function getExportPreview(request = {}) {
  return buildExportArtifact(request);
}

async function copyExportDocument(request = {}) {
  const artifact = buildExportArtifact(request);
  if (!artifact.ok) return artifact;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(artifact.copyText);
    else fallbackCopy(artifact.copyText);
    return { ok: true, message: `${artifact.fileName} content copied.`, artifact };
  } catch {
    try { fallbackCopy(artifact.copyText); return { ok: true, message: `${artifact.fileName} content copied.`, artifact }; }
    catch { return { ok: false, reason: "Clipboard access is unavailable.", artifact }; }
  }
}

function downloadExportBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportDocument(request = {}) {
  flushRichDocumentNow("before-export");
  flushReferenceDocumentNow("before-export");
  const artifact = buildExportArtifact(request);
  if (!artifact.ok) return artifact;
  try {
    if (artifact.format === "pdf") {
      const win = window.open("", "_blank");
      if (!win) return { ok: false, reason: "Popups are blocked. Allow one popup, then choose Save as PDF.", artifact };
      win.document.write(artifact.content); win.document.close(); win.focus(); win.print();
      return { ok: true, message: "Print dialog opened. Choose Save as PDF.", artifact };
    }
    if (artifact.format === "card") {
      downloadExportCard(artifact);
      return { ok: true, message: `${artifact.fileName} saved.`, artifact };
    }
    const content = artifact.format === "epub" ? makeZip(artifact.files) : artifact.content;
    if (!content || (typeof content === "string" && !content.length)) return { ok: false, reason: "The generated export was empty.", artifact };
    downloadExportBlob(new Blob([content], { type: artifact.mime }), artifact.fileName);
    return { ok: true, message: `${artifact.fileName} saved.`, artifact };
  } catch (error) {
    return { ok: false, reason: error?.message || "Export failed. The source document was not changed.", artifact };
  }
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
      20, 0, 0, 0, 0, crc, data.length, data.length, name.length, 0,
    ]);
    chunks.push(local, name, data);
    central.push({
      offset,
      name,
      data,
      crc,
      header: zipHeader(0x02014b50, [
        20, 20, 0, 0, 0, 0, crc, data.length, data.length, name.length, 0, 0, 0, 0, 0, offset,
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
  flushRichDocumentNow("before-session-recover");
  try {
    const snapshot = readSessionRecoverySnapshot();
    if (!snapshot || typeof snapshot !== "object") return;
    if (snapshot.id && !snapshot.content && !snapshot.contentHtml) {
      activeId = documents.some((doc) => doc.id === snapshot.id && !doc.deletedAt) ? snapshot.id : null;
      resolveStartupActiveDocument(snapshot);
      persistNow();
      renderActive();
      restoreSessionViewport(snapshot);
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
  applyWordWrapPreference();
  renderSystemPanel();
}

function createAndFocusDocument() {
  flushRichDocumentNow("before-new-document");
  const doc = createDocument("");
  documents.unshift(doc);
  activeId = doc.id;
  persistNow();
  renderActive();
  focusWithoutScroll(els.editor);
}

function loadUniversalCommandState() {
  try {
    const value = JSON.parse(localStorage.getItem(UNIVERSAL_COMMAND_KEY) || "{}");
    return {
      version: 1,
      recentDocuments: safeArray(value.recentDocuments).filter((id) => typeof id === "string").slice(0, 12),
      recentCommands: safeArray(value.recentCommands).filter((id) => typeof id === "string").slice(0, 12),
    };
  } catch {
    return { version: 1, recentDocuments: [], recentCommands: [] };
  }
}

function recordUniversalRecent(kind, id) {
  if (!id) return;
  const state = loadUniversalCommandState();
  const key = kind === "document" ? "recentDocuments" : "recentCommands";
  state[key] = [id, ...state[key].filter((item) => item !== id)].slice(0, 12);
  safeLocalSet(UNIVERSAL_COMMAND_KEY, JSON.stringify(state));
}

function commandCategory(item) {
  if (item.category) return item.category;
  if (/theme|focus|ui-mode|log-mode/.test(item.id)) return "settings";
  if (/view-|split-|inspector/.test(item.id)) return "view";
  if (/copy-|export-|snapshot|history|recover/.test(item.id)) return "document-command";
  return "command";
}

function universalCommandItems(query = "") {
  const recent = loadUniversalCommandState();
  const recentDocRank = new Map(recent.recentDocuments.map((id, index) => [id, 30 - index]));
  const recentCommandRank = new Map(recent.recentCommands.map((id, index) => [id, 24 - index]));
  const commandItems = COMMANDS.map((item) => ({
    ...item,
    type: "command",
    category: commandCategory(item),
    aliases: `${safeArray(item.aliases).join(" ")} ${item.hint || ""}`,
    searchText: `${item.title} ${item.hint || ""} ${safeArray(item.aliases).join(" ")}`,
    recentScore: recentCommandRank.get(item.id) || 0,
    disabled: item.labOnly && uiMode !== "lab" || (typeof item.enabled === "function" && !item.enabled()),
  }));
  const documentItems = documents.filter((doc) => !doc.deletedAt).map((doc) => ({
    id: `doc-${doc.id}`,
    targetId: doc.id,
    type: "document",
    category: doc.favorite ? "favorite" : "document",
    title: doc.title || "제목 없음",
    hint: `${doc.favorite ? "즐겨찾기 · " : ""}${doc.tags.map((tag) => `#${tag}`).join(" ") || "태그 없음"}`,
    aliases: doc.tags.join(" "),
    searchText: doc.searchText || doc._searchText || `${doc.title} ${doc.tags.join(" ")} ${doc.previewText || ""}`,
    recentScore: recentDocRank.get(doc.id) || Math.max(0, 6 - Math.floor((Date.now() - new Date(doc.updatedAt || 0).getTime()) / 86400000)),
    run: () => openDocumentInPane(doc.id, "main", { source: "universal-command" }),
  }));
  const folderItems = folders.map((folder) => ({
    id: `folder-${folder.id}`,
    targetId: folder.id,
    type: "folder",
    category: "folder",
    title: folder.name,
    hint: `폴더 · ${documents.filter((doc) => !doc.deletedAt && doc.folderId === folder.id).length}개 문서`,
    aliases: "폴더 library",
    searchText: `${folder.name} 폴더`,
    recentScore: 0,
    run: () => openPortalLibrary({ folderId: folder.id }),
  }));
  const items = [...documentItems, ...folderItems, ...commandItems].filter((item) => !item.disabled);
  const core = window.TextForgeUniversalCommandCore;
  const group = (results) => {
    const order = ["favorite", "document", "folder", "view", "settings", "document-command", "command"];
    return results.map((item, index) => ({ item, index })).sort((a, b) => order.indexOf(a.item.category) - order.indexOf(b.item.category) || a.index - b.index).map((entry) => entry.item);
  };
  if (query) return group(core?.search ? core.search(items, query, 48) : items.filter((item) => `${item.title} ${item.searchText}`.toLowerCase().includes(query.toLowerCase())).slice(0, 48));
  const recentItems = items.filter((item) => item.recentScore > 0).sort((a, b) => b.recentScore - a.recentScore);
  return group([...recentItems, ...items.filter((item) => !recentItems.includes(item))].slice(0, 32));
}

const UNIVERSAL_CATEGORY_LABELS = {
  favorite: "즐겨찾기 문서", document: "문서", folder: "폴더", view: "보기", settings: "설정", "document-command": "문서 작업", command: "명령",
};

async function executeUniversalCommand(item) {
  if (!item || item.disabled) return;
  if (item.type === "document") recordUniversalRecent("document", item.targetId);
  else recordUniversalRecent("command", item.id);
  closeCommandPalette({ restoreFocus: false });
  await item.run();
  if (item.type === "document" && currentEditorMode() !== "clean") requestAnimationFrame(() => focusWithoutScroll(currentEditorMode() === "source" ? els.editor : els.richEditor));
}

function openCommandPalette() {
  universalCommandReturnFocus = document.activeElement;
  if (els.richEditor.contains(document.activeElement)) saveEditorSelection();
  els.commandOverlay.classList.remove("hidden");
  els.commandBtn?.setAttribute("aria-expanded", "true");
  els.commandInput.value = "";
  universalCommandIndex = 0;
  renderCommands();
  focusWithoutScroll(els.commandInput);
}

function closeCommandPalette(options = {}) {
  els.commandOverlay.classList.add("hidden");
  els.commandBtn?.setAttribute("aria-expanded", "false");
  els.commandInput.removeAttribute("aria-activedescendant");
  if (options.restoreFocus !== false && universalCommandReturnFocus?.isConnected) focusWithoutScroll(universalCommandReturnFocus);
}

function renderCommands() {
  const query = els.commandInput.value.trim();
  universalCommandResults = universalCommandItems(query);
  universalCommandIndex = Math.min(Math.max(0, universalCommandIndex), Math.max(0, universalCommandResults.length - 1));
  els.commandList.innerHTML = "";
  if (!universalCommandResults.length) {
    els.commandList.innerHTML = '<p class="command-empty">일치하는 문서, 폴더 또는 명령이 없습니다.</p>';
    els.commandInput.removeAttribute("aria-activedescendant");
    return;
  }
  let lastCategory = null;
  universalCommandResults.forEach((item, index) => {
    if (item.category !== lastCategory) {
      const label = document.createElement("div");
      label.className = "command-group-label";
      label.textContent = UNIVERSAL_CATEGORY_LABELS[item.category] || "명령";
      label.setAttribute("role", "presentation");
      els.commandList.append(label);
      lastCategory = item.category;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.id = `universal-command-${index}`;
    button.className = `command-item${index === universalCommandIndex ? " selected" : ""}`;
    button.dataset.itemType = item.type || "command";
    if (item.targetId) button.dataset.targetId = item.targetId;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(index === universalCommandIndex));
    button.innerHTML = `<span class="command-item-main"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(UNIVERSAL_CATEGORY_LABELS[item.category] || "명령")}</small></span><span>${escapeHtml(item.hint || "")}</span>`;
    button.addEventListener("pointermove", () => { universalCommandIndex = index; updateUniversalCommandSelection(); });
    button.addEventListener("click", () => executeUniversalCommand(item));
    els.commandList.append(button);
  });
  updateUniversalCommandSelection(false);
}

function updateUniversalCommandSelection(scroll = true) {
  const buttons = [...els.commandList.querySelectorAll(".command-item")];
  buttons.forEach((button, index) => {
    const selected = index === universalCommandIndex;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-selected", String(selected));
  });
  const active = buttons[universalCommandIndex];
  if (active) {
    els.commandInput.setAttribute("aria-activedescendant", active.id);
    if (scroll) active.scrollIntoView({ block: "nearest" });
  }
}

function moveUniversalCommandSelection(direction) {
  if (!universalCommandResults.length) return;
  universalCommandIndex = (universalCommandIndex + direction + universalCommandResults.length) % universalCommandResults.length;
  updateUniversalCommandSelection();
}

function moveUniversalCommandGroup(direction) {
  if (!universalCommandResults.length) return;
  const currentCategory = universalCommandResults[universalCommandIndex]?.category;
  for (let offset = 1; offset <= universalCommandResults.length; offset += 1) {
    const index = (universalCommandIndex + direction * offset + universalCommandResults.length) % universalCommandResults.length;
    if (universalCommandResults[index].category !== currentCategory) { universalCommandIndex = index; updateUniversalCommandSelection(); return; }
  }
}

function downloadExportCard(artifact) {
  const doc = documents.find((item) => item.id === artifact.documentId && !item.deletedAt);
  if (!doc) throw new Error("The card source is unavailable.");
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
  if (artifact.options.includeTitle) {
    ctx.fillStyle = "#17212b";
    ctx.font = "800 48px Segoe UI, sans-serif";
    wrapCanvasText(ctx, doc.title, 92, 176, CARD_WIDTH - 184, 58, 2);
  }
  ctx.fillStyle = "#485867";
  ctx.font = "30px Segoe UI, sans-serif";
  wrapCanvasText(ctx, htmlToPlain(doc.contentHtml), 92, artifact.options.includeTitle ? 300 : 190, CARD_WIDTH - 184, 44, artifact.options.includeTitle ? 6 : 8);
  if (artifact.options.includeMetadata) {
    ctx.fillStyle = "#607080";
    ctx.font = "22px Segoe UI, sans-serif";
    ctx.fillText(`${Number(doc.charCount || 0).toLocaleString("ko-KR")} chars`, 92, CARD_HEIGHT - 88);
  }
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = artifact.fileName;
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

function applyWordWrapPreference() {
  document.documentElement.classList.toggle("wrap-off", !wordWrapEnabled);
  document.documentElement.classList.toggle("wrap-on", wordWrapEnabled);
  els.editor.classList.toggle("no-wrap", !wordWrapEnabled);
  els.richEditor.classList.toggle("no-wrap", !wordWrapEnabled);
  if (els.breakLineBtn) els.breakLineBtn.textContent = wordWrapEnabled ? "화면 줄바꿈 끄기" : "화면 줄바꿈 켜기";
}

function toggleWordWrapDisplayOnly() {
  wordWrapEnabled = !wordWrapEnabled;
  localStorage.setItem(WORD_WRAP_KEY, wordWrapEnabled ? "true" : "false");
  applyWordWrapPreference();
  setSessionText(wordWrapEnabled ? "Word wrap on" : "Word wrap off");
}

function applyFormat(command, value = null) {
  const initialRange = getEditorRangeFromSelection();
  createWholeDocumentSafetySnapshot(`before-format-${command}`, initialRange);
  const bulkBefore = isWholeEditorSelection(initialRange) ? captureActiveDocumentState(`before-format-${command}`) : null;
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
  pushBulkOperationUndoState(`format-${command}`, bulkBefore);
}

function applyBlockStyle(tag) {
  const initialRange = getEditorRangeFromSelection();
  createWholeDocumentSafetySnapshot(`before-block-${tag}`, initialRange);
  const bulkBefore = isWholeEditorSelection(initialRange) ? captureActiveDocumentState(`before-block-${tag}`) : null;
  restoreEditorSelection();
  focusWithoutScroll(els.richEditor);
  document.execCommand("formatBlock", false, tag);
  saveEditorSelection();
  syncRichToDocument();
  pushBulkOperationUndoState(`block-${tag}`, bulkBefore);
}

function selectionElementFromRange(range = getEditorRangeFromSelection()) {
  if (!range) return null;
  const node = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentElement;
  if (!node) return null;
  if (!range.collapsed && range.startContainer === range.endContainer && range.endOffset === range.startOffset + 1) {
    const selected = range.startContainer.childNodes?.[range.startOffset];
    if (selected?.nodeType === Node.ELEMENT_NODE) return selected;
  }
  return node;
}

function closestEditorElement(element, selector) {
  const match = element?.closest?.(selector) || null;
  return match && els.richEditor.contains(match) ? match : null;
}

function contextualCommandState(command) {
  try {
    if (document.queryCommandIndeterm?.(command)) return "mixed";
    return Boolean(document.queryCommandState(command));
  } catch {
    return false;
  }
}

function getContextualInspectorState() {
  const range = getEditorRangeFromSelection() || savedEditorSelection;
  if (!range || !els.richEditor.contains(range.commonAncestorContainer)) return { kind: "none", editable: false };
  const element = selectionElementFromRange(range);
  const image = element?.matches?.("img") ? element : closestEditorElement(element, "img");
  const cell = closestEditorElement(element, "td, th");
  const table = cell?.closest("table") || closestEditorElement(element, "table");
  const link = closestEditorElement(element, "a[href]");
  const block = closestEditorElement(element, "p, h1, h2, h3, blockquote, li, pre, div") || els.richEditor;
  const style = getComputedStyle(element || block);
  const base = {
    editable: true,
    collapsed: range.collapsed,
    block: block === els.richEditor ? "p" : block.tagName.toLowerCase(),
    fontFamily: style.fontFamily || "",
    fontSize: style.fontSize || "",
    textAlign: getComputedStyle(block).textAlign || "left",
    bold: contextualCommandState("bold"),
    italic: contextualCommandState("italic"),
    underline: contextualCommandState("underline"),
    strikeThrough: contextualCommandState("strikeThrough"),
    foreColor: style.color || "",
    backColor: style.backgroundColor || "",
  };
  if (image) return { ...base, kind: "image", width: image.style.width || image.getAttribute("width") || "auto", alt: image.getAttribute("alt") || "", align: image.closest("p, div, figure")?.style.textAlign || "left" };
  if (table) return { ...base, kind: "table", rowIndex: cell?.parentElement?.rowIndex ?? 0, columnIndex: cell?.cellIndex ?? 0 };
  if (link) return { ...base, kind: "link", href: link.getAttribute("href") || "", text: link.textContent || "" };
  return { ...base, kind: range.collapsed ? "caret" : "text" };
}

function selectElementContents(element, collapse = false) {
  if (!element) return;
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(collapse);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  savedEditorSelection = range.cloneRange();
}

function finalizeContextualStructure(target, reason) {
  if (target?.isConnected) selectElementContents(target, true);
  syncRichToDocument();
  focusWithoutScroll(els.richEditor);
  saveEditorSelection();
  setSessionText(`Inspector: ${reason}`);
}

function runContextualInspectorCommand(action, value = "") {
  if (compositionActive) return false;
  restoreEditorSelection();
  const state = getContextualInspectorState();
  const range = getEditorRangeFromSelection();
  const element = selectionElementFromRange(range);
  if (!range || !state.editable) return false;
  if (["bold", "italic", "underline", "strikeThrough", "justifyLeft", "justifyCenter", "justifyRight", "unlink"].includes(action)) {
    applyFormat(action);
    return true;
  }
  if (action === "block") { applyBlockStyle(value || "p"); return true; }
  if (action === "fontFamily") { applyInlineStyle("fontFamily", value); return true; }
  if (action === "fontSize") { applyFontSize(value); return true; }
  if (action === "color") { applyInlineStyle("color", value); return true; }
  if (action === "backgroundColor") { applyInlineStyle("backgroundColor", value); return true; }
  if (action === "clear") { clearFormattingToDefault(); return true; }
  const link = closestEditorElement(element, "a[href]");
  if (action === "link-set") {
    if (!value) return false;
    if (link) { link.setAttribute("href", value); syncRichToDocument(); focusWithoutScroll(els.richEditor); return true; }
    applyFormat("createLink", value); return true;
  }
  if (action === "link-remove" && link) {
    selectElementContents(link);
    applyFormat("unlink");
    return true;
  }
  if (action === "link-open" && link) {
    window.open(link.href, "_blank", "noopener");
    return true;
  }
  const image = element?.matches?.("img") ? element : closestEditorElement(element, "img");
  if (image && action.startsWith("image-")) {
    createSafetySnapshot(`before-${action}`);
    if (action === "image-width") image.style.width = value === "auto" ? "" : value;
    if (action === "image-alt") image.setAttribute("alt", value);
    if (action === "image-align") (image.closest("p, div, figure") || image.parentElement).style.textAlign = value;
    if (action === "image-remove") { const parent = image.parentElement; image.remove(); finalizeContextualStructure(parent, action); return true; }
    finalizeContextualStructure(image, action); return true;
  }
  const cell = closestEditorElement(element, "td, th");
  const table = cell?.closest("table") || closestEditorElement(element, "table");
  if (table && action.startsWith("table-")) {
    createSafetySnapshot(`before-${action}`);
    const row = cell?.parentElement || table.rows[0];
    const columnIndex = cell?.cellIndex ?? 0;
    if (action === "table-row-add") {
      const newRow = table.insertRow(Math.min(table.rows.length, (row?.rowIndex ?? table.rows.length - 1) + 1));
      const count = Math.max(1, row?.cells.length || table.rows[0]?.cells.length || 1);
      for (let index = 0; index < count; index += 1) newRow.insertCell().textContent = "";
      finalizeContextualStructure(newRow.cells[0], action); return true;
    }
    if (action === "table-row-delete" && row && table.rows.length > 1) { const next = table.rows[Math.max(0, row.rowIndex - 1)]?.cells[0]; row.remove(); finalizeContextualStructure(next, action); return true; }
    if (action === "table-column-add") { [...table.rows].forEach((item) => item.insertCell(Math.min(item.cells.length, columnIndex + 1)).textContent = ""); finalizeContextualStructure(table.rows[0].cells[columnIndex + 1], action); return true; }
    if (action === "table-column-delete" && table.rows[0]?.cells.length > 1) { [...table.rows].forEach((item) => item.cells[columnIndex]?.remove()); finalizeContextualStructure(table.rows[0].cells[Math.max(0, columnIndex - 1)], action); return true; }
    if (action === "table-remove") { const parent = table.parentElement; table.remove(); finalizeContextualStructure(parent, action); return true; }
  }
  return false;
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

function defaultTextStyleMap() {
  return {
    fontSize: "18px",
    fontFamily: "Pretendard, Inter, system-ui, sans-serif",
    color: "var(--text-primary)",
    fontWeight: "400",
    fontStyle: "normal",
    textDecoration: "none",
    textDecorationLine: "none",
  };
}

function resetPendingTypingStyleToDefault() {
  pendingTypingStyle = {
    fontSize: "18px",
    fontFamily: "Pretendard, Inter, system-ui, sans-serif",
    color: "var(--text-primary)",
  };
  formatDebugLog("pendingTypingStyle:reset-default", {
    pendingTypingStyle: { ...pendingTypingStyle },
  });
}

function stripInlineFormatting(element) {
  if (!element?.style) return;
  [
    "fontSize",
    "fontFamily",
    "color",
    "backgroundColor",
    "fontWeight",
    "fontStyle",
    "textDecoration",
    "textDecorationLine",
  ].forEach((property) => element.style[property] = "");
  element.removeAttribute("data-dark-color-fix");
  element.style.removeProperty("--tf-adapted-color");
  if (!element.getAttribute("style")?.trim()) element.removeAttribute("style");
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

function cleanupFormattingSpans(root) {
  root.querySelectorAll("[data-dark-color-fix]").forEach((element) => element.removeAttribute("data-dark-color-fix"));
  root.querySelectorAll('[style*="--tf-adapted-color"]').forEach((element) => {
    element.style.removeProperty("--tf-adapted-color");
  });
  root.querySelectorAll("span").forEach((span) => {
    if (!span.getAttribute("style")?.trim() && !span.attributes.length) unwrapElement(span);
  });
  cleanupInlineStyleSpans(root);
}

function applyDefaultTextStyleToRange(range) {
  return applyInlineStyleToSelection(defaultTextStyleMap(), range);
}

function clearFormattingInSelection(range) {
  if (!range || range.collapsed) return false;
  document.execCommand("removeFormat", false, null);
  const currentRange = getEditorRangeFromSelection() || range;
  const applied = applyDefaultTextStyleToRange(currentRange);
  cleanupFormattingSpans(els.richEditor);
  return applied;
}

function clearFormattingInComplexSelection(range) {
  return clearFormattingInSelection(range);
}

function clearFormattingToDefault() {
  restoreEditorSelection();
  focusWithoutScroll(els.richEditor);
  const range = getEditorRangeFromSelection();
  formatDebugLog("clearFormattingToDefault:start", {
    selection: getSelectionDebugSummary(),
    path: range?.collapsed ? "pendingTypingStyle" : range ? (isComplexRange(range) ? "complex-selection" : "selection") : "no-range",
  });
  if (!range) return;
  if (range.collapsed) {
    resetPendingTypingStyleToDefault();
    savedEditorSelection = range.cloneRange();
    focusWithoutScroll(els.richEditor);
    return;
  }
  createWholeDocumentSafetySnapshot("before-clear-formatting", range);
  const bulkBefore = isWholeEditorSelection(range) ? captureActiveDocumentState("before-clear-formatting") : null;
  const beforeHtml = els.richEditor.innerHTML;
  const applied = isComplexRange(range) ? clearFormattingInComplexSelection(range) : clearFormattingInSelection(range);
  if (applied) {
    formatDebugLog("clearFormattingToDefault:after-dom", {
      editorHTMLChanged: beforeHtml !== els.richEditor.innerHTML,
      afterEditorHTML: summarizeHtmlForFormatDebug(els.richEditor.innerHTML),
    });
    syncRichToDocument();
    pushBulkOperationUndoState("clear-formatting", bulkBefore);
    focusWithoutScroll(els.richEditor);
  }
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
  if (!activeTypingTrace) createTypingTrace(event, "beforeinput");
  markTypingTrace("typing:beforeinput", {
    inputType: event.inputType,
    dataLength: event.data?.length || 0,
    isComposing: event.isComposing,
  });
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
  markTypingTrace("before syncRichToDocument");
  syncRichToDocumentFast(event);
  finishTypingTrace();
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
  createWholeDocumentSafetySnapshot(`before-inline-${property}`, range);
  const bulkBefore = isWholeEditorSelection(range) ? captureActiveDocumentState(`before-inline-${property}`) : null;
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
    pushBulkOperationUndoState(`inline-${property}`, bulkBefore);
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
  recordTypingEvent("typing:paste", event);
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

function openMacintoshSurface(method) {
  const api = window.TextForgeMacintoshExperience;
  if (!api || typeof api[method] !== "function") {
    setSessionText("요청한 화면을 아직 열 수 없습니다.");
    return false;
  }
  api[method]();
  return true;
}

function runActiveDocumentMenuAction(action) {
  const current = activeDoc();
  if (!current) return;
  if (action === "duplicate") {
    const now = new Date().toISOString();
    const copy = refreshDocDerived({ ...current, id: crypto.randomUUID(), title: `${current.title} copy`, favorite: false, createdAt: now, updatedAt: now });
    documents.unshift(copy);
    persistNow();
    return;
  }
  if (action === "trash") {
    current.deletedAt = Date.now();
    current.updatedAt = new Date().toISOString();
    let next = documents.find((doc) => !doc.deletedAt);
    if (!next) {
      next = createDocument("");
      documents.unshift(next);
    }
    activeId = next.id;
    persistNow();
    renderActive();
  }
}

els.newDocBtn.addEventListener("click", createAndFocusDocument);

els.searchInput.addEventListener("input", renderDocList);
els.portalLibraryBtn?.addEventListener("click", openPortalLibrary);
els.sidebarFavoritesBtn?.addEventListener("click", () => openPortalLibrary({ smartFolder: "favorites" }));
els.sidebarFoldersBtn?.addEventListener("click", () => openPortalLibrary());
els.moreLibraryBtn?.addEventListener("click", () => openPortalLibrary());
els.sidebarToggleBtn?.addEventListener("click", () => {
  const collapsed = els.appShell.classList.toggle("sidebar-collapsed");
  els.sidebarToggleBtn.setAttribute("aria-pressed", String(!collapsed));
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
  bulkUndoPending = false;
  bulkRedoStack = [];
  syncSourceToDocument();
});

els.richEditor.addEventListener("input", (event) => {
  bulkUndoPending = false;
  bulkRedoStack = [];
  const trace = activeTypingTrace || createTypingTrace(event, "input");
  if (trace && !trace.inputStartMs) trace.inputStartMs = performance.now();
  markTypingTrace("typing:input:start", {
    inputType: event.inputType,
    dataLength: event.data?.length || 0,
    isComposing: event.isComposing,
  });
  if (isFormatDebugActive()) {
    formatDebugLog("input", {
      inputType: event.inputType,
      isComposing: event.isComposing,
      pendingTypingStyle: { ...pendingTypingStyle },
      editorHTML: summarizeHtmlForFormatDebug(els.richEditor.innerHTML),
    });
  }
  markTypingTrace("before syncRichToDocument");
  syncRichToDocumentFast(event);
  markTypingTrace("before updateStats");
  updateStats({ fast: true });
  markTypingTrace("after updateStats");
  finishTypingTrace();
});
els.richEditor.addEventListener("beforeinput", applyPendingTypingStyleOnBeforeInput);
els.richEditor.addEventListener("paste", handleRichPaste);
els.richEditor.addEventListener("compositionstart", (event) => {
  compositionActive = true;
  recordTypingEvent("typing:compositionstart", event);
  formatDebugLog("compositionstart", { selection: getSelectionDebugSummary() });
});
els.richEditor.addEventListener("compositionend", (event) => {
  compositionActive = false;
  scheduleSanitizedSync("composition-end", 900);
  recordTypingEvent("typing:compositionend", event);
  formatDebugLog("compositionend", { selection: getSelectionDebugSummary(), pendingTypingStyle: { ...pendingTypingStyle } });
});
els.richEditor.addEventListener("keyup", saveEditorSelection);
els.richEditor.addEventListener("mouseup", () => {
  saveEditorSelection();
  scheduleSessionRecoverySave();
});
els.richEditor.addEventListener("focus", saveEditorSelection);
els.richEditor.addEventListener("blur", () => scheduleSessionRecoverySave(0));
els.editor.addEventListener("blur", () => scheduleSessionRecoverySave(0));
document.querySelector(".rich-toolbar")?.addEventListener("pointerdown", saveEditorSelection, true);

document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
  btn.addEventListener("keydown", (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...document.querySelectorAll(".mode-btn")];
    const direction = event.key === "ArrowLeft" ? -1 : 1;
    const next = buttons[(buttons.indexOf(btn) + direction + buttons.length) % buttons.length];
    next?.focus();
    if (next) setMode(next.dataset.mode);
  });
});
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
  if (els.splitOpenDocSelect.value) openDocumentInNewPane(els.splitOpenDocSelect.value, { mode: "rich" });
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
  flushReferenceDocumentNow("reference-mode-change");
  captureReferenceViewState();
  pane.mode = els.referencePaneMode.value;
  pane.readonly = pane.documentId === activeId || isDocumentDetached(pane.documentId);
  persistSplitWorkspace();
  renderSplitWorkspace({ preserveScroll: true });
});
els.referenceScrollLockBtn?.addEventListener("click", () => setPaneScrollLocked("reference", !getPane("reference")?.lockedScroll));
els.referenceSyncBtn?.addEventListener("click", toggleSplitScrollSync);
els.referenceDocSelect?.addEventListener("change", () => openDocumentInPane(els.referenceDocSelect.value, "reference", { mode: getPane("reference")?.mode || "rich", lockedScroll: getPane("reference")?.lockedScroll }));
els.referenceCloseBtn?.addEventListener("click", () => closePane("reference"));
els.referenceSwapBtn?.addEventListener("click", swapDocumentPanes);
els.referencePaneBody?.addEventListener("input", () => syncReferenceDocumentFast("rich"));
els.referenceSourceEditor?.addEventListener("input", () => syncReferenceDocumentFast("source"));
els.referencePaneBody?.addEventListener("compositionstart", () => { referenceCompositionActive = true; });
els.referencePaneBody?.addEventListener("compositionend", () => { referenceCompositionActive = false; scheduleReferenceDocumentSync("reference-composition-end", 500); });
[els.referencePaneBody, els.referenceSourceEditor].forEach((editor) => {
  editor?.addEventListener("focus", () => setActivePane("reference"));
  editor?.addEventListener("keyup", captureReferenceViewState);
  editor?.addEventListener("mouseup", captureReferenceViewState);
  editor?.addEventListener("blur", () => { captureReferenceViewState(); flushReferenceDocumentNow("reference-blur"); });
});
els.richEditor?.addEventListener("scroll", () => {
  savePaneScroll("main");
  scheduleSessionRecoverySave();
  syncPaneScroll("main");
});
els.editor?.addEventListener("scroll", () => {
  savePaneScroll("main");
  scheduleSessionRecoverySave();
  syncPaneScroll("main");
});
els.preview?.addEventListener("scroll", () => {
  savePaneScroll("main");
  scheduleSessionRecoverySave();
  syncPaneScroll("main");
});
els.referencePaneBody?.addEventListener("scroll", () => {
  handleReferenceScroll();
  syncPaneScroll("reference");
});
els.referenceSourceEditor?.addEventListener("scroll", () => { handleReferenceScroll(); syncPaneScroll("reference"); });
els.referencePreview?.addEventListener("scroll", () => { handleReferenceScroll(); syncPaneScroll("reference"); });

function setSplitDividerRatio(ratio) {
  splitWorkspace.dividerRatio = Math.min(0.8, Math.max(0.2, Number(ratio) || 0.5));
  persistSplitWorkspace();
  applySplitWorkspaceUi();
}

els.splitDivider?.addEventListener("pointerdown", (event) => {
  if (splitWorkspace.layout === "single") return;
  event.preventDefault();
  const grid = els.editorGrid.getBoundingClientRect();
  const horizontal = splitWorkspace.layout === "horizontal-2";
  const move = (moveEvent) => {
    const ratio = horizontal ? (moveEvent.clientY - grid.top) / grid.height : (moveEvent.clientX - grid.left) / grid.width;
    setSplitDividerRatio(ratio);
  };
  const stop = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop, { once: true });
});
els.splitDivider?.addEventListener("keydown", (event) => {
  const relevant = splitWorkspace.layout === "horizontal-2" ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"];
  if (!relevant.includes(event.key)) return;
  event.preventDefault();
  const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
  setSplitDividerRatio((splitWorkspace.dividerRatio || 0.5) + direction * (event.shiftKey ? 0.1 : 0.02));
});
els.inspectorToggleBtn?.addEventListener("click", () => setInspectorOpen(!inspectorOpen || inspectorTab !== "context", "context"));
els.topForgeSnapshotBtn?.addEventListener("click", openForgeSnapshotPanel);
els.quickNoteBtn?.addEventListener("click", () => openMacintoshSurface("openQuickNote"));
els.exportStudioBtn?.addEventListener("click", () => openMacintoshSurface("openExportStudio"));
els.versionsBtn?.addEventListener("click", () => openMacintoshSurface("openVersions"));
els.workspaceBtn?.addEventListener("click", () => openMacintoshSurface("openWorkspaceManager"));
els.detachedEditorBtn?.addEventListener("click", () => openMacintoshSurface("openDetached"));
els.documentInfoBtn?.addEventListener("click", () => setInspectorOpen(true, "info"));
els.sourceModeBtn?.addEventListener("click", () => setMode("source"));
els.duplicateDocBtn?.addEventListener("click", () => runActiveDocumentMenuAction("duplicate"));
els.trashDocBtn?.addEventListener("click", () => runActiveDocumentMenuAction("trash"));
els.tocToolsBtn?.addEventListener("click", () => setInspectorOpen(true, "toc"));
els.promptToolsBtn?.addEventListener("click", () => setInspectorOpen(true, "prompt"));
els.systemToolsBtn?.addEventListener("click", () => setInspectorOpen(true, "system"));
document.querySelectorAll(".grouped-menu button").forEach((button) => {
  button.addEventListener("click", () => button.closest("details")?.removeAttribute("open"));
});

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
els.snapshotBtn.addEventListener("click", saveManualSnapshot);
els.foldPreviewBtn.addEventListener("click", () => {
  previewFolded = !previewFolded;
  els.foldPreviewBtn.textContent = previewFolded ? "펼치기" : "접기";
  renderPreview();
});
els.insertPromptBtn.addEventListener("click", insertSelectedPrompt);
els.copyPromptBtn.addEventListener("click", copySelectedPrompt);
els.savePromptBtn.addEventListener("click", saveCurrentAsPrompt);
els.commandBtn.addEventListener("click", openCommandPalette);
els.focusModeBtn?.addEventListener("click", toggleFocusMode);
els.commandInput.addEventListener("input", () => { universalCommandIndex = 0; renderCommands(); });
els.commandInput.addEventListener("compositionstart", () => { universalCommandComposing = true; });
els.commandInput.addEventListener("compositionend", () => { universalCommandComposing = false; universalCommandIndex = 0; renderCommands(); });
els.commandInput.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown") { event.preventDefault(); moveUniversalCommandSelection(1); }
  else if (event.key === "ArrowUp") { event.preventDefault(); moveUniversalCommandSelection(-1); }
  else if (event.key === "Tab") { event.preventDefault(); moveUniversalCommandGroup(event.shiftKey ? -1 : 1); }
  else if (event.altKey && event.code === "Space" && universalCommandResults[universalCommandIndex]?.type === "document") {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("textforge:quick-look-request", { detail: { type: "document", id: universalCommandResults[universalCommandIndex].targetId, source: "universal-command" } }));
  }
  else if (event.key === "Enter" && !universalCommandComposing && !event.isComposing && event.keyCode !== 229) {
    event.preventDefault();
    executeUniversalCommand(universalCommandResults[universalCommandIndex]);
  } else if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeCommandPalette();
  }
});
els.commandOverlay.addEventListener("click", (event) => {
  if (event.target === els.commandOverlay) closeCommandPalette();
});
els.preview.addEventListener("click", (event) => {
  const link = event.target.closest(".doc-link");
  if (link) openDocByTitle(link.dataset.docTitle || link.textContent);
});
[els.systemList, els.docInfoList].filter(Boolean).forEach((container) => container.addEventListener("click", (event) => {
  const backlink = event.target.closest("[data-backlink-doc-id]");
  if (!backlink) return;
  const source = documents.find((doc) => doc.id === backlink.dataset.backlinkDocId && !doc.deletedAt);
  if (source) openDocumentInPane(source.id, "main", { source: "backlink" });
}));
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
els.breakLineBtn?.addEventListener("click", toggleWordWrapDisplayOnly);

document.addEventListener("keydown", (event) => {
  if (event.target === els.richEditor || els.richEditor.contains(event.target)) {
    recordTypingEvent("typing:keydown", event);
  }
  const editorShortcutTarget = event.target === els.richEditor || els.richEditor.contains(event.target) || event.target === els.editor;
  if (editorShortcutTarget && event.ctrlKey && !event.altKey && event.code === "KeyZ") {
    const wantsRedo = event.shiftKey;
    if (wantsRedo && bulkRedoStack.length && redoLastBulkOperation()) {
      event.preventDefault();
      return;
    }
    if (!wantsRedo && bulkUndoPending && bulkUndoStack.length && restoreLastBulkOperation()) {
      event.preventDefault();
      return;
    }
  }
  if (editorShortcutTarget && event.ctrlKey && !event.altKey && event.code === "KeyY" && bulkRedoStack.length && redoLastBulkOperation()) {
    event.preventDefault();
    return;
  }
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

window.addEventListener("beforeunload", () => {
  flushRichDocumentNow("beforeunload");
  flushReferenceDocumentNow("beforeunload");
  if (referenceDocumentDirty) persistNow({ flushRich: false });
  savePaneScroll("main");
  persistSessionRecoveryState();
  portalLibraryChannel?.close();
  detachedEditorChannel?.close();
  clearInterval(detachedEditorHeartbeatTimer);
});

window.addEventListener("pagehide", () => {
  if (compositionActive) return;
  savePaneScroll("main");
  persistSessionRecoveryState();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "hidden" || compositionActive) return;
  savePaneScroll("main");
  persistSessionRecoveryState();
});

window.TextForgeDocumentSwitchPerf = {
  runDocumentSwitchBenchmark,
  getLastDocumentSwitchTrace,
  exportDocumentSwitchBenchmarkJson,
  showLastDocumentSwitchTrace,
};

function experienceDocumentState(doc) {
  return doc ? {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    contentHtml: doc.contentHtml,
    updatedAt: doc.updatedAt,
  } : null;
}

function restoreExperienceDocumentState(state) {
  const doc = documents.find((item) => item.id === state?.id);
  if (!doc) return false;
  doc.title = state.title;
  doc.content = state.content;
  doc.contentHtml = state.contentHtml;
  doc.updatedAt = state.updatedAt;
  refreshDocDerived(doc);
  return true;
}

function experienceDocumentHtml(doc) {
  if (!doc) return "<p></p>";
  if (doc.id === activeId && richDocumentDirty) return sanitizeRichHtml(els.richEditor.innerHTML);
  const reference = getPane("reference");
  if (referenceDocumentDirty && reference?.documentId === doc.id && reference.mode === "rich") return sanitizeRichHtml(els.referencePaneBody.innerHTML);
  return sanitizeRichHtml(doc.contentHtml || markdownToHtml(doc.content || ""));
}

function getExperiencePreview(request = {}) {
  const type = request.type === "version" ? "version" : "document";
  const doc = documents.find((item) => item.id === (request.docId || request.id));
  if (!doc || doc.deletedAt) return { available: false, type, id: request.id || request.docId || null, docId: doc?.id || request.docId || null, title: doc?.title || "Unavailable", deleted: Boolean(doc?.deletedAt), sourceContext: request.contextLabel || request.source || "", contentHtml: "<p>This item is no longer available.</p>" };
  const snapshot = type === "version" ? safeArray(doc.history).find((item) => item.id === (request.snapshotId || request.id)) : null;
  if (type === "version" && !snapshot) return { available: false, type, id: request.id || null, docId: doc.id, title: "Unavailable version", sourceContext: request.contextLabel || request.source || "", contentHtml: "<p>This version is no longer available.</p>" };
  const folder = folders.find((item) => item.id === doc.folderId);
  const contentHtml = type === "version"
    ? sanitizeRichHtml(snapshot.contentHtml || markdownToHtml(snapshot.content || ""))
    : experienceDocumentHtml(doc);
  return {
    available: true,
    type,
    id: type === "version" ? snapshot.id : doc.id,
    docId: doc.id,
    title: type === "version" ? snapshot.title || doc.title : doc.title,
    label: snapshot?.label || "",
    createdAt: snapshot?.createdAt || doc.createdAt,
    updatedAt: snapshot?.createdAt || doc.updatedAt,
    charCount: htmlToPlain(contentHtml).length,
    folder: folder?.name || "Inbox",
    favorite: Boolean(doc.favorite),
    deleted: Boolean(doc.deletedAt),
    sourceContext: request.contextLabel || request.source || "",
    contentHtml,
  };
}

function experienceTopLevelBlock(node, root) {
  let current = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
  while (current && current.parentElement !== root) current = current.parentElement;
  return current?.parentElement === root ? current : null;
}

function classifyExperienceSelection(root, range) {
  const blocks = [...root.children].filter((block) => {
    try { return range.intersectsNode(block); } catch { return false; }
  });
  const fragment = range.cloneContents();
  const hasTable = Boolean(fragment.querySelector?.("table,tbody,tr,td,th")) || Boolean(experienceTopLevelBlock(range.commonAncestorContainer, root)?.closest("table"));
  const hasList = Boolean(fragment.querySelector?.("ul,ol,li")) || blocks.some((block) => /^(UL|OL)$/.test(block.tagName));
  const hasMedia = Boolean(fragment.querySelector?.("img,video,audio"));
  const exactBlocks = blocks.length > 0 && range.startContainer === root && range.endContainer === root;
  let kind = blocks.length > 1 ? "partial-blocks" : "inline";
  if (hasTable) kind = "table";
  else if (hasList) kind = "list";
  else if (hasMedia) kind = "media";
  else if (exactBlocks) kind = blocks.length > 1 ? "blocks" : "block";
  return { kind, blocks, exactBlocks };
}

function captureExperienceSelection() {
  if (compositionActive || referenceCompositionActive) return { ok: false, reason: "IME composition is active." };
  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  if (!range || range.collapsed) {
    if (currentEditorMode() === "source" && els.editor.selectionEnd > els.editor.selectionStart) {
      const text = els.editor.value.slice(els.editor.selectionStart, els.editor.selectionEnd);
      experienceSelectionLease = {
        token: crypto.randomUUID(), kind: "source", docId: activeId, paneId: "main", revision: activeDoc()?.updatedAt,
        start: els.editor.selectionStart, end: els.editor.selectionEnd, text,
      };
      return { ok: true, ...experienceSelectionLease, html: `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`, blockCount: 0, canMoveBlocks: false };
    }
    return { ok: false, reason: "Select text or one or more paragraphs first." };
  }
  let root = null;
  let doc = null;
  let paneId = null;
  if (els.richEditor.contains(range.commonAncestorContainer)) { root = els.richEditor; doc = activeDoc(); paneId = "main"; }
  else if (els.referencePaneBody?.contains(range.commonAncestorContainer)) { root = els.referencePaneBody; doc = documents.find((item) => item.id === getPane("reference")?.documentId); paneId = "reference"; }
  if (!root || !doc) return { ok: false, reason: "The selection is not inside an editable document." };
  if (isDocumentDetached(doc.id) || root.getAttribute("contenteditable") !== "true") return { ok: false, reason: "This document is read-only or owned by a detached writer." };
  const classification = classifyExperienceSelection(root, range);
  const wrapper = document.createElement("div");
  wrapper.append(range.cloneContents());
  const token = crypto.randomUUID();
  experienceSelectionLease = {
    token,
    kind: classification.kind,
    docId: doc.id,
    paneId,
    revision: doc.updatedAt,
    range: range.cloneRange(),
    root,
    blockIndexes: classification.blocks.map((block) => [...root.children].indexOf(block)).filter((index) => index >= 0),
    exactBlocks: classification.exactBlocks,
  };
  return {
    ok: true,
    token,
    kind: classification.kind,
    docId: doc.id,
    paneId,
    revision: doc.updatedAt,
    html: sanitizeRichHtml(wrapper.innerHTML),
    text: wrapper.textContent || "",
    blockCount: classification.blocks.length,
    canMoveBlocks: classification.blocks.length > 0 && !["table", "list", "media"].includes(classification.kind),
    expandsToBlocks: classification.blocks.length > 0 && !classification.exactBlocks,
  };
}

function resolveExperienceSelection(token) {
  const lease = experienceSelectionLease;
  const doc = documents.find((item) => item.id === lease?.docId);
  if (!lease || lease.token !== token || !doc || isDocumentDetached(doc.id)) return { ok: false, reason: "The selection is no longer available." };
  if (lease.revision !== doc.updatedAt) return { ok: false, reason: "The document changed. Select the content again." };
  if (lease.kind === "source") {
    if (currentEditorMode() !== "source" || activeId !== lease.docId || els.editor.selectionStart !== lease.start || els.editor.selectionEnd !== lease.end) return { ok: false, reason: "The source selection changed." };
    return { ok: true, lease, doc };
  }
  if (!lease.range?.startContainer?.isConnected || !lease.root?.isConnected) return { ok: false, reason: "The selection is stale." };
  return { ok: true, lease, doc };
}

function selectExperienceNodes(root, first, last = first) {
  if (!first?.isConnected || !last?.isConnected) return;
  const range = document.createRange();
  range.setStartBefore(first);
  range.setEndAfter(last);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  if (root === els.richEditor) savedEditorSelection = range.cloneRange();
}

function syncExperienceRoot(lease, doc, reason) {
  if (lease.kind === "source") {
    doc.content = els.editor.value;
    doc.contentHtml = markdownToHtml(doc.content);
  } else {
    doc.contentHtml = sanitizeRichHtml(lease.root.innerHTML);
    doc.content = htmlToMarkdown(doc.contentHtml);
  }
  doc.updatedAt = new Date().toISOString();
  refreshDocDerived(doc);
  richDocumentDirty = false;
  if (lease.paneId === "reference") { referenceDocumentDirty = false; referenceDirtyDocumentId = null; }
  window.dispatchEvent(new CustomEvent("textforge:document-content-change", { detail: { id: doc.id, source: reason } }));
}

function pushExperienceOperation(reason, before, after) {
  const operation = { id: crypto.randomUUID(), reason, before, after, undone: false };
  experienceOperationUndoStack.push(operation);
  experienceOperationUndoStack = experienceOperationUndoStack.slice(-20);
  return operation;
}

function runLocalSelectionOperation(action, token) {
  const resolved = resolveExperienceSelection(token);
  if (!resolved.ok) return resolved;
  const { lease, doc } = resolved;
  if (["table", "list", "media"].includes(lease.kind)) return { ok: false, reason: `${lease.kind} selections require a safer parent-level operation.` };
  const before = [experienceDocumentState(doc)];
  addSnapshot(doc, `Safety: selection ${action}`);
  try {
    if (lease.kind === "source") {
      const selected = els.editor.value.slice(lease.start, lease.end);
      if (action === "duplicate") els.editor.setRangeText(selected + selected, lease.start, lease.end, "end");
      else if (action === "delete") els.editor.setRangeText("", lease.start, lease.end, "end");
      else return { ok: false, reason: "Paragraph movement is available in Write mode." };
    } else if (action === "move-up" || action === "move-down") {
      const blocks = lease.blockIndexes.map((index) => lease.root.children[index]).filter(Boolean);
      if (!blocks.length) return { ok: false, reason: "No safe paragraph boundary was found." };
      const firstIndex = [...lease.root.children].indexOf(blocks[0]);
      const lastIndex = [...lease.root.children].indexOf(blocks.at(-1));
      if (action === "move-up") {
        const previous = lease.root.children[firstIndex - 1];
        if (!previous) return { ok: false, reason: "The selection is already at the document start." };
        lease.root.insertBefore(previous, blocks.at(-1).nextSibling);
      } else {
        const next = lease.root.children[lastIndex + 1];
        if (!next) return { ok: false, reason: "The selection is already at the document end." };
        lease.root.insertBefore(next, blocks[0]);
      }
      selectExperienceNodes(lease.root, blocks[0], blocks.at(-1));
    } else if (action === "duplicate") {
      const fragment = lease.range.cloneContents();
      const inserted = [...fragment.childNodes];
      const insertion = lease.range.cloneRange();
      insertion.collapse(false);
      insertion.insertNode(fragment);
      if (inserted.length) selectExperienceNodes(lease.root, inserted[0], inserted.at(-1));
    } else if (action === "delete") {
      lease.range.deleteContents();
      lease.range.collapse(true);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(lease.range);
    } else return { ok: false, reason: "Unsupported selection action." };
    syncExperienceRoot(lease, doc, `selection-${action}`);
    persistNow({ flushRich: false });
    const operation = pushExperienceOperation(`selection-${action}`, before, [experienceDocumentState(doc)]);
    experienceSelectionLease = null;
    return { ok: true, operationId: operation.id, message: `Selection ${action} completed.` };
  } catch (error) {
    restoreExperienceDocumentState(before[0]);
    renderActive();
    return { ok: false, reason: error.message || "Selection operation failed." };
  }
}

function appendExperienceHtml(doc, html) {
  const template = document.createElement("template");
  template.innerHTML = experienceDocumentHtml(doc);
  const incoming = document.createElement("template");
  incoming.innerHTML = sanitizeRichHtml(html);
  template.content.append(...incoming.content.childNodes);
  doc.contentHtml = sanitizeRichHtml(template.innerHTML);
  doc.content = htmlToMarkdown(doc.contentHtml);
  doc.updatedAt = new Date().toISOString();
  refreshDocDerived(doc);
}

function quickNoteFragmentHtml(title, body) {
  const blocks = String(body || "").replace(/\r\n?/g, "\n").split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const titleHtml = String(title || "").trim() ? `<h3>${escapeHtml(String(title).trim())}</h3>` : "";
  const bodyHtml = blocks.map((part) => `<p>${escapeHtml(part).replace(/\n/g, "<br>")}</p>`).join("") || "<p></p>";
  return sanitizeRichHtml(`${titleHtml}${bodyHtml}`);
}

function loadQuickNoteOperationResults() {
  try {
    const stored = JSON.parse(localStorage.getItem(QUICK_NOTE_OPERATION_KEY) || "[]");
    return new Map(safeArray(stored).filter((item) => item && typeof item.requestId === "string" && item.result?.ok).slice(-40).map((item) => [item.requestId, item.result]));
  } catch {
    return new Map();
  }
}

const quickNoteOperationResults = loadQuickNoteOperationResults();

function rememberQuickNoteOperationResult(requestId, result) {
  quickNoteOperationResults.set(requestId, result);
  const records = [...quickNoteOperationResults.entries()].slice(-40).map(([id, value]) => ({ requestId: id, result: value }));
  safeLocalSet(QUICK_NOTE_OPERATION_KEY, JSON.stringify(records));
}

function syncQuickNoteDocumentView(doc) {
  if (!doc) return;
  if (doc.id === activeId) {
    const mode = currentEditorMode();
    if (mode === "source") {
      const start = els.editor.selectionStart;
      const end = els.editor.selectionEnd;
      const scrollTop = els.editor.scrollTop;
      els.editor.value = doc.content;
      els.editor.setSelectionRange(Math.min(start, doc.content.length), Math.min(end, doc.content.length));
      els.editor.scrollTop = scrollTop;
    } else {
      setRichEditorHtmlPrepared(doc.contentHtml);
    }
    richDocumentDirty = false;
    if (isPreviewPaneVisible()) renderPreview();
  }
  const reference = getPane("reference");
  if (reference?.documentId !== doc.id) return;
  if (reference.mode === "source") {
    const start = els.referenceSourceEditor.selectionStart;
    const end = els.referenceSourceEditor.selectionEnd;
    const scrollTop = els.referenceSourceEditor.scrollTop;
    els.referenceSourceEditor.value = doc.content;
    els.referenceSourceEditor.setSelectionRange(Math.min(start, doc.content.length), Math.min(end, doc.content.length));
    els.referenceSourceEditor.scrollTop = scrollTop;
  } else if (reference.mode === "rich") {
    els.referencePaneBody.innerHTML = prepareHtmlForThemedRender(doc.contentHtml);
  } else if (!els.referencePane?.classList.contains("hidden")) {
    renderReferencePane();
  }
  referenceDocumentDirty = false;
  referenceDirtyDocumentId = null;
}

async function performQuickNoteSave(request = {}) {
  const requestId = typeof request.operationId === "string" && request.operationId ? request.operationId : crypto.randomUUID();
  const cached = quickNoteOperationResults.get(requestId);
  if (cached) return { ...cached, deduplicated: true };
  const body = String(request.body || "").trim();
  const title = String(request.title || "").trim().slice(0, 240);
  if (!body) return { ok: false, reason: "Write something before saving the Quick Note." };
  if (body.length > 50000) return { ok: false, reason: "Quick Note is limited to 50,000 characters." };

  flushRichDocumentNow("before-quick-note-save");
  flushReferenceDocumentNow("before-quick-note-save");
  const target = String(request.target || "new-inbox");
  if (target === "new-inbox" || target === "new-document") {
    const previousActiveId = activeId;
    const doc = createDocument("");
    const firstLine = body.split(/\r?\n/).find((line) => line.trim())?.trim() || "Quick Note";
    doc.title = title || firstLine.slice(0, 80);
    doc.contentHtml = quickNoteFragmentHtml("", body);
    doc.content = htmlToMarkdown(doc.contentHtml);
    doc.folderId = target === "new-inbox" ? null : (folders.some((folder) => folder.id === request.folderId) ? request.folderId : null);
    doc.tags = safeArray(request.tags).map((tag) => String(tag).trim()).filter(Boolean).slice(0, 20);
    refreshDocDerived(doc);
    documents.unshift(doc);
    try {
      if (!await persistExperienceOperationDurably()) throw new Error("The new Quick Note could not be saved.");
      const operation = pushExperienceOperation("quick-note-create", [], []);
      operation.createdDocuments = [experienceDocumentState(doc)];
      const result = { ok: true, documentId: doc.id, operationId: operation.id, message: "Quick Note saved without changing the current document." };
      rememberQuickNoteOperationResult(requestId, result);
      persistNow({ flushRich: false });
      renderDocList();
      if (request.openAfter) openDocumentInPane(doc.id, "main", { source: "quick-note" });
      else activeId = previousActiveId;
      return result;
    } catch (error) {
      documents = documents.filter((item) => item.id !== doc.id);
      activeId = previousActiveId;
      persistNow({ flushRich: false });
      await persistExperienceOperationDurably();
      return { ok: false, rolledBack: true, reason: error.message || "Quick Note creation failed." };
    }
  }

  const targetId = target === "append-current" ? activeId : target.startsWith("append:") ? target.slice(7) : "";
  const doc = documents.find((item) => item.id === targetId && !item.deletedAt);
  if (!doc) return { ok: false, reason: "The Quick Note destination is unavailable." };
  if (isDocumentDetached(doc.id)) return { ok: false, reason: "A detached writer currently owns this document." };
  if (request.targetRevision && request.targetRevision !== doc.updatedAt) return { ok: false, reason: "The destination changed. Review it before saving again." };
  const mainViewState = doc.id === activeId ? captureMainViewState() : null;
  const before = experienceDocumentState(doc);
  addSnapshot(doc, "Safety: append Quick Note");
  try {
    appendExperienceHtml(doc, quickNoteFragmentHtml(title, body));
    if (!await persistExperienceOperationDurably()) throw new Error("The Quick Note destination could not be saved.");
    syncQuickNoteDocumentView(doc);
    if (mainViewState) restoreMainViewState(mainViewState);
    persistNow({ flushRich: false });
    renderDocList();
    window.dispatchEvent(new CustomEvent("textforge:document-content-change", { detail: { id: doc.id, source: "quick-note" } }));
    const operation = pushExperienceOperation("quick-note-append", [before], [experienceDocumentState(doc)]);
    const result = { ok: true, documentId: doc.id, operationId: operation.id, message: `Quick Note appended to ${doc.title || "Untitled"}.` };
    rememberQuickNoteOperationResult(requestId, result);
    if (request.openAfter && doc.id !== activeId) openDocumentInPane(doc.id, "main", { source: "quick-note" });
    return result;
  } catch (error) {
    restoreExperienceDocumentState(before);
    syncQuickNoteDocumentView(doc);
    if (mainViewState) restoreMainViewState(mainViewState);
    persistNow({ flushRich: false });
    await persistExperienceOperationDurably();
    return { ok: false, rolledBack: true, reason: error.message || "Quick Note append failed." };
  }
}

const quickNoteOperationsInFlight = new Map();

function saveQuickNote(request = {}) {
  const requestId = typeof request.operationId === "string" && request.operationId ? request.operationId : crypto.randomUUID();
  const cached = quickNoteOperationResults.get(requestId);
  if (cached) return Promise.resolve({ ...cached, deduplicated: true });
  const pending = quickNoteOperationsInFlight.get(requestId);
  if (pending) return pending;
  const operation = performQuickNoteSave({ ...request, operationId: requestId });
  quickNoteOperationsInFlight.set(requestId, operation);
  operation.then(() => quickNoteOperationsInFlight.delete(requestId), () => quickNoteOperationsInFlight.delete(requestId));
  return operation;
}

async function runCrossDocumentSelectionOperation(action, token, targetId, options = {}) {
  const resolved = resolveExperienceSelection(token);
  if (!resolved.ok) return resolved;
  const { lease, doc: source } = resolved;
  const target = documents.find((item) => item.id === targetId && !item.deletedAt);
  if (!target || target.id === source.id) return { ok: false, reason: "Choose another available document." };
  if (isDocumentDetached(source.id) || isDocumentDetached(target.id)) return { ok: false, reason: "A detached writer currently owns one of these documents." };
  if (["table", "list"].includes(lease.kind)) return { ok: false, reason: "Partial table and list selections cannot be sent safely." };
  const wrapper = document.createElement("div");
  if (lease.kind === "source") wrapper.innerHTML = `<p>${escapeHtml(lease.text).replace(/\n/g, "<br>")}</p>`;
  else wrapper.append(lease.range.cloneContents());
  const fragmentHtml = sanitizeRichHtml(wrapper.innerHTML);
  const before = [experienceDocumentState(source), experienceDocumentState(target)];
  addSnapshot(source, `Safety: selection ${action}`);
  addSnapshot(target, `Safety: receive selection ${action}`);
  try {
    appendExperienceHtml(target, fragmentHtml);
    if (options.simulateFailure === "target-save") throw new Error("Simulated target save failure");
    if (!await persistExperienceOperationDurably()) throw new Error("Target document could not be saved.");
    if (action === "move") {
      if (lease.kind === "source") els.editor.setRangeText("", lease.start, lease.end, "end");
      else lease.range.deleteContents();
      syncExperienceRoot(lease, source, "selection-move-source");
      if (options.simulateFailure === "source-save") throw new Error("Simulated source save failure");
      if (!await persistExperienceOperationDurably()) throw new Error("Source document could not be saved.");
    }
    persistNow({ flushRich: false });
    renderDocList();
    const after = [experienceDocumentState(source), experienceDocumentState(target)];
    const operation = pushExperienceOperation(`selection-${action}`, before, after);
    experienceSelectionLease = null;
    return { ok: true, operationId: operation.id, message: `Selection ${action} completed at the target document end.` };
  } catch (error) {
    before.forEach(restoreExperienceDocumentState);
    if (lease.paneId === "main" && source.id === activeId) setRichEditorHtmlPrepared(source.contentHtml);
    if (lease.paneId === "reference" && getPane("reference")?.documentId === source.id) els.referencePaneBody.innerHTML = prepareHtmlForThemedRender(source.contentHtml);
    persistNow({ flushRich: false });
    await persistExperienceOperationDurably();
    return { ok: false, rolledBack: true, reason: error.message || "The move was rolled back." };
  }
}

async function createDocumentFromExperienceSelection(token, move = false, title = "") {
  const resolved = resolveExperienceSelection(token);
  if (!resolved.ok) return resolved;
  const { lease, doc: source } = resolved;
  if (["table", "list"].includes(lease.kind)) return { ok: false, reason: "Select a complete safe block before creating a document." };
  const wrapper = document.createElement("div");
  if (lease.kind === "source") wrapper.innerHTML = `<p>${escapeHtml(lease.text).replace(/\n/g, "<br>")}</p>`;
  else wrapper.append(lease.range.cloneContents());
  const beforeSource = experienceDocumentState(source);
  const doc = createDocument("");
  doc.title = String(title || `${source.title || "Note"} excerpt`).trim() || "Selection excerpt";
  doc.folderId = source.folderId || null;
  doc.contentHtml = sanitizeRichHtml(wrapper.innerHTML);
  doc.content = htmlToMarkdown(doc.contentHtml);
  refreshDocDerived(doc);
  let newDocumentPersisted = false;
  try {
    documents.unshift(doc);
    if (!await persistExperienceOperationDurably()) throw new Error("The new document could not be saved.");
    newDocumentPersisted = durableStorageHydrated;
    if (move) {
      addSnapshot(source, "Safety: move selection to new document");
      if (lease.kind === "source") els.editor.setRangeText("", lease.start, lease.end, "end");
      else lease.range.deleteContents();
      syncExperienceRoot(lease, source, "selection-move-new-document");
      if (!await persistExperienceOperationDurably()) throw new Error("The source document could not be saved.");
    }
    persistNow({ flushRich: false });
    const operation = pushExperienceOperation(move ? "selection-move-new" : "selection-copy-new", [beforeSource], [experienceDocumentState(source)]);
    operation.createdDocuments = [experienceDocumentState(doc)];
    experienceSelectionLease = null;
    return { ok: true, documentId: doc.id, operationId: operation.id, message: move ? "Selection moved to a new document." : "Selection copied to a new document." };
  } catch (error) {
    if (newDocumentPersisted) {
      doc.deletedAt = new Date().toISOString();
      doc.updatedAt = doc.deletedAt;
      refreshDocDerived(doc);
    } else documents = documents.filter((item) => item.id !== doc.id);
    restoreExperienceDocumentState(beforeSource);
    persistNow({ flushRich: false });
    await persistExperienceOperationDurably();
    return { ok: false, rolledBack: true, reason: error.message || "Document creation failed." };
  }
}

function insertExperienceDocumentLink(token, targetId) {
  const resolved = resolveExperienceSelection(token);
  if (!resolved.ok) return resolved;
  const target = documents.find((item) => item.id === targetId && !item.deletedAt);
  if (!target) return { ok: false, reason: "The linked document is unavailable." };
  const { lease, doc } = resolved;
  const before = [experienceDocumentState(doc)];
  const linkText = ` [[${target.title}]]`;
  if (lease.kind === "source") {
    els.editor.setRangeText(`${els.editor.value.slice(lease.start, lease.end)}${linkText}`, lease.start, lease.end, "end");
  } else {
    const insertion = lease.range.cloneRange(); insertion.collapse(false); insertion.insertNode(document.createTextNode(linkText));
  }
  syncExperienceRoot(lease, doc, "selection-link");
  persistNow({ flushRich: false });
  const operation = pushExperienceOperation("selection-link", before, [experienceDocumentState(doc)]);
  experienceSelectionLease = null;
  return { ok: true, operationId: operation.id, message: `Linked to ${target.title}.` };
}

function insertSnapshotBlocks(snapshotId, blockIndexes = []) {
  const doc = activeDoc();
  const snapshot = safeArray(doc?.history).find((item) => item.id === snapshotId);
  if (!doc || !snapshot || currentEditorMode() === "source" || isDocumentDetached(doc.id)) return { ok: false, reason: "Return to an editable Write view before inserting version content." };
  const template = document.createElement("template");
  template.innerHTML = sanitizeRichHtml(snapshot.contentHtml || markdownToHtml(snapshot.content || ""));
  const children = [...template.content.children];
  const selected = [...new Set(safeArray(blockIndexes).map(Number))].map((index) => children[index]).filter(Boolean);
  if (!selected.length || selected.some((node) => node.matches("table") || node.querySelector("table"))) return { ok: false, reason: "Choose one or more safe text blocks." };
  const before = captureActiveDocumentState("insert-version-blocks");
  createSafetySnapshot("before-version-insert");
  restoreEditorSelection();
  const range = getEditorRangeFromSelection();
  if (!range) return { ok: false, reason: "Place the caret in the current document first." };
  const fragment = document.createDocumentFragment(); selected.forEach((node) => fragment.append(node.cloneNode(true)));
  range.insertNode(fragment);
  syncRichToDocumentFull({ renderPreviewNow: isPreviewPaneVisible(), updateStatsNow: true });
  pushBulkOperationUndoState("insert-version-blocks", before);
  return { ok: true, message: `${selected.length} version block(s) inserted.` };
}

function undoExperienceOperation(operationId = null) {
  const operation = [...experienceOperationUndoStack].reverse().find((item) => !item.undone && (!operationId || item.id === operationId));
  if (!operation) return { ok: false, reason: "No Selection operation is available to undo." };
  const safe = operation.after.every((state) => {
    const doc = documents.find((item) => item.id === state.id);
    return doc && doc.contentHtml === state.contentHtml;
  }) && safeArray(operation.createdDocuments).every((state) => documents.find((item) => item.id === state.id)?.contentHtml === state.contentHtml);
  if (!safe) return { ok: false, reason: "These documents changed after the operation. Use History or a Safety Snapshot instead." };
  operation.before.forEach(restoreExperienceDocumentState);
  const createdIds = new Set(safeArray(operation.createdDocuments).map((state) => state.id));
  documents.forEach((doc) => {
    if (!createdIds.has(doc.id)) return;
    doc.deletedAt = new Date().toISOString();
    doc.updatedAt = doc.deletedAt;
    refreshDocDerived(doc);
  });
  operation.undone = true;
  persistNow({ flushRich: false });
  renderActive(); renderDocList();
  return { ok: true, message: "Selection operation undone." };
}

// A narrow UI host for optional local-only experience layers. Document persistence
// remains owned by this file; consumers receive copies and invoke explicit actions.
window.TextForgeExperienceHost = {
  getDocuments: () => documents.map((doc) => ({ ...doc, tags: [...doc.tags], history: safeArray(doc.history).map((item) => ({ ...item })) })),
  getDocumentMetadata: () => documents.map((doc) => ({
    id: doc.id, title: doc.title, type: doc.type, folderId: doc.folderId, tags: [...doc.tags], favorite: doc.favorite,
    deletedAt: doc.deletedAt, createdAt: doc.createdAt, updatedAt: doc.updatedAt, charCount: doc.charCount, previewText: doc.previewText,
  })),
  getActiveDocument: () => {
    const doc = activeDoc();
    return doc ? { ...doc, tags: [...doc.tags], history: safeArray(doc.history).map((item) => ({ ...item })) } : null;
  },
  getFolders: () => folders.map((folder) => ({ ...folder })),
  openDocument: (id, options = {}) => openDocumentInPane(id, options.paneId || "main", { source: options.source || "mac-experience", ...options }),
  setSplitLayout,
  getSplitWorkspace: () => JSON.parse(JSON.stringify(splitWorkspace)),
  restoreSplitWorkspace: restoreSplitWorkspaceState,
  openDocumentInNewPane,
  swapDocumentPanes,
  closeReferencePane: () => closePane("reference"),
  captureMainViewState,
  restoreMainViewState,
  captureReferenceViewState,
  flushAllEditors: (reason = "experience-host") => {
    flushRichDocumentNow(reason);
    flushReferenceDocumentNow(reason);
    persistNow({ flushRich: false });
    return true;
  },
  setInspectorOpen,
  getInspectorState: () => ({ open: inspectorOpen, tab: inspectorTab }),
  getFocusMode: () => focusMode,
  toggleFocusMode,
  setFocusMode: applyFocusMode,
  openDetachedEditor,
  getDetachedDocuments: () => [...detachedEditorLeases.values()].map((lease) => ({ documentId: lease.documentId, windowId: lease.windowId, originalTabIndex: lease.originalTabIndex, viewState: lease.viewState || null })),
  saveManualSnapshot,
  getExportCapabilities,
  getExportPreview,
  exportDocument,
  copyExportDocument,
  openForgeSnapshotPanel,
  copyAs,
  addCommands: (items) => COMMANDS.push(...items),
  getContextualInspectorState,
  runContextualInspectorCommand,
  saveEditorSelection,
  focusEditor: () => focusWithoutScroll(currentEditorMode() === "source" ? els.editor : els.richEditor),
  isComposing: () => compositionActive,
  getPreview: getExperiencePreview,
  captureSelectionObject: captureExperienceSelection,
  runLocalSelectionOperation,
  runCrossDocumentSelectionOperation,
  createDocumentFromSelection: createDocumentFromExperienceSelection,
  insertDocumentLinkFromSelection: insertExperienceDocumentLink,
  insertSnapshotBlocks,
  undoSelectionOperation: undoExperienceOperation,
  saveQuickNote,
  createQuickNote: ({ title, body, folderId = null, tags = [] }) => {
    return saveQuickNote({ operationId: crypto.randomUUID(), title, body, folderId, tags, target: folderId ? "new-document" : "new-inbox", openAfter: false });
  },
  createDocumentFromSnapshot: (snapshot) => {
    const doc = createDocument(snapshot?.content || "");
    doc.title = `${snapshot?.title || "Version"} copy`;
    doc.contentHtml = snapshot?.contentHtml || doc.contentHtml;
    refreshDocDerived(doc);
    documents.unshift(doc);
    activeId = doc.id;
    persistNow();
    renderActive();
    renderDocList();
    return doc.id;
  },
  restoreSnapshot: (id) => restoreSnapshot(id),
  getSelectionPayload: () => {
    const range = getEditorRangeFromSelection();
    if (!range || range.collapsed) return null;
    const wrapper = document.createElement("div");
    wrapper.append(range.cloneContents());
    return { html: wrapper.innerHTML, text: wrapper.textContent || "", start: range.startOffset, end: range.endOffset };
  },
  replaceSelectionWithHtml: (html) => {
    const range = getEditorRangeFromSelection();
    if (!range) return false;
    range.deleteContents();
    const template = document.createElement("template");
    template.innerHTML = html;
    range.insertNode(template.content);
    flushRichDocumentNow("selection-object");
    return true;
  },
};

initTheme();
initPortalLibraryBridge();
initDetachedEditorBridge();
initFloatingUiDismiss();
initModalAccessibility();
setUiMode(uiMode);
focusMode = loadFocusModeState();
updateFocusModeUi();
applyFocusCanvasWidth();
initFocusResizeHandles();
applyWordWrapPreference();
initPwaInstallHints();
renderInspectorState();
renderActive();
renderDocList();
scheduleStartupResume(readSessionRecoverySnapshot());
configureDiagnosticsContext();
(async () => {
  await hydrateFromDurableStorage();
  renderDocList();
  scheduleDurableSave(1200);
})();
