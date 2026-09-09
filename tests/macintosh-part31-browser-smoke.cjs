const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const baseUrl = process.argv[2] || "http://localhost:4291";
const cdpPort = Number(process.argv[3] || 9391);
const edgePath = process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const profilePath = path.join(os.tmpdir(), `textforge-part31-${Date.now()}`);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getJson(url) {
  return new Promise((resolve, reject) => http.get(url, (response) => {
    let body = "";
    response.setEncoding("utf8");
    response.on("data", (chunk) => { body += chunk; });
    response.on("end", () => { try { resolve(JSON.parse(body)); } catch (error) { reject(error); } });
  }).on("error", reject));
}

async function waitForTarget(predicate, label) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const tabs = await getJson(`http://127.0.0.1:${cdpPort}/json/list`);
      const page = tabs.find((tab) => tab.type === "page" && predicate(tab));
      if (page?.webSocketDebuggerUrl) return page;
    } catch {}
    await delay(150);
  }
  throw new Error(`${label} Edge target did not start`);
}

function createClient(webSocketUrl) {
  let nextId = 0;
  const pending = new Map();
  const runtimeErrors = [];
  const socket = new WebSocket(webSocketUrl);
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(JSON.stringify(message.error)));
      else request.resolve(message.result);
    } else if (message.method === "Runtime.exceptionThrown") {
      runtimeErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    }
  };
  return {
    runtimeErrors,
    ready: new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; }),
    send(method, params = {}) { return new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); }); },
    close() { socket.close(); },
  };
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}

