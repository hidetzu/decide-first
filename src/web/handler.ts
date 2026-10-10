// Every route, once, as Web-standard Request -> Response. The Node server (src/web/server.ts) and
// the Cloudflare Worker (src/worker.ts) both answer through this, so the two never disagree about
// what a URL means (CLAUDE.md §3: never two implementations of one question; docs/adr/0010).
import { assess, UNREADABLE } from "../app.ts";
import type { ClientOptions } from "../github/client.ts";

/**
 * The files in public/, by the path they are served at. ⚠ On Workers, Cloudflare serves public/
 * itself and this is unset; only the local Node server passes it.
 */
export type PublicFiles = Map<string, { body: Uint8Array<ArrayBuffer>; type: string }>;

const JSON_TYPE = { "content-type": "application/json; charset=utf-8" };

export function createHandler(opts: ClientOptions = {}, files?: PublicFiles): (request: Request) => Promise<Response> {
  return async (request) => {
    const url = new URL(request.url);
    const file = request.method === "GET" ? files?.get(url.pathname) : undefined;
    if (file) return new Response(file.body, { headers: { "content-type": file.type } });
    if (request.method === "GET" && url.pathname === "/api/evaluate") {
      // ⚠ Nothing thrown here may escape: on Node an unhandled rejection ends the process, and with
      //   it the page for everyone (hidetzu/decide-first#23). The person gets the same one sentence.
      try {
        const result = await assess(url.searchParams.get("url") ?? "", opts);
        return new Response(JSON.stringify(result), { status: result.ok ? 200 : 422, headers: JSON_TYPE });
      } catch {
        return new Response(JSON.stringify({ ok: false, message: UNREADABLE }), { status: 500, headers: JSON_TYPE });
      }
    }
    return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  };
}
