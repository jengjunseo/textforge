const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const edgePath = process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const baseUrl = String(process.argv[2] || "http://127.0.0.1:4291").replace(/\/$/, "");
const outputDir = path.resolve(process.argv[3] || path.join(os.tmpdir(), `textforge-migration-browser-${Date.now()}`));
const cdpPort = Number(process.argv[4] || 9364);
const userDataDir = path.join(os.tmpdir(), `textforge-migration-edge-${Date.now()}`);

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => {
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    }).on("error", reject);
  });
}

async function waitForCdp() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const tabs = await getJson(`http://127.0.0.1:${cdpPort}/json/list`);
      const page = tabs.find((tab) => tab.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      // Edge is still starting.
    }
    await delay(200);
  }
  throw new Error("Edge CDP did not become ready");
}

function createCdpClient(webSocketUrl) {
  let nextId = 0;
  const pending = new Map();
  const events = [];
  const socket = new WebSocket(webSocketUrl);
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(JSON.stringify(message.error)));
      else request.resolve(message.result);
      return;
    }
    if (["Runtime.exceptionThrown", "Runtime.consoleAPICalled", "Log.entryAdded"].includes(message.method)) events.push(message);
  };
  return {
    events,
    ready: new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; }),
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++nextId;
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() { socket.close(); },
  };
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}

async function navigate(cdp, url) {
  await cdp.send("Page.navigate", { url });
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (await evaluate(cdp, "document.readyState").catch(() => "loading") === "complete") {
      await delay(250);
      return;
    }
    await delay(100);
  }
  throw new Error(`Page did not finish loading: ${url}`);
}

function fixtureScript() {
  const docs = [
    {
      id: "migration-doc-1", title: "한국어 Rich 초안", content: "한국어 Rich 초안", contentHtml: "<p><strong>한국어 Rich 초안</strong></p>", type: "note", folderId: "migration-folder-child", color: "#167c80", deletedAt: null, theme: "modern", modelVersion: 3, tags: ["중요", "한국어"], favorite: true, history: [{ id: "migration-history-1", label: "보호본", title: "이전 제목", content: "이전 내용", contentHtml: "<p>이전 내용</p>", createdAt: "2026-01-01T00:00:00.000Z" }], createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z",
    },
    {
      id: "migration-doc-2", title: "두 번째 문서", content: "두 번째 문서 내용", contentHtml: "<p><em>두 번째 문서 내용</em></p>", type: "note", folderId: "migration-folder-root", color: "#576cbc", deletedAt: null, theme: "report", modelVersion: 3, tags: ["보조"], favorite: false, history: [], createdAt: "2026-01-03T00:00:00.000Z", updatedAt: "2026-01-03T00:00:00.000Z",
    },
  ];
  const folders = [
    { id: "migration-folder-root", name: "프로젝트", parentId: null, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
    { id: "migration-folder-child", name: "초안", parentId: "migration-folder-root", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  ];
  const prompts = [{ name: "한국어 요약", text: "아래 내용을 한국어로 요약해줘." }];
  const collections = [{ id: "migration-collection", name: "이번 작업", docIds: ["migration-doc-1", "migration-doc-2"] }];
  const workspaceState = { version: 2, id: "migration-workspace", name: "집중 작업", activeTab: "migration-doc-1", tabs: [{ docId: "migration-doc-1", viewState: { scrollTop: 100, selection: { start: 2, end: 2 } } }], recentlyClosed: [], split: { layout: "single", dividerRatio: 0.5, panes: [{ id: "main", documentId: "migration-doc-1", mode: "rich", lockedScroll: false, scrollTop: 100 }] }, inspector: { open: true, tab: "toc" }, focus: true, sidebarOpen: true, detached: [], savedAt: "2026-01-02T00:00:00.000Z" };
  return `(() => {
    const docs = ${JSON.stringify(docs)};
    const folders = ${JSON.stringify(folders)};
    localStorage.setItem("textforge.documents.v1", JSON.stringify(docs));
    localStorage.setItem("textforge.activeDocument.v1", "migration-doc-1");
    localStorage.setItem("textforge.folders.v1", JSON.stringify(folders));
    localStorage.setItem("textforge.prompts.v1", ${JSON.stringify(JSON.stringify(prompts))});
    localStorage.setItem("textforge.portalLibrary.preferences.v1", ${JSON.stringify(JSON.stringify({ view: "grid", sort: "updated", collections }))});
    localStorage.setItem("textforge.macintoshExperience.v1", ${JSON.stringify(JSON.stringify({ version: 2, tabs: [{ docId: "migration-doc-1", viewState: null }], activeTab: "migration-doc-1", workspaces: [workspaceState], activeWorkspaceId: "migration-workspace", lastWorkspaceId: "migration-workspace", autoRestore: false }))});
    window.confirm = () => true;
  })();`;
}

async function waitForDownload() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const files = fs.readdirSync(outputDir).filter((file) => file.endsWith(".textforge-migrate"));
    if (files.length) return path.join(outputDir, files[0]);
    await delay(100);
  }
  throw new Error("Migration file was not downloaded");
}

