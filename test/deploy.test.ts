import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { judgeEvaluate, judgeFile, SERVED } from "../scripts/check-deploy.mjs";
import { createHandler } from "../src/web/handler.ts";
import worker, { WORKER_MAX_COMMENT_PAGES } from "../src/worker.ts";
import { PER_PAGE } from "../src/github/client.ts";

test("deploy: a file that could not be fetched is not called absent, and differs from a changed one", () => {
  const a = judgeFile("x", null);
  const b = judgeFile("x", "y");
  const c = judgeFile("x", "x");
  assert.deepEqual([a.ok, b.ok, c.ok], [false, false, true]);
  assert.match(a.why, /取れなかった/);
  assert.match(b.why, /中身が違う/);
  assert.notEqual(a.why, b.why);
});

test("deploy: /api/evaluate passes only with a 200 JSON verdict", () => {
  assert.equal(judgeEvaluate(200, JSON.stringify({ ok: true, evaluation: { verdict: "NOT_READY" } })).ok, true);
  assert.match(judgeEvaluate(null, null).why, /取れなかった/);
  assert.match(judgeEvaluate(200, "<html>").why, /JSON でない/);
  assert.equal(judgeEvaluate(422, JSON.stringify({ ok: false, message: "上限" })).ok, false);
});

test("deploy: public/ holds exactly the files check-deploy compares, and no TypeScript", () => {
  assert.deepEqual(readdirSync("public").sort(), SERVED.map(([f]) => f).sort());
});

test("deploy: every action in the workflow is pinned to a full commit SHA", () => {
  const uses = [...readFileSync(".github/workflows/check.yml", "utf8").matchAll(/^\s*-?\s*uses:\s*(\S+)/gm)].map((m) => m[1]);
  assert.ok(uses.length > 0);
  for (const u of uses) assert.match(u, /@[0-9a-f]{40}$/, u);
});

// The Worker answers through the same handler; GitHub is stubbed.
test("worker: the GITHUB_TOKEN secret reaches GitHub as the authorization header", async () => {
  const seen: string[] = [];
  const orig = globalThis.fetch;
  globalThis.fetch = (async (_: unknown, init?: RequestInit) => {
    seen.push(String((init?.headers as Record<string, string>)?.authorization));
    return new Response(JSON.stringify({ title: "t", body: "b", state: "open", html_url: "u", labels: [], comments: 0 }));
  }) as typeof fetch;
  try {
    const r = await worker.fetch(new Request("https://x.workers.dev/api/evaluate?url=" + encodeURIComponent("https://github.com/o/r/issues/1")), { GITHUB_TOKEN: "t0ken" });
    assert.equal(r.status, 200);
    assert.deepEqual(seen, ["Bearer t0ken"]);
  } finally {
    globalThis.fetch = orig;
  }
});

test("handler: routes, with and without the public files", async () => {
  const github = (async () => new Response(JSON.stringify({ title: "t", body: "", state: "open", html_url: "u", labels: [], comments: 0 }))) as unknown as typeof fetch;
  const withFiles = createHandler({ fetch: github }, { page: "<p>page</p>", view: "export {}" });
  const get = (h: typeof withFiles, path: string) => h(new Request("http://x" + path));
  assert.equal(await (await get(withFiles, "/")).text(), "<p>page</p>");
  assert.match((await get(withFiles, "/view.js")).headers.get("content-type") ?? "", /^text\/javascript/);
  assert.equal((await get(withFiles, "/api/evaluate?url=" + encodeURIComponent("https://github.com/o/r/issues/1"))).status, 200);
  assert.equal((await get(withFiles, "/api/evaluate?url=x")).status, 422);
  assert.equal((await get(withFiles, "/nope")).status, 404);
  // On Workers, Cloudflare serves public/; the handler itself does not.
  const bare = createHandler({ fetch: github });
  assert.equal((await get(bare, "/")).status, 404);
});

test("worker: reads at most WORKER_MAX_COMMENT_PAGES of comments, then declines in words", async () => {
  const pageOf = (n: number) => JSON.stringify(Array.from({ length: n }, () => ({ user: { login: "u" }, body: "x", created_at: "t" })));
  const orig = globalThis.fetch;
  const run = async (comments: number) => {
    let pages = 0;
    globalThis.fetch = (async (url: unknown) => {
      const m = /[?&]page=(\d+)/.exec(String(url));
      if (!m) return new Response(JSON.stringify({ title: "t", body: "b", state: "open", html_url: "u", labels: [], comments }));
      pages++;
      const before = (Number(m[1]) - 1) * PER_PAGE;
      return new Response(pageOf(Math.max(0, Math.min(PER_PAGE, comments - before))));
    }) as typeof fetch;
    const r = await worker.fetch(new Request("https://x/api/evaluate?url=" + encodeURIComponent("https://github.com/o/r/issues/1")), {});
    return { body: (await r.json()) as { ok: boolean; message?: string }, pages };
  };
  try {
    const limit = WORKER_MAX_COMMENT_PAGES * PER_PAGE;
    const under = await run(limit - 1);
    assert.equal(under.body.ok, true);
    const over = await run(limit + 1);
    assert.equal(over.body.ok, false);
    assert.match(over.body.message ?? "", new RegExp(`${limit} 件を超える`));
    assert.equal(over.pages, WORKER_MAX_COMMENT_PAGES, "no page beyond the limit is fetched");
  } finally {
    globalThis.fetch = orig;
  }
});
