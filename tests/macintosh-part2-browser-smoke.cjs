const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const baseUrl = process.argv[2] || "http://127.0.0.1:4291";
const cdpPort = Number(process.argv[3] || 9376);
const edgePath = process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const profilePath = path.join(os.tmpdir(), `textforge-part2-${Date.now()}`);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => { try { resolve(JSON.parse(body)); } catch (error) { reject(error); } });
    }).on("error", reject);
  });
}

async function waitForPage() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const tabs = await getJson(`http://127.0.0.1:${cdpPort}/json/list`);
      const page = tabs.find((tab) => tab.type === "page" && tab.url.startsWith(baseUrl));
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await delay(150);
  }
  throw new Error("Part 2 Edge target did not start");
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
    if (message.method === "Runtime.exceptionThrown") runtimeErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
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

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}

(async () => {
  const edge = spawn(edgePath, [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
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
    const longText = "Long document input. ".repeat(900).slice(0, 17000);
    const now = new Date().toISOString();
    const fixture = [
      { id: "part2-alpha", title: "Part2 Alpha 17K", content: longText, contentHtml: `<p>${longText}</p>`, tags: [], history: [], favorite: false, theme: "modern", createdAt: now, updatedAt: now },
      { id: "part2-beta", title: "Part2 Beta", content: "Beta body", contentHtml: "<p>Beta body</p>", tags: [], history: [], favorite: false, theme: "modern", createdAt: now, updatedAt: now },
    ];
    await evaluate(client, `(() => {
      localStorage.setItem("textforge.documents.v1", ${JSON.stringify(JSON.stringify(fixture))});
      localStorage.setItem("textforge.activeDocument.v1", "part2-alpha");
      localStorage.removeItem("textforge.sessionRecovery.v1");
      localStorage.removeItem("textforge.splitWorkspace");
      localStorage.removeItem("textforge.macintoshExperience.v1");
      location.reload();
      return true;
    })()`);
    await delay(450);
    const result = await evaluate(client, `(async () => {
      const host = window.TextForgeExperienceHost;
      const mac = window.TextForgeMacintoshExperience;
      const editor = document.querySelector("#richEditor");
      window.TextForgeTypingDebug.clear();
      window.TextForgeTypingDebug.enable();
      const textNode = editor.querySelector("p").firstChild;
      for (let index = 0; index < 10; index += 1) {
        textNode.nodeValue += "x";
        editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "x" }));
      }
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const typing = window.TextForgeTypingDebug.summary();
      window.TextForgeTypingDebug.disable();
      const switching = await window.TextForgeDocumentSwitchPerf.runDocumentSwitchBenchmark({ samples: 12 });

      host.openDocument("part2-alpha", { source: "part2-smoke" });
      host.openDocumentInNewPane("part2-beta", { mode: "rich" });
      const reference = document.querySelector("#referencePaneBody");
      reference.innerHTML = "<p>Beta edited in Split</p>";
      reference.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "d" }));
      host.flushAllEditors("part2-smoke");
      const afterSplit = host.getDocuments();
      const alpha = afterSplit.find((doc) => doc.id === "part2-alpha");
      const beta = afterSplit.find((doc) => doc.id === "part2-beta");

      host.openDocument("part2-beta", { source: "part2-tab-smoke" });
      host.openDocument("part2-alpha", { source: "part2-tab-smoke" });
      const tabsBefore = document.querySelectorAll("#tfTabStrip [role=tab]").length;
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "w", ctrlKey: true, bubbles: true }));
      const tabsClosed = document.querySelectorAll("#tfTabStrip [role=tab]").length;
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "t", ctrlKey: true, shiftKey: true, bubbles: true }));
      const tabsReopened = document.querySelectorAll("#tfTabStrip [role=tab]").length;

      const saved = mac.saveWorkspace("Part2 Browser Smoke");
      const workspacePreference = localStorage.getItem("textforge.macintoshExperience.v1") || "";
      host.setSplitLayout("single");
      const restored = mac.restoreWorkspace(saved.workspace.id);
      return {
        inputP95: typing.inputHandler.p95,
        inputLongTasks: typing.longTaskCount,
        switchNextFrameP95: switching.totalToNextFrame.p95,
        switchRenderP95: switching.totalToRenderActiveEnd.p95,
        switchLongTasks: switching.longTaskCount,
        alphaLength: alpha.contentHtml.length,
        betaText: beta.plainText,
        referenceEditable: reference.getAttribute("contenteditable"),
        tabsBefore, tabsClosed, tabsReopened,
        workspaceSaved: saved.ok,
        workspaceRestored: restored.ok,
        workspaceSplit: host.getSplitWorkspace().layout,
        workspaceHasBody: /"content(?:Html)?"\\s*:/.test(workspacePreference),
      };
    })()`);

    assert.ok(result.inputP95 < 5, `17K input p95 ${result.inputP95}ms`);
    assert.equal(result.inputLongTasks, 0);
    assert.ok(result.switchNextFrameP95 < 30, `tab switch p95 ${result.switchNextFrameP95}ms`);
    assert.equal(result.switchLongTasks, 0);
    assert.equal(result.betaText, "Beta edited in Split");
    assert.equal(result.referenceEditable, "true");
    assert.equal(result.tabsClosed, result.tabsBefore - 1);
    assert.equal(result.tabsReopened, result.tabsBefore);
    assert.equal(result.workspaceSaved, true);
    assert.equal(result.workspaceRestored, true);
    assert.equal(result.workspaceSplit, "vertical-2");
    assert.equal(result.workspaceHasBody, false);
    assert.deepEqual(client.runtimeErrors, []);
    process.stdout.write(`${JSON.stringify(result)}\nTextForge Macintosh Part 2 browser smoke passed.\n`);
  } finally {
    client?.close();
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/PID", String(edge.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
      const escapedProfile = profilePath.replace(/'/g, "''");
      spawnSync("powershell.exe", ["-NoProfile", "-Command", `$target='${escapedProfile}'; Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'msedge.exe' -and $_.CommandLine -like \"*$target*\" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: "ignore", windowsHide: true });
    } else edge.kill();
    const resolvedTemp = path.resolve(profilePath);
    if (resolvedTemp.startsWith(path.resolve(os.tmpdir()))) {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        try { fs.rmSync(resolvedTemp, { recursive: true, force: true }); break; }
        catch (error) {
          if (attempt === 5) console.warn(`Temporary Edge profile remains for later cleanup: ${resolvedTemp}`);
          else await delay(300);
        }
      }
    }
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
