// The Cloudflare Workers entry (docs/adr/0010). public/ is served by Cloudflare before this runs,
// so only /api/evaluate (and unknown paths) reach here.
import { createHandler } from "./web/handler.ts";

interface Env {
  /** A permissionless GitHub token, set as a Workers secret. ⚠ It never widens what is read. */
  GITHUB_TOKEN?: string;
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return createHandler({ token: env.GITHUB_TOKEN })(request);
  },
};
