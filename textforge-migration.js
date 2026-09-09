(() => {
  "use strict";

  const FORMAT_ID = "textforge-migration";
  const SCHEMA_VERSION = 1;
  const FILE_EXTENSION = ".textforge-migrate";

  function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function cloneJson(value, label) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      throw new Error(`${label} is not serializable`);
    }
  }

  function requiredString(value, label) {
    if (typeof value !== "string" || !value) throw new Error(`${label} is invalid`);
    return value;
  }

  function nullableString(value, label) {
    if (value !== null && typeof value !== "string") throw new Error(`${label} is invalid`);
    return value || null;
  }

  function copyDocument(document, index) {
    if (!isRecord(document)) throw new Error(`documents[${index}] is invalid`);
    const history = Array.isArray(document.history) ? document.history : [];
    if (history.some((item) => !isRecord(item))) throw new Error(`documents[${index}].history is invalid`);
    return {
      id: requiredString(document.id, `documents[${index}].id`),
      title: typeof document.title === "string" ? document.title : "Untitled",
      content: typeof document.content === "string" ? document.content : "",
      contentHtml: typeof document.contentHtml === "string" ? document.contentHtml : "",
      type: typeof document.type === "string" ? document.type : "note",
      folderId: nullableString(document.folderId, `documents[${index}].folderId`),
      color: typeof document.color === "string" ? document.color : "",
      deletedAt: nullableString(document.deletedAt, `documents[${index}].deletedAt`),
      theme: typeof document.theme === "string" ? document.theme : "modern",
      modelVersion: Number.isFinite(Number(document.modelVersion)) ? Number(document.modelVersion) : 3,
      tags: Array.isArray(document.tags) ? document.tags.map((tag) => requiredString(tag, `documents[${index}].tags`)) : [],
      favorite: Boolean(document.favorite),
      history: cloneJson(history, `documents[${index}].history`),
      createdAt: typeof document.createdAt === "string" ? document.createdAt : "",
      updatedAt: typeof document.updatedAt === "string" ? document.updatedAt : "",
    };
  }

  function copyFolder(folder, index) {
    if (!isRecord(folder)) throw new Error(`folders[${index}] is invalid`);
    return {
      id: requiredString(folder.id, `folders[${index}].id`),
      name: typeof folder.name === "string" ? folder.name : "새 폴더",
      parentId: nullableString(folder.parentId, `folders[${index}].parentId`),
      createdAt: typeof folder.createdAt === "string" ? folder.createdAt : "",
      updatedAt: typeof folder.updatedAt === "string" ? folder.updatedAt : "",
    };
  }

  function copyPrompts(prompts) {
    if (!Array.isArray(prompts) || prompts.some((prompt) => !isRecord(prompt))) throw new Error("prompts is invalid");
    return cloneJson(prompts, "prompts");
  }

  function copyCollections(collections) {
    if (!Array.isArray(collections)) throw new Error("collections is invalid");
    return collections.map((collection, index) => {
      if (!isRecord(collection)) throw new Error(`collections[${index}] is invalid`);
      if (!Array.isArray(collection.docIds) || collection.docIds.some((id) => typeof id !== "string" || !id)) throw new Error(`collections[${index}].docIds is invalid`);
      return {
        id: requiredString(collection.id, `collections[${index}].id`),
        name: requiredString(collection.name, `collections[${index}].name`),
        docIds: [...collection.docIds],
      };
    });
  }

  function copyWorkspace(workspace, index) {
    if (!isRecord(workspace)) throw new Error(`workspaces[${index}] is invalid`);
    const tabs = Array.isArray(workspace.tabs) ? workspace.tabs : [];
    const split = isRecord(workspace.split) ? workspace.split : { layout: "single", panes: [] };
    const panes = Array.isArray(split.panes) ? split.panes : [];
    return {
      id: requiredString(workspace.id, `workspaces[${index}].id`),
      name: requiredString(workspace.name, `workspaces[${index}].name`),
      savedAt: typeof workspace.savedAt === "string" ? workspace.savedAt : "",
      activeTab: nullableString(workspace.activeTab, `workspaces[${index}].activeTab`),
      tabs: tabs.map((tab, tabIndex) => {
        const docId = typeof tab === "string" ? tab : tab?.docId;
        return { docId: requiredString(docId, `workspaces[${index}].tabs[${tabIndex}].docId`) };
      }),
      split: {
        layout: typeof split.layout === "string" ? split.layout : "single",
        dividerRatio: Number.isFinite(Number(split.dividerRatio)) ? Number(split.dividerRatio) : 0.5,
        panes: panes.map((pane, paneIndex) => ({
          id: requiredString(pane?.id, `workspaces[${index}].split.panes[${paneIndex}].id`),
          documentId: nullableString(pane?.documentId, `workspaces[${index}].split.panes[${paneIndex}].documentId`),
          mode: typeof pane?.mode === "string" ? pane.mode : "rich",
          lockedScroll: Boolean(pane?.lockedScroll),
        })),
      },
      inspector: isRecord(workspace.inspector)
        ? { open: Boolean(workspace.inspector.open), tab: typeof workspace.inspector.tab === "string" ? workspace.inspector.tab : "toc" }
        : { open: false, tab: "toc" },
      focus: Boolean(workspace.focus),
      sidebarOpen: workspace.sidebarOpen !== false,
    };
  }

  function validateData(data) {
    if (!isRecord(data)) throw new Error("migration data is invalid");
    if (!Array.isArray(data.documents)) throw new Error("documents is invalid");
    if (!Array.isArray(data.folders)) throw new Error("folders is invalid");
    if (!Array.isArray(data.prompts)) throw new Error("prompts is invalid");
    if (!Array.isArray(data.collections)) throw new Error("collections is invalid");
    if (!Array.isArray(data.workspaces)) throw new Error("workspaces is invalid");
    if (data.activeDocumentId !== null && typeof data.activeDocumentId !== "string") throw new Error("activeDocumentId is invalid");
    const documents = data.documents.map(copyDocument);
    const documentIds = new Set(documents.map((document) => document.id));
    if (data.activeDocumentId && !documentIds.has(data.activeDocumentId)) throw new Error("activeDocumentId does not reference a document");
    return {
      activeDocumentId: data.activeDocumentId || null,
      documents,
      folders: data.folders.map(copyFolder),
      prompts: copyPrompts(data.prompts),
      collections: copyCollections(data.collections),
      workspaces: data.workspaces.map(copyWorkspace),
    };
  }

  function buildPayload(input = {}) {
    if (!isRecord(input)) throw new Error("migration input is invalid");
    const data = validateData({
      activeDocumentId: input.activeDocumentId || null,
      documents: input.documents,
      folders: input.folders,
      prompts: input.prompts,
      collections: input.collections || [],
      workspaces: input.workspaces || [],
    });
    const sourceVersion = requiredString(input.sourceVersion, "source.version");
    return {
      format: FORMAT_ID,
      schemaVersion: SCHEMA_VERSION,
      source: { product: "TextForge", version: sourceVersion },
      exportedAt: new Date().toISOString(),
      data,
    };
  }

  function bytesFor(text) {
    return new TextEncoder().encode(text);
  }

  async function sha256(text) {
    if (!globalThis.crypto?.subtle) throw new Error("SHA-256 is unavailable");
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytesFor(text));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function serialize(payload) {
    if (!isRecord(payload) || payload.format !== FORMAT_ID || payload.schemaVersion !== SCHEMA_VERSION) throw new Error("Unsupported migration payload");
    validateData(payload.data);
    const body = cloneJson(payload, "migration payload");
    delete body.integrity;
    const canonical = JSON.stringify(body);
    return JSON.stringify({ ...body, integrity: { algorithm: "SHA-256", value: await sha256(canonical) } }, null, 2);
  }

  async function parse(text) {
    if (typeof text !== "string" || !text.trim()) throw new Error("Migration file is empty");
    let parsed;
    try { parsed = JSON.parse(text); } catch { throw new Error("Migration file is not valid JSON"); }
    if (!isRecord(parsed) || parsed.format !== FORMAT_ID) throw new Error("This is not a TextForge migration file");
    if (parsed.schemaVersion !== SCHEMA_VERSION) throw new Error("Unsupported TextForge migration schema");
    if (!isRecord(parsed.source) || parsed.source.product !== "TextForge" || typeof parsed.source.version !== "string") throw new Error("Migration source metadata is invalid");
    if (typeof parsed.exportedAt !== "string" || !isRecord(parsed.integrity) || parsed.integrity.algorithm !== "SHA-256" || typeof parsed.integrity.value !== "string") throw new Error("Migration integrity metadata is invalid");
    validateData(parsed.data);
    const integrity = parsed.integrity;
    const body = cloneJson(parsed, "migration file");
    delete body.integrity;
    const actual = await sha256(JSON.stringify(body));
    if (actual !== integrity.value) throw new Error("Migration file integrity check failed");
    return parsed;
  }

  function download(text, fileName) {
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName.endsWith(FILE_EXTENSION) ? fileName : `${fileName}${FILE_EXTENSION}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return link.download;
  }

  window.TextForgeMigration = Object.freeze({ FORMAT_ID, SCHEMA_VERSION, FILE_EXTENSION, buildPayload, serialize, parse, download });
})();
