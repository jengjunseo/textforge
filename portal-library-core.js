(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TextForgePortalCore = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const DAY = 24 * 60 * 60 * 1000;

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeQuery(value) {
    return String(value || "").trim().toLocaleLowerCase();
  }

  function matchesSmartFolder(doc, smartFolder, now = Date.now()) {
    if (smartFolder === "trash") return Boolean(doc.deletedAt);
    if (doc.deletedAt) return false;
    if (smartFolder === "favorites") return Boolean(doc.favorite);
    if (smartFolder === "recent") return now - new Date(doc.updatedAt || doc.createdAt || 0).getTime() <= 30 * DAY;
    if (smartFolder === "week") return now - new Date(doc.updatedAt || doc.createdAt || 0).getTime() <= 7 * DAY;
    if (smartFolder === "long") return Number(doc.charCount || 0) >= 10000;
    if (smartFolder === "untitled") return !String(doc.title || "").trim() || /^untitled\b/i.test(String(doc.title || ""));
    if (smartFolder === "unfiled" || smartFolder === "inbox") return !doc.folderId;
    if (smartFolder === "recovery") return Number(doc.historyCount || 0) > 0;
    return true;
  }

  function documentSearchText(doc) {
    return [doc.title, doc.previewText, doc.type, ...safeArray(doc.tags)].join("\n").toLocaleLowerCase();
  }

  function filterDocuments(documents, options = {}) {
    const query = normalizeQuery(options.query);
    const folderId = options.folderId === undefined ? null : options.folderId;
    const smartFolder = options.smartFolder || "all";
    const collectionIds = options.collectionIds ? new Set(options.collectionIds) : null;
    const now = options.now || Date.now();

    return safeArray(documents).filter((doc) => {
      if (!matchesSmartFolder(doc, smartFolder, now)) return false;
      if (smartFolder === "all" && doc.deletedAt) return false;
      if (folderId !== null && doc.folderId !== folderId) return false;
      if (collectionIds && !collectionIds.has(doc.id)) return false;
      if (!query) return true;
      return documentSearchText(doc).includes(query);
    });
  }

  function sortDocuments(documents, sort = "updated") {
    return safeArray(documents).slice().sort((a, b) => {
      if (sort === "created") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sort === "title") return String(a.title || "").localeCompare(String(b.title || ""), "ko");
      if (sort === "favorite") return Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      if (sort === "chars") return Number(b.charCount || 0) - Number(a.charCount || 0);
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
  }

  function getFolderDescendantIds(folders, folderId) {
    const descendants = new Set();
    let frontier = [folderId];
    while (frontier.length) {
      const parentId = frontier.shift();
      safeArray(folders).forEach((folder) => {
        if (folder.parentId === parentId && !descendants.has(folder.id)) {
          descendants.add(folder.id);
          frontier.push(folder.id);
        }
      });
    }
    return descendants;
  }

  function canMoveFolder(folders, folderId, targetParentId) {
    if (!folderId) return false;
    if (!targetParentId) return true;
    if (folderId === targetParentId) return false;
    return !getFolderDescendantIds(folders, folderId).has(targetParentId);
  }

  function updateSelection(currentIds, visibleIds, docId, options = {}) {
    const selected = new Set(safeArray(currentIds));
    const visible = safeArray(visibleIds);
    const index = visible.indexOf(docId);
    const anchorIndex = visible.indexOf(options.anchorId);

    if (options.shift && index >= 0 && anchorIndex >= 0) {
      const [start, end] = anchorIndex < index ? [anchorIndex, index] : [index, anchorIndex];
      if (!options.additive) selected.clear();
      visible.slice(start, end + 1).forEach((id) => selected.add(id));
    } else if (options.additive) {
      if (selected.has(docId)) selected.delete(docId);
      else selected.add(docId);
    } else {
      selected.clear();
      if (docId) selected.add(docId);
    }
    return [...selected];
  }

  function buildFolderPath(folders, folderId) {
    const byId = new Map(safeArray(folders).map((folder) => [folder.id, folder]));
    const path = [];
    const visited = new Set();
    let current = byId.get(folderId);
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      path.unshift(current);
      current = byId.get(current.parentId);
    }
    return path;
  }

  function documentsHash(documents) {
    const text = JSON.stringify(safeArray(documents).map((doc) => [doc.id, doc.title, doc.contentHtml, doc.folderId, doc.deletedAt, doc.favorite]));
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  return {
    filterDocuments,
    sortDocuments,
    matchesSmartFolder,
    getFolderDescendantIds,
    canMoveFolder,
    updateSelection,
    buildFolderPath,
    documentsHash,
  };
});
