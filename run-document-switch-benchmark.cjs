const http = require("node:http");
const { spawn } = require("node:child_process");
const path = require("node:path");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const port = Number(process.argv[2] || 9340);
const appUrl = process.argv[3] || "http://127.0.0.1:4291";
const userDataDir = path.join(process.cwd(), `.tmp-edge-switch-bench-${Date.now()}`);

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    }).on("error", reject);
  });
}

async function waitForCdp() {
  for (let index = 0; index < 30; index += 1) {
    try {
      const tabs = await getJson(`http://127.0.0.1:${port}/json/list`);
      const page = tabs?.find((tab) => tab.type === "page" && tab.url?.startsWith(appUrl)) || tabs?.find((tab) => tab.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("CDP port did not become ready");
}

function createCdpClient(wsUrl) {
  let id = 0;
  const pending = new Map();
  const events = [];
  const ws = new WebSocket(wsUrl);
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) item.reject(new Error(JSON.stringify(message.error)));
      else item.resolve(message.result);
    } else if (message.method === "Runtime.exceptionThrown" || message.method === "Log.entryAdded") {
      events.push(message);
    }
  };
  return {
    ready: new Promise((resolve) => {
      ws.onopen = resolve;
    }),
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const messageId = ++id;
        pending.set(messageId, { resolve, reject });
        ws.send(JSON.stringify({ id: messageId, method, params }));
      });
    },
    close() {
      ws.close();
    },
    events,
  };
}

(async () => {
  const edge = spawn(edgePath, [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    appUrl,
  ], { stdio: "ignore" });

  try {
    const wsUrl = await waitForCdp();
    const cdp = createCdpClient(wsUrl);
    await cdp.ready;
    await cdp.send("Runtime.enable");
    await new Promise((resolve) => setTimeout(resolve, 2200));
    const expression = `
      (async () => {
        if (!window.TextForgeDocumentSwitchPerf) return JSON.stringify({ error: "missing perf api" });
        const report = await window.TextForgeDocumentSwitchPerf.runDocumentSwitchBenchmark({ samples: 10 });
        return JSON.stringify({
          hasApi: true,
          keys: Object.keys(window.TextForgeDocumentSwitchPerf || {}),
          reportType: Object.prototype.toString.call(report),
          samples: report && report.samples,
          totalToNextFrame: report && report.totalToNextFrame,
          totalToRenderActiveEnd: report && report.totalToRenderActiveEnd,
          longTaskCount: report && report.longTaskCount,
          maxLongTaskMs: report && report.maxLongTaskMs,
          totalLongTaskMs: report && report.totalLongTaskMs,
          topSlowSteps: report && report.topSlowSteps,
          firstTraceTopSlowSteps: report && report.traces && report.traces[0] && report.traces[0].topSlowSteps,
        });
      })()
    `;
    const result = await cdp.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      timeout: 30000,
    });
    console.log(result.result.value || JSON.stringify(result, null, 2));
    if (result.result.value?.includes?.("missing perf api")) {
      console.error(JSON.stringify({ runtimeEvents: cdp.events }, null, 2));
    }
    cdp.close();
  } finally {
    edge.kill();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
