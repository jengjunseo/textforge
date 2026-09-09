const assert = require("node:assert/strict");
const http = require("node:http");
const { spawn } = require("node:child_process");
const os = require("node:os");
const path = require("node:path");

const baseUrl = process.argv[2] || "http://127.0.0.1:4291";
const cdpPort = Number(process.argv[3] || 9364);
const edgePath = process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const profilePath = path.join(os.tmpdir(), `textforge-session-resume-${Date.now()}`);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function waitForPage() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const tabs = await getJson(`http://127.0.0.1:${cdpPort}/json/list`);
      const page = tabs.find((tab) => tab.type === "page" && tab.url.startsWith(baseUrl));
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      // Edge is still starting.
    }
    await delay(150);
  }
  throw new Error("TextForge Edge target did not start");
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
      return;
    }
    if (message.method === "Runtime.exceptionThrown") {
      const details = message.params.exceptionDetails;
      runtimeErrors.push(details.exception?.description || details.text || "Uncaught runtime exception");
    }
  };
  return {
    runtimeErrors,
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

async function waitForApp(client) {
  let lastState = null;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const result = await client.send("Runtime.evaluate", {
      expression: "({ ready: Boolean(window.TextForgeDocumentSwitchPerf && document.querySelector('#richEditor')), title: document.title, bodyLength: document.body?.innerText?.length || 0 })",
      returnByValue: true,
    });
    lastState = result.result.value;
    if (lastState.ready) return;
    await delay(100);
  }
  throw new Error(`TextForge did not become ready: ${JSON.stringify(lastState)}; runtime errors: ${client.runtimeErrors.join(", ")}`);
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
  return result.result.value;
}

function fixture(docId, content, resume = null) {
  const now = new Date().toISOString();
  const documentState = [{
    id: docId,
    title: "Resume Fixture",
    content,
    contentHtml: `<p>${content}</p>`,
    tags: [],
    history: [],
    favorite: false,
    folderId: null,
    type: "note",
    theme: "modern",
    createdAt: now,
    updatedAt: now,
  }];
  return {
    documents: JSON.stringify(documentState),
    folders: JSON.stringify([{ id: "folder-projects", name: "Projects", parentId: null, createdAt: now, updatedAt: now }]),
    activeId: docId,
    session: JSON.stringify({ id: docId, title: "Resume Fixture", updatedAt: now, resume }),
  };
}

async function installFixtureAndReload(client, state) {
  const source = `
    localStorage.clear();
    localStorage.setItem("textforge.documents.v1", ${JSON.stringify(state.documents)});
    localStorage.setItem("textforge.folders.v1", ${JSON.stringify(state.folders || "[]")});
    localStorage.setItem("textforge.activeDocument.v1", ${JSON.stringify(state.activeId)});
    localStorage.setItem("textforge.sessionRecovery.v1", ${JSON.stringify(state.session)});
  `;
  const registration = await client.send("Page.addScriptToEvaluateOnNewDocument", { source });
  await client.send("Page.reload", { ignoreCache: true });
  await delay(180);
  await waitForApp(client);
  await delay(260);
  await client.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: registration.identifier });
}

