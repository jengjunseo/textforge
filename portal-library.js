(function () {
  const core = window.TextForgePortalCore;
  const CHANNEL_NAME = "textforge.portal-library.v1";
  const PREFS_KEY = "textforge.portalLibrary.preferences.v1";
  const QUERY = new URLSearchParams(location.search);
  const FIXTURE_MODE = QUERY.get("fixture") === "1";
  const FIXTURE_THEME = QUERY.get("theme") === "dark" ? "dark" : "light";
  const SMART_LABELS = {
    all: "전체 문서",
    inbox: "Inbox",
    recent: "최근 문서",
    favorites: "즐겨찾기",
    week: "이번 주 작성",
    long: "장문",
    untitled: "제목 없음",
    unfiled: "미분류",
    recovery: "복구 스냅샷 있음",
    trash: "휴지통",
  };

  const els = Object.fromEntries(
    [
      "connectionText", "backBtn", "forwardBtn", "upBtn", "searchInput", "sortSelect", "gridBtn", "listBtn",
      "quickNoteBtn", "newFolderBtn", "sidebarNewFolderBtn", "newCollectionBtn", "folderTree", "collectionList",
      "allCount", "inboxCount", "trashCount", "breadcrumbs", "resultCount", "activeDocumentText", "selectionBar",
      "selectionText", "favoriteSelectionBtn", "collectionSelectionBtn", "trashSelectionBtn", "clearSelectionBtn",
      "moveSelectionBtn", "moveDialog", "moveForm", "moveFolderSelect",
      "dropRoot", "librarySurface", "emptyState", "statusText", "quickLookDialog", "quickLookTitle", "quickLookMeta",
      "quickLookSearch", "quickLookPrevMatch", "quickLookMatchStatus", "quickLookNextMatch", "quickLookOpenBtn", "quickLookCloseBtn", "quickLookContent", "contextMenu", "toast",
      "toastText", "toastUndoBtn",
    ].map((id) => [id, document.getElementById(id)]),
  );

  let library = { documents: [], folders: [], activeId: null, theme: "system", updatedAt: null };
  let preferences = loadPreferences();
  let channel = null;
  let selectedIds = new Set();
  let selectionAnchorId = null;
  let visibleDocuments = [];
  let focusedDocumentId = null;
  const requestedSmartFolder = SMART_LABELS[QUERY.get("smart")] ? QUERY.get("smart") : "all";
  let currentLocation = { smartFolder: requestedSmartFolder, folderId: QUERY.get("folder") || null, collectionId: null };
  let locationHistory = [{ ...currentLocation }];
  let locationHistoryIndex = 0;
  let contextDocumentId = null;
  let quickLookDocumentId = null;
  let quickLookHtml = "";
  let quickLookMatches = [];
  let quickLookMatchIndex = -1;
  let dragPayload = null;
  let springTimer = null;
  let springTargetId = null;
  let toastTimer = null;
  let movedDocumentIds = [];
  let searchTimer = null;

  function loadPreferences() {
    try {
      const parsed = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
      return {
        view: parsed.view === "list" ? "list" : "grid",
        sort: ["updated", "created", "title", "favorite", "chars"].includes(parsed.sort) ? parsed.sort : "updated",
        collections: Array.isArray(parsed.collections) ? parsed.collections.filter((item) => item?.id && item?.name).map((item) => ({ ...item, docIds: Array.isArray(item.docIds) ? item.docIds : [] })) : [],
      };
    } catch {
      return { view: "grid", sort: "updated", collections: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
    } catch {
      setStatus("Portal 보기 설정을 저장하지 못했습니다.");
    }
  }

  function createFixtureLibrary() {
    const now = Date.now();
    const folders = [
      { id: "folder-projects", name: "Projects", parentId: null },
      { id: "folder-writing", name: "Writing", parentId: null },
      { id: "folder-archive", name: "Archive", parentId: null },
      { id: "folder-notes", name: "Research Notes", parentId: "folder-writing" },
    ];
    const titles = ["TextForge v1.0 Release Notes", "Portal Library UX", "Long-form Essay Draft", "Meeting Notes", "Ideas Inbox", "Snapshot Recovery Plan", "Performance Budget", "Weekly Review", "Keyboard Navigation", "Export Checklist", "Dark Mode Audit", "Writing Prompts"];
    const documents = Array.from({ length: 28 }, (_, index) => ({
      id: `fixture-${index}`,
      title: titles[index % titles.length] + (index >= titles.length ? ` ${Math.floor(index / titles.length) + 1}` : ""),
      previewText: index % 3 === 0 ? "A focused draft with structured notes, decisions, and the next concrete action." : "Local-first writing workspace document preview.",
      type: index % 6 === 0 ? "report" : "note",
      folderId: index % 5 === 0 ? null : folders[index % folders.length].id,
      tags: index % 4 === 0 ? ["release", "writing"] : ["notes"],
      favorite: index % 7 === 0,
      deletedAt: null,
      createdAt: new Date(now - index * 8 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - index * 3 * 60 * 60 * 1000).toISOString(),
      charCount: index === 2 ? 17000 : 620 + index * 170,
      color: ["#167c80", "#576cbc", "#b24f3f", "#8a6f2a", "#4f7b45"][index % 5],
      historyCount: index % 8 === 0 ? 2 : 0,
    }));
    return { documents, folders, activeId: documents[0].id, theme: FIXTURE_THEME, resolvedTheme: FIXTURE_THEME, updatedAt: new Date().toISOString() };
  }

  function connect() {
    if (FIXTURE_MODE) {
      library = createFixtureLibrary();
      document.documentElement.dataset.theme = library.resolvedTheme;
      els.connectionText.textContent = "격리된 시각 테스트 데이터";
      renderAll();
      return;
    }
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.addEventListener("message", (event) => handleMainMessage(event.data));
    }
    window.addEventListener("message", (event) => {
      if (event.origin !== location.origin) return;
      handleMainMessage(event.data);
    });
    postToMain("request-state");
    setTimeout(() => {
      if (!library.updatedAt) els.connectionText.textContent = "TextForge 본체에서 다시 열어주세요";
    }, 1800);
  }

  function postToMain(type, payload = {}) {
    if (FIXTURE_MODE) {
      handleFixtureAction(type, payload);
      return;
    }
    const message = { source: "textforge-portal", type, payload, requestId: crypto.randomUUID() };
    if (channel) channel.postMessage(message);
    else if (window.opener && !window.opener.closed) window.opener.postMessage(message, location.origin);
  }

  function handleMainMessage(message) {
    if (!message || message.source !== "textforge-main") return;
    if (message.type === "state") {
      library = {
        documents: Array.isArray(message.payload?.documents) ? message.payload.documents : [],
        folders: Array.isArray(message.payload?.folders) ? message.payload.folders : [],
        activeId: message.payload?.activeId || null,
        theme: message.payload?.theme || "system",
        updatedAt: message.payload?.updatedAt || new Date().toISOString(),
      };
      document.documentElement.dataset.theme = message.payload?.resolvedTheme || document.documentElement.dataset.theme;
      els.connectionText.textContent = `TextForge 연결됨 · ${formatTime(library.updatedAt)}`;
      pruneSelection();
      renderAll();
    }
    if (message.type === "preview") showQuickLookContent(message.payload);
    if (message.type === "operation-result") {
      movedDocumentIds = Array.isArray(message.payload?.movedDocumentIds) ? message.payload.movedDocumentIds : [];
      showToast(message.payload?.message || "작업을 완료했습니다.", Boolean(message.payload?.undoAvailable));
    }
    if (message.type === "error") showToast(message.payload?.message || "작업을 완료하지 못했습니다.", false);
  }

  function handleFixtureAction(type, payload) {
    if (type === "open-quick-note") {
      showToast("Quick Note는 TextForge 본체에서 열립니다.", false);
      return;
    }
    if (type === "request-preview") {
      const doc = library.documents.find((item) => item.id === payload.docId);
      showQuickLookContent({
        docId: doc?.id,
        title: doc?.title || "빠른 보기",
        contentHtml: `<h1>${escapeHtml(doc?.title || "Untitled")}</h1><p>${escapeHtml(doc?.previewText || "Fixture preview")}</p><h2>Local-first writing</h2><p>Portal Library visual fixture. No user document data is loaded or changed.</p>`,
        updatedAt: doc?.updatedAt,
        charCount: doc?.charCount || 0,
      });
      return;
    }
    if (type === "move-documents") {
      library.documents.forEach((doc) => {
        if (payload.docIds?.includes(doc.id)) doc.folderId = payload.folderId || null;
      });
      movedDocumentIds = payload.docIds || [];
      renderAll();
      showToast(`${movedDocumentIds.length}개 문서를 이동했습니다.`, false);
    }
  }

  function renderAll() {
    renderSidebar();
    renderBreadcrumbs();
    renderDocuments();
    renderSelectionBar();
    if (els.captureFolder) renderCaptureFolders();
    renderMoveFolders();
    els.sortSelect.value = preferences.sort;
    setView(preferences.view, false);
    els.allCount.textContent = String(library.documents.filter((doc) => !doc.deletedAt).length);
    els.inboxCount.textContent = String(library.documents.filter((doc) => !doc.deletedAt && !doc.folderId).length);
    els.trashCount.textContent = String(library.documents.filter((doc) => doc.deletedAt).length);
    const active = library.documents.find((doc) => doc.id === library.activeId);
    els.activeDocumentText.textContent = active ? `편집 중: ${active.title}` : "선택된 문서 없음";
    updateHistoryButtons();
  }

  function renderSidebar() {
    document.querySelectorAll("[data-smart-folder]").forEach((button) => {
      const active = currentLocation.smartFolder === button.dataset.smartFolder && !currentLocation.folderId && !currentLocation.collectionId;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    els.folderTree.innerHTML = "";
    renderFolderBranch(null, 0);
    els.collectionList.innerHTML = preferences.collections.length
      ? preferences.collections.map((collection) => `<button class="collection-row${currentLocation.collectionId === collection.id ? " active" : ""}" data-collection-id="${escapeAttr(collection.id)}" type="button"><span>${escapeHtml(collection.name)}</span><small>${collection.docIds.length}</small></button>`).join("")
      : '<span class="sidebar-empty">컬렉션 없음</span>';
  }

  function renderFolderBranch(parentId, depth) {
    library.folders
      .filter((folder) => (folder.parentId || null) === (parentId || null))
      .sort((a, b) => String(a.name).localeCompare(String(b.name), "ko"))
      .forEach((folder) => {
        const button = document.createElement("button");
        button.className = `folder-row${currentLocation.folderId === folder.id ? " active" : ""}`;
        button.type = "button";
        button.draggable = true;
        button.dataset.folderId = folder.id;
        button.setAttribute("role", "treeitem");
        button.setAttribute("aria-level", String(depth + 1));
        button.setAttribute("aria-selected", String(currentLocation.folderId === folder.id));
        button.style.setProperty("--folder-depth", String(depth));
        const count = library.documents.filter((doc) => !doc.deletedAt && doc.folderId === folder.id).length;
        button.innerHTML = `<span>${escapeHtml(folder.name)}</span><small>${count}</small>`;
        els.folderTree.append(button);
        renderFolderBranch(folder.id, depth + 1);
      });
  }

  function renderBreadcrumbs() {
    const path = currentLocation.folderId ? core.buildFolderPath(library.folders, currentLocation.folderId) : [];
    const collection = preferences.collections.find((item) => item.id === currentLocation.collectionId);
    const smartLabel = SMART_LABELS[currentLocation.smartFolder] || "전체 문서";
    const pieces = [{ label: "전체 문서함", location: { smartFolder: "all", folderId: null, collectionId: null } }];
    if (path.length) path.forEach((folder) => pieces.push({ label: folder.name, location: { smartFolder: "all", folderId: folder.id, collectionId: null } }));
    else if (collection) pieces.push({ label: collection.name, location: { smartFolder: "all", folderId: null, collectionId: collection.id } });
    else if (currentLocation.smartFolder !== "all") pieces.push({ label: smartLabel, location: { ...currentLocation } });
    els.breadcrumbs.innerHTML = pieces.map((piece) => `<button type="button" data-location='${escapeAttr(JSON.stringify(piece.location))}'>${escapeHtml(piece.label)}</button>`).join("");
  }

  function getVisibleDocuments() {
    const collection = preferences.collections.find((item) => item.id === currentLocation.collectionId);
    return core.sortDocuments(
      core.filterDocuments(library.documents, {
        query: els.searchInput.value,
        smartFolder: currentLocation.smartFolder,
        folderId: currentLocation.folderId,
        collectionIds: collection?.docIds,
      }),
      preferences.sort,
    );
  }

  function renderDocuments() {
    visibleDocuments = getVisibleDocuments();
    const fragment = document.createDocumentFragment();
    visibleDocuments.forEach((doc) => fragment.append(createDocumentItem(doc)));
    els.librarySurface.replaceChildren(fragment);
    els.resultCount.textContent = `${visibleDocuments.length.toLocaleString("ko-KR")}개`;
    els.emptyState.classList.toggle("hidden", visibleDocuments.length > 0);
    if (focusedDocumentId && visibleDocuments.some((doc) => doc.id === focusedDocumentId)) focusDocument(focusedDocumentId, false);
    movedDocumentIds.forEach((id) => els.librarySurface.querySelector(`[data-doc-id="${cssEscape(id)}"]`)?.classList.add("just-moved"));
    movedDocumentIds = [];
  }

  function createDocumentItem(doc) {
    const item = document.createElement("div");
    item.className = `portal-document${selectedIds.has(doc.id) ? " selected" : ""}${library.activeId === doc.id ? " active-document" : ""}`;
    item.dataset.docId = doc.id;
    item.draggable = true;
    item.tabIndex = focusedDocumentId === doc.id ? 0 : -1;
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", String(selectedIds.has(doc.id)));
    item.setAttribute("aria-label", `${doc.title || "Untitled"}, ${(doc.charCount || 0).toLocaleString("ko-KR")}자`);
    item.style.setProperty("--document-color", doc.color || "var(--portal-accent)");
    item.innerHTML = `
      <div class="document-heading"><span class="document-type">${escapeHtml(typeLabel(doc.type))}</span><span class="document-favorite">${doc.favorite ? "★" : ""}</span></div>
      <div class="document-title">${escapeHtml(doc.title || "Untitled")}</div>
      <div class="document-preview">${escapeHtml(doc.previewText || "빈 문서")}</div>
      <div class="document-meta"><span>${formatTime(doc.updatedAt)}</span><span>${(doc.charCount || 0).toLocaleString("ko-KR")}자</span></div>`;
    item.addEventListener("click", (event) => selectDocument(doc.id, event));
    item.addEventListener("dblclick", () => openDocument(doc.id));
    item.addEventListener("contextmenu", (event) => openContextMenu(event, doc.id));
    item.addEventListener("dragstart", (event) => startDocumentDrag(event, doc.id));
    item.addEventListener("dragend", cleanupDragState);
    return item;
  }

  function renderSelectionBar() {
    const count = selectedIds.size;
    const selectedDocuments = library.documents.filter((doc) => selectedIds.has(doc.id));
    const restoring = selectedDocuments.length > 0 && selectedDocuments.every((doc) => doc.deletedAt);
    els.selectionBar.classList.toggle("hidden", count === 0);
    els.selectionText.textContent = `${count}개 선택`;
    els.trashSelectionBtn.textContent = restoring ? "복원" : "휴지통";
  }

  function renderMoveFolders() {
    const options = ['<option value="">루트</option>'];
    const append = (parentId, depth) => {
      library.folders.filter((folder) => (folder.parentId || null) === (parentId || null)).forEach((folder) => {
        options.push(`<option value="${escapeAttr(folder.id)}">${"　".repeat(depth)}${escapeHtml(folder.name)}</option>`);
        append(folder.id, depth + 1);
      });
    };
    append(null, 0);
    els.moveFolderSelect.innerHTML = options.join("");
  }

  function selectDocument(docId, event = {}) {
    const visibleIds = visibleDocuments.map((doc) => doc.id);
    selectedIds = new Set(core.updateSelection([...selectedIds], visibleIds, docId, {
      shift: Boolean(event.shiftKey),
      additive: Boolean(event.ctrlKey || event.metaKey),
      anchorId: selectionAnchorId,
    }));
    if (!event.shiftKey) selectionAnchorId = docId;
    focusedDocumentId = docId;
    renderDocuments();
    renderSelectionBar();
  }

  function focusDocument(docId, shouldFocus = true) {
    focusedDocumentId = docId;
    els.librarySurface.querySelectorAll(".portal-document").forEach((item) => {
      item.tabIndex = item.dataset.docId === docId ? 0 : -1;
    });
    if (shouldFocus) els.librarySurface.querySelector(`[data-doc-id="${cssEscape(docId)}"]`)?.focus({ preventScroll: true });
  }

  function pruneSelection() {
    const valid = new Set(library.documents.map((doc) => doc.id));
    selectedIds = new Set([...selectedIds].filter((id) => valid.has(id)));
  }

  function navigateTo(location, options = {}) {
    const next = { smartFolder: location.smartFolder || "all", folderId: location.folderId || null, collectionId: location.collectionId || null };
    currentLocation = next;
    selectedIds.clear();
    selectionAnchorId = null;
    focusedDocumentId = null;
    if (options.history !== false) {
      locationHistory = locationHistory.slice(0, locationHistoryIndex + 1);
      locationHistory.push({ ...next });
      locationHistoryIndex = locationHistory.length - 1;
    }
    animateNavigation(options.direction || "forward");
    renderAll();
  }

  function animateNavigation(direction) {
    const className = direction === "back" ? "portal-enter-back" : "portal-enter-forward";
    document.body.classList.remove("portal-enter-back", "portal-enter-forward");
    void document.body.offsetWidth;
    document.body.classList.add(className);
    setTimeout(() => document.body.classList.remove(className), 190);
  }

  function navigateHistory(delta) {
    const nextIndex = locationHistoryIndex + delta;
    if (nextIndex < 0 || nextIndex >= locationHistory.length) return;
    locationHistoryIndex = nextIndex;
    currentLocation = { ...locationHistory[locationHistoryIndex] };
    animateNavigation(delta < 0 ? "back" : "forward");
    renderAll();
  }

  function navigateUp() {
    if (currentLocation.folderId) {
      const folder = library.folders.find((item) => item.id === currentLocation.folderId);
      navigateTo({ smartFolder: "all", folderId: folder?.parentId || null, collectionId: null }, { direction: "back" });
    } else if (currentLocation.smartFolder !== "all" || currentLocation.collectionId) {
      navigateTo({ smartFolder: "all", folderId: null, collectionId: null }, { direction: "back" });
    }
  }

  function updateHistoryButtons() {
    els.backBtn.disabled = locationHistoryIndex <= 0;
    els.forwardBtn.disabled = locationHistoryIndex >= locationHistory.length - 1;
    els.upBtn.disabled = !currentLocation.folderId && currentLocation.smartFolder === "all" && !currentLocation.collectionId;
  }

  function openDocument(docId) {
    postToMain("open-document", { docId });
    setStatus("편집기에서 문서를 열었습니다.");
  }

  function openQuickLook(docId) {
    const doc = library.documents.find((item) => item.id === docId);
    if (!doc) return;
    quickLookDocumentId = docId;
    quickLookHtml = "";
    els.quickLookTitle.textContent = doc.title || "Untitled";
    els.quickLookMeta.textContent = `${formatTime(doc.updatedAt)} · ${(doc.charCount || 0).toLocaleString("ko-KR")}자`;
    els.quickLookContent.innerHTML = '<p class="loading-preview">미리보기를 불러오는 중...</p>';
    els.quickLookSearch.value = "";
    if (!els.quickLookDialog.open) els.quickLookDialog.showModal();
    postToMain("request-preview", { docId });
  }

  function showQuickLookContent(payload) {
    if (!payload || payload.docId !== quickLookDocumentId) return;
    els.quickLookTitle.textContent = payload.title || "Untitled";
    els.quickLookMeta.textContent = [formatTime(payload.updatedAt), `${(payload.charCount || 0).toLocaleString("ko-KR")}자`, payload.folder || "Inbox", payload.favorite ? "즐겨찾기" : "", payload.deleted ? "삭제됨" : ""].filter(Boolean).join(" · ");
    quickLookHtml = sanitizePreviewHtml(payload.contentHtml || "<p></p>");
    els.quickLookContent.innerHTML = quickLookHtml;
  }

  function navigateQuickLook(delta) {
    const ids = visibleDocuments.map((doc) => doc.id);
    const index = ids.indexOf(quickLookDocumentId);
    if (index < 0) return;
    const nextId = ids[Math.max(0, Math.min(ids.length - 1, index + delta))];
    if (nextId && nextId !== quickLookDocumentId) openQuickLook(nextId);
  }

  function sanitizePreviewHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = String(html || "");
    template.content.querySelectorAll("script,style,iframe,object,embed,form").forEach((node) => node.remove());
    template.content.querySelectorAll("*").forEach((node) => {
      [...node.attributes].forEach((attribute) => {
        if (/^on/i.test(attribute.name)) node.removeAttribute(attribute.name);
        if (/^(href|src)$/i.test(attribute.name) && /^\s*javascript:/i.test(attribute.value || "")) node.removeAttribute(attribute.name);
        if (attribute.name.toLowerCase() === "contenteditable") node.removeAttribute(attribute.name);
      });
    });
    return template.innerHTML || "<p></p>";
  }

  function searchQuickLook(query) {
    els.quickLookContent.innerHTML = quickLookHtml;
    quickLookMatches = [];
    quickLookMatchIndex = -1;
    const term = String(query || "").trim();
    if (!term) { els.quickLookMatchStatus.textContent = "0 / 0"; return; }
    const walker = document.createTreeWalker(els.quickLookContent, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    const lower = term.toLocaleLowerCase();
    textNodes.forEach((node) => {
      const index = node.nodeValue.toLocaleLowerCase().indexOf(lower);
      if (index < 0) return;
      const mark = document.createElement("mark");
      const after = node.splitText(index);
      after.splitText(term.length);
      mark.textContent = after.nodeValue;
      after.replaceWith(mark);
      quickLookMatches.push(mark);
    });
    if (quickLookMatches.length) { quickLookMatchIndex = 0; quickLookMatches[0].classList.add("current"); quickLookMatches[0].scrollIntoView({ block: "center" }); }
    els.quickLookMatchStatus.textContent = `${quickLookMatches.length ? 1 : 0} / ${quickLookMatches.length}`;
  }

  function navigateQuickLookMatch(delta) {
    if (!quickLookMatches.length) return;
    quickLookMatches[quickLookMatchIndex]?.classList.remove("current");
    quickLookMatchIndex = (quickLookMatchIndex + delta + quickLookMatches.length) % quickLookMatches.length;
    quickLookMatches[quickLookMatchIndex].classList.add("current");
    quickLookMatches[quickLookMatchIndex].scrollIntoView({ block: "center" });
    els.quickLookMatchStatus.textContent = `${quickLookMatchIndex + 1} / ${quickLookMatches.length}`;
  }

  function startDocumentDrag(event, docId) {
    const ids = selectedIds.has(docId) ? [...selectedIds] : [docId];
    dragPayload = { kind: "documents", ids };
    event.currentTarget.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-textforge-portal", JSON.stringify(dragPayload));
    event.dataTransfer.setDragImage(createDragGhost(ids.length, library.documents.find((doc) => doc.id === docId)?.title), 22, 22);
    els.dropRoot.classList.add("visible");
  }

  function startFolderDrag(event, folderId) {
    dragPayload = { kind: "folders", ids: [folderId] };
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-textforge-portal", JSON.stringify(dragPayload));
    event.dataTransfer.setDragImage(createDragGhost(1, library.folders.find((folder) => folder.id === folderId)?.name), 22, 22);
    els.dropRoot.classList.add("visible");
  }

  function createDragGhost(count, title) {
    const ghost = document.createElement("div");
    ghost.className = "drag-ghost";
    ghost.innerHTML = `<b>${count}</b><span>${escapeHtml(count > 1 ? `${count}개 항목` : title || "항목")}</span>`;
    document.body.append(ghost);
    setTimeout(() => ghost.remove());
    return ghost;
  }

  function readDragPayload(event) {
    if (dragPayload) return dragPayload;
    try {
      return JSON.parse(event.dataTransfer.getData("application/x-textforge-portal") || "null");
    } catch {
      return null;
    }
  }

  function moveDragPayload(payload, folderId) {
    if (!payload?.ids?.length) return;
    if (payload.kind === "documents") postToMain("move-documents", { docIds: payload.ids, folderId: folderId || null });
    if (payload.kind === "folders") postToMain("move-folders", { folderIds: payload.ids, parentId: folderId || null });
    movedDocumentIds = payload.kind === "documents" ? payload.ids : [];
    cleanupDragState();
  }

  function cleanupDragState() {
    dragPayload = null;
    clearSpringTimer();
    els.dropRoot.classList.remove("visible", "drop-active");
    document.querySelectorAll(".dragging,.drop-active,.spring-loading").forEach((node) => node.classList.remove("dragging", "drop-active", "spring-loading"));
  }

  function startSpringTimer(folderButton) {
    const folderId = folderButton.dataset.folderId;
    if (springTargetId === folderId) return;
    clearSpringTimer();
    springTargetId = folderId;
    folderButton.classList.add("spring-loading");
    springTimer = setTimeout(() => {
      navigateTo({ smartFolder: "all", folderId, collectionId: null });
      springTimer = null;
      springTargetId = null;
    }, 650);
  }

  function clearSpringTimer() {
    if (springTimer) clearTimeout(springTimer);
    springTimer = null;
    springTargetId = null;
    document.querySelectorAll(".spring-loading").forEach((node) => node.classList.remove("spring-loading"));
  }

  function openContextMenu(event, docId) {
    event.preventDefault();
    contextDocumentId = docId;
    els.contextMenu.classList.remove("hidden");
    const width = 205;
    const height = 205;
    els.contextMenu.style.left = `${Math.min(event.clientX, innerWidth - width - 8)}px`;
    els.contextMenu.style.top = `${Math.min(event.clientY, innerHeight - height - 8)}px`;
    const doc = library.documents.find((item) => item.id === docId);
    const trashButton = els.contextMenu.querySelector('[data-action="trash"]');
    if (trashButton) trashButton.textContent = doc?.deletedAt ? "문서 복원" : "휴지통으로 이동";
    els.contextMenu.querySelector("button")?.focus();
  }

  function closeContextMenu() {
    els.contextMenu.classList.add("hidden");
  }

  function runContextAction(action) {
    const doc = library.documents.find((item) => item.id === contextDocumentId);
    if (!doc) return;
    if (action === "open") openDocument(doc.id);
    if (action === "quicklook") openQuickLook(doc.id);
    if (action === "rename") {
      const title = prompt("문서 이름", doc.title || "Untitled");
      if (title?.trim()) postToMain("rename-document", { docId: doc.id, title: title.trim() });
    }
    if (action === "favorite") postToMain("toggle-favorite", { docIds: [doc.id] });
    if (action === "collection") addDocumentsToCollection([doc.id]);
    if (action === "trash") postToMain(doc.deletedAt ? "restore-documents" : "trash-documents", { docIds: [doc.id] });
    closeContextMenu();
  }

  function createFolder(parentId = currentLocation.folderId) {
    const name = prompt("새 폴더 이름");
    if (name?.trim()) postToMain("create-folder", { name: name.trim(), parentId: parentId || null });
  }

  function createCollection() {
    const name = prompt("새 컬렉션 이름");
    if (!name?.trim()) return;
    const collection = { id: crypto.randomUUID(), name: name.trim(), docIds: [] };
    preferences.collections.push(collection);
    savePreferences();
    navigateTo({ smartFolder: "all", folderId: null, collectionId: collection.id });
  }

  function addDocumentsToCollection(docIds) {
    if (!preferences.collections.length) {
      createCollection();
      const latest = preferences.collections.at(-1);
      if (latest) latest.docIds = [...new Set([...latest.docIds, ...docIds])];
      savePreferences();
      renderAll();
      return;
    }
    const choices = preferences.collections.map((collection, index) => `${index + 1}. ${collection.name}`).join("\n");
    const answer = prompt(`추가할 컬렉션 번호\n${choices}`, "1");
    const collection = preferences.collections[Number(answer) - 1];
    if (!collection) return;
    collection.docIds = [...new Set([...collection.docIds, ...docIds])];
    savePreferences();
    renderAll();
    showToast(`${collection.name} 컬렉션에 추가했습니다.`, false);
  }

  function showToast(message, undoAvailable) {
    clearTimeout(toastTimer);
    els.toastText.textContent = message;
    els.toastUndoBtn.classList.toggle("hidden", !undoAvailable);
    els.toast.classList.remove("hidden");
    toastTimer = setTimeout(() => els.toast.classList.add("hidden"), 5500);
  }

  function setStatus(message) {
    els.statusText.textContent = message;
  }

  function setView(view, persist = true) {
    preferences.view = view === "list" ? "list" : "grid";
    els.librarySurface.classList.toggle("grid-view", preferences.view === "grid");
    els.librarySurface.classList.toggle("list-view", preferences.view === "list");
    els.gridBtn.classList.toggle("active", preferences.view === "grid");
    els.listBtn.classList.toggle("active", preferences.view === "list");
    els.gridBtn.setAttribute("aria-pressed", String(preferences.view === "grid"));
    els.listBtn.setAttribute("aria-pressed", String(preferences.view === "list"));
    if (persist) savePreferences();
  }

  function handleDocumentKeyboard(event) {
    if (event.target.matches("input,textarea,select") || event.target.closest("dialog[open]")) return;
    if (event.altKey && event.key === "ArrowLeft") {
      event.preventDefault();
      navigateHistory(-1);
      return;
    }
    if (event.altKey && event.key === "ArrowRight") {
      event.preventDefault();
      navigateHistory(1);
      return;
    }
    const ids = visibleDocuments.map((doc) => doc.id);
    const currentIndex = Math.max(0, ids.indexOf(focusedDocumentId || [...selectedIds][0]));
    if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key) && ids.length) {
      event.preventDefault();
      const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      const nextId = ids[Math.max(0, Math.min(ids.length - 1, currentIndex + step))];
      selectDocument(nextId, { shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, metaKey: event.metaKey });
      focusDocument(nextId);
    }
    if (event.key === "Enter" && selectedIds.size === 1) {
      event.preventDefault();
      openDocument([...selectedIds][0]);
    }
    if (event.code === "Space" && selectedIds.size === 1) {
      event.preventDefault();
      openQuickLook([...selectedIds][0]);
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      navigateUp();
    }
    if (event.ctrlKey && event.shiftKey && event.code === "KeyN") {
      event.preventDefault();
      postToMain("open-quick-note");
    }
    if (event.key === "Escape") {
      closeContextMenu();
      if (els.quickLookDialog.open) els.quickLookDialog.close();
      else if (selectedIds.size) {
        selectedIds.clear();
        renderAll();
      }
    }
  }

  function openMoveDialog() {
    if (!selectedIds.size) return;
    renderMoveFolders();
    els.moveFolderSelect.value = currentLocation.folderId || "";
    els.moveDialog.showModal();
    setTimeout(() => els.moveFolderSelect.focus(), 0);
  }

  function submitMove(event) {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    postToMain("move-documents", { docIds: [...selectedIds], folderId: els.moveFolderSelect.value || null });
    els.moveDialog.close();
  }

  function typeLabel(type) {
    return ({ note: "메모", prompt: "프롬프트", report: "보고서", board: "보드", log: "로그" })[type] || "문서";
  }

  function formatTime(value) {
    const date = new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function cssEscape(value) {
    return window.CSS?.escape ? CSS.escape(String(value)) : String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function bindEvents() {
    els.backBtn.addEventListener("click", () => navigateHistory(-1));
    els.forwardBtn.addEventListener("click", () => navigateHistory(1));
    els.upBtn.addEventListener("click", navigateUp);
    els.searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(renderAll, 90);
    });
    els.sortSelect.addEventListener("change", () => {
      preferences.sort = els.sortSelect.value;
      savePreferences();
      renderAll();
    });
    els.gridBtn.addEventListener("click", () => { setView("grid"); renderDocuments(); });
    els.listBtn.addEventListener("click", () => { setView("list"); renderDocuments(); });
    els.quickNoteBtn.addEventListener("click", () => postToMain("open-quick-note"));
    els.newFolderBtn.addEventListener("click", () => createFolder());
    els.sidebarNewFolderBtn.addEventListener("click", () => createFolder());
    els.newCollectionBtn.addEventListener("click", createCollection);
    els.clearSelectionBtn.addEventListener("click", () => { selectedIds.clear(); renderAll(); });
    els.favoriteSelectionBtn.addEventListener("click", () => postToMain("toggle-favorite", { docIds: [...selectedIds] }));
    els.moveSelectionBtn.addEventListener("click", openMoveDialog);
    els.collectionSelectionBtn.addEventListener("click", () => addDocumentsToCollection([...selectedIds]));
    els.trashSelectionBtn.addEventListener("click", () => {
      const selectedDocuments = library.documents.filter((doc) => selectedIds.has(doc.id));
      const restoring = selectedDocuments.length > 0 && selectedDocuments.every((doc) => doc.deletedAt);
      postToMain(restoring ? "restore-documents" : "trash-documents", { docIds: [...selectedIds] });
    });
    els.moveForm.addEventListener("submit", submitMove);
    els.quickLookCloseBtn.addEventListener("click", () => els.quickLookDialog.close());
    els.quickLookOpenBtn.addEventListener("click", () => quickLookDocumentId && openDocument(quickLookDocumentId));
    els.quickLookSearch.addEventListener("input", () => searchQuickLook(els.quickLookSearch.value));
    els.quickLookSearch.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); navigateQuickLookMatch(event.shiftKey ? -1 : 1); } });
    els.quickLookPrevMatch.addEventListener("click", () => navigateQuickLookMatch(-1));
    els.quickLookNextMatch.addEventListener("click", () => navigateQuickLookMatch(1));
    els.quickLookDialog.addEventListener("keydown", (event) => {
      if (event.target.matches("input") && event.key !== "Escape") return;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); navigateQuickLook(-1); }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); navigateQuickLook(1); }
      if (event.code === "Space" || event.key === "Escape") { event.preventDefault(); els.quickLookDialog.close(); }
      if (event.key === "Enter" && quickLookDocumentId) { event.preventDefault(); openDocument(quickLookDocumentId); }
    });
    els.toastUndoBtn.addEventListener("click", () => postToMain("undo-portal-operation"));
    els.contextMenu.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (button) runContextAction(button.dataset.action);
    });
    els.contextMenu.addEventListener("keydown", (event) => {
      const buttons = [...els.contextMenu.querySelectorAll("button:not([disabled])")];
      const current = buttons.indexOf(document.activeElement);
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeContextMenu();
        els.librarySurface.querySelector(`[data-doc-id="${cssEscape(contextDocumentId)}"]`)?.focus({ preventScroll: true });
      } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) && buttons.length) {
        event.preventDefault();
        event.stopPropagation();
        const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next].focus();
      }
    });
    document.addEventListener("pointerdown", (event) => {
      if (!els.contextMenu.contains(event.target)) closeContextMenu();
    });
    document.addEventListener("keydown", handleDocumentKeyboard);
    [els.moveDialog, els.quickLookDialog].forEach((dialog) => {
      dialog.addEventListener("pointerdown", (event) => {
        if (event.target === dialog) dialog.close();
      });
    });
    window.addEventListener("beforeunload", () => channel?.close());

    document.querySelectorAll("[data-smart-folder]").forEach((button) => button.addEventListener("click", () => navigateTo({ smartFolder: button.dataset.smartFolder, folderId: null, collectionId: null })));
    els.breadcrumbs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-location]");
      if (!button) return;
      try { navigateTo(JSON.parse(button.dataset.location)); } catch { /* Ignore invalid internal state. */ }
    });
    els.folderTree.addEventListener("click", (event) => {
      const button = event.target.closest("[data-folder-id]");
      if (button) navigateTo({ smartFolder: "all", folderId: button.dataset.folderId, collectionId: null });
    });
    els.folderTree.addEventListener("contextmenu", (event) => {
      const button = event.target.closest("[data-folder-id]");
      if (!button) return;
      event.preventDefault();
      const folder = library.folders.find((item) => item.id === button.dataset.folderId);
      const name = prompt("폴더 이름", folder?.name || "");
      if (name?.trim()) postToMain("rename-folder", { folderId: button.dataset.folderId, name: name.trim() });
    });
    els.folderTree.addEventListener("dragstart", (event) => {
      const button = event.target.closest("[data-folder-id]");
      if (button) startFolderDrag(event, button.dataset.folderId);
    });
    els.folderTree.addEventListener("dragend", cleanupDragState);
    els.folderTree.addEventListener("dragover", (event) => {
      const button = event.target.closest("[data-folder-id]");
      if (!button || !dragPayload) return;
      event.preventDefault();
      button.classList.add("drop-active");
      startSpringTimer(button);
    });
    els.folderTree.addEventListener("dragleave", (event) => {
      const button = event.target.closest("[data-folder-id]");
      if (button && !button.contains(event.relatedTarget)) {
        button.classList.remove("drop-active");
        clearSpringTimer();
      }
    });
    els.folderTree.addEventListener("drop", (event) => {
      const button = event.target.closest("[data-folder-id]");
      if (!button) return;
      event.preventDefault();
      moveDragPayload(readDragPayload(event), button.dataset.folderId);
    });
    els.collectionList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-collection-id]");
      if (button) navigateTo({ smartFolder: "all", folderId: null, collectionId: button.dataset.collectionId });
    });
    els.collectionList.addEventListener("contextmenu", (event) => {
      const button = event.target.closest("[data-collection-id]");
      if (!button) return;
      event.preventDefault();
      const collection = preferences.collections.find((item) => item.id === button.dataset.collectionId);
      const name = prompt("컬렉션 이름 (비우면 삭제)", collection?.name || "");
      if (name === null) return;
      if (!name.trim()) preferences.collections = preferences.collections.filter((item) => item.id !== button.dataset.collectionId);
      else collection.name = name.trim();
      savePreferences();
      renderAll();
    });
    els.dropRoot.addEventListener("dragover", (event) => { event.preventDefault(); els.dropRoot.classList.add("drop-active"); });
    els.dropRoot.addEventListener("dragleave", () => els.dropRoot.classList.remove("drop-active"));
    els.dropRoot.addEventListener("drop", (event) => { event.preventDefault(); moveDragPayload(readDragPayload(event), null); });
  }

  bindEvents();
  connect();
})();
