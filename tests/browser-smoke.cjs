const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const edgePath = process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const baseUrl = String(process.argv[2] || "http://127.0.0.1:4291").replace(/\/$/, "");
const outputDir = path.resolve(process.argv[3] || path.join(os.tmpdir(), `textforge-browser-smoke-${Date.now()}`));
const cdpPort = Number(process.argv[4] || 9361);
const userDataDir = path.join(os.tmpdir(), `textforge-edge-profile-${Date.now()}`);

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

async function waitForCdp() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const tabs = await getJson(`http://127.0.0.1:${cdpPort}/json/list`);
      const page = tabs.find((tab) => tab.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      // Edge is still starting.
    }
    await delay(250);
  }
  throw new Error("Edge CDP did not become ready");
}

async function waitForTargetCdp(urlPrefix) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const tabs = await getJson(`http://127.0.0.1:${cdpPort}/json/list`);
      const page = tabs.find((tab) => tab.type === "page" && tab.url.startsWith(urlPrefix));
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      // The new target is still starting.
    }
    await delay(100);
  }
  throw new Error(`CDP target did not become ready: ${urlPrefix}`);
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
    ready: new Promise((resolve, reject) => {
      socket.onopen = resolve;
      socket.onerror = reject;
    }),
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
    const readyState = await evaluate(cdp, "document.readyState").catch(() => "loading");
    if (readyState === "complete") {
      await delay(180);
      return;
    }
    await delay(100);
  }
  throw new Error(`Page did not finish loading: ${url}`);
}

async function setViewport(cdp, width, height, deviceScaleFactor) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor,
    mobile: false,
    screenWidth: width,
    screenHeight: height,
  });
}

async function captureScreenshot(cdp, filename) {
  const result = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, Buffer.from(result.data, "base64"));
  return filePath;
}

async function inspectPortal(cdp) {
  return evaluate(cdp, `(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const first = document.querySelector('.portal-document');
    first.click();
    const selected = document.querySelector('.portal-document.selected');
    selected.focus();
    selected.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
    await wait(30);
    const quickLookOpened = document.querySelector('#quickLookDialog').open;
    const quickLookTextLength = document.querySelector('#quickLookContent').innerText.length;
    document.querySelector('#quickLookDialog').close();

    document.querySelector('#listBtn').click();
    const listViewWorked = document.querySelector('#librarySurface').classList.contains('list-view');
    document.querySelector('#gridBtn').click();

    const search = document.querySelector('#searchInput');
    search.value = [...document.querySelectorAll('.document-title')].at(-1).textContent;
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(130);
    const filteredCount = document.querySelectorAll('.portal-document').length;
    search.value = '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(130);

    document.querySelector('#quickNoteBtn').click();
    await wait(30);
    const quickNoteRouted = document.querySelector('#toastText').textContent.includes('Quick Note');

    const folder = document.querySelector('[data-folder-id]');
    folder.click();
    const folderNavigationWorked = document.querySelectorAll('#breadcrumbs button').length > 1;
    document.querySelector('#backBtn').click();

    const currentFirst = document.querySelector('.portal-document');
    currentFirst.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 240, clientY: 180 }));
    const contextMenuOpened = !document.querySelector('#contextMenu').classList.contains('hidden');
    document.querySelector('#contextMenu button').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    return {
      title: document.title,
      bodyTextLength: document.body.innerText.trim().length,
      cardCount: document.querySelectorAll('.portal-document').length,
      quickLookOpened,
      quickLookTextLength,
      listViewWorked,
      filteredCount,
      quickNoteRouted,
      folderNavigationWorked,
      contextMenuOpened,
      contextMenuClosed: document.querySelector('#contextMenu').classList.contains('hidden'),
      overlay: Boolean(document.querySelector('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay')),
      brokenImages: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).length,
    };
  })()`);
}

