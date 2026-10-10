// Every route, once, as Web-standard Request -> Response. The Node server (src/web/server.ts) and
// the Cloudflare Worker (src/worker.ts) both answer through this, so the two never disagree about
// what a URL means (CLAUDE.md §3: never two implementations of one question; docs/adr/0010).
import { assess, UNREADABLE } from "../app.ts";
import type { ClientOptions } from "../github/client.ts";

/** The two files in public/. ⚠ On Workers, Cloudflare serves them itself and these are unset. */
export interface PublicFiles {
  page: string;
  view: string;
}

const JSON_TYPE = { "content-type": "application/json; charset=utf-8" };

export function createHandler(opts: ClientOptions = {}, files?: PublicFiles): (request: Request) => Promise<Response> {
  return async (request) => {
    const url = new URL(request.url);
    if (request.method === "GET" && files && url.pathname === "/") {
      return new Response(files.page, { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    if (request.method === "GET" && files && url.pathname === "/view.js") {
      return new Response(files.view, { headers: { "content-type": "text/javascript; charset=utf-8" } });
    }
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