async function readDurableSnapshot(cdp) {
  return evaluate(cdp, `new Promise((resolve) => {
    const request = indexedDB.open("textforge-personal-storage", 1);
    request.onerror = () => resolve(null);
    request.onsuccess = () => {
      const tx = request.result.transaction("state", "readonly");
      const get = tx.objectStore("state").get("snapshot");
      get.onerror = () => resolve(null);
      get.onsuccess = () => resolve(get.result || null);
    };
  })`);
}

(async () => {
  assert.ok(fs.existsSync(edgePath), `Microsoft Edge not found: ${edgePath}`);
  fs.mkdirSync(outputDir, { recursive: true });
  const edge = spawn(edgePath, [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--no-first-run",
    "--metrics-recording-only",
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ], { stdio: "ignore", windowsHide: true });
  let cdp;
  try {
    const websocketUrl = await waitForCdp();
    cdp = createCdpClient(websocketUrl);
    await cdp.ready;
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Log.enable");
    await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: outputDir });
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: fixtureScript() });
    await navigate(cdp, baseUrl);
    assert.equal(await evaluate(cdp, "typeof window.TextForgeMigration"), "object");
    assert.equal(await evaluate(cdp, "document.querySelectorAll('#richEditor').length"), 1);
    await evaluate(cdp, `(() => {
      const editor = document.querySelector("#richEditor");
      editor.insertAdjacentHTML("beforeend", "<p>마지막 입력</p>");
      editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "마지막 입력" }));
      return editor.innerHTML;
    })()`);
    const before = await evaluate(cdp, "window.TextForgeExperienceHost.getDocuments()");
    const durableBefore = await readDurableSnapshot(cdp);
    await evaluate(cdp, "document.querySelector('#v2MigrationBtn').click()");
    const downloadPath = await waitForDownload();
    const text = fs.readFileSync(downloadPath, "utf8");
    const migration = JSON.parse(text);
    assert.equal(migration.format, "textforge-migration");
    assert.equal(migration.schemaVersion, 1);
    assert.equal(migration.source.product, "TextForge");
    assert.equal(migration.source.version, "1.0.0");
    assert.match(migration.exportedAt, /^20\d\d-/);
    assert.equal(migration.integrity.algorithm, "SHA-256");
    assert.equal(await evaluate(cdp, `window.TextForgeMigration.parse(${JSON.stringify(text)}).then(() => true)`), true);
    const tamperedText = text.replace("마지막 입력", "변조된 입력");
    assert.equal(await evaluate(cdp, `window.TextForgeMigration.parse(${JSON.stringify(tamperedText)}).then(() => false).catch(() => true)`), true);
    const after = await evaluate(cdp, "window.TextForgeExperienceHost.getDocuments()");
    assert.equal(after.length, before.length);
    assert.equal(migration.data.documents.length, 2);
    assert.equal(migration.data.documents[0].id, "migration-doc-1");
    assert.match(migration.data.documents[0].content, /마지막 입력/);
    assert.match(migration.data.documents[0].contentHtml, /마지막 입력/);
    assert.equal(migration.data.documents[0].favorite, true);
    assert.deepEqual(migration.data.documents[0].tags, ["중요", "한국어"]);
    assert.equal(migration.data.folders.length, 2);
    assert.equal(migration.data.folders[1].parentId, "migration-folder-root");
    assert.equal(migration.data.prompts.length, 1);
    assert.equal(migration.data.collections.length, 1);
    assert.equal(migration.data.workspaces.length, 1);
    assert.equal("viewState" in migration.data.workspaces[0].tabs[0], false);
    assert.equal("scrollTop" in migration.data.workspaces[0].split.panes[0], false);
    assert.equal(await evaluate(cdp, "document.querySelector('#sessionText').textContent.includes('V2 migration file downloaded')"), true);
    const durableAfter = await readDurableSnapshot(cdp);
    assert.deepEqual(durableAfter, durableBefore);
    const runtimeErrors = cdp.events.filter((event) => event.method === "Runtime.exceptionThrown");
    assert.equal(runtimeErrors.length, 0, JSON.stringify(runtimeErrors));
    const digest = crypto.createHash("sha256").update(text).digest("hex");
    console.log(JSON.stringify({ ok: true, downloadPath, bytes: Buffer.byteLength(text), sha256: digest, documentCount: migration.data.documents.length, folderCount: migration.data.folders.length, promptCount: migration.data.prompts.length, collectionCount: migration.data.collections.length, workspaceCount: migration.data.workspaces.length, runtimeErrorCount: runtimeErrors.length }));
  } finally {
    cdp?.close();
    edge.kill();
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