async function main() {
  const edge = spawn(edgePath, [
    "--headless=new",
    "--disable-gpu",
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${profilePath}`,
    baseUrl,
  ], { stdio: "ignore", windowsHide: true });
  let client;
  try {
    client = createClient(await waitForPage());
    await client.ready;
    await client.send("Runtime.enable");
    await client.send("Page.enable");
    await waitForApp(client);

    const content17k = "가나다라마바사 ".repeat(2125).slice(0, 17000);
    const richResumeState = {
      mode: "rich",
      scrollTop: 420,
      selection: {
        kind: "rich",
        start: { path: [0, 0], offset: 8500 },
        end: { path: [0, 0], offset: 8520 },
      },
    };
    const richResume = {
      version: 2,
      documentId: "resume-17k",
      ...richResumeState,
      documents: { "resume-17k": richResumeState },
    };
    await installFixtureAndReload(client, fixture("resume-17k", content17k, richResume));
    const restored = await evaluate(client, `(async () => {
      const editor = document.querySelector('#richEditor');
      const range = window.getSelection()?.rangeCount ? window.getSelection().getRangeAt(0) : null;
      const selectionStart = range?.startOffset;
      const selectionEnd = range?.endOffset;
      const beforeHtml = editor.innerHTML;
      const beforeLength = editor.textContent.length;
      document.execCommand('insertText', false, 'Z');
      window.TextForgeTypingDebug.clear();
      window.TextForgeTypingDebug.enable();
      const textNode = editor.querySelector('p').firstChild;
      for (let index = 0; index < 10; index += 1) {
        textNode.nodeValue += 'x';
        editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'x' }));
      }
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const typingSummary = window.TextForgeTypingDebug.summary();
      window.TextForgeTypingDebug.disable();
      return {
        activeTitle: document.querySelector('#titleInput').value,
        focus: document.activeElement === editor,
        scrollTop: editor.scrollTop,
        scrollHeight: editor.scrollHeight,
        clientHeight: editor.clientHeight,
        session: localStorage.getItem('textforge.sessionRecovery.v1'),
        start: selectionStart,
        end: selectionEnd,
        beforeHtml,
        beforeLength,
        afterLength: editor.textContent.length,
        inputP95: typingSummary?.inputHandler?.p95,
        inputLongTaskCount: typingSummary?.longTaskCount,
      };
    })()`);
    assert.equal(restored.activeTitle, "Resume Fixture");
    assert.equal(restored.focus, true);
    assert.ok(restored.scrollTop >= 400, `scroll restored: ${restored.scrollTop}, height ${restored.scrollHeight}/${restored.clientHeight}, session ${restored.session}`);
    assert.equal(restored.start, 8500);
    assert.equal(restored.end, 8520);
    assert.equal(restored.beforeHtml, `<p>${content17k}</p>`);
    assert.equal(restored.afterLength, restored.beforeLength - (restored.end - restored.start) + 11);
    assert.ok(restored.inputP95 < 5, `17K input p95: ${restored.inputP95}`);
    assert.equal(restored.inputLongTaskCount, 0);

    const fallback = fixture("surviving-doc", "Fallback body", {
      version: 1,
      documentId: "missing-doc",
      mode: "rich",
      scrollTop: 999999,
      selection: { kind: "rich", start: { path: [99], offset: 0 }, end: { path: [99], offset: 0 } },
    });
    fallback.activeId = "missing-doc";
    fallback.session = JSON.stringify({ id: "missing-doc", title: "Missing", resume: JSON.parse(fallback.session).resume });
    await installFixtureAndReload(client, fallback);
    const fallbackResult = await evaluate(client, "({ title: document.querySelector('#titleInput').value, focus: document.activeElement === document.querySelector('#richEditor'), text: document.querySelector('#richEditor').textContent })");
    assert.equal(fallbackResult.title, "Resume Fixture");
    assert.equal(fallbackResult.focus, true);
    assert.equal(fallbackResult.text, "Fallback body");

    await evaluate(client, "localStorage.setItem('textforge.sessionRecovery.v1', '{bad-json'); location.reload(); true;");
    await delay(180);
    await waitForApp(client);
    const corruptResult = await evaluate(client, "({ title: document.querySelector('#titleInput').value, text: document.querySelector('#richEditor').textContent })");
    assert.equal(corruptResult.title, "Resume Fixture");
    assert.equal(corruptResult.text, "Fallback body");

    const partOne = await evaluate(client, `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const editor = document.querySelector('#richEditor');
      editor.innerHTML = '<p><strong>Alpha</strong> plain <a href="https://example.com">link</a></p><p><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="old"></p><table><tbody><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></tbody></table>';
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
      const range = document.createRange();
      range.selectNodeContents(editor.querySelector('strong'));
      const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
      const selectedInitially = selection.toString();
      window.TextForgeExperienceHost.saveEditorSelection();
      window.TextForgeExperienceHost.setInspectorOpen(true, 'context');
      await wait(120);
      const selectionAfterInspectorOpen = getSelection().toString();
      const selectionBefore = selectedInitially;
      const hashBeforeToggle = editor.innerHTML;
      const caretKind = window.TextForgeExperienceHost.getContextualInspectorState().kind;
      window.TextForgeExperienceHost.runContextualInspectorCommand('italic');
      const selectionAfter = getSelection().toString();
      const focusAfterFormat = document.activeElement === editor;
      const italicApplied = Boolean(editor.querySelector('i, em')) || document.queryCommandState('italic');

      const link = editor.querySelector('a');
      const linkRange = document.createRange(); linkRange.selectNodeContents(link); selection.removeAllRanges(); selection.addRange(linkRange);
      window.TextForgeExperienceHost.saveEditorSelection();
      const linkKind = window.TextForgeExperienceHost.getContextualInspectorState().kind;
      window.TextForgeExperienceHost.runContextualInspectorCommand('link-set', 'https://openai.com');
      const linkUpdated = link.getAttribute('href');
      window.TextForgeExperienceHost.runContextualInspectorCommand('link-remove');
      const linkRemoved = !editor.querySelector('a');

      const image = editor.querySelector('img');
      const imageRange = document.createRange(); imageRange.selectNode(image); selection.removeAllRanges(); selection.addRange(imageRange);
      window.TextForgeExperienceHost.saveEditorSelection();
      const imageKind = window.TextForgeExperienceHost.getContextualInspectorState().kind;
      window.TextForgeExperienceHost.runContextualInspectorCommand('image-alt', 'updated');
      window.TextForgeExperienceHost.runContextualInspectorCommand('image-width', '50%');
      const imageChanged = image.alt === 'updated' && image.style.width === '50%';

      const cell = editor.querySelector('td'); const cellRange = document.createRange(); cellRange.selectNodeContents(cell); selection.removeAllRanges(); selection.addRange(cellRange);
      window.TextForgeExperienceHost.saveEditorSelection();
      const tableKind = window.TextForgeExperienceHost.getContextualInspectorState().kind;
      const rowsBefore = editor.querySelectorAll('tr').length;
      window.TextForgeExperienceHost.runContextualInspectorCommand('table-row-add');
      const tableRowAdded = editor.querySelectorAll('tr').length === rowsBefore + 1;

      const hashBeforeClose = editor.innerHTML;
      window.TextForgeExperienceHost.setInspectorOpen(false);
      const hashAfterClose = editor.innerHTML;
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', code: 'KeyK', ctrlKey: true, bubbles: true }));
      const commandInput = document.querySelector('#commandInput');
      const paletteOpened = !document.querySelector('#commandOverlay').classList.contains('hidden');
      const defaultGroups = [...document.querySelectorAll('.command-group-label')].map((node) => node.textContent);
      commandInput.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '문' }));
      commandInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, isComposing: true, bubbles: true }));
      const stayedOpenDuringIme = !document.querySelector('#commandOverlay').classList.contains('hidden');
      commandInput.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '문' }));
      commandInput.value = '다크 테마'; commandInput.dispatchEvent(new Event('input', { bubbles: true }));
      commandInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      commandInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      const keyboardSelected = Boolean(document.querySelector('.command-item.selected'));
      commandInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await wait(30);
      const commandExecuted = document.documentElement.dataset.theme === 'dark';
      return { selectionBefore, selectionAfterInspectorOpen, selectionAfter, focusAfterFormat, italicApplied, caretKind, linkKind, linkUpdated, linkRemoved, imageKind, imageChanged, tableKind, tableRowAdded, hashBeforeToggle, hashBeforeClose, hashAfterClose, paletteOpened, defaultGroups, stayedOpenDuringIme, keyboardSelected, commandExecuted };
    })()`);
    assert.equal(partOne.selectionBefore, "Alpha");
    assert.equal(partOne.selectionAfterInspectorOpen, "Alpha");
    assert.equal(partOne.selectionAfter, "Alpha");
    assert.equal(partOne.focusAfterFormat, true);
    assert.equal(partOne.italicApplied, true);
    assert.equal(partOne.caretKind, "text");
    assert.equal(partOne.linkKind, "link");
    assert.equal(partOne.linkUpdated, "https://openai.com");
    assert.equal(partOne.linkRemoved, true);
    assert.equal(partOne.imageKind, "image");
    assert.equal(partOne.imageChanged, true);
    assert.equal(partOne.tableKind, "table");
    assert.equal(partOne.tableRowAdded, true);
    assert.equal(partOne.hashBeforeClose, partOne.hashAfterClose);
    assert.equal(partOne.paletteOpened, true);
    assert.ok(partOne.defaultGroups.includes("문서") || partOne.defaultGroups.includes("즐겨찾기 문서"));
    assert.ok(partOne.defaultGroups.includes("폴더"));
    assert.equal(partOne.stayedOpenDuringIme, true);
    assert.equal(partOne.keyboardSelected, true);
    assert.equal(partOne.commandExecuted, true);
    assert.equal(client.runtimeErrors.length, 0, `runtime errors: ${client.runtimeErrors.join(', ')}`);
    process.stdout.write(`TextForge Part 1 browser smoke passed. 17K input p95 ${restored.inputP95}ms.\n`);
  } finally {
    client?.close();
    edge.kill();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
