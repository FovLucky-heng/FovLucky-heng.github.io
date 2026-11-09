/* =========================================================
   开发服务器：静态服务 dist/ + 监听 src/ 自动重新构建
   用法：node scripts/dev.mjs [--port 8123] [--no-watch]
   ========================================================= */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { watch, existsSync } from "node:fs";
import { join, dirname, extname, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const SRC = join(ROOT, "src");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

/** 起一个只读静态服务器，供 dev / e2e 测试复用 */
export function startServer(root = DIST, port = 8123) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith("/")) pathname += "index.html";

      const file = resolve(join(root, pathname));
      if (!file.startsWith(resolve(root) + sep) && file !== resolve(root)) {
        res.writeHead(403).end("Forbidden");
        return;
      }

      let body;
      let status = 200;
      try {
        const info = await stat(file);
        body = info.isDirectory()
          ? await readFile(join(file, "index.html"))
          : await readFile(file);
      } catch {
        status = 404;
        const notFound = join(root, "404.html");
        body = existsSync(notFound)
          ? await readFile(notFound)
          : Buffer.from("404");
      }

      res.writeHead(status, {
        "Content-Type": MIME[extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      res.end(body);
    } catch (err) {
      res.writeHead(500).end(String(err));
    }
  });

  return new Promise((ok) => server.listen(port, "127.0.0.1", () => ok(server)));
}

/* ---------- CLI ---------- */
const isCli =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isCli) {
  const args = process.argv.slice(2);
  const portArg = args.indexOf("--port");
  const port = portArg >= 0 ? Number(args[portArg + 1]) : 8123;
  const noWatch = args.includes("--no-watch");

  await startServer(DIST, port);
  console.log(`\n  生活五号线  →  http://127.0.0.1:${port}/\n`);

  if (!noWatch) {
    let timer = null;
    let building = false;
    const rebuild = () => {
      if (building) return;
      building = true;
      const child = spawn(process.execPath, [join(ROOT, "scripts/build.mjs")], {
        stdio: "inherit"
      });
      child.on("exit", () => {
        building = false;
        console.log("  ↻ 已重新构建，刷新页面即可\n");
      });
    };

    watch(SRC, { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(rebuild, 180);
    });
    console.log("  正在监听 src/ 变化…（Ctrl+C 退出）\n");
  }
}
