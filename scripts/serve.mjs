#!/usr/bin/env node
/**
 * Minimal static server for local development and the smoke test.
 * Not needed to play: index.html also works opened directly from disk.
 *
 *   node scripts/serve.mjs [port]           → http://localhost:8080
 *   node scripts/serve.mjs [port] --lan     → also reachable from a phone on the same Wi-Fi
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
};

/** Starts the server and resolves with { server, url }. Port 0 picks a free port. */
export function startServer(port = 0, host = "127.0.0.1") {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      const file = path.join(ROOT, urlPath.endsWith("/") ? `${urlPath}index.html` : urlPath);
      if (!file.startsWith(ROOT + path.sep)) throw Object.assign(new Error("forbidden"), { code: "EACCES" });
      const body = await readFile(file);
      res.writeHead(200, {
        "Content-Type": TYPES[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store", // always serve the latest files while developing
      });
      res.end(body);
    } catch (error) {
      res.writeHead(error.code === "EACCES" ? 403 : 404, { "Content-Type": "text/plain" });
      res.end("Not found");
    }
  });
  return new Promise((resolve) => {
    server.listen(port, host, () => {
      resolve({ server, url: `http://127.0.0.1:${server.address().port}/` });
    });
  });
}

/** IPv4 addresses of this machine on the local network. */
function lanAddresses() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((net) => net && net.family === "IPv4" && !net.internal)
    .map((net) => net.address);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const lan = process.argv.includes("--lan");
  const port = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a))) || 8080;
  const { server, url } = await startServer(port, lan ? "0.0.0.0" : "127.0.0.1");
  const actualPort = server.address().port;
  console.log(`AWS Cloud Quest running at ${url}  (Ctrl+C to stop)`);
  if (lan) lanAddresses().forEach((ip) => console.log(`  on your network: http://${ip}:${actualPort}/`));
}