async function inspectLayout(cdp) {
  return evaluate(cdp, `(() => {
    const shell = document.querySelector('.portal-shell');
    const toolbar = document.querySelector('.portal-toolbar');
    const surface = document.querySelector('#librarySurface');
    const cards = [...document.querySelectorAll('.portal-document')];
    const shellRect = shell.getBoundingClientRect();
    const toolbarRect = toolbar.getBoundingClientRect();
    const surfaceRect = surface.getBoundingClientRect();
    const outsideCards = cards.filter((card) => {
      const rect = card.getBoundingClientRect();
      return rect.left < surfaceRect.left - 1 || rect.right > surfaceRect.right + 1;
    }).length;
    return {
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      theme: document.documentElement.dataset.theme,
      shellFits: shellRect.width <= innerWidth + 1 && shellRect.height <= innerHeight + 1,
      documentHasHorizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      toolbarFits: toolbarRect.right <= innerWidth + 1 && toolbarRect.bottom <= innerHeight + 1,
      surfaceVisible: surfaceRect.width > 0 && surfaceRect.height > 0,
      outsideCards,
      cards: cards.length,
    };
  })()`);
}

async function inspectMainApp(cdp) {
  return evaluate(cdp, `(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const percentile = (values, ratio) => values.slice().sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * ratio))] || 0;
    const editor = document.querySelector('#richEditor');
    const formatDebugType = typeof window.TextForgeFormatDebug;
    const formatDebugEnabled = window.TextForgeFormatDebug?.enable();
    window.TextForgeFormatDebug?.clear();
    window.TextForgeFormatDebug?.disable();
    const baselineSwitchReport = await window.TextForgeDocumentSwitchPerf.runDocumentSwitchBenchmark({ samples: 12 });

    editor.innerHTML = '<p>' + '가'.repeat(17000) + '</p>';
    editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '가' }));
    await wait(240);
    window.TextForgeTypingDebug?.clear();
    window.TextForgeTypingDebug?.enable();
    const textNode = editor.querySelector('p').firstChild;
    const inputDurations = [];
    for (let index = 0; index < 30; index += 1) {
      textNode.nodeValue += 'a';
      const start = performance.now();
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'a' }));
      inputDurations.push(performance.now() - start);
    }
    const typingSummary = window.TextForgeTypingDebug?.summary();
    window.TextForgeTypingDebug?.disable();
    await wait(240);

    const sourceBeforeViews = editor.innerHTML;
    const themeSelect = document.querySelector('#appThemeSelect');
    themeSelect.value = 'dark';
    themeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    document.querySelector('#focusModeBtn').click();
    document.querySelector('#focusModeBtn').click();
    const sourceAfterViews = editor.innerHTML;

    const longDocumentSwitchReport = await window.TextForgeDocumentSwitchPerf.runDocumentSwitchBenchmark({ samples: 12 });
    const quickDiagnostics = await window.TextForgeDiagnostics.runQuickBenchmark();
    const mac = window.TextForgeMacintoshExperience;
    const tabStripExists = Boolean(document.querySelector('#tfTabStrip'));
    const contextBarExists = Boolean(document.querySelector('#tfContextBar'));
    mac?.openQuickLook();
    const quickLookExists = Boolean(document.querySelector('#tfQuickLook .tf-preview'));
    document.querySelector('#tfQuickLook .tf-modal-head button')?.click();
    mac?.openVersions();
    const versionsExists = Boolean(document.querySelector('#tfVersions'));
    document.querySelector('#tfVersions .tf-modal-head button')?.click();
    mac?.openExportStudio();
    const exportStudioExists = Boolean(document.querySelector('#tfExportStudio select[name="format"]'));
    document.querySelector('#tfExportStudio .tf-modal-head button')?.click();
    return {
      title: document.title,
      bodyTextLength: document.body.innerText.trim().length,
      editorExists: Boolean(editor),
      portalButtonExists: Boolean(document.querySelector('#portalLibraryBtn')),
      formatDebugType,
      formatDebugEnabled: Boolean(formatDebugEnabled),
      formatDebugEntriesAfterClear: window.TextForgeFormatDebug?.getEntries().length,
      macintosh: { apiExists: Boolean(mac), tabStripExists, contextBarExists, quickLookExists, versionsExists, exportStudioExists },
      input17k: {
        samples: inputDurations.length,
        avg: inputDurations.reduce((sum, value) => sum + value, 0) / inputDurations.length,
        p50: percentile(inputDurations, 0.5),
        p95: percentile(inputDurations, 0.95),
        max: Math.max(...inputDurations),
        longTaskCount: typingSummary?.longTaskCount || 0,
      },
      sourceStableAcrossViews: sourceBeforeViews === sourceAfterViews,
      documentSwitchBaseline: {
        samples: baselineSwitchReport.samples,
        totalToNextFrame: baselineSwitchReport.totalToNextFrame,
        totalToRenderActiveEnd: baselineSwitchReport.totalToRenderActiveEnd,
        longTaskCount: baselineSwitchReport.longTaskCount,
        maxLongTaskMs: baselineSwitchReport.maxLongTaskMs,
        topSlowSteps: baselineSwitchReport.topSlowSteps.slice(0, 5),
      },
      documentSwitch17k: {
        samples: longDocumentSwitchReport.samples,
        totalToNextFrame: longDocumentSwitchReport.totalToNextFrame,
        totalToRenderActiveEnd: longDocumentSwitchReport.totalToRenderActiveEnd,
        longTaskCount: longDocumentSwitchReport.longTaskCount,
        maxLongTaskMs: longDocumentSwitchReport.maxLongTaskMs,
        topSlowSteps: longDocumentSwitchReport.topSlowSteps.slice(0, 5),
      },
      diagnostics: {
        kind: quickDiagnostics.kind,
        summary: quickDiagnostics.summary,
        releaseReadiness: quickDiagnostics.releaseReadiness,
        testCount: quickDiagnostics.tests?.length || 0,
        failedTests: (quickDiagnostics.tests || []).filter((test) => !test.ok).map((test) => ({ name: test.name, error: test.error || null })),
      },
      overlay: Boolean(document.querySelector('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay')),
    };
  })()`);
}

