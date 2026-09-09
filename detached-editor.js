(() => {
  "use strict";

  const CHANNEL_NAME = "textforge.detached-editor.v1";
  const params = new URLSearchParams(location.search);
  const documentId = params.get("documentId") || "";
  const windowId = params.get("windowId") || crypto.randomUUID();
  const draftKey = `textforge.detachedDraft.v1:${documentId}`;
  const viewKey = `textforge.detachedView.v1:${documentId}`;
  const channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
  const els = {
    title: document.querySelector("#detachedTitle"),
    connection: document.querySelector("#detachedConnection"),
    save: document.querySelector("#detachedSaveState"),
    rich: document.querySelector("#detachedRichEditor"),
    source: document.querySelector("#detachedSourceEditor"),
    preview: document.querySelector("#detachedPreview"),
    quickLook: document.querySelector("#detachedQuickLookBtn"),
    reattach: document.querySelector("#reattachBtn"),
  };
  let mode = "rich";
  let baseUpdatedAt = null;
  let connected = false;
  let initialized = false;
  let localRevision = 0;
  let sentRevision = 0;
  let saveInFlight = false;
  let saveTimer = null;
  let lastMainAt = 0;
  let reattachPending = false;
  let completed = false;
  let ownershipRejected = false;
  let heartbeatTimer = null;
  const previewRequests = new Map();
  let quickLookReturnView = null;

  function requestId() { return `${windowId}:${Date.now()}:${Math.random().toString(36).slice(2)}`; }
  function post(type, payload = {}) {
    if (completed || ownershipRejected) return;
    const message = { source: "textforge-detached", type, requestId: requestId(), payload: { documentId, windowId, ...payload } };
    channel?.postMessage(message);
    if (window.opener && !window.opener.closed) window.opener.postMessage(message, location.origin);
    return message.requestId;
  }
  function readJson(key) { try { return JSON.parse(sessionStorage.getItem(key) || "null"); } catch { return null; } }
  function setConnection(value, label) {
    connected = value;
    els.connection.textContent = label;
    els.connection.className = `connection-state ${value ? "connected" : "disconnected"}`;
    const editable = value && initialized;
    els.rich.setAttribute("contenteditable", editable ? "true" : "false");
    els.source.readOnly = !editable;
    els.title.readOnly = !editable;
    if (!value) {
      previewRequests.forEach(({ reject, timer }) => { clearTimeout(timer); reject(new Error("Main window is unavailable.")); });
      previewRequests.clear();
    }
  }
  function captureSelection() {
    if (mode === "source") return { kind: "source", start: els.source.selectionStart || 0, end: els.source.selectionEnd || 0 };
    const selection = window.getSelection();
    if (!selection?.rangeCount) return null;
    const range = selection.getRangeAt(0);
    if (!els.rich.contains(range.startContainer) || !els.rich.contains(range.endContainer)) return null;
    const boundary = (node, offset) => {
      const path = [];
      while (node && node !== els.rich) {
        const parent = node.parentNode;
        if (!parent || path.length > 64) return null;
        path.unshift(Array.prototype.indexOf.call(parent.childNodes, node));
        node = parent;
      }
      return node === els.rich ? { path, offset } : null;
    };
    const start = boundary(range.startContainer, range.startOffset);
    const end = boundary(range.endContainer, range.endOffset);
    return start && end ? { kind: "rich", start, end } : null;
  }
  function captureView() {
    const editor = mode === "source" ? els.source : mode === "preview" ? els.preview : els.rich;
    const view = { mode, scrollTop: editor.scrollTop || 0, selection: captureSelection() };
    sessionStorage.setItem(viewKey, JSON.stringify(view));
    return view;
  }
  function restoreQuickLookView(view) {
    if (!view || view.mode !== mode) return;
    const editor = mode === "source" ? els.source : mode === "preview" ? els.preview : els.rich;
    requestAnimationFrame(() => {
      editor.scrollTop = Math.max(0, Number(view.scrollTop) || 0);
      restoreSelection(view.selection);
    });
  }
  function requestPreview(item) {
    if (!connected || completed || ownershipRejected) return Promise.reject(new Error("Main window is unavailable."));
    const previewRequestId = requestId();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        previewRequests.delete(previewRequestId);
        reject(new Error("Preview request timed out."));
      }, 5000);
      previewRequests.set(previewRequestId, { resolve, reject, timer });
      post("preview-request", { previewRequestId, item: { type: item.type || "document", id: item.id, docId: item.docId || item.id, snapshotId: item.snapshotId || null, contextLabel: item.contextLabel || "Detached Editor" } });
    });
  }
  const quickLookController = window.TextForgeQuickLookController?.create({
    getItem: requestPreview,
    openItem: () => {},
    captureState: () => { quickLookReturnView = captureView(); return quickLookReturnView; },
    onClose: ({ returnState }) => restoreQuickLookView(returnState || quickLookReturnView),
  });
  function openCurrentQuickLook() {
    const item = { type: "document", id: documentId, docId: documentId, key: `detached:${documentId}`, contextLabel: "Detached Editor current document" };
    return quickLookController?.open({ item, items: [item], id: "tfDetachedQuickLook", title: "Quick Look", openLabel: "Return to editor", focusTarget: els.quickLook });
  }
  function restoreSelection(selectionState) {
    if (mode === "source" && selectionState?.kind === "source") {
      const start = Math.min(els.source.value.length, Math.max(0, Number(selectionState.start) || 0));
      const end = Math.min(els.source.value.length, Math.max(start, Number(selectionState.end) || start));
      els.source.setSelectionRange(start, end);
      return;
    }
    if (mode !== "rich" || selectionState?.kind !== "rich") return;
    const resolve = (boundary) => {
      let node = els.rich;
      for (const index of boundary?.path || []) {
        if (!node.childNodes[index]) return null;
        node = node.childNodes[index];
      }
      const limit = node.nodeType === Node.TEXT_NODE ? node.data.length : node.childNodes.length;
      return Number(boundary?.offset) <= limit ? { node, offset: Number(boundary.offset) } : null;
    };
    const start = resolve(selectionState.start);
    const end = resolve(selectionState.end);
    if (!start || !end) return;
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  function setMode(nextMode, restore = true) {
    mode = ["rich", "source", "preview"].includes(nextMode) ? nextMode : "rich";
    els.rich.classList.toggle("hidden", mode !== "rich");
    els.source.classList.toggle("hidden", mode !== "source");
    els.preview.classList.toggle("hidden", mode !== "preview");
    document.querySelectorAll("[data-mode]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
    if (mode === "preview") els.preview.innerHTML = els.rich.innerHTML;
    const view = readJson(viewKey);
    if (restore && view?.mode === mode) requestAnimationFrame(() => {
      const editor = mode === "source" ? els.source : mode === "preview" ? els.preview : els.rich;
      editor.scrollTop = Math.max(0, Number(view.scrollTop) || 0);
      if (mode !== "preview" && connected) editor.focus({ preventScroll: true });
      restoreSelection(view.selection);
    });
  }
  function storeDraft() {
    sessionStorage.setItem(draftKey, JSON.stringify({
      baseUpdatedAt,
      title: els.title.value,
      contentHtml: els.rich.innerHTML,
      content: els.source.value,
      mode,
      viewState: captureView(),
      localRevision,
    }));
  }
  function markDirty() {
    localRevision += 1;
    storeDraft();
    els.save.textContent = connected ? "Unsaved changes" : "Draft held until reconnect";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 450);
  }
  function save() {
    clearTimeout(saveTimer);
    if (!connected || saveInFlight || localRevision === sentRevision) return;
    saveInFlight = true;
    sentRevision = localRevision;
    els.save.textContent = "Saving...";
    post("save-document", {
      baseUpdatedAt,
      title: els.title.value,
      mode,
      contentHtml: els.rich.innerHTML,
      content: els.source.value,
      viewState: captureView(),
      revision: sentRevision,
    });
  }
  function applyDocumentState(payload, force = false) {
    const draft = readJson(draftKey);
    if (!force && draft && draft.localRevision > 0 && draft.baseUpdatedAt && draft.baseUpdatedAt !== payload.updatedAt) {
      baseUpdatedAt = payload.updatedAt;
      initialized = true;
      setConnection(false, "Conflict held");
      els.save.textContent = "Main document changed; local draft remains in this window";
      return;
    }
    els.title.value = payload.title || "Untitled";
    els.rich.innerHTML = payload.contentHtml || "<p></p>";
    els.source.value = payload.content || "";
    baseUpdatedAt = payload.updatedAt || null;
    initialized = true;
    lastMainAt = Date.now();
    setConnection(true, "Connected");
    const view = payload.viewState || draft?.viewState || readJson(viewKey);
    if (draft && (!draft.baseUpdatedAt || draft.baseUpdatedAt === payload.updatedAt)) {
      els.title.value = draft.title || els.title.value;
      els.rich.innerHTML = draft.contentHtml || els.rich.innerHTML;
      els.source.value = draft.content ?? els.source.value;
      localRevision = Math.max(localRevision, Number(draft.localRevision) || 1);
      setMode(draft.mode || view?.mode || "rich", false);
      setTimeout(save, 0);
    } else {
      sessionStorage.removeItem(draftKey);
      localRevision = 0;
      sentRevision = 0;
      setMode(view?.mode || "rich", false);
      els.save.textContent = "Saved";
    }
    requestAnimationFrame(() => {
      const editor = mode === "source" ? els.source : mode === "preview" ? els.preview : els.rich;
      editor.scrollTop = Math.max(0, Number(view?.scrollTop) || 0);
      if (mode !== "preview") editor.focus({ preventScroll: true });
      restoreSelection(view?.selection);
    });
    document.title = `${els.title.value} - TextForge`;
  }
  function receive(message) {
    if (!message || message.source !== "textforge-main") return;
    const payload = message.payload || {};
    if (payload.documentId && payload.documentId !== documentId) return;
    if (payload.windowId && payload.windowId !== windowId) return;
    lastMainAt = Date.now();
    if (message.type === "document-state") applyDocumentState(payload);
    if (message.type === "preview-response") {
      const pending = previewRequests.get(payload.previewRequestId);
      if (!pending) return;
      previewRequests.delete(payload.previewRequestId);
      clearTimeout(pending.timer);
      pending.resolve(payload.preview || { available: false, title: "Unavailable", contentHtml: "<p>Preview is unavailable.</p>" });
    }
    if (message.type === "save-ack") {
      baseUpdatedAt = payload.updatedAt;
      saveInFlight = false;
      lastMainAt = Date.now();
      setConnection(true, "Connected");
      if (localRevision === sentRevision) {
        sessionStorage.removeItem(draftKey);
        els.save.textContent = "Saved";
      } else {
        setTimeout(save, 0);
      }
      if (reattachPending && localRevision === sentRevision) post("reattach", { viewState: captureView() });
    }
    if (message.type === "heartbeat" || message.type === "main-heartbeat") setConnection(true, "Connected");
    if (message.type === "stale") {
      saveInFlight = false;
      storeDraft();
      applyDocumentState(payload);
    }
    if (message.type === "ownership-denied" || message.type === "error") {
      ownershipRejected = true;
      clearInterval(heartbeatTimer);
      setConnection(false, "Read only");
      els.save.textContent = payload.message || "Editing authority unavailable";
    }
    if (message.type === "reattach-ack") {
      sessionStorage.removeItem(draftKey);
      completed = true;
      clearInterval(heartbeatTimer);
      quickLookController?.close("reattach");
      channel?.close();
      setConnection(false, "Reattached");
      els.save.textContent = "Editing returned to the main window";
      window.close();
    }
  }

  channel?.addEventListener("message", (event) => receive(event.data));
  window.addEventListener("message", (event) => { if (event.origin === location.origin) receive(event.data); });
  [els.rich, els.source, els.title].forEach((element) => element.addEventListener("input", markDirty));
  [els.rich, els.source, els.preview].forEach((element) => element.addEventListener("scroll", captureView, { passive: true }));
  document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => { captureView(); setMode(button.dataset.mode); }));
  document.querySelectorAll("[data-command]").forEach((button) => button.addEventListener("click", () => {
    if (!connected || mode === "preview") return;
    const editor = mode === "source" ? els.source : els.rich;
    editor.focus({ preventScroll: true });
    document.execCommand(button.dataset.command, false);
  }));
  els.quickLook?.addEventListener("click", openCurrentQuickLook);
  els.reattach.addEventListener("click", () => {
    reattachPending = true;
    if (localRevision !== sentRevision || saveInFlight) save();
    else post("reattach", { viewState: captureView() });
  });
  window.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === "s") { event.preventDefault(); save(); }
  });
  window.addEventListener("beforeunload", () => {
    quickLookController?.close("window-close");
    if (completed || ownershipRejected) { channel?.close(); return; }
    if (connected && localRevision !== sentRevision) {
      post("save-document", { baseUpdatedAt, title: els.title.value, mode, contentHtml: els.rich.innerHTML, content: els.source.value, viewState: captureView(), revision: localRevision });
    }
    if (!reattachPending) post("release", { viewState: captureView() });
    channel?.close();
  });

  setConnection(false, "Connecting");
  post("hello", { viewState: readJson(viewKey) });
  heartbeatTimer = setInterval(() => {
    if (completed || ownershipRejected) return;
    post(connected ? "heartbeat" : "hello", { viewState: captureView() });
    if (connected && Date.now() - lastMainAt > 7000) {
      storeDraft();
      setConnection(false, "Main unavailable");
      els.save.textContent = "Draft held until reconnect";
    }
  }, 2000);
})();