(async () => {
  const edge = spawn(edgePath, ["--headless=new", "--disable-gpu", "--disable-extensions", "--disable-popup-blocking", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${profilePath}`, baseUrl], { stdio: "ignore", windowsHide: true });
  let mainClient;
  let detachedClient;
  try {
    const mainTarget = await waitForTarget((tab) => tab.url.startsWith(baseUrl) && !tab.url.includes("detached-editor"), "Main");
    mainClient = createClient(mainTarget.webSocketDebuggerUrl);
    await mainClient.ready;
    await mainClient.send("Runtime.enable");
    await mainClient.send("Page.enable");

    const now = new Date().toISOString();
    const fixture = [
      { id: "p31-target", title: "Part31 Target", content: "Target body alpha beta", contentHtml: "<p>Target body alpha beta</p>", tags: [], history: [], favorite: false, folderId: null, deletedAt: null, theme: "modern", createdAt: now, updatedAt: now },
      { id: "p31-source", title: "Part31 Source", content: "Source body links [[Part31 Target]]", contentHtml: "<p>Source body links [[Part31 Target]]</p><script>window.__p31Unsafe=1</script>", tags: [], history: [], favorite: false, folderId: null, deletedAt: null, theme: "modern", createdAt: now, updatedAt: now },
      { id: "p31-third", title: "Part31 Third", content: "Third body gamma", contentHtml: "<p>Third body gamma</p>", tags: [], history: [], favorite: false, folderId: null, deletedAt: null, theme: "modern", createdAt: now, updatedAt: now },
      { id: "p31-detached", title: "Part31 Detached", content: "Detached preview body delta", contentHtml: "<p>Detached preview body delta</p><img src=x onerror=window.__p31DetachedUnsafe=1>", tags: [], history: [], favorite: false, folderId: null, deletedAt: null, theme: "modern", createdAt: now, updatedAt: now },
    ];
    await evaluate(mainClient, `(() => {
      localStorage.setItem("textforge.documents.v1", ${JSON.stringify(JSON.stringify(fixture))});
      localStorage.setItem("textforge.activeDocument.v1", "p31-target");
      localStorage.removeItem("textforge.sessionRecovery.v1");
      localStorage.removeItem("textforge.macintoshExperience.v1");
      location.reload();
      return true;
    })()`);
    await delay(750);

    const mainResult = await evaluate(mainClient, `(async () => {
      const host = window.TextForgeExperienceHost;
      const mac = window.TextForgeMacintoshExperience;
      const wait = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));
      const bodies = () => Object.fromEntries(host.getDocuments().map((doc) => [doc.id, doc.contentHtml]));
      const closeQuick = (key = "Escape") => document.querySelector(".tf-quicklook-overlay")?.dispatchEvent(new KeyboardEvent("keydown", { key, code: key === " " ? "Space" : key, bubbles: true }));

      host.openDocument("p31-target", { source: "p31" });
      host.openDocument("p31-third", { source: "p31-tab" });
      host.openDocument("p31-target", { source: "p31-tab" });
      host.openDocumentInNewPane("p31-source", { mode: "rich" });
      const splitMain = host.getSplitWorkspace(); splitMain.activePaneId = "main"; host.restoreSplitWorkspace(splitMain);
      const saved = mac.saveWorkspace("Part31 Workspace");
      const workspaceBefore = { active: host.getActiveDocument().id, split: JSON.stringify(host.getSplitWorkspace()), bodies: JSON.stringify(bodies()), workspaceId: JSON.parse(localStorage.getItem("textforge.macintoshExperience.v1")).activeWorkspaceId };
      mac.openWorkspaceManager(); await wait();
      const workspaceRefs = [...document.querySelectorAll(".tf-workspace-doc-ref")];
      const workspaceTrigger = workspaceRefs[0]; workspaceTrigger.focus();
      workspaceTrigger.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", key: " ", bubbles: true })); await wait();
      let quick = document.querySelector(".tf-quicklook-overlay");
      const workspaceOpened = Boolean(quick?.querySelector(".tf-quicklook-preview"));
      const workspaceFirstTitle = quick?.querySelector(".tf-quicklook-meta strong")?.textContent;
      const workspaceSearch = quick?.querySelector("input"); workspaceSearch.value = "body"; workspaceSearch.dispatchEvent(new Event("input", { bubbles: true }));
      const workspaceMatches = quick.querySelectorAll("mark[data-quick-match]").length;
      quick.querySelector('[data-quick-nav="1"]:not([disabled])')?.click(); await wait();
      const workspaceNextTitle = quick.querySelector(".tf-quicklook-meta strong")?.textContent;
      closeQuick("Escape"); await wait();
      const workspaceFocusReturned = document.activeElement === workspaceTrigger;
      const workspaceAfter = { active: host.getActiveDocument().id, split: JSON.stringify(host.getSplitWorkspace()), bodies: JSON.stringify(bodies()), workspaceId: JSON.parse(localStorage.getItem("textforge.macintoshExperience.v1")).activeWorkspaceId };
      document.querySelector("#tfWorkspaceManager")?.remove();

      host.setSplitLayout("single"); host.openDocument("p31-target", { source: "p31-backlink" }); host.setInspectorOpen(true, "system"); await wait();
      const backlinkTrigger = document.querySelector("#systemPanel [data-backlink-doc-id='p31-source']") || document.querySelector("[data-backlink-doc-id='p31-source']");
      const backlinkBefore = { active: host.getActiveDocument().id, view: JSON.stringify(host.captureMainViewState()), bodies: JSON.stringify(bodies()) };
      backlinkTrigger.focus(); backlinkTrigger.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", key: " ", bubbles: true })); await wait();
      quick = document.querySelector(".tf-quicklook-overlay");
      const backlinkOpened = quick?.querySelector(".tf-quicklook-meta strong")?.textContent === "Part31 Source";
      const unsafeBacklink = Boolean(quick?.querySelector("script")) || window.__p31Unsafe === 1;
      closeQuick("Escape"); await wait();
      const backlinkFocusReturned = document.activeElement === backlinkTrigger;
      const backlinkAfter = { active: host.getActiveDocument().id, view: JSON.stringify(host.captureMainViewState()), bodies: JSON.stringify(bodies()) };

      host.setInspectorOpen(false); host.openDocument("p31-target", { source: "p31-split" }); host.openDocumentInNewPane("p31-source", { mode: "rich" });
      const split = host.getSplitWorkspace(); split.activePaneId = "main"; host.restoreSplitWorkspace(split); await wait();
      const paneTrigger = document.querySelector("#referencePaneQuickLookBtn");
      const paneBefore = { active: host.getActiveDocument().id, split: JSON.stringify(host.getSplitWorkspace()), bodies: JSON.stringify(bodies()) };
      paneTrigger.focus(); paneTrigger.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", key: " ", bubbles: true })); await wait();
      quick = document.querySelector(".tf-quicklook-overlay");
      const paneOpened = quick?.querySelector(".tf-quicklook-meta strong")?.textContent === "Part31 Source";
      closeQuick("Escape"); await wait();
      const paneFocusReturned = document.activeElement === paneTrigger;
      const paneAfter = { active: host.getActiveDocument().id, split: JSON.stringify(host.getSplitWorkspace()), bodies: JSON.stringify(bodies()) };

      const editor = document.querySelector("#richEditor"); editor.focus();
      const editorSpaceAccepted = editor.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", key: " ", bubbles: true, cancelable: true })) && !document.querySelector(".tf-quicklook-overlay");
      paneTrigger.focus(); paneTrigger.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", key: " ", isComposing: true, bubbles: true, cancelable: true }));
      const composingBlocked = !document.querySelector(".tf-quicklook-overlay");
      paneTrigger.dataset.docId = "missing-p31"; paneTrigger.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", key: " ", bubbles: true })); await wait();
      quick = document.querySelector(".tf-quicklook-overlay");
      const staleUnavailable = quick?.querySelector(".tf-quicklook-meta strong")?.textContent === "Unavailable" && quick?.querySelector("[data-open]")?.disabled;
      closeQuick("Escape");

      window.TextForgeTypingDebug.clear(); window.TextForgeTypingDebug.enable();
      editor.replaceChildren(document.createElement("p")); const text = document.createTextNode("x".repeat(17000)); editor.firstChild.append(text);
      for (let index = 0; index < 10; index += 1) { text.nodeValue += "x"; editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "x" })); }
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const typing = window.TextForgeTypingDebug.summary(); window.TextForgeTypingDebug.disable();
      const switching = await window.TextForgeDocumentSwitchPerf.runDocumentSwitchBenchmark({ samples: 10 });
      host.openDocument("p31-detached", { source: "p31-detached" });
      return {
        workspaceOpened, workspaceFirstTitle, workspaceNextTitle, workspaceMatches, workspaceFocusReturned,
        workspaceStable: JSON.stringify(workspaceBefore) === JSON.stringify(workspaceAfter), workspaceHasBody: /"content(?:Html)?"\\s*:/.test(localStorage.getItem("textforge.macintoshExperience.v1") || ""),
        backlinkOpened, unsafeBacklink, backlinkFocusReturned, backlinkStable: JSON.stringify(backlinkBefore) === JSON.stringify(backlinkAfter),
        paneOpened, paneFocusReturned, paneStable: JSON.stringify(paneBefore) === JSON.stringify(paneAfter), editorSpaceAccepted, composingBlocked, staleUnavailable,
        inputP95: typing.inputHandler.p95, inputLongTasks: typing.longTaskCount,
        switchNextFrameP95: switching.totalToNextFrame.p95, switchRenderP95: switching.totalToRenderActiveEnd.p95, switchLongTasks: switching.longTaskCount,
        saved: saved.ok,
      };
    })()`);

    if (process.argv.includes("--main-only")) {
      assert.equal(mainResult.saved, true);
      assert.equal(mainResult.workspaceOpened, true); assert.ok(mainResult.workspaceMatches >= 1); assert.notEqual(mainResult.workspaceFirstTitle, mainResult.workspaceNextTitle); assert.equal(mainResult.workspaceFocusReturned, true); assert.equal(mainResult.workspaceStable, true); assert.equal(mainResult.workspaceHasBody, false);
      assert.equal(mainResult.backlinkOpened, true); assert.equal(mainResult.unsafeBacklink, false); assert.equal(mainResult.backlinkFocusReturned, true); assert.equal(mainResult.backlinkStable, true);
      assert.equal(mainResult.paneOpened, true); assert.equal(mainResult.paneFocusReturned, true); assert.equal(mainResult.paneStable, true); assert.equal(mainResult.editorSpaceAccepted, true); assert.equal(mainResult.composingBlocked, true); assert.equal(mainResult.staleUnavailable, true);
      assert.ok(mainResult.inputP95 < 5, `17K input p95 ${mainResult.inputP95}ms`); assert.equal(mainResult.inputLongTasks, 0); assert.ok(mainResult.switchNextFrameP95 < 35, `switch p95 ${mainResult.switchNextFrameP95}ms`); assert.equal(mainResult.switchLongTasks, 0);
      assert.deepEqual(mainClient.runtimeErrors, []);
      process.stdout.write(`${JSON.stringify(mainResult)}\nTextForge Macintosh Part 3.1 main-window browser smoke passed.\n`);
      return;
    }

    await mainClient.send("Target.createTarget", { url: `${baseUrl}/detached-editor.html?documentId=p31-detached&windowId=p31-window` });
    const detachedTarget = await waitForTarget((tab) => tab.url.includes("detached-editor.html") && tab.url.includes("p31-window"), "Detached");
    detachedClient = createClient(detachedTarget.webSocketDebuggerUrl);
    await detachedClient.ready;
    await detachedClient.send("Runtime.enable");
    await detachedClient.send("Page.enable");
    await delay(650);
    const detachedResult = await evaluate(detachedClient, `(async () => {
      const wait = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));
      for (let i = 0; i < 30 && !document.querySelector("#detachedConnection")?.classList.contains("connected"); i += 1) await wait(100);
      const editor = document.querySelector("#detachedRichEditor"); const button = document.querySelector("#detachedQuickLookBtn");
      editor.scrollTop = 12; const node = editor.querySelector("p")?.firstChild; if (node) { const range = document.createRange(); range.setStart(node, 3); range.collapse(true); getSelection().removeAllRanges(); getSelection().addRange(range); }
      const before = { html: editor.innerHTML, title: document.querySelector("#detachedTitle").value, mode: document.querySelector('[data-mode][aria-pressed="true"]')?.dataset.mode, save: document.querySelector("#detachedSaveState").textContent };
      button.focus(); button.click(); await wait();
      const quick = document.querySelector("#tfDetachedQuickLook");
      const opened = quick?.querySelector(".tf-quicklook-meta strong")?.textContent === "Part31 Detached";
      const search = quick?.querySelector("input"); search.value = "delta"; search.dispatchEvent(new Event("input", { bubbles: true }));
      const matches = quick.querySelectorAll("mark[data-quick-match]").length;
      const unsafe = Boolean(quick.querySelector("script,[onerror]")) || window.__p31DetachedUnsafe === 1;
      const channel = new BroadcastChannel("textforge.detached-editor.v1"); channel.postMessage({ source: "textforge-main", type: "preview-response", payload: { documentId: "p31-detached", windowId: "p31-window", previewRequestId: "stale-p31", preview: { title: "Stale response", contentHtml: "<p>stale</p>" } } }); channel.close();
      await wait(); const staleIgnored = quick.querySelector(".tf-quicklook-meta strong")?.textContent === "Part31 Detached";
      quick.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await wait();
      const after = { html: editor.innerHTML, title: document.querySelector("#detachedTitle").value, mode: document.querySelector('[data-mode][aria-pressed="true"]')?.dataset.mode, save: document.querySelector("#detachedSaveState").textContent };
      return { connected: document.querySelector("#detachedConnection").classList.contains("connected"), opened, matches, unsafe, staleIgnored, focusReturned: document.activeElement === button, stateStable: JSON.stringify(before) === JSON.stringify(after), revisionUnchanged: before.save === "Saved" && after.save === "Saved" };
    })()`);

    const leaseDuring = await evaluate(mainClient, `window.TextForgeExperienceHost.getDetachedDocuments().some((item) => item.documentId === "p31-detached" && item.windowId === "p31-window")`);
    await mainClient.send("Page.navigate", { url: "about:blank" });
    await delay(8500);
    const disconnected = await evaluate(detachedClient, `(async () => {
      const button = document.querySelector("#detachedQuickLookBtn"); button.click(); await new Promise((resolve) => setTimeout(resolve, 80));
      const quick = document.querySelector("#tfDetachedQuickLook");
      const unavailable = quick?.querySelector(".tf-quicklook-meta strong")?.textContent === "Unavailable";
      quick?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      return { label: document.querySelector("#detachedConnection").textContent, unavailable, readonly: document.querySelector("#detachedRichEditor").getAttribute("contenteditable") === "false" };
    })()`);
    await mainClient.send("Page.navigate", { url: baseUrl });
    await delay(3200);
    const reconnected = await evaluate(detachedClient, `document.querySelector("#detachedConnection").classList.contains("connected") && document.querySelector("#detachedRichEditor").getAttribute("contenteditable") === "true"`);

    assert.equal(mainResult.saved, true);
    assert.equal(mainResult.workspaceOpened, true); assert.ok(mainResult.workspaceMatches >= 1); assert.notEqual(mainResult.workspaceFirstTitle, mainResult.workspaceNextTitle); assert.equal(mainResult.workspaceFocusReturned, true); assert.equal(mainResult.workspaceStable, true); assert.equal(mainResult.workspaceHasBody, false);
    assert.equal(mainResult.backlinkOpened, true); assert.equal(mainResult.unsafeBacklink, false); assert.equal(mainResult.backlinkFocusReturned, true); assert.equal(mainResult.backlinkStable, true);
    assert.equal(mainResult.paneOpened, true); assert.equal(mainResult.paneFocusReturned, true); assert.equal(mainResult.paneStable, true); assert.equal(mainResult.editorSpaceAccepted, true); assert.equal(mainResult.composingBlocked, true); assert.equal(mainResult.staleUnavailable, true);
    assert.ok(mainResult.inputP95 < 5, `17K input p95 ${mainResult.inputP95}ms`); assert.equal(mainResult.inputLongTasks, 0); assert.ok(mainResult.switchNextFrameP95 < 35, `switch p95 ${mainResult.switchNextFrameP95}ms`); assert.equal(mainResult.switchLongTasks, 0);
    assert.equal(detachedResult.connected, true); assert.equal(detachedResult.opened, true); assert.ok(detachedResult.matches >= 1); assert.equal(detachedResult.unsafe, false); assert.equal(detachedResult.staleIgnored, true); assert.equal(detachedResult.focusReturned, true); assert.equal(detachedResult.stateStable, true); assert.equal(detachedResult.revisionUnchanged, true); assert.equal(leaseDuring, true);
    assert.match(disconnected.label, /unavailable/i); assert.equal(disconnected.unavailable, true); assert.equal(disconnected.readonly, true); assert.equal(reconnected, true);
    assert.deepEqual(mainClient.runtimeErrors, []); assert.deepEqual(detachedClient.runtimeErrors, []);
    process.stdout.write(`${JSON.stringify({ ...mainResult, detached: detachedResult, disconnected, reconnected })}\nTextForge Macintosh Part 3.1 browser smoke passed.\n`);
  } finally {
    detachedClient?.close(); mainClient?.close();
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(edge.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }); else edge.kill();
    const resolved = path.resolve(profilePath);
    if (resolved.startsWith(path.resolve(os.tmpdir()))) for (let attempt = 0; attempt < 6; attempt += 1) { try { fs.rmSync(resolved, { recursive: true, force: true }); break; } catch { await delay(250); } }
  }
})().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
