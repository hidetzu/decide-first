// The local server: Node's http in front of the shared handler. ⚠ No framework (CLAUDE.md §3).
// ⚠ Routes live in src/web/handler.ts only; this file only adapts Node's request and response.
import { createServer, type Server } from "node:http";
import { readdirSync, readFileSync } from "node:fs";
import type { ClientOptions } from "../github/client.ts";
import { createHandler, type PublicFiles } from "./handler.ts";

// ⚠ The same files Cloudflare serves from public/ (docs/adr/0010), at the same paths.
const TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  ico: "image/x-icon",
};
const PUBLIC = new URL("../../public/", import.meta.url);
const FILES: PublicFiles = new Map(
  readdirSync(PUBLIC).map((name) => [
    name === "index.html" ? "/" : `/${name}`,
    { body: new Uint8Array(readFileSync(new URL(name, PUBLIC))), type: TYPES[name.split(".").pop() ?? ""] ?? "application/octet-stream" },
  ]),
);

export function createDecideFirstServer(opts: ClientOptions = {}): Server {
  const handle = createHandler(opts, FILES);
  return createServer(async (req, res) => {
    const response = await handle(new Request(new URL(req.url ?? "/", "http://localhost"), { method: req.method }));
    res.writeHead(response.status, Object.fromEntries(response.headers)).end(Buffer.from(await response.arrayBuffer()));
  });
}
