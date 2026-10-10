// Serves the one page, its view module, and one JSON endpoint. ⚠ No framework (CLAUDE.md §3).
import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { assess } from "../app.ts";
import type { ClientOptions } from "../github/client.ts";

const PAGE = readFileSync(new URL("./index.html", import.meta.url));
// ⚠ Served as is: plain JS, no build step (src/web/view.js).
const VIEW = readFileSync(new URL("./view.js", import.meta.url));

export function createDecideFirstServer(opts: ClientOptions = {}): Server {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(PAGE);
      return;
    }
    if (req.method === "GET" && url.pathname === "/view.js") {
      res.writeHead(200, { "content-type": "text/javascript; charset=utf-8" }).end(VIEW);
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/evaluate") {
      const result = await assess(url.searchParams.get("url") ?? "", opts);
      res.writeHead(result.ok ? 200 : 422, { "content-type": "application/json; charset=utf-8" }).end(JSON.stringify(result));
      return;
    }
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not Found");
  });
}
