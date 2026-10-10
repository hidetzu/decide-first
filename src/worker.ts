// The Cloudflare Workers entry (docs/adr/0010). public/ is served by Cloudflare before this runs,
// so only /api/evaluate (and unknown paths) reach here.
import { createHandler } from "./web/handler.ts";

interface Env {
  /** A permissionless GitHub token, set as a Workers secret. ⚠ It never widens what is read. */
  GITHUB_TOKEN?: string;
}

// ⚠ Fewer comment pages than the Node server and the CLI read: Workers Free stops a request at
//   10 ms of CPU, and a full 10 pages measured over it (owner decision on hidetzu/decide-first#26;
//   the measurement is on its PR). Beyond this the person reads the usual too-many-comments sentence,
//   not Cloudflare's error page.
export const WORKER_MAX_COMMENT_PAGES = 3;

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return createHandler({ token: env.GITHUB_TOKEN, maxCommentPages: WORKER_MAX_COMMENT_PAGES })(request);
  },
};
