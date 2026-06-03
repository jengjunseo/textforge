const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 4291);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon",
};

http
  .createServer((req, res) => {
    const urlPath = req.url === "/" ? "index.html" : decodeURIComponent(req.url.slice(1));
    const filePath = path.resolve(root, urlPath);

    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "text/plain" });
      res.end(data);
    });
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`TextForge MVP running at http://127.0.0.1:${port}`);
  });
