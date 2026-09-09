const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const baseUrl = process.argv[2] || "http://localhost:4291";
const cdpPort = Number(process.argv[3] || 9383);
const edgePath = process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const profilePath = path.join(os.tmpdir(), `textforge-part3-${Date.now()}`);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getJson(url) {
  return new Promise((resolve, reject) => http.get(url, (response) => {
    let body = ""; response.setEncoding("utf8"); response.on("data", (chunk) => { body += chunk; });
    response.on("end", () => { try { resolve(JSON.parse(body)); } catch (error) { reject(error); } });
  }).on("error", reject));
}

async function waitForPage() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const tabs = await getJson(`http://127.0.0.1:${cdpPort}/json/list`);
      const page = tabs.find((tab) => tab.type === "page" && tab.url.startsWith(baseUrl));
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await delay(150);
  }
  throw new Error("Part 3 Edge target did not start");
}

function createClient(webSocketUrl) {
  let nextId = 0; const pending = new Map(); const runtimeErrors = []; const socket = new WebSocket(webSocketUrl);
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const request = pending.get(message.id); pending.delete(message.id);
      if (message.error) request.reject(new Error(JSON.stringify(message.error))); else request.resolve(message.result);
    } else if (message.method === "Runtime.exceptionThrown") runtimeErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
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
  const edge = spawn(edgePath, ["--headless=new", "--disable-gpu", "--disable-extensions", `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${profilePath}`, baseUrl], { stdio: "ignore", windowsHide: true });
  let client;
  try {
    client = createClient(await waitForPage()); await client.ready; await client.send("Runtime.enable"); await client.send("Page.enable");
    await client.send("Page.navigate", { url: baseUrl });
    await delay(450);
    const now = new Date().toISOString();
    const longText = "Large preview text. ".repeat(7000).slice(0, 100000);
    const fixture = [
      { id: "p3-source", title: "Part3 Source", content: "Kept\n\nMove me\n\nCurrent changed\n\nAdded now\n\nEnd", contentHtml: "<p>Kept</p><p>Move me</p><p>Current changed</p><p>Added now</p><p>End</p>", tags: ["part3"], history: [{ id: "p3-version", label: "Safety: Part 3 baseline", title: "Part3 Source", content: "Kept\n\nDeleted only\n\nMove me\n\nPast changed\n\nEnd", contentHtml: "<p>Kept</p><p>Deleted only</p><p>Move me</p><p>Past changed</p><p>End</p><script>window.__unsafe=1</script>", createdAt: now }], favorite: true, folderId: null, deletedAt: null, theme: "modern", createdAt: now, updatedAt: now },
      { id: "p3-target", title: "Part3 Target", content: "Target start", contentHtml: "<p>Target start</p>", tags: [], history: [], favorite: false, folderId: null, deletedAt: null, theme: "modern", createdAt: now, updatedAt: now },
      { id: "p3-large", title: "Part3 100K", content: longText, contentHtml: `<p>${longText}</p>`, tags: [], history: [], favorite: false, folderId: null, deletedAt: now, theme: "modern", createdAt: now, updatedAt: now },
    ];
    await evaluate(client, `(() => { localStorage.setItem("textforge.documents.v1", ${JSON.stringify(JSON.stringify(fixture))}); localStorage.setItem("textforge.activeDocument.v1", "p3-source"); localStorage.removeItem("textforge.sessionRecovery.v1"); localStorage.removeItem("textforge.macintoshExperience.v1"); location.reload(); return true; })()`);
    await delay(650);
    const result = await evaluate(client, `(async () => {
      const host = window.TextForgeExperienceHost; const mac = window.TextForgeMacintoshExperience; const editor = document.querySelector("#richEditor");
      const wait = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms));
      const selectBlock = (index) => { const range = document.createRange(); range.selectNode(editor.children[index]); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); return host.captureSelectionObject(); };
      const html = (id) => host.getDocuments().find((doc) => doc.id === id)?.contentHtml || "";
      const originalSource = html("p3-source"); const originalTarget = html("p3-target"); const activeBefore = host.getActiveDocument().id;

      mac.openQuickLook("p3-target", { source: "test" }); await wait();
      const quick = document.querySelector("#tfQuickLook"); const quickOpened = Boolean(quick?.querySelector(".tf-quicklook-preview"));
      const quickActiveStable = host.getActiveDocument().id === activeBefore;
      const quickInput = quick.querySelector("input"); quickInput.value = "Target"; quickInput.dispatchEvent(new Event("input", { bubbles: true }));
      const quickMatches = quick.querySelectorAll("mark[data-quick-match]").length; quick.closeDialog();
      mac.openQuickLook("p3-large", { source: "test" }); await wait(60); const largePreviewLength = document.querySelector("#tfQuickLook .tf-quicklook-preview").innerText.length; document.querySelector("#tfQuickLook").closeDialog();
      const previewInvariant = html("p3-source") === originalSource && html("p3-target") === originalTarget;

      mac.openVersions(); await wait(80);
      const versions = document.querySelector("#tfVersions");
      const diffKinds = [...versions.querySelectorAll("[data-diff-kind]")].map((row) => row.dataset.diffKind);
      const unsafeRendered = Boolean(versions.querySelector("script")) || window.__unsafe === 1;
      versions.closeDialog();

      host.restoreSnapshot("p3-version");
      const restoreWorked = html("p3-source").includes("Past changed") && host.getActiveDocument().history.some((item) => item.label === "복구 직전");
      editor.dispatchEvent(new KeyboardEvent("keydown", { key: "z", code: "KeyZ", ctrlKey: true, bubbles: true }));
      const restoreUndoWorked = html("p3-source") === originalSource;
      const caret = document.createRange(); caret.selectNodeContents(editor); caret.collapse(false); getSelection().removeAllRanges(); getSelection().addRange(caret); host.saveEditorSelection();
      const versionInsert = host.insertSnapshotBlocks("p3-version", [0]); const versionInsertWorked = versionInsert.ok && editor.lastElementChild?.textContent === "Kept";
      editor.dispatchEvent(new KeyboardEvent("keydown", { key: "z", code: "KeyZ", ctrlKey: true, bubbles: true }));
      const versionInsertUndoWorked = html("p3-source") === originalSource;

      let payload = selectBlock(1); const moved = host.runLocalSelectionOperation("move-up", payload.token); const movedText = editor.children[0].textContent; const localUndo = host.undoSelectionOperation(moved.operationId);
      const afterLocalUndo = html("p3-source") === originalSource;

      payload = selectBlock(1); const copy = await host.runCrossDocumentSelectionOperation("copy", payload.token, "p3-target"); const copyWorked = html("p3-target").includes("Move me") && html("p3-source") === originalSource; const copyUndo = host.undoSelectionOperation(copy.operationId);
      const copyUndoWorked = html("p3-target") === originalTarget && html("p3-source") === originalSource;

      payload = selectBlock(1); const targetFailure = await host.runCrossDocumentSelectionOperation("move", payload.token, "p3-target", { simulateFailure: "target-save" });
      const targetRollback = targetFailure.rolledBack && html("p3-source") === originalSource && html("p3-target") === originalTarget;
      payload = selectBlock(1); const sourceFailure = await host.runCrossDocumentSelectionOperation("move", payload.token, "p3-target", { simulateFailure: "source-save" });
      const sourceRollback = sourceFailure.rolledBack && html("p3-source") === originalSource && html("p3-target") === originalTarget;

      payload = selectBlock(1); const move = await host.runCrossDocumentSelectionOperation("move", payload.token, "p3-target"); const moveWorked = !html("p3-source").includes("Move me") && html("p3-target").includes("Move me"); const moveUndo = host.undoSelectionOperation(move.operationId);
      const moveUndoWorked = html("p3-source") === originalSource && html("p3-target") === originalTarget;

      payload = selectBlock(1); const link = host.insertDocumentLinkFromSelection(payload.token, "p3-target"); const linkWorked = html("p3-source").includes("[[Part3 Target]]"); host.undoSelectionOperation(link.operationId);
      payload = selectBlock(1); const newCopy = await host.createDocumentFromSelection(payload.token, false, "Part3 Extract"); const created = host.getDocuments().some((doc) => doc.id === newCopy.documentId && doc.title === "Part3 Extract" && !doc.deletedAt); const newUndo = host.undoSelectionOperation(newCopy.operationId); const createdUndone = Boolean(host.getDocuments().find((doc) => doc.id === newCopy.documentId)?.deletedAt);

      const table = document.createElement("table"); table.innerHTML = "<tbody><tr><td>Unsafe partial cell</td></tr></tbody>"; editor.append(table);
      const tableRange = document.createRange(); tableRange.selectNodeContents(table.querySelector("td")); getSelection().removeAllRanges(); getSelection().addRange(tableRange);
      const tablePayload = host.captureSelectionObject(); const tableGuard = !host.runLocalSelectionOperation("duplicate", tablePayload.token).ok; table.remove();
      editor.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "ㅎ" })); const imeGuard = !host.captureSelectionObject().ok; editor.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "한" }));

      window.TextForgeTypingDebug.clear(); window.TextForgeTypingDebug.enable();
      const longNode = document.createTextNode("x".repeat(17000)); editor.replaceChildren(document.createElement("p")); editor.firstChild.append(longNode);
      for (let index = 0; index < 10; index += 1) { longNode.nodeValue += "x"; editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "x" })); }
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const typing = window.TextForgeTypingDebug.summary(); window.TextForgeTypingDebug.disable();
      const switching = await window.TextForgeDocumentSwitchPerf.runDocumentSwitchBenchmark({ samples: 10 });
      return { quickOpened, quickActiveStable, quickMatches, largePreviewLength, previewInvariant, diffKinds, unsafeRendered, restoreWorked, restoreUndoWorked, versionInsertWorked, versionInsertUndoWorked, moved: moved.ok, movedText, localUndo: localUndo.ok, afterLocalUndo, copyWorked, copyUndo: copyUndo.ok, copyUndoWorked, targetRollback, sourceRollback, moveWorked, moveUndo: moveUndo.ok, moveUndoWorked, linkWorked, created, newUndo: newUndo.ok, createdUndone, tableGuard, imeGuard, inputP95: typing.inputHandler.p95, inputLongTasks: typing.longTaskCount, switchNextFrameP95: switching.totalToNextFrame.p95, switchRenderP95: switching.totalToRenderActiveEnd.p95, switchLongTasks: switching.longTaskCount, switchTopSteps: switching.topSlowSteps.slice(0, 5) };
    })()`);

    assert.equal(result.quickOpened, true); assert.equal(result.quickActiveStable, true); assert.ok(result.quickMatches >= 1); assert.ok(result.largePreviewLength >= 99000); assert.equal(result.previewInvariant, true);
    assert.ok(result.diffKinds.includes("changed")); assert.ok(result.diffKinds.includes("added")); assert.ok(result.diffKinds.includes("deleted")); assert.equal(result.unsafeRendered, false);
    assert.equal(result.restoreWorked, true); assert.equal(result.restoreUndoWorked, true); assert.equal(result.versionInsertWorked, true); assert.equal(result.versionInsertUndoWorked, true);
    assert.equal(result.moved, true); assert.equal(result.movedText, "Move me"); assert.equal(result.localUndo, true); assert.equal(result.afterLocalUndo, true);
    assert.equal(result.copyWorked, true); assert.equal(result.copyUndo, true); assert.equal(result.copyUndoWorked, true); assert.equal(result.targetRollback, true); assert.equal(result.sourceRollback, true);
    assert.equal(result.moveWorked, true); assert.equal(result.moveUndo, true); assert.equal(result.moveUndoWorked, true); assert.equal(result.linkWorked, true); assert.equal(result.created, true); assert.equal(result.newUndo, true); assert.equal(result.createdUndone, true);
    assert.equal(result.tableGuard, true); assert.equal(result.imeGuard, true);
    assert.ok(result.inputP95 < 5, `17K input p95 ${result.inputP95}ms`); assert.equal(result.inputLongTasks, 0); assert.ok(result.switchNextFrameP95 < 35, `switch p95 ${result.switchNextFrameP95}ms`); assert.equal(result.switchLongTasks, 0);
    assert.deepEqual(client.runtimeErrors, []);
    process.stdout.write(`${JSON.stringify(result)}\nTextForge Macintosh Part 3 browser smoke passed.\n`);
  } finally {
    client?.close();
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(edge.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }); else edge.kill();
    const resolved = path.resolve(profilePath); if (resolved.startsWith(path.resolve(os.tmpdir()))) for (let attempt = 0; attempt < 6; attempt += 1) { try { fs.rmSync(resolved, { recursive: true, force: true }); break; } catch { await delay(250); } }
  }
})().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
