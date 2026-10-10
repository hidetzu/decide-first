// The local server: Node's http in front of the shared handler. ⚠ No framework (CLAUDE.md §3).
// ⚠ Routes live in src/web/handler.ts only; this file only adapts Node's request and response.
import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import type { ClientOptions } from "../github/client.ts";
import { createHandler } from "./handler.ts";

// ⚠ The same files Cloudflare serves from public/ (docs/adr/0010).
const FILES = {
  page: readFileSync(new URL("../../public/index.html", import.meta.url), "utf8"),
  view: readFileSync(new URL("../../public/view.js", import.meta.url), "utf8"),
};

export function createDecideFirstServer(opts: ClientOptions = {}): Server {
  const handle = createHandler(opts, FILES);
  return createServer(async (req, res) => {
    const response = await handle(new Request(new URL(req.url ?? "/", "http://localhost"), { method: req.method }));
    res.writeHead(response.status, Object.fromEntries(response.headers)).end(Buffer.from(await response.arrayBuffer()));
  });
}
