(() => {
  "use strict";

  const host = window.TextForgeExperienceHost;
  if (!host) return;
  const KEY = "textforge.macintoshExperience.v1";
  const QUICK_NOTE_DRAFT_KEY = "textforge.quickNoteDraft.v1";
  const QUICK_NOTE_DRAFT_VERSION = 1;
  const SCHEMA_VERSION = 2;
  const MAX_TABS = 40;
  const MAX_CLOSED_TABS = 12;
  const MAX_WORKSPACES = 20;
  const state = loadState();
  let selectionMenu;
  let tabContextMenu;
  let workspaceSaveTimer = null;
  let selectionPayload = null;
  let operationToastTimer = null;
  const quickLookController = window.TextForgeQuickLookController?.create({
    getItem: (item) => host.getPreview(item),
    openItem: (payload) => payload?.docId && host.openDocument(payload.docId, { source: "quick-look" }),
  });
  const exportQuickLookController = window.TextForgeQuickLookController?.create({
    getItem: (item) => item,
  });

  function normalizeExportPreferences(value = {}) {
    const formats = ["txt", "md", "html", "doc", "pdf", "epub", "card"];
    const format = formats.includes(value.format) ? value.format : "md";
    const storedByFormat = value.version === 1 && value.byFormat && typeof value.byFormat === "object" ? value.byFormat : {};
    const byFormat = {};
    formats.forEach((item) => {
      const options = storedByFormat[item] || {};
      byFormat[item] = { includeTitle: options.includeTitle !== false, includeMetadata: options.includeMetadata === true };
    });
    return { version: 1, format, byFormat };
  }

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || "{}");
      const tabs = Array.isArray(stored.tabs)
        ? stored.tabs.map((item) => typeof item === "string" ? { docId: item, viewState: null } : item).filter((item) => typeof item?.docId === "string").slice(0, MAX_TABS)
        : [];
      const workspaces = Array.isArray(stored.workspaces)
        ? stored.workspaces
        : Object.entries(stored.workspaces && typeof stored.workspaces === "object" ? stored.workspaces : {}).map(([name, workspace]) => ({ id: crypto.randomUUID(), name, ...workspace }));
      return {
        version: SCHEMA_VERSION,
        tabs,
        activeTab: typeof stored.activeTab === "string" ? stored.activeTab : null,
        recentlyClosed: Array.isArray(stored.recentlyClosed) ? stored.recentlyClosed.filter((item) => typeof item?.docId === "string").slice(0, MAX_CLOSED_TABS) : [],
        workspaces: workspaces.filter((item) => item && typeof item.name === "string").slice(0, MAX_WORKSPACES),
        activeWorkspaceId: typeof stored.activeWorkspaceId === "string" ? stored.activeWorkspaceId : null,
        lastWorkspaceId: typeof stored.lastWorkspaceId === "string" ? stored.lastWorkspaceId : workspaces.find((workspace) => workspace.name === "Last workspace")?.id || null,
        autoRestore: stored.autoRestore !== false,
        exportOptions: normalizeExportPreferences(stored.exportOptions),
        quickNoteRecentTargets: Array.isArray(stored.quickNoteRecentTargets) ? stored.quickNoteRecentTargets.filter((item) => typeof item === "string").slice(0, 5) : [],
      };
    } catch { return { version: SCHEMA_VERSION, tabs: [], activeTab: null, recentlyClosed: [], workspaces: [], activeWorkspaceId: null, lastWorkspaceId: null, autoRestore: true, exportOptions: normalizeExportPreferences(), quickNoteRecentTargets: [] }; }
  }

  function persist() {
    try {
      const payload = JSON.stringify(state);
      if (payload.length > 500000 || /"content(?:Html)?"\s*:/.test(payload)) throw new Error("Workspace preference payload is unsafe");
      localStorage.setItem(KEY, payload);
      return true;
    } catch (error) {
      console.error("[TextForge workspace] preference save failed", error);
      return false;
    }
  }
  function docs() { return host.getDocuments().filter((doc) => !doc.deletedAt); }
  function metadataDocs() { return (host.getDocumentMetadata?.() || host.getDocuments()).filter((doc) => !doc.deletedAt); }
  function active() { return host.getActiveDocument(); }
  function byId(id) { return docs().find((doc) => doc.id === id); }
  function esc(value) { const node = document.createElement("span"); node.textContent = String(value || ""); return node.innerHTML; }
  function plain(html) { const node = document.createElement("div"); node.innerHTML = html || ""; return node.textContent || ""; }

  function emptyQuickNoteDraft() {
    return { version: QUICK_NOTE_DRAFT_VERSION, operationId: crypto.randomUUID(), title: "", body: "", target: "new-inbox", folderId: "", tags: "", openAfter: false, updatedAt: new Date().toISOString() };
  }

  function loadQuickNoteDraft() {
    try {
      const value = JSON.parse(sessionStorage.getItem(QUICK_NOTE_DRAFT_KEY) || "null");
      if (!value || value.version !== QUICK_NOTE_DRAFT_VERSION) return emptyQuickNoteDraft();
      return {
        version: QUICK_NOTE_DRAFT_VERSION,
        operationId: typeof value.operationId === "string" && value.operationId ? value.operationId : crypto.randomUUID(),
        title: String(value.title || "").slice(0, 240),
        body: String(value.body || "").slice(0, 50000),
        target: typeof value.target === "string" ? value.target : "new-inbox",
        folderId: typeof value.folderId === "string" ? value.folderId : "",
        tags: String(value.tags || "").slice(0, 500),
        openAfter: value.openAfter === true,
        updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
      };
    } catch { return emptyQuickNoteDraft(); }
  }

  function storeQuickNoteDraft(draft) {
    try {
      sessionStorage.setItem(QUICK_NOTE_DRAFT_KEY, JSON.stringify({ ...draft, version: QUICK_NOTE_DRAFT_VERSION, updatedAt: new Date().toISOString() }));
      return true;
    } catch { return false; }
  }

  function clearQuickNoteDraft() {
    try { sessionStorage.removeItem(QUICK_NOTE_DRAFT_KEY); } catch { /* The next open safely falls back to an empty draft. */ }
  }

  function ensureTabs() {
    const valid = new Set(docs().map((doc) => doc.id));
    state.tabs = state.tabs.filter((tab) => valid.has(tab.docId));
    const current = active()?.id;
    if (current && !state.tabs.some((tab) => tab.docId === current) && !host.getDetachedDocuments?.().some((item) => item.documentId === current)) state.tabs.push({ docId: current, viewState: null });
    if (!state.activeTab || !valid.has(state.activeTab)) state.activeTab = current || state.tabs[0]?.docId || null;
    if (state.tabs.length > MAX_TABS) state.tabs = state.tabs.slice(-MAX_TABS);
    persist();
  }

  function tabById(id) { return state.tabs.find((tab) => tab.docId === id); }

  function rememberView(id, viewState = host.captureMainViewState?.()) {
    const tab = tabById(id);
    if (tab && viewState && typeof viewState === "object") tab.viewState = viewState;
  }

  function activateTab(id, options = {}) {
    const tab = tabById(id);
    if (!tab || !byId(id)) return false;
    const currentId = active()?.id;
    if (currentId && currentId !== id) rememberView(currentId);
    state.activeTab = id;
    persist();
    host.openDocument(id, { source: options.source || "tab", viewState: tab.viewState, focus: options.focus !== false });
    return true;
  }

  function installChrome() {
    const workspace = document.querySelector(".workspace");
    if (!workspace || document.querySelector("#tfTabStrip")) return;
    const strip = document.createElement("nav");
    strip.id = "tfTabStrip";
    strip.className = "tf-tab-strip";
    strip.setAttribute("role", "tablist");
    strip.setAttribute("aria-label", "Open documents");
    workspace.insertBefore(strip, workspace.querySelector(".content-area"));
    renderTabs();
  }

  function renderTabs() {
    const strip = document.querySelector("#tfTabStrip");
    if (!strip) return;
    ensureTabs();
    strip.innerHTML = "";
    state.tabs.forEach((tabState, index) => {
      const id = tabState.docId;
      const doc = byId(id); if (!doc) return;
      const tab = document.createElement("button");
      tab.type = "button"; tab.className = `tf-tab${id === active()?.id ? " active" : ""}`; tab.draggable = true;
      tab.id = `tf-tab-${id}`;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(id === active()?.id));
      tab.setAttribute("aria-controls", "editorGrid");
      tab.setAttribute("aria-label", doc.title || "Untitled");
      tab.tabIndex = id === active()?.id ? 0 : -1;
      tab.innerHTML = `<span class="tf-tab-label">${esc(doc.title || "Untitled")}</span><span class="tf-tab-close" title="Close tab" aria-hidden="true">x</span>`;
      tab.addEventListener("click", (event) => {
        if (event.target.closest(".tf-tab-close")) { closeTab(id); return; }
        activateTab(id);
      });
      tab.addEventListener("contextmenu", (event) => { event.preventDefault(); openTabContextMenu(id, event.clientX, event.clientY); });
      tab.addEventListener("keydown", (event) => {
        if (event.key === "Enter") { event.preventDefault(); activateTab(id); }
        if (event.code === "Space") { event.preventDefault(); openQuickLook(doc, { source: "tab", items: state.tabs.map((item) => quickItem(item.docId, "tab")) }); }
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const direction = event.key === "ArrowLeft" ? -1 : 1;
          if (event.altKey && event.shiftKey) reorderTab(id, Math.max(0, Math.min(state.tabs.length - 1, index + direction)));
          else strip.querySelectorAll('[role="tab"]')[(index + direction + state.tabs.length) % state.tabs.length]?.focus();
        }
      });
      tab.addEventListener("dragstart", () => { tab.dataset.dragging = "true"; });
      tab.addEventListener("dragend", () => { delete tab.dataset.dragging; });
      tab.addEventListener("dragover", (event) => event.preventDefault());
      tab.addEventListener("drop", (event) => {
        event.preventDefault();
        const from = state.tabs.findIndex((item) => strip.querySelector(`[data-doc-id="${CSS.escape(item.docId)}"]`)?.dataset.dragging === "true");
        const to = state.tabs.findIndex((item) => item.docId === id);
        if (from >= 0 && to >= 0 && from !== to) reorderTab(state.tabs[from].docId, to);
      });
      tab.dataset.docId = id;
      strip.append(tab);
    });
  }

  function reorderTab(id, to) {
    const from = state.tabs.findIndex((tab) => tab.docId === id);
    if (from < 0 || to < 0 || to >= state.tabs.length || from === to) return;
    const [moved] = state.tabs.splice(from, 1);
    state.tabs.splice(to, 0, moved);
    persist(); renderTabs();
    requestAnimationFrame(() => document.querySelector(`[data-doc-id="${CSS.escape(id)}"]`)?.focus());
  }

  function closeTab(id) {
    const index = state.tabs.findIndex((tab) => tab.docId === id); if (index < 0) return;
    rememberView(id);
    const [closed] = state.tabs.splice(index, 1);
    if (byId(id)) state.recentlyClosed.unshift({ ...closed, closedAt: Date.now(), originalIndex: index });
    state.recentlyClosed = state.recentlyClosed.slice(0, MAX_CLOSED_TABS);
    if (active()?.id === id) {
      let next = state.tabs[index]?.docId || state.tabs[index - 1]?.docId;
      if (!next) {
        next = docs().find((doc) => doc.id !== id)?.id || docs()[0]?.id;
        if (next && !tabById(next)) state.tabs.push({ docId: next, viewState: null });
      }
      if (next) activateTab(next, { source: "tab-close" });
    }
    persist(); renderTabs();
  }

  function closeOtherTabs(id) { [...state.tabs].filter((tab) => tab.docId !== id).forEach((tab) => closeTab(tab.docId)); activateTab(id); }
  function closeTabsToRight(id) { const index = state.tabs.findIndex((tab) => tab.docId === id); [...state.tabs.slice(index + 1)].forEach((tab) => closeTab(tab.docId)); }
  function reopenClosedTab() {
    while (state.recentlyClosed.length) {
      const closed = state.recentlyClosed.shift();
      if (!byId(closed.docId) || tabById(closed.docId)) continue;
      const requestedIndex = Number.isInteger(Number(closed.originalIndex)) ? Number(closed.originalIndex) : state.tabs.length;
      const index = Math.max(0, Math.min(state.tabs.length, requestedIndex));
      state.tabs.splice(index, 0, { docId: closed.docId, viewState: closed.viewState || null });
      persist(); renderTabs(); activateTab(closed.docId, { source: "tab-reopen" }); return true;
    }
    persist(); return false;
  }

  function openTabContextMenu(id, x, y) {
    tabContextMenu?.remove();
    tabContextMenu = document.createElement("div");
    tabContextMenu.className = "tf-tab-menu";
    tabContextMenu.setAttribute("role", "menu");
    tabContextMenu.innerHTML = '<button role="menuitem" data-tab-action="quicklook">빠른 보기</button><button role="menuitem" data-tab-action="close">탭 닫기</button><button role="menuitem" data-tab-action="others">다른 탭 닫기</button><button role="menuitem" data-tab-action="right">오른쪽 탭 닫기</button><button role="menuitem" data-tab-action="split">분할로 열기</button><button role="menuitem" data-tab-action="detach">별도 창에서 편집</button>';
    tabContextMenu.style.left = `${Math.min(x, innerWidth - 190)}px`;
    tabContextMenu.style.top = `${Math.min(y, innerHeight - 210)}px`;
    tabContextMenu.addEventListener("click", (event) => {
      const action = event.target.dataset.tabAction;
      if (action === "quicklook") openQuickLook(byId(id), { source: "tab" });
      if (action === "close") closeTab(id);
      if (action === "others") closeOtherTabs(id);
      if (action === "right") closeTabsToRight(id);
      if (action === "split") host.openDocumentInNewPane(id, { mode: id === active()?.id ? "preview" : "rich" });
      if (action === "detach") openDetached(id);
      tabContextMenu.remove();
    });
    document.body.append(tabContextMenu);
    tabContextMenu.querySelector("button")?.focus();
  }

  function renderContext() {
    const bar = document.querySelector("#tfContextBar"); const doc = active(); if (!bar || !doc) return;
    const wordCount = plain(doc.contentHtml).trim().split(/\s+/).filter(Boolean).length;
    bar.innerHTML = `<span>${esc(doc.title || "Untitled")}</span><span>${wordCount.toLocaleString()} words</span><span>${doc.tags.map((tag) => `#${esc(tag)}`).join(" ") || "No tags"}</span><button type="button" data-tf-action="inspector" aria-haspopup="true">Inspector</button><button type="button" data-tf-action="versions">Versions</button><button type="button" data-tf-action="quicklook">Quick Look</button><button type="button" data-tf-action="export">Export Studio</button><button type="button" data-tf-action="workspace">Workspaces</button>`;
    bar.querySelector('[data-tf-action="inspector"]').addEventListener("click", () => host.setInspectorOpen(true, "context"));
    bar.querySelector('[data-tf-action="versions"]').addEventListener("click", openVersions);
    bar.querySelector('[data-tf-action="quicklook"]').addEventListener("click", () => openQuickLook(doc));
    bar.querySelector('[data-tf-action="export"]').addEventListener("click", openExportStudio);
    bar.querySelector('[data-tf-action="workspace"]').addEventListener("click", openWorkspaceManager);
  }

  function overlay(id, title, body) {
    document.querySelector(`#${id}`)?.remove();
    const previousFocus = document.activeElement;
    const root = document.createElement("div"); root.id = id; root.className = "tf-overlay"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true");
    root.innerHTML = `<section class="tf-modal"><header class="tf-modal-head"><h2>${esc(title)}</h2><button class="tf-icon-button" type="button" aria-label="Close">x</button></header><div class="tf-modal-body"></div></section>`;
    root.querySelector(".tf-modal-body").append(body);
    const close = () => { root.remove(); if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); };
    root.closeDialog = close;
    root.addEventListener("click", (event) => { if (event.target === root || event.target.closest(".tf-modal-head button")) close(); });
    root.addEventListener("keydown", (event) => {
      if (event.key === "Escape") { event.preventDefault(); close(); return; }
      if (event.key !== "Tab") return;
      const focusable = [...root.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((element) => !element.hidden);
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    document.body.append(root); root.querySelector("button")?.focus({ preventScroll: true }); return root;
  }

  function sanitizePreview(html) {
    return window.TextForgeQuickLookController?.sanitize(html) || "<p></p>";
  }

  function quickItem(value, source = "main") {
    if (!value) return null;
    if (value.type === "version") return { ...value, type: "version", id: value.id || value.snapshotId, snapshotId: value.snapshotId || value.id, docId: value.docId, source: value.source || source };
    const id = typeof value === "string" ? value : value.id || value.docId;
    return id ? { ...(typeof value === "object" ? value : {}), type: "document", id, docId: id, source: value?.source || source } : null;
  }

  function openQuickLook(value = active(), options = {}) {
    const initial = quickItem(value, options.source || "main");
    if (!initial || !quickLookController || typeof host.getPreview !== "function") return false;
    const ordered = (options.items || metadataDocs().map((doc) => quickItem(doc, options.source || "main"))).filter(Boolean);
    if (!ordered.some((item) => item.key ? item.key === initial.key : item.type === initial.type && item.id === initial.id)) ordered.unshift(initial);
    return quickLookController.open({
      item: initial,
      items: ordered,
      focusTarget: options.focusTarget || document.activeElement,
      title: options.title || "Quick Look",
      openLabel: options.openLabel || "Open document",
    });
  }

  function versionBlocks(html) {
    const template = document.createElement("template"); template.innerHTML = sanitizePreview(html);
    return [...template.content.children].map((node, index) => ({ index, html: node.outerHTML, text: (node.textContent || "").replace(/\s+/g, " ").trim(), tag: node.tagName.toLowerCase() }));
  }

  function inlineChange(before, after) {
    let start = 0; while (start < before.length && start < after.length && before[start] === after[start]) start += 1;
    let end = 0; while (end < before.length - start && end < after.length - start && before.at(-1 - end) === after.at(-1 - end)) end += 1;
    const prefix = esc(before.slice(0, start));
    const oldMiddle = esc(before.slice(start, before.length - end));
    const newMiddle = esc(after.slice(start, after.length - end));
    const suffix = esc(before.slice(before.length - end));
    return { oldHtml: `${prefix}<del>${oldMiddle}</del>${suffix}`, newHtml: `${prefix}<ins>${newMiddle}</ins>${suffix}` };
  }

  function alignVersionBlocks(oldBlocks, currentBlocks) {
    const rows = oldBlocks.length + 1;
    const cols = currentBlocks.length + 1;
    if (rows * cols > 180000) {
      const length = Math.max(oldBlocks.length, currentBlocks.length);
      return Array.from({ length }, (_, index) => ({ old: oldBlocks[index] || null, current: currentBlocks[index] || null, kind: !oldBlocks[index] ? "added" : !currentBlocks[index] ? "deleted" : oldBlocks[index].text === currentBlocks[index].text ? "unchanged" : "changed" }));
    }
    const table = Array.from({ length: rows }, () => new Uint16Array(cols));
    for (let i = oldBlocks.length - 1; i >= 0; i -= 1) for (let j = currentBlocks.length - 1; j >= 0; j -= 1) table[i][j] = oldBlocks[i].text === currentBlocks[j].text ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    const result = []; let i = 0; let j = 0; let pendingOld = []; let pendingCurrent = [];
    const flush = () => {
      const length = Math.max(pendingOld.length, pendingCurrent.length);
      for (let k = 0; k < length; k += 1) result.push({ old: pendingOld[k] || null, current: pendingCurrent[k] || null, kind: !pendingOld[k] ? "added" : !pendingCurrent[k] ? "deleted" : "changed" });
      pendingOld = []; pendingCurrent = [];
    };
    while (i < oldBlocks.length || j < currentBlocks.length) {
      if (i < oldBlocks.length && j < currentBlocks.length && oldBlocks[i].text === currentBlocks[j].text) { flush(); result.push({ old: oldBlocks[i++], current: currentBlocks[j++], kind: "unchanged" }); }
      else if (j >= currentBlocks.length || (i < oldBlocks.length && table[i + 1][j] >= table[i][j + 1])) pendingOld.push(oldBlocks[i++]);
      else pendingCurrent.push(currentBlocks[j++]);
    }
    flush(); return result;
  }

  function openVersions() {
    const doc = active(); if (!doc) return false;
    host.saveEditorSelection?.();
    const snapshots = doc.history || [];
    const body = document.createElement("div"); body.className = "tf-versions-layout";
    body.innerHTML = '<aside class="tf-version-timeline" aria-label="Version timeline"></aside><section class="tf-version-stage"><div class="tf-version-nav"><button type="button" data-change="-1">Previous change</button><span aria-live="polite">Select a version</span><button type="button" data-change="1">Next change</button></div><div class="tf-version-compare" aria-label="Read-only version comparison"></div></section>';
    const timeline = body.querySelector(".tf-version-timeline"); const compare = body.querySelector(".tf-version-compare"); const status = body.querySelector(".tf-version-nav span");
    let selected = null; let changes = []; let changeIndex = -1;
    const renderDiff = (snapshot) => {
      selected = snapshot; compare.innerHTML = '<p class="loading-preview">Calculating changes...</p>';
      setTimeout(() => {
        const oldBlocks = versionBlocks(snapshot.contentHtml || snapshot.content || "");
        const currentBlocks = versionBlocks(host.getPreview({ type: "document", id: doc.id })?.contentHtml || doc.contentHtml);
        const rows = alignVersionBlocks(oldBlocks, currentBlocks);
        compare.innerHTML = '<header><strong>Past version</strong><strong>Current document</strong></header>';
        rows.forEach((row) => {
          const line = document.createElement("div"); line.className = `tf-diff-row ${row.kind}`; line.dataset.diffKind = row.kind;
          let oldHtml = row.old ? esc(row.old.text) : ""; let newHtml = row.current ? esc(row.current.text) : "";
          if (row.kind === "changed") ({ oldHtml, newHtml } = inlineChange(row.old.text, row.current.text));
          line.innerHTML = `<div>${row.old ? `<label><input type="checkbox" data-version-block="${row.old.index}"> Take block</label>` : ""}<span class="tf-diff-label">${row.kind === "deleted" ? "Deleted" : row.kind === "changed" ? "Changed before" : row.kind === "unchanged" ? "Unchanged" : "No past block"}</span><p>${oldHtml}</p></div><div><span class="tf-diff-label">${row.kind === "added" ? "Added" : row.kind === "changed" ? "Changed now" : row.kind === "unchanged" ? "Unchanged" : "No current block"}</span><p>${newHtml}</p></div>`;
          compare.append(line);
        });
        changes = [...compare.querySelectorAll('.tf-diff-row:not(.unchanged)')]; changeIndex = changes.length ? 0 : -1;
        status.textContent = `${changes.length} change${changes.length === 1 ? "" : "s"}`;
        changes[0]?.classList.add("current-change");
      }, 0);
    };
    snapshots.forEach((snapshot, index) => {
      const button = document.createElement("button"); button.type = "button"; button.dataset.snapshotId = snapshot.id; button.dataset.docId = doc.id; button.className = "tf-version-item";
      button.innerHTML = `<strong>${esc(snapshot.label || "Snapshot")}</strong><time>${new Date(snapshot.createdAt).toLocaleString()}</time><span>${plain(snapshot.contentHtml || snapshot.content).length.toLocaleString()} chars · ${/^Safety:/.test(snapshot.label || "") ? "Safety" : index === 0 ? "Latest" : "Saved"}</span>`;
      button.addEventListener("click", () => { timeline.querySelectorAll("button").forEach((item) => item.classList.toggle("selected", item === button)); renderDiff(snapshot); });
      button.addEventListener("keydown", (event) => { if (event.code === "Space") { event.preventDefault(); openQuickLook({ type: "version", id: snapshot.id, docId: doc.id }, { source: "versions", items: snapshots.map((item) => ({ type: "version", id: item.id, docId: doc.id })) }); } });
      timeline.append(button);
    });
    if (!snapshots.length) timeline.innerHTML = '<p class="tf-empty-state">No saved versions yet.</p>';
    body.querySelector(".tf-version-nav").addEventListener("click", (event) => {
      const button = event.target.closest("[data-change]"); if (!button || !changes.length) return;
      changes[changeIndex]?.classList.remove("current-change"); changeIndex = (changeIndex + Number(button.dataset.change) + changes.length) % changes.length;
      changes[changeIndex].classList.add("current-change"); changes[changeIndex].scrollIntoView({ block: "center" }); status.textContent = `Change ${changeIndex + 1} of ${changes.length}`;
    });
    const root = overlay("tfVersions", "이전 버전", body);
    const actions = document.createElement("div"); actions.className = "tf-modal-actions";
    actions.innerHTML = '<span class="tf-readonly-badge">읽기 전용 비교</span><button type="button" data-version="quick">빠른 보기</button><button type="button" data-version="insert">선택 블록 삽입</button><button type="button" data-version="new">새 문서로 열기</button><button type="button" data-version="restore">선택 버전 복원</button>';
    actions.addEventListener("click", (event) => {
      const action = event.target.closest("[data-version]")?.dataset.version; if (!action || !selected) return;
      if (action === "quick") { openQuickLook({ type: "version", id: selected.id, docId: doc.id }, { source: "versions", items: snapshots.map((item) => ({ type: "version", id: item.id, docId: doc.id })) }); return; }
      if (action === "insert") {
        const indexes = [...compare.querySelectorAll("[data-version-block]:checked")].map((input) => Number(input.dataset.versionBlock));
        root.closeDialog(); const result = host.insertSnapshotBlocks?.(selected.id, indexes); showOperationToast(result); return;
      }
      if (action === "new") { host.createDocumentFromSnapshot(selected); root.closeDialog(); return; }
      if (action === "restore" && confirm(`${selected.label || "이 버전"}을 복원할까요? 현재 문서는 자동 보호본으로 보존됩니다.`)) { host.restoreSnapshot(selected.id); root.closeDialog(); }
    });
    root.querySelector(".tf-modal").append(actions);
    timeline.querySelector("button")?.click();
    return true;
  }

  function openQuickNote() {
    host.flushAllEditors?.("before-quick-note-open");
    let draft = loadQuickNoteDraft();
    const available = metadataDocs();
    const revisionById = new Map(available.map((doc) => [doc.id, doc.updatedAt]));
    const recentIds = state.quickNoteRecentTargets.filter((id) => available.some((doc) => doc.id === id));
    const ordered = [...recentIds.map((id) => available.find((doc) => doc.id === id)), ...available.filter((doc) => !recentIds.includes(doc.id))].filter(Boolean);
    const targetOptions = ordered.map((doc) => `<option value="append:${esc(doc.id)}">${recentIds.includes(doc.id) ? "Recent - " : ""}${esc(doc.title || "Untitled")}</option>`).join("");
    const folderOptions = host.getFolders().map((folder) => `<option value="${esc(folder.id)}">${esc(folder.name)}</option>`).join("");
    const body = document.createElement("form"); body.className = "tf-form tf-quick-note-form";
    body.innerHTML = `<label>Title (optional)<input name="title" maxlength="240" placeholder="Generated from the first line when empty"></label><label>Body<textarea name="body" maxlength="50000" placeholder="Write a note"></textarea></label><div class="tf-export-options"><label>Save to<select name="target"><option value="new-inbox">New document in Inbox</option><option value="new-document">New document in folder</option><option value="append-current">Append to current document</option>${targetOptions}</select></label><label>Folder<select name="folder"><option value="">Inbox</option>${folderOptions}</select></label></div><label>Tags for a new document<input name="tags" placeholder="comma, separated"></label><label class="tf-check-row"><input type="checkbox" name="openAfter"> Open after saving</label><p class="tf-form-status" role="status"></p>`;
    const root = overlay("tfQuickNote", "Quick Note", body);
    const status = body.querySelector(".tf-form-status");
    const actions = document.createElement("div"); actions.className = "tf-modal-actions";
    actions.innerHTML = '<button type="button" data-action="discard">Discard draft</button><button type="button" data-action="cancel">Cancel</button><button type="submit" data-action="save">Save note</button>';
    root.querySelector(".tf-modal").append(actions);
    const fields = body.elements;
    fields.title.value = draft.title;
    fields.body.value = draft.body;
    fields.target.value = [...fields.target.options].some((option) => option.value === draft.target) ? draft.target : "new-inbox";
    fields.folder.value = [...fields.folder.options].some((option) => option.value === draft.folderId) ? draft.folderId : "";
    fields.tags.value = draft.tags;
    fields.openAfter.checked = draft.openAfter;
    let draftTimer = null;
    let submitting = false;
    let composing = false;
    const readDraft = () => ({ ...draft, title: fields.title.value, body: fields.body.value, target: fields.target.value, folderId: fields.folder.value, tags: fields.tags.value, openAfter: fields.openAfter.checked });
    const saveDraftSoon = () => { clearTimeout(draftTimer); draftTimer = setTimeout(() => { draft = readDraft(); storeQuickNoteDraft(draft); }, 220); };
    const setSubmitting = (value) => { submitting = value; actions.querySelectorAll("button").forEach((button) => { button.disabled = value; }); fields.body.setAttribute("aria-busy", String(value)); };
    body.addEventListener("input", saveDraftSoon);
    body.addEventListener("change", saveDraftSoon);
    body.addEventListener("compositionstart", () => { composing = true; });
    body.addEventListener("compositionend", () => { composing = false; saveDraftSoon(); });
    body.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && (composing || event.isComposing)) { event.stopPropagation(); return; }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && !event.isComposing && !composing) { event.preventDefault(); body.requestSubmit(); }
    });
    body.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submitting || composing || event.isComposing) return;
      clearTimeout(draftTimer);
      draft = readDraft();
      storeQuickNoteDraft(draft);
      if (!draft.body.trim()) { status.textContent = "Write something before saving."; fields.body.focus({ preventScroll: true }); return; }
      setSubmitting(true); status.textContent = "Saving...";
      try {
        const targetId = draft.target.startsWith("append:") ? draft.target.slice(7) : draft.target === "append-current" ? active()?.id : null;
        const result = await host.saveQuickNote?.({
          ...draft,
          folderId: draft.folderId || null,
          tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          targetRevision: targetId ? revisionById.get(targetId) : null,
        });
        if (!result?.ok) { status.textContent = result?.reason || "Quick Note could not be saved."; return; }
        clearQuickNoteDraft();
        if (targetId) state.quickNoteRecentTargets = [targetId, ...state.quickNoteRecentTargets.filter((id) => id !== targetId)].slice(0, 5);
        persist();
        root.closeDialog();
        showOperationToast(result);
      } catch (error) {
        status.textContent = error?.message || "Quick Note could not be saved.";
      } finally { if (root.isConnected) setSubmitting(false); }
    });
    actions.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (action === "save") { body.requestSubmit(); return; }
      if (action === "discard") { clearTimeout(draftTimer); clearQuickNoteDraft(); root.closeDialog(); }
      if (action === "cancel") { clearTimeout(draftTimer); draft = readDraft(); storeQuickNoteDraft(draft); root.closeDialog(); }
    });
    fields.body.focus({ preventScroll: true });
  }

  function openExportStudio() {
    host.flushAllEditors?.("before-export-studio-open");
    const source = active();
    if (!source) return false;
    const capabilities = host.getExportCapabilities?.() || [];
    if (!capabilities.length) { showOperationToast({ ok: false, reason: "No export formats are available." }); return false; }
    const body = document.createElement("form"); body.className = "tf-form tf-export-studio";
    body.innerHTML = `<div class="tf-export-options"><label>Format<select name="format">${capabilities.map((item) => `<option value="${esc(item.format)}">${esc(item.label)}</option>`).join("")}</select></label><label>File name<input name="fileName" maxlength="100"></label></div><div class="tf-export-options"><label class="tf-check-row"><input type="checkbox" name="includeTitle"> Include title</label><label class="tf-check-row"><input type="checkbox" name="includeMetadata"> Include document metadata</label></div><p class="tf-export-limitation"></p><p class="tf-form-status" role="status">Preparing preview...</p><article class="tf-preview tf-export-preview" aria-label="Export preview"><p class="loading-preview">Preparing preview...</p></article>`;
    const root = overlay("tfExportStudio", "내보내기", body);
    const fields = body.elements;
    const status = body.querySelector(".tf-form-status");
    const limitation = body.querySelector(".tf-export-limitation");
    const preview = body.querySelector(".tf-export-preview");
    const actions = document.createElement("div"); actions.className = "tf-modal-actions";
    actions.innerHTML = '<button type="button" data-action="cancel">Cancel</button><button type="button" data-action="copy">Copy</button><button type="button" data-action="quicklook">Quick Look</button><button type="button" data-action="export">Export</button>';
    root.querySelector(".tf-modal").append(actions);
    let artifact = null;
    let renderTimer = null;
    let renderSequence = 0;
    let generating = false;
    const capabilityFor = (format) => capabilities.find((item) => item.format === format) || capabilities[0];
    const applyFormatPreferences = (format, replaceFileName = true) => {
      const options = state.exportOptions.byFormat[format] || { includeTitle: true, includeMetadata: false };
      fields.includeTitle.checked = options.includeTitle;
      fields.includeMetadata.checked = options.includeMetadata;
      if (replaceFileName) fields.fileName.value = `${source.title || "textforge-note"}.${capabilityFor(format).extension}`;
      limitation.textContent = capabilityFor(format).limitation || "";
    };
    const request = () => ({ documentId: source.id, format: fields.format.value, fileName: fields.fileName.value, options: { includeTitle: fields.includeTitle.checked, includeMetadata: fields.includeMetadata.checked } });
    const rememberOptions = () => {
      const format = fields.format.value;
      state.exportOptions = { ...state.exportOptions, version: 1, format, byFormat: { ...state.exportOptions.byFormat, [format]: request().options } };
      persist();
    };
    const renderPreview = () => {
      const sequence = ++renderSequence;
      status.textContent = "Generating preview...";
      setTimeout(() => {
        if (!root.isConnected || sequence !== renderSequence) return;
        const next = host.getExportPreview?.(request());
        if (sequence !== renderSequence) return;
        if (!next?.ok) { artifact = null; preview.innerHTML = '<p class="tf-empty-state">Preview unavailable.</p>'; status.textContent = next?.reason || "Preview failed. The source document was not changed."; return; }
        artifact = next;
        preview.innerHTML = sanitizePreview(next.previewHtml);
        status.textContent = `${next.fileName} - ${next.mime}`;
      }, 0);
    };
    const schedulePreview = () => { clearTimeout(renderTimer); renderTimer = setTimeout(renderPreview, 180); };
    fields.format.value = capabilities.some((item) => item.format === state.exportOptions.format) ? state.exportOptions.format : capabilities[0].format;
    applyFormatPreferences(fields.format.value);
    fields.format.addEventListener("change", () => { state.exportOptions.format = fields.format.value; applyFormatPreferences(fields.format.value); persist(); schedulePreview(); });
    [fields.fileName, fields.includeTitle, fields.includeMetadata].forEach((control) => control.addEventListener("input", () => { rememberOptions(); schedulePreview(); }));
    actions.addEventListener("click", async (event) => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (!action || generating) return;
      if (action === "cancel") { clearTimeout(renderTimer); root.closeDialog(); return; }
      if (action === "quicklook") {
        if (!artifact) { status.textContent = "Wait for the preview to finish."; return; }
        exportQuickLookController?.open({ item: { id: `export:${source.id}:${artifact.format}`, title: artifact.fileName, contentHtml: artifact.previewHtml, charCount: artifact.copyText.length, sourceContext: "Export Studio", available: true }, items: [], focusTarget: event.target, title: "Export Quick Look", openLabel: "Return to Export Studio" });
        return;
      }
      generating = true;
      actions.querySelectorAll("button").forEach((button) => { button.disabled = true; });
      status.textContent = action === "copy" ? "Copying..." : "Generating export...";
      try {
        const result = action === "copy" ? await host.copyExportDocument?.(request()) : await host.exportDocument?.(request());
        status.textContent = result?.message || result?.reason || "The export action could not be completed.";
        if (!result?.ok) preview.setAttribute("aria-invalid", "true"); else preview.removeAttribute("aria-invalid");
      } catch (error) { status.textContent = error?.message || "Export failed. The source document was not changed."; }
      finally { generating = false; actions.querySelectorAll("button").forEach((button) => { button.disabled = false; }); }
    });
    renderPreview();
    return true;
  }

  function openDetached(documentId = active()?.id) {
    const doc = byId(documentId); if (!doc) return false;
    const index = state.tabs.findIndex((tab) => tab.docId === doc.id);
    const viewState = doc.id === active()?.id ? host.captureMainViewState?.() : tabById(doc.id)?.viewState || null;
    const result = host.openDetachedEditor?.(doc.id, { originalTabIndex: index >= 0 ? index : null, viewState });
    if (!result?.ok) return false;
    if (index >= 0) {
      const [detachedTab] = state.tabs.splice(index, 1);
      state.recentlyClosed = state.recentlyClosed.filter((item) => item.docId !== doc.id);
      if (active()?.id === doc.id) {
        const next = state.tabs[index]?.docId || state.tabs[index - 1]?.docId || docs().find((item) => item.id !== doc.id)?.id;
        if (next) activateTab(next, { source: "detach" });
      }
      if (detachedTab) persist();
      renderTabs();
    }
    scheduleWorkspaceSave();
    return true;
  }

  function showOperationToast(result) {
    document.querySelector("#tfOperationToast")?.remove();
    const toast = document.createElement("div"); toast.id = "tfOperationToast"; toast.className = `tf-operation-toast${result?.ok ? "" : " error"}`; toast.setAttribute("role", result?.ok ? "status" : "alert");
    toast.innerHTML = `<span>${esc(result?.message || result?.reason || "The operation could not be completed.")}</span>${result?.ok && result.operationId ? '<button type="button">Undo</button>' : ""}`;
    toast.querySelector("button")?.addEventListener("click", () => { const undone = host.undoSelectionOperation?.(result.operationId); showOperationToast(undone); });
    document.body.append(toast); clearTimeout(operationToastTimer); operationToastTimer = setTimeout(() => toast.remove(), 6000);
  }

  function openSelectionTarget(payload) {
    if (!payload?.ok) return showOperationToast(payload);
    const body = document.createElement("div"); body.className = "tf-selection-target";
    body.innerHTML = '<label>Find a destination<input type="search" autocomplete="off" placeholder="Title, folder, or tag"></label><p>Placement: document end. Move uses copy, save, then source delete.</p><div class="tf-target-list" role="listbox"></div>';
    const input = body.querySelector("input"); const list = body.querySelector(".tf-target-list");
    const render = () => {
      const query = input.value.trim().toLocaleLowerCase();
      const folders = new Map(host.getFolders().map((folder) => [folder.id, folder.name]));
      const items = metadataDocs().filter((doc) => doc.id !== payload.docId && !doc.deletedAt && `${doc.title} ${doc.tags.join(" ")} ${folders.get(doc.folderId) || "Inbox"}`.toLocaleLowerCase().includes(query)).sort((a, b) => Number(b.favorite) - Number(a.favorite) || new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 60);
      list.innerHTML = "";
      items.forEach((doc) => {
        const row = document.createElement("div"); row.className = "tf-target-row"; row.dataset.docId = doc.id;
        row.innerHTML = `<div><strong>${esc(doc.title || "Untitled")}</strong><span>${esc(folders.get(doc.folderId) || "Inbox")} · ${new Date(doc.updatedAt).toLocaleString()}${doc.favorite ? " · Favorite" : ""}</span></div><div><button type="button" data-send="copy">Copy</button><button type="button" data-send="move">Move</button><button type="button" data-send="link">Link</button></div>`;
        list.append(row);
      });
      if (!items.length) list.innerHTML = '<p class="tf-empty-state">No available destination.</p>';
    };
    const root = overlay("tfSelectionTarget", "Send Selection", body);
    body.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-send]"); const row = button?.closest("[data-doc-id]"); if (!button || !row) return;
      const action = button.dataset.send;
      const result = action === "link"
        ? host.insertDocumentLinkFromSelection(payload.token, row.dataset.docId)
        : await host.runCrossDocumentSelectionOperation(action, payload.token, row.dataset.docId);
      root.closeDialog(); showOperationToast(result);
    });
    input.addEventListener("input", render); render(); input.focus({ preventScroll: true });
  }

  async function runSelectionAction(action, payload = selectionPayload) {
    if (!payload?.ok) return showOperationToast(payload || { ok: false, reason: "Select content again." });
    if (action === "send") return openSelectionTarget(payload);
    if (action === "copy") { navigator.clipboard?.writeText(payload.text); selectionMenu.classList.add("hidden"); return; }
    if (action === "new-copy" || action === "new-move") {
      const title = prompt("New document title", `${byId(payload.docId)?.title || "Note"} excerpt`);
      if (title === null) return;
      const result = await host.createDocumentFromSelection(payload.token, action === "new-move", title);
      selectionMenu.classList.add("hidden"); showOperationToast(result); return;
    }
    if (action === "delete" && payload.blockCount > 1 && !confirm(`Delete ${payload.blockCount} selected paragraphs? A Safety Snapshot will be created.`)) return;
    const result = host.runLocalSelectionOperation(action, payload.token);
    selectionMenu.classList.add("hidden"); showOperationToast(result);
  }

  function installSelectionObject() {
    selectionMenu = document.createElement("div"); selectionMenu.className = "tf-selection-menu hidden"; selectionMenu.setAttribute("role", "toolbar"); selectionMenu.setAttribute("aria-label", "Selection actions");
    selectionMenu.innerHTML = '<span class="tf-selection-kind"></span><button type="button" data-action="move-up" title="Move paragraph up">&#8593;</button><button type="button" data-action="move-down" title="Move paragraph down">&#8595;</button><button type="button" data-action="duplicate">Duplicate</button><button type="button" data-action="delete">Delete</button><button type="button" data-action="new-copy">New document</button><button type="button" data-action="new-move">Move to new</button><button type="button" data-action="send">Send...</button>';
    selectionMenu.addEventListener("mousedown", (event) => event.preventDefault());
    selectionMenu.addEventListener("click", (event) => { const action = event.target.closest("[data-action]")?.dataset.action; if (action) runSelectionAction(action); });
    document.body.append(selectionMenu);
    let frame = null;
    document.addEventListener("selectionchange", () => {
      cancelAnimationFrame(frame); frame = requestAnimationFrame(() => {
        const sel = window.getSelection(); const anchor = sel?.anchorNode; const main = document.querySelector("#richEditor"); const reference = document.querySelector("#referencePaneBody");
        const inspectorState = host.getInspectorState();
        if (!sel || sel.isCollapsed || (!main?.contains(anchor) && !reference?.contains(anchor)) || (inspectorState.open && inspectorState.tab === "context") || host.isComposing()) { selectionMenu.classList.add("hidden"); selectionPayload = null; return; }
        selectionPayload = host.captureSelectionObject();
        if (!selectionPayload?.ok) { selectionMenu.classList.add("hidden"); return; }
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        selectionMenu.querySelector(".tf-selection-kind").textContent = `${selectionPayload.kind}${selectionPayload.expandsToBlocks ? " · paragraph move expands" : ""}`;
        selectionMenu.querySelectorAll('[data-action^="move-"]').forEach((button) => { button.disabled = !selectionPayload.canMoveBlocks; });
        selectionMenu.style.left = `${Math.max(8, Math.min(innerWidth - 620, rect.left))}px`; selectionMenu.style.top = `${Math.max(8, rect.top - 46)}px`; selectionMenu.classList.remove("hidden");
      });
    });
  }

  function rgbToHex(value, fallback) {
    const match = String(value || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    return match ? `#${match.slice(1, 4).map((part) => Number(part).toString(16).padStart(2, "0")).join("")}` : fallback;
  }

  function installContextualInspector() {
    const panel = document.querySelector("#contextInspectorPanel");
    const body = document.querySelector("#contextInspectorBody");
    if (!panel || !body || typeof host.getContextualInspectorState !== "function") return;
    let timer = null;
    const group = (name) => body.querySelector(`[data-context-group="${name}"]`);
    const setPressed = (command, value) => {
      const button = body.querySelector(`[data-context-command="${command}"]`);
      if (button) button.setAttribute("aria-pressed", value === "mixed" ? "mixed" : String(Boolean(value)));
    };
    const render = () => {
      timer = null;
      if (host.isComposing()) return;
      const info = host.getContextualInspectorState();
      const textLike = ["caret", "text", "link"].includes(info.kind);
      group("inline").hidden = !textLike;
      group("text").hidden = !textLike;
      group("align").hidden = !textLike;
      group("link").hidden = !textLike;
      group("image").hidden = info.kind !== "image";
      group("table").hidden = info.kind !== "table";
      document.querySelector("#contextInspectorKind").textContent = ({ caret: "Caret", text: "Text selection", link: "Link", image: "Image", table: "Table", none: "No selection" })[info.kind] || info.kind;
      if (textLike) {
        setPressed("bold", info.bold); setPressed("italic", info.italic); setPressed("underline", info.underline); setPressed("strikeThrough", info.strikeThrough);
        const block = document.querySelector("#contextBlock"); if ([...block.options].some((option) => option.value === info.block)) block.value = info.block;
        const size = document.querySelector("#contextSize"); if ([...size.options].some((option) => option.value === info.fontSize)) size.value = info.fontSize;
        const font = document.querySelector("#contextFont"); const fontOption = [...font.options].find((option) => info.fontFamily?.toLowerCase().includes(option.textContent.toLowerCase())); if (fontOption) font.value = fontOption.value;
        document.querySelector("#contextColor").value = rgbToHex(info.foreColor, "#17212b");
        document.querySelector("#contextBackground").value = rgbToHex(info.backColor, "#fff2a8");
        document.querySelector("#contextLinkHref").value = info.href || "";
      }
      if (info.kind === "image") {
        const width = document.querySelector("#contextImageWidth"); if ([...width.options].some((option) => option.value === info.width)) width.value = info.width; else width.value = "auto";
        document.querySelector("#contextImageAlt").value = info.alt || "";
      }
    };
    const schedule = () => { clearTimeout(timer); timer = setTimeout(render, 70); };
    panel.addEventListener("pointerdown", () => host.saveEditorSelection(), true);
    body.addEventListener("click", (event) => {
      const button = event.target.closest("[data-context-command]"); if (!button) return;
      const action = button.dataset.contextCommand;
      let value = button.dataset.value || "";
      if (action === "link-set") value = document.querySelector("#contextLinkHref").value.trim();
      host.runContextualInspectorCommand(action, value);
      schedule();
    });
    document.querySelector("#contextBlock").addEventListener("change", (event) => { host.runContextualInspectorCommand("block", event.target.value); schedule(); });
    document.querySelector("#contextFont").addEventListener("change", (event) => { host.runContextualInspectorCommand("fontFamily", event.target.value); schedule(); });
    document.querySelector("#contextSize").addEventListener("change", (event) => { host.runContextualInspectorCommand("fontSize", event.target.value); schedule(); });
    document.querySelector("#contextColor").addEventListener("change", (event) => { host.runContextualInspectorCommand("color", event.target.value); schedule(); });
    document.querySelector("#contextBackground").addEventListener("change", (event) => { host.runContextualInspectorCommand("backgroundColor", event.target.value); schedule(); });
    document.querySelector("#contextImageWidth").addEventListener("change", (event) => { host.runContextualInspectorCommand("image-width", event.target.value); schedule(); });
    document.querySelector("#contextImageAlt").addEventListener("change", (event) => { host.runContextualInspectorCommand("image-alt", event.target.value); schedule(); });
    document.querySelector("#contextInspectorClose").addEventListener("click", () => { host.setInspectorOpen(false); host.focusEditor(); });
    document.addEventListener("selectionchange", schedule);
    document.querySelector("#richEditor")?.addEventListener("keyup", schedule);
    document.querySelector("#richEditor")?.addEventListener("mouseup", schedule);
    document.addEventListener("pointerdown", (event) => {
      if (host.getInspectorState().open && host.getInspectorState().tab === "context" && !panel.contains(event.target) && !document.querySelector("#richEditor")?.contains(event.target) && !event.target.closest("#inspectorToggleBtn, [data-tf-action='inspector']")) host.setInspectorOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && host.getInspectorState().open && host.getInspectorState().tab === "context") { host.setInspectorOpen(false); host.focusEditor(); }
    });
    window.addEventListener("textforge:active-document-change", schedule);
    window.addEventListener("textforge:inspector-change", schedule);
    render();
  }

  function createWorkspaceSnapshot(name, id = crypto.randomUUID()) {
    const currentId = active()?.id;
    if (currentId) rememberView(currentId);
    return {
      version: 2,
      id,
      name,
      tabs: state.tabs.map((tab) => ({ docId: tab.docId, viewState: tab.viewState || null })),
      activeTab: currentId || state.activeTab || null,
      recentlyClosed: state.recentlyClosed.slice(0, 5).map((item) => ({ docId: item.docId, viewState: item.viewState || null, originalIndex: item.originalIndex })),
      split: host.getSplitWorkspace(),
      inspector: host.getInspectorState(),
      focus: host.getFocusMode(),
      sidebarOpen: !document.querySelector(".sidebar")?.classList.contains("collapsed"),
      portalReference: null,
      detached: host.getDetachedDocuments?.() || [],
      savedAt: new Date().toISOString(),
    };
  }

  function sameWorkspaceName(name, exceptId = null) {
    const normalized = String(name || "").trim().toLocaleLowerCase();
    return state.workspaces.some((workspace) => workspace.id !== exceptId && workspace.name.trim().toLocaleLowerCase() === normalized);
  }

  function commitWorkspaceMutation(mutator) {
    const backup = JSON.stringify({
      workspaces: state.workspaces,
      activeWorkspaceId: state.activeWorkspaceId,
      lastWorkspaceId: state.lastWorkspaceId,
      autoRestore: state.autoRestore,
    });
    mutator();
    state.workspaces = state.workspaces.slice(0, MAX_WORKSPACES);
    if (persist()) return true;
    const previous = JSON.parse(backup);
    state.workspaces = previous.workspaces;
    state.activeWorkspaceId = previous.activeWorkspaceId;
    state.lastWorkspaceId = previous.lastWorkspaceId;
    state.autoRestore = previous.autoRestore;
    return false;
  }

  function saveWorkspace(name = "Workspace", options = {}) {
    const cleanName = String(name || "").trim().slice(0, 80);
    if (!cleanName || sameWorkspaceName(cleanName, options.overwriteId || null)) return { ok: false, reason: "duplicate-or-empty-name" };
    host.flushAllEditors?.("before-workspace-save");
    const backup = JSON.stringify({ workspaces: state.workspaces, activeWorkspaceId: state.activeWorkspaceId, lastWorkspaceId: state.lastWorkspaceId });
    const existingIndex = options.overwriteId ? state.workspaces.findIndex((workspace) => workspace.id === options.overwriteId) : -1;
    const id = existingIndex >= 0 ? state.workspaces[existingIndex].id : crypto.randomUUID();
    const snapshot = createWorkspaceSnapshot(cleanName, id);
    if (existingIndex >= 0) state.workspaces.splice(existingIndex, 1, snapshot);
    else state.workspaces.unshift(snapshot);
    state.workspaces = state.workspaces.slice(0, MAX_WORKSPACES);
    state.activeWorkspaceId = id;
    state.lastWorkspaceId = id;
    if (!persist()) {
      const previous = JSON.parse(backup);
      state.workspaces = previous.workspaces;
      state.activeWorkspaceId = previous.activeWorkspaceId;
      state.lastWorkspaceId = previous.lastWorkspaceId;
      return { ok: false, reason: "storage-failed" };
    }
    return { ok: true, workspace: snapshot };
  }

  function restoreWorkspace(idOrName) {
    const workspace = state.workspaces.find((item) => item.id === idOrName || item.name === idOrName);
    if (!workspace) return { ok: false, reason: "missing-workspace" };
    host.flushAllEditors?.("before-workspace-switch");
    const backup = createWorkspaceSnapshot("Rollback", "rollback");
    try {
      const valid = new Set(docs().map((doc) => doc.id));
      const tabs = (workspace.tabs || []).map((tab) => typeof tab === "string" ? { docId: tab, viewState: null } : tab).filter((tab) => valid.has(tab.docId));
      const detachedFallback = (workspace.detached || []).filter((item) => valid.has(item.documentId) && !tabs.some((tab) => tab.docId === item.documentId)).map((item) => ({ docId: item.documentId, viewState: item.viewState || null }));
      state.tabs = [...tabs, ...detachedFallback].slice(0, MAX_TABS);
      const activeId = valid.has(workspace.activeTab) ? workspace.activeTab : state.tabs[0]?.docId || docs()[0]?.id;
      if (activeId && !state.tabs.some((tab) => tab.docId === activeId)) state.tabs.unshift({ docId: activeId, viewState: null });
      if (!host.restoreSplitWorkspace?.(workspace.split || { layout: "single" })) throw new Error("Split restore failed");
      host.setInspectorOpen(Boolean(workspace.inspector?.open), workspace.inspector?.tab || "toc");
      host.setFocusMode?.(Boolean(workspace.focus));
      state.activeWorkspaceId = workspace.id;
      state.lastWorkspaceId = workspace.id;
      state.recentlyClosed = (workspace.recentlyClosed || []).filter((item) => valid.has(item.docId)).slice(0, MAX_CLOSED_TABS);
      persist();
      renderTabs();
      if (activeId) activateTab(activeId, { source: "workspace", focus: true });
      return { ok: true, detachedFallback: detachedFallback.length };
    } catch (error) {
      state.tabs = backup.tabs;
      state.recentlyClosed = backup.recentlyClosed;
      host.restoreSplitWorkspace?.(backup.split);
      host.setInspectorOpen(Boolean(backup.inspector?.open), backup.inspector?.tab || "toc");
      host.setFocusMode?.(Boolean(backup.focus));
      persist(); renderTabs();
      if (backup.activeTab) activateTab(backup.activeTab, { source: "workspace-rollback" });
      console.error("[TextForge workspace] restore rolled back", error);
      return { ok: false, reason: "restore-failed" };
    }
  }

  function scheduleWorkspaceSave() {
    if (!state.activeWorkspaceId) return;
    clearTimeout(workspaceSaveTimer);
    workspaceSaveTimer = setTimeout(() => {
      const workspace = state.workspaces.find((item) => item.id === state.activeWorkspaceId);
      if (workspace) saveWorkspace(workspace.name, { overwriteId: workspace.id });
    }, 600);
  }

  function workspaceDocumentReferences(workspace) {
    const references = [];
    (workspace.tabs || []).forEach((tab, index) => references.push({ docId: typeof tab === "string" ? tab : tab?.docId, role: `Tab ${index + 1}` }));
    (workspace.split?.panes || []).forEach((pane, index) => {
      if (pane?.documentId) references.push({ docId: pane.documentId, role: `${pane.id === "reference" ? "Split reference" : "Split main"} ${index + 1}` });
    });
    (workspace.detached || []).forEach((item, index) => references.push({ docId: item?.documentId, role: `Detached ${index + 1}` }));
    return references.filter((item) => typeof item.docId === "string" && item.docId);
  }

  function workspaceQuickLookItems(workspace) {
    return workspaceDocumentReferences(workspace).map((reference, index) => quickItem({
      id: reference.docId,
      key: `workspace:${workspace.id}:${index}`,
      contextLabel: `${workspace.name} · ${reference.role}`,
    }, "workspace"));
  }

  function openWorkspaceReferenceQuickLook(workspace, key, focusTarget) {
    const items = workspaceQuickLookItems(workspace);
    const initial = items.find((item) => item.key === key);
    return initial ? openQuickLook(initial, { source: "workspace", items, focusTarget }) : false;
  }

  function openWorkspaceManager() {
    const body = document.createElement("div");
    body.className = "tf-workspace-manager";
    body.innerHTML = '<form class="tf-workspace-create"><label>Workspace name<input name="name" maxlength="80" autocomplete="off" placeholder="Writing desk"></label><button type="submit">Save current</button></form><div class="tf-workspace-list" role="listbox" aria-label="Saved workspaces"></div><label class="tf-workspace-auto"><input type="checkbox" name="autoRestore"> Restore the last workspace when TextForge starts</label><p class="tf-workspace-note" role="status"></p>';
    const root = overlay("tfWorkspaceManager", "작업공간", body);
    const list = body.querySelector(".tf-workspace-list");
    const note = body.querySelector(".tf-workspace-note");
    const nameInput = body.querySelector('[name="name"]');
    const auto = body.querySelector('[name="autoRestore"]');
    auto.checked = state.autoRestore;
    let selectedId = state.activeWorkspaceId || state.workspaces[0]?.id || null;
    const render = () => {
      list.innerHTML = "";
      [...state.workspaces].sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0)).forEach((workspace) => {
        const row = document.createElement("div"); row.className = `tf-workspace-row${workspace.id === selectedId ? " selected" : ""}`; row.setAttribute("role", "option"); row.setAttribute("aria-selected", String(workspace.id === selectedId));
        row.innerHTML = `<button type="button" class="tf-workspace-name"><strong>${esc(workspace.name)}</strong><span>${new Date(workspace.savedAt || 0).toLocaleString()}</span></button><div class="tf-workspace-actions"><button type="button" data-action="open">Open</button><button type="button" data-action="overwrite">Update</button><button type="button" data-action="rename">Rename</button><button type="button" data-action="duplicate">Duplicate</button><button type="button" data-action="delete">Delete</button></div><div class="tf-workspace-documents" aria-label="${esc(workspace.name)} document references"></div>`;
        const catalog = new Map((host.getDocumentMetadata?.() || host.getDocuments()).map((doc) => [doc.id, doc]));
        const workspaceItems = workspaceQuickLookItems(workspace);
        const references = workspaceDocumentReferences(workspace);
        const documentList = row.querySelector(".tf-workspace-documents");
        workspaceItems.forEach((item, index) => {
          const doc = catalog.get(item.docId);
          const button = document.createElement("button");
          button.type = "button";
          button.className = "tf-workspace-doc-ref";
          button.dataset.workspaceId = workspace.id;
          button.dataset.quickItemKey = item.key;
          button.innerHTML = `<small>${esc(references[index]?.role || "Document")}</small><span>${esc(doc?.title || "Unavailable")}${doc?.deletedAt ? " · Deleted" : ""}</span>`;
          button.addEventListener("click", (event) => { event.stopPropagation(); openWorkspaceReferenceQuickLook(workspace, item.key, button); });
          documentList.append(button);
        });
        row.querySelector(".tf-workspace-name").addEventListener("click", () => { selectedId = workspace.id; nameInput.value = workspace.name; render(); });
        row.querySelector(".tf-workspace-actions").addEventListener("click", (event) => {
          const action = event.target.dataset.action; if (!action) return;
          selectedId = workspace.id;
          if (action === "open") { const result = restoreWorkspace(workspace.id); note.textContent = result.ok ? (result.detachedFallback ? "Workspace opened. Detached documents were restored as tabs." : "Workspace opened.") : "Workspace could not be opened."; if (result.ok) root.remove(); }
          if (action === "overwrite") { const result = saveWorkspace(workspace.name, { overwriteId: workspace.id }); note.textContent = result.ok ? "Workspace updated." : "Workspace update failed."; render(); }
          if (action === "rename") {
            const nextName = nameInput.value.trim();
            if (!nextName || sameWorkspaceName(nextName, workspace.id)) note.textContent = "Use a unique workspace name.";
            else { const ok = commitWorkspaceMutation(() => { workspace.name = nextName; workspace.savedAt = new Date().toISOString(); }); note.textContent = ok ? "Workspace renamed." : "Workspace rename failed."; render(); }
          }
          if (action === "duplicate") {
            let suffix = 1; let nextName = `${workspace.name} copy`;
            while (sameWorkspaceName(nextName) && suffix < 100) { suffix += 1; nextName = `${workspace.name} copy ${suffix}`; }
            const ok = commitWorkspaceMutation(() => { const copy = JSON.parse(JSON.stringify(workspace)); copy.id = crypto.randomUUID(); copy.name = nextName; copy.savedAt = new Date().toISOString(); state.workspaces.unshift(copy); });
            note.textContent = ok ? "Workspace duplicated." : "Workspace duplication failed."; render();
          }
          if (action === "delete") {
            const ok = commitWorkspaceMutation(() => { state.workspaces = state.workspaces.filter((item) => item.id !== workspace.id); if (state.activeWorkspaceId === workspace.id) state.activeWorkspaceId = null; if (state.lastWorkspaceId === workspace.id) state.lastWorkspaceId = state.workspaces[0]?.id || null; });
            selectedId = state.workspaces[0]?.id || null; note.textContent = ok ? "Workspace deleted. Documents were not changed." : "Workspace deletion failed."; render();
          }
        });
        list.append(row);
      });
      if (!state.workspaces.length) list.innerHTML = "<p>No saved workspaces.</p>";
    };
    body.querySelector("form").addEventListener("submit", (event) => { event.preventDefault(); const result = saveWorkspace(nameInput.value); note.textContent = result.ok ? "Workspace saved." : "Enter a unique workspace name."; if (result.ok) { selectedId = result.workspace.id; nameInput.value = ""; render(); } });
    auto.addEventListener("change", () => { const next = auto.checked; const ok = commitWorkspaceMutation(() => { state.autoRestore = next; }); if (!ok) auto.checked = state.autoRestore; note.textContent = ok ? (next ? "Automatic restore is on." : "Automatic restore is off.") : "Automatic restore setting could not be saved."; });
    render();
  }

  host.addCommands([
    { id: "mac-quick-note", title: "Quick Note", hint: "Create a local note", run: openQuickNote },
    { id: "mac-quick-look", title: "빠른 보기", hint: "문서를 열지 않고 미리보기", run: () => openQuickLook() },
    { id: "mac-versions", title: "이전 버전", hint: "보호본을 비교하고 복원", run: openVersions },
    { id: "mac-export-studio", title: "내보내기", hint: "형식과 옵션을 선택해 파일로 저장", run: openExportStudio },
    { id: "mac-workspaces", title: "작업공간 관리", hint: "문서와 창 배치를 저장하거나 열기", run: openWorkspaceManager },
    { id: "mac-save-workspace", title: "현재 작업공간 저장", hint: "현재 배치에 이름을 지정해 저장", run: openWorkspaceManager },
    { id: "mac-restore-workspace", title: "최근 작업공간 복원", hint: "최근에 사용한 문서 배치 복원", run: () => state.lastWorkspaceId && restoreWorkspace(state.lastWorkspaceId) },
    { id: "mac-open-split", title: "Open another document in split", hint: "Edit two different documents side by side", run: () => { const other = docs().find((doc) => doc.id !== active()?.id); if (other) host.openDocumentInNewPane(other.id, { mode: "rich" }); else host.setSplitLayout("vertical-2"); } },
    { id: "mac-detach", title: "별도 창에서 편집", hint: "현재 문서를 별도 로컬 창에서 편집", run: () => openDetached() },
    { id: "mac-reopen-tab", title: "Reopen Closed Tab", hint: "Restore the most recently closed document tab", run: reopenClosedTab },
    { id: "mac-selection-move-up", title: "Move Selection Up", hint: "Move the selected safe paragraph block up", run: () => runSelectionAction("move-up") },
    { id: "mac-selection-move-down", title: "Move Selection Down", hint: "Move the selected safe paragraph block down", run: () => runSelectionAction("move-down") },
    { id: "mac-selection-duplicate", title: "Duplicate Selection", hint: "Duplicate selected content in place", run: () => runSelectionAction("duplicate") },
    { id: "mac-selection-delete", title: "Delete Selection", hint: "Delete selected content with Safety recovery", run: () => runSelectionAction("delete") },
    { id: "mac-selection-send", title: "Send Selection to Document", hint: "Copy, move, or link selected content", run: () => runSelectionAction("send") },
  ]);

  function openBacklinkQuickLook(target) {
    const buttons = [...target.closest(".backlink-list")?.querySelectorAll("[data-backlink-doc-id]") || []];
    const items = buttons.map((button, index) => quickItem({
      id: button.dataset.backlinkDocId,
      key: `backlink:${index}:${button.dataset.backlinkDocId}`,
      contextLabel: "Backlink source",
    }, "backlink"));
    const targetIndex = buttons.indexOf(target);
    return items[targetIndex] ? openQuickLook(items[targetIndex], { source: "backlink", items, focusTarget: target }) : false;
  }

  function openSplitPaneQuickLook(target) {
    const buttons = [...document.querySelectorAll("[data-pane-quicklook][data-doc-id]")];
    const items = buttons.map((button, index) => quickItem({
      id: button.dataset.docId,
      key: `split:${button.dataset.paneQuicklook}:${index}`,
      contextLabel: `${button.dataset.paneQuicklook === "reference" ? "Reference" : "Main"} pane`,
    }, "split"));
    const targetIndex = buttons.indexOf(target);
    return items[targetIndex] ? openQuickLook(items[targetIndex], { source: "split", items, focusTarget: target, openLabel: "Open in main pane" }) : false;
  }

  window.addEventListener("textforge:before-active-document-change", (event) => rememberView(event.detail?.id, event.detail?.viewState));
  window.addEventListener("textforge:active-document-change", () => { state.activeTab = active()?.id || state.activeTab; ensureTabs(); renderTabs(); renderContext(); scheduleWorkspaceSave(); });
  window.addEventListener("textforge:document-content-change", () => { renderTabs(); renderContext(); });
  window.addEventListener("textforge:detached-reattach", (event) => {
    const detail = event.detail || {}; if (!byId(detail.documentId)) return;
    const requestedIndex = detail.originalTabIndex !== null && Number.isInteger(Number(detail.originalTabIndex)) ? Number(detail.originalTabIndex) : state.tabs.length;
    if (!tabById(detail.documentId)) state.tabs.splice(Math.max(0, Math.min(state.tabs.length, requestedIndex)), 0, { docId: detail.documentId, viewState: detail.viewState || null });
    persist(); renderTabs(); activateTab(detail.documentId, { source: "reattach" }); scheduleWorkspaceSave();
  });
  document.addEventListener("pointerdown", (event) => { if (tabContextMenu && !tabContextMenu.contains(event.target)) tabContextMenu.remove(); });
  document.addEventListener("click", (event) => {
    const paneTrigger = event.target.closest("[data-pane-quicklook]");
    if (!paneTrigger || paneTrigger.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    openSplitPaneQuickLook(paneTrigger);
  }, true);
  window.addEventListener("textforge:quick-look-request", (event) => openQuickLook(event.detail, { source: event.detail?.source || "command" }));
  document.addEventListener("keydown", (event) => {
    if (!event.ctrlKey && !event.altKey && !event.metaKey && event.code === "Space" && !event.isComposing && !event.target.matches("input,textarea,select,[contenteditable=true]") && !event.target.closest(".tf-quicklook-overlay")) {
      const documentTarget = event.target.closest(".doc-item,.doc-card");
      const historyTarget = event.target.closest(".history-item");
      const workspaceTarget = event.target.closest(".tf-workspace-doc-ref");
      const backlinkTarget = event.target.closest("[data-backlink-doc-id]");
      const paneTarget = event.target.closest("[data-pane-quicklook]");
      if (workspaceTarget) {
        const workspace = state.workspaces.find((item) => item.id === workspaceTarget.dataset.workspaceId);
        if (workspace) { event.preventDefault(); openWorkspaceReferenceQuickLook(workspace, workspaceTarget.dataset.quickItemKey, workspaceTarget); }
        return;
      }
      if (backlinkTarget) { event.preventDefault(); openBacklinkQuickLook(backlinkTarget); return; }
      if (paneTarget && !paneTarget.disabled) { event.preventDefault(); openSplitPaneQuickLook(paneTarget); return; }
      if (documentTarget?.dataset.docId) { event.preventDefault(); openQuickLook(documentTarget.dataset.docId, { source: "sidebar" }); return; }
      if (historyTarget?.dataset.snapshotId) { event.preventDefault(); openQuickLook({ type: "version", id: historyTarget.dataset.snapshotId, docId: historyTarget.dataset.docId }, { source: "history" }); return; }
    }
    if (!event.ctrlKey || event.altKey) return;
    if (event.key === "Tab") { event.preventDefault(); const current = state.tabs.findIndex((tab) => tab.docId === active()?.id); const direction = event.shiftKey ? -1 : 1; const next = state.tabs[(Math.max(0, current) + direction + state.tabs.length) % state.tabs.length]; if (next) activateTab(next.docId, { source: "tab-keyboard" }); }
    if (!event.shiftKey && event.key.toLowerCase() === "w") { event.preventDefault(); if (active()?.id) closeTab(active().id); }
    if (event.shiftKey && event.key.toLowerCase() === "t") { event.preventDefault(); reopenClosedTab(); }
  }, true);
  window.TextForgeMacintoshExperience = { openQuickLook, openVersions, openQuickNote, openExportStudio, openDetached, saveWorkspace, restoreWorkspace, openWorkspaceManager, reopenClosedTab };
  installChrome(); installSelectionObject(); installContextualInspector(); ensureTabs(); renderTabs(); renderContext();
  if (state.autoRestore && state.lastWorkspaceId && state.workspaces.some((workspace) => workspace.id === state.lastWorkspaceId)) restoreWorkspace(state.lastWorkspaceId);
})();