async function inspectLivePortal(cdp) {
  return evaluate(cdp, `(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const waitFor = async (predicate, label) => {
      for (let attempt = 0; attempt < 160; attempt += 1) {
        if (predicate()) return;
        await wait(50);
      }
      throw new Error('Timed out: ' + label);
    };
    const findCard = (title) => [...document.querySelectorAll('.portal-document')].find((card) => card.querySelector('.document-title')?.textContent === title);
    await waitFor(() => document.querySelector('#connectionText').textContent.includes('연결됨') && document.querySelectorAll('.portal-document').length > 0, 'Portal connection');

    const initialCount = document.querySelectorAll('.portal-document').length;
    const activeBefore = document.querySelector('#activeDocumentText').textContent;

    window.prompt = () => 'Bridge Folder';
    document.querySelector('#newFolderBtn').click();
    await waitFor(() => [...document.querySelectorAll('[data-folder-id]')].some((button) => button.textContent.includes('Bridge Folder')), 'folder creation');

    document.querySelector('#quickNoteBtn').click();
    await waitFor(() => document.querySelector('#toastText').textContent.includes('Quick Note'), 'Quick Note route');
    const quickNoteRequested = true;
    await waitFor(() => Boolean(findCard('Bridge Note')), 'Quick Note state sync');
    const activePreservedAfterQuickNote = document.querySelector('#activeDocumentText').textContent === activeBefore;

    let card = findCard('Bridge Note');
    card.click();
    card = findCard('Bridge Note');
    const folder = [...document.querySelectorAll('[data-folder-id]')].find((button) => button.textContent.includes('Bridge Folder'));
    const dataTransfer = new DataTransfer();
    card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
    folder.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }));
    folder.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
    await waitFor(() => !document.querySelector('#toastUndoBtn').classList.contains('hidden') && document.querySelector('#toastText').textContent.includes('이동'), 'move undo toast');
    [...document.querySelectorAll('[data-folder-id]')].find((button) => button.textContent.includes('Bridge Folder')).click();
    await waitFor(() => document.querySelectorAll('#breadcrumbs button').length > 1, 'folder navigation after move');
    await waitFor(() => Boolean(findCard('Bridge Note')), 'document moved into folder');
    const dragMoveWorked = Boolean(findCard('Bridge Note'));
    document.querySelector('#toastUndoBtn').click();
    await waitFor(() => document.querySelector('#toastText').textContent.includes('되돌렸'), 'move undo response');
    await waitFor(() => !findCard('Bridge Note'), 'move undo');
    const moveUndoWorked = !findCard('Bridge Note');

    document.querySelector('[data-smart-folder="all"]').click();
    await waitFor(() => Boolean(findCard('Bridge Note')), 'return to all documents');
    card = findCard('Bridge Note');
    card.click();
    document.querySelector('#moveSelectionBtn').click();
    const moveFolder = [...document.querySelectorAll('[data-folder-id]')].find((button) => button.textContent.includes('Bridge Folder'));
    document.querySelector('#moveFolderSelect').value = moveFolder.dataset.folderId;
    document.querySelector('#moveForm').requestSubmit(document.querySelector('#moveForm .primary'));
    await waitFor(() => !document.querySelector('#toastUndoBtn').classList.contains('hidden') && document.querySelector('#toastText').textContent.includes('이동'), 'keyboard move result');
    [...document.querySelectorAll('[data-folder-id]')].find((button) => button.textContent.includes('Bridge Folder')).click();
    await waitFor(() => Boolean(findCard('Bridge Note')), 'keyboard move into folder');
    const keyboardMoveWorked = true;
    document.querySelector('#toastUndoBtn').click();
    await waitFor(() => document.querySelector('#toastText').textContent.includes('되돌렸') && !findCard('Bridge Note'), 'keyboard move undo');
    document.querySelector('[data-smart-folder="all"]').click();
    await waitFor(() => Boolean(findCard('Bridge Note')), 'return after keyboard move undo');
    card = findCard('Bridge Note');
    card.click();
    document.querySelector('#favoriteSelectionBtn').click();
    await waitFor(() => findCard('Bridge Note')?.querySelector('.document-favorite')?.textContent.includes('★'), 'favorite state');
    const favoriteWorked = true;

    window.prompt = () => 'Bridge Note Renamed';
    card = findCard('Bridge Note');
    card.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 260, clientY: 210 }));
    document.querySelector('[data-action="rename"]').click();
    await waitFor(() => Boolean(findCard('Bridge Note Renamed')), 'document rename');
    const renameWorked = true;

    card = findCard('Bridge Note Renamed');
    card.click();
    document.querySelector('#trashSelectionBtn').click();
    await waitFor(() => !findCard('Bridge Note Renamed'), 'move to trash');
    document.querySelector('[data-smart-folder="trash"]').click();
    await waitFor(() => Boolean(findCard('Bridge Note Renamed')), 'trash view');
    card = findCard('Bridge Note Renamed');
    card.click();
    const restoreLabelWorked = document.querySelector('#trashSelectionBtn').textContent === '복원';
    document.querySelector('#trashSelectionBtn').click();
    await waitFor(() => !findCard('Bridge Note Renamed'), 'restore from trash');
    document.querySelector('[data-smart-folder="all"]').click();
    await waitFor(() => Boolean(findCard('Bridge Note Renamed')), 'restored document in all view');

    card = findCard('Bridge Note Renamed');
    card.click();
    window.prompt = () => 'Bridge Collection';
    document.querySelector('#collectionSelectionBtn').click();
    await waitFor(() => [...document.querySelectorAll('[data-collection-id]')].some((button) => button.textContent.includes('Bridge Collection')), 'collection creation');
    const collectionWorked = Boolean(findCard('Bridge Note Renamed'));

    card = findCard('Bridge Note Renamed');
    card.click();
    card = findCard('Bridge Note Renamed');
    card.focus();
    card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
    await waitFor(() => document.querySelector('#quickLookDialog').open && document.querySelector('#quickLookContent').innerText.includes('Quick Note body'), 'live Quick Look');
    const quickLookWorked = true;
    document.querySelector('#quickLookDialog').close();

    return {
      connected: true,
      quickNoteRequested,
      initialCount,
      finalCount: document.querySelectorAll('.portal-document').length,
      activePreservedAfterQuickNote,
      dragMoveWorked,
      moveUndoWorked,
      keyboardMoveWorked,
      favoriteWorked,
      renameWorked,
      restoreLabelWorked,
      collectionWorked,
      quickLookWorked,
    };
  })()`);
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
  ], { stdio: "ignore" });

  let cdp;
  let livePortalCdp;
  let livePortalTargetId;
  try {
    cdp = createCdpClient(await waitForCdp());
    await cdp.ready;
    await Promise.all([
      cdp.send("Page.enable"),
      cdp.send("Runtime.enable"),
      cdp.send("Log.enable"),
    ]);

    await setViewport(cdp, 1920, 1080, 1);
    await navigate(cdp, `${baseUrl}/portal-library.html?fixture=1&theme=light`);
    const portal = await inspectPortal(cdp);
    assert.ok(portal.bodyTextLength > 200 && portal.cardCount >= 20, "Portal page is blank or incomplete");
    assert.equal(portal.overlay, false);
    assert.equal(portal.brokenImages, 0);
    assert.equal(portal.quickLookOpened, true);
    assert.ok(portal.quickLookTextLength > 30);
    assert.equal(portal.listViewWorked, true);
    assert.equal(portal.filteredCount, 1);
    assert.equal(portal.quickNoteRouted, true);
    assert.equal(portal.folderNavigationWorked, true);
    assert.equal(portal.contextMenuOpened, true);
    assert.equal(portal.contextMenuClosed, true);

    const layouts = [];
    const screenshots = [];
    const scaleCases = [
      { name: "100-light", scale: 1, width: 3840, height: 2160, theme: "light" },
      { name: "125-light", scale: 1.25, width: 3072, height: 1728, theme: "light" },
      { name: "150-dark", scale: 1.5, width: 2560, height: 1440, theme: "dark" },
      { name: "200-dark", scale: 2, width: 1920, height: 1080, theme: "dark" },
    ];
    for (const scaleCase of scaleCases) {
      await setViewport(cdp, scaleCase.width, scaleCase.height, scaleCase.scale);
      await navigate(cdp, `${baseUrl}/portal-library.html?fixture=1&theme=${scaleCase.theme}`);
      await evaluate(cdp, "document.querySelector('#gridBtn').click()");
      const layout = await inspectLayout(cdp);
      assert.equal(layout.shellFits, true, `${scaleCase.name}: shell overflow`);
      assert.equal(layout.documentHasHorizontalOverflow, false, `${scaleCase.name}: document overflow`);
      assert.equal(layout.toolbarFits, true, `${scaleCase.name}: toolbar overflow`);
      assert.equal(layout.surfaceVisible, true, `${scaleCase.name}: library surface hidden`);
      assert.equal(layout.outsideCards, 0, `${scaleCase.name}: cards outside surface`);
      layouts.push({ name: scaleCase.name, ...layout });
      screenshots.push(await captureScreenshot(cdp, `portal-${scaleCase.name}.png`));
    }

    await setViewport(cdp, 1920, 1080, 1);
    await navigate(cdp, `${baseUrl}/`);
    const main = await inspectMainApp(cdp);
    assert.equal(main.editorExists, true);
    assert.equal(main.portalButtonExists, true);
    assert.equal(main.formatDebugType, "object");
    assert.equal(main.formatDebugEntriesAfterClear, 0);
    assert.equal(main.macintosh.apiExists, true);
    assert.equal(main.macintosh.tabStripExists, true);
    assert.equal(main.macintosh.contextBarExists, false);
    assert.equal(main.macintosh.quickLookExists, true);
    assert.equal(main.macintosh.versionsExists, true);
    assert.equal(main.macintosh.exportStudioExists, true);
    assert.equal(main.sourceStableAcrossViews, true);
    assert.ok(main.input17k.p95 < 5, `17K input p95 exceeded 5ms: ${main.input17k.p95}`);
    assert.equal(main.input17k.longTaskCount, 0);
    assert.ok(main.documentSwitchBaseline.totalToNextFrame.p95 < 30, `baseline document switch p95 exceeded 30ms: ${main.documentSwitchBaseline.totalToNextFrame.p95}`);
    assert.equal(main.documentSwitchBaseline.longTaskCount, 0);
    assert.ok(main.documentSwitch17k.totalToRenderActiveEnd.p95 < 30, `17K renderActive p95 exceeded 30ms: ${main.documentSwitch17k.totalToRenderActiveEnd.p95}`);
    assert.ok(main.documentSwitch17k.totalToNextFrame.p95 < 40, `17K document switch p95 exceeded 40ms: ${main.documentSwitch17k.totalToNextFrame.p95}`);
    assert.ok(main.documentSwitch17k.longTaskCount <= 1 && (main.documentSwitch17k.maxLongTaskMs || 0) <= 100, `17K switch long tasks exceeded tolerance: ${main.documentSwitch17k.longTaskCount}, ${main.documentSwitch17k.maxLongTaskMs}ms`);
    assert.equal(main.overlay, false);
    screenshots.push(await captureScreenshot(cdp, "main-macintosh.png"));

    const activeSourceBeforePortal = await evaluate(cdp, "document.querySelector('#richEditor').innerHTML");
    const livePortalUrl = `${baseUrl}/portal-library.html`;
    const target = await cdp.send("Target.createTarget", { url: livePortalUrl });
    livePortalTargetId = target.targetId;
    livePortalCdp = createCdpClient(await waitForTargetCdp(livePortalUrl));
    await livePortalCdp.ready;
    await Promise.all([
      livePortalCdp.send("Page.enable"),
      livePortalCdp.send("Runtime.enable"),
      livePortalCdp.send("Log.enable"),
    ]);
    const completeRoutedQuickNote = evaluate(cdp, `(async () => {
      const activeDialogs = () => [...document.querySelectorAll('dialog, [role="dialog"]')].filter((node) => {
        if (node instanceof HTMLDialogElement) return node.open;
        if (node.closest('[hidden], .hidden, [aria-hidden="true"]')) return false;
        const style = getComputedStyle(node);
        return style.display !== 'none'
          && style.visibility !== 'hidden'
          && node.getClientRects().length > 0;
      });
      for (let attempt = 0; attempt < 80; attempt += 1) {
        const dialog = document.querySelector('#tfQuickNote');
        if (dialog) {
          const quickNoteDetected = activeDialogs().includes(dialog);
          const form = dialog.querySelector('.tf-quick-note-form');
          form.elements.title.value = 'Bridge Note';
          form.elements.body.value = 'Quick Note body from the isolated Portal bridge test.';
          form.elements.target.value = 'new-inbox';
          form.elements.openAfter.checked = false;
          form.requestSubmit();
          for (let saveAttempt = 0; saveAttempt < 160 && document.querySelector('#tfQuickNote'); saveAttempt += 1) {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          document.querySelector('#richEditor')?.focus({ preventScroll: true });
          await new Promise((resolve) => setTimeout(resolve, 0));
          return {
            closed: !document.querySelector('#tfQuickNote'),
            overlayCount: document.querySelectorAll('.tf-overlay').length,
            activeDialogCount: activeDialogs().length,
            quickNoteDetected,
            focusSafe: Boolean(document.activeElement?.closest('#richEditor, #quickNoteBtn, #moreMenuBtn')),
            pendingSave: Boolean(window.TextForgeMacintoshExperience?.getPendingSave?.()),
            composing: Boolean(window.__textforgeCompositionActive),
          };
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return { closed: false, overlayCount: -1, activeDialogCount: -1, quickNoteDetected: false, focusSafe: false, pendingSave: true, composing: true };
    })()`);
    const [livePortal, quickNoteReset] = await Promise.all([inspectLivePortal(livePortalCdp), completeRoutedQuickNote]);
    assert.equal(quickNoteReset.closed, true, "Portal Quick Note did not close in the main editor");
    assert.equal(quickNoteReset.quickNoteDetected, true, "Open Quick Note was not detected as an active dialog");
    assert.equal(quickNoteReset.overlayCount, 0, "Quick Note overlay remained after close");
    assert.equal(quickNoteReset.activeDialogCount, 0, "Another dialog remained open after Quick Note");
    assert.equal(quickNoteReset.focusSafe, true, "Focus did not return to a safe main editor control");
    assert.equal(quickNoteReset.pendingSave, false, "Quick Note left a pending save");
    assert.equal(quickNoteReset.composing, false, "IME composition remained active after Quick Note");
    const activeSourceAfterPortal = await evaluate(cdp, "document.querySelector('#richEditor').innerHTML");
    assert.equal(livePortal.connected, true);
    assert.equal(livePortal.quickNoteRequested, true);
    assert.equal(livePortal.activePreservedAfterQuickNote, true);
    assert.equal(livePortal.dragMoveWorked, true);
    assert.equal(livePortal.moveUndoWorked, true);
    assert.equal(livePortal.keyboardMoveWorked, true);
    assert.equal(livePortal.favoriteWorked, true);
    assert.equal(livePortal.renameWorked, true);
    assert.equal(livePortal.restoreLabelWorked, true);
    assert.equal(livePortal.collectionWorked, true);
    assert.equal(livePortal.quickLookWorked, true);
    assert.equal(activeSourceAfterPortal, activeSourceBeforePortal, "Portal metadata operations changed the active document body");

    const allBrowserEvents = [...cdp.events, ...(livePortalCdp?.events || [])];
    const runtimeErrors = allBrowserEvents.filter((event) => event.method === "Runtime.exceptionThrown" || (event.method === "Log.entryAdded" && event.params?.entry?.level === "error"));
    assert.equal(runtimeErrors.length, 0, JSON.stringify(runtimeErrors, null, 2));

    const reportPath = path.join(outputDir, "browser-smoke-report.json");
    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      edgePath,
      isolatedProfile: userDataDir,
      outputDir,
      reportPath,
      portal,
      layouts,
      screenshots,
      main,
      livePortal: {
        ...livePortal,
        activeDocumentBodyUnchanged: activeSourceAfterPortal === activeSourceBeforePortal,
      },
      performanceBudget: {
        input17kP95Under5: main.input17k.p95 < 5,
        baselineSwitchNextFrameP95Under20: main.documentSwitchBaseline.totalToNextFrame.p95 < 20,
        long17kSwitchNextFrameP95Under20: main.documentSwitch17k.totalToNextFrame.p95 < 20,
        long17kRenderActiveP95Under20: main.documentSwitch17k.totalToRenderActiveEnd.p95 < 20,
        long17kSwitchLongTaskZero: main.documentSwitch17k.longTaskCount === 0,
      },
      runtimeErrorCount: runtimeErrors.length,
    };
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } finally {
    if (livePortalTargetId) await cdp?.send("Target.closeTarget", { targetId: livePortalTargetId }).catch(() => {});
    livePortalCdp?.close();
    cdp?.close();
    edge.kill();
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
