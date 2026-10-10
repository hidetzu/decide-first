import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { assess, UNREADABLE } from "../src/app.ts";
import { createDecideFirstServer } from "../src/web/server.ts";

// ⚠ GitHub is stubbed: the end-to-end path is ours, the other end is a recorded shape.
const apiIssue = (body: string) => ({ title: "Fix login", body, state: "open", html_url: "https://github.com/o/r/issues/5", labels: [], comments: 0 });
const github = (body: string, status = 200) =>
  (async () => new Response(JSON.stringify(apiIssue(body)), { status })) as unknown as typeof fetch;

test("app: a URL becomes an evaluation", async () => {
  const r = await assess("https://github.com/o/r/issues/5", { fetch: github("Please fix.") });
  assert.ok(r.ok);
  assert.equal(r.evaluation.verdict, "NEEDS_CLARIFICATION");
  assert.deepEqual(r.evaluation.issue, { owner: "o", repo: "r", number: 5 });
});

test("app: failures become a sentence, and 404 never claims non-existence alone", async () => {
  const bad = await assess("not a url", { fetch: github("") });
  assert.ok(!bad.ok && /Issue の URL/.test(bad.message));
  const pr = await assess("https://github.com/o/r/pull/5", { fetch: github("") });
  assert.ok(!pr.ok && /Pull Request/.test(pr.message));
  const nf = await assess("https://github.com/o/r/issues/5", { fetch: github("", 404) });
  assert.ok(!nf.ok && /private repository/.test(nf.message));
});

test("server: GET / serves the page, /view.js its view module; /api/evaluate returns the JSON verdict", async () => {
  const srv = createDecideFirstServer({ fetch: github("## Goal\nx\n## Scope\nsrc/a.ts\n## Out of Scope\nsrc/b.ts\n## Acceptance Criteria\n- a\n## Verify\nnpm test") }).listen(0, "127.0.0.1");
  await once(srv, "listening");
  const base = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
  try {
    const page = await fetch(base + "/");
    assert.equal(page.status, 200);
    assert.match(await page.text(), /import \{ renderEvaluation \} from "\/view\.js"/);
    const view = await fetch(base + "/view.js");
    assert.equal(view.status, 200);
    assert.match(view.headers.get("content-type") ?? "", /^text\/javascript/);
    assert.match(await view.text(), /export function renderEvaluation/);
    for (const [path, type] of [["/icon.svg", "image/svg+xml"], ["/favicon.ico", "image/x-icon"], ["/og.png", "image/png"]]) {
      const r = await fetch(base + path);
      assert.equal(r.status, 200, path);
      assert.equal(r.headers.get("content-type"), type, path);
    }
    const ok = await fetch(base + "/api/evaluate?url=" + encodeURIComponent("https://github.com/o/r/issues/5"));
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).evaluation.verdict, "READY");
    const bad = await fetch(base + "/api/evaluate?url=x");
    assert.equal(bad.status, 422);
    assert.equal((await bad.json()).ok, false);
  } finally {
    srv.close();
  }
});

// hidetzu/decide-first#23: one malformed answer from GitHub used to end the server process.
const html = (async () => new Response("<html>oops</html>", { status: 200 })) as unknown as typeof fetch;
// Not a Response at all: something inside the client throws that nothing there catches.
const broken = (async () => null) as unknown as typeof fetch;

test("app: a malformed answer from GitHub becomes the owner's sentence (hidetzu/decide-first#23)", async () => {
  assert.deepEqual(await assess("https://github.com/o/r/issues/5", { fetch: html }), { ok: false, message: UNREADABLE });
});

test("server: a malformed answer or an unforeseen throw is JSON, and the process keeps serving (hidetzu/decide-first#23)", async () => {
  for (const [githubFetch, status] of [[html, 422], [broken, 500]] as const) {
    const srv = createDecideFirstServer({ fetch: githubFetch }).listen(0, "127.0.0.1");
    await once(srv, "listening");
    const base = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
    try {
      // ⚠ A deadline, so a server that never answers fails here instead of hanging the run.
      const r = await fetch(base + "/api/evaluate?url=" + encodeURIComponent("https://github.com/o/r/issues/5"), { signal: AbortSignal.timeout(5000) });
      assert.equal(r.status, status);
      assert.deepEqual(await r.json(), { ok: false, message: UNREADABLE });
      assert.equal((await fetch(base + "/")).status, 200, "still serving after it");
    } finally {
      srv.close();
    }
  }
});
