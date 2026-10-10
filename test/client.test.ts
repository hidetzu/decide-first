import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchIssue, MAX_COMMENT_PAGES, MAX_DEPENDENCIES } from "../src/github/client.ts";

const REF = { owner: "o", repo: "r", number: 1 };
const ISSUE = { title: "t", body: "b", state: "open", html_url: "https://github.com/o/r/issues/1", labels: [{ name: "bug" }, "x"], comments: 0 };

// ⚠ A stub, never the real API: a check must not depend on GitHub being up (rules/verification.md).
function stub(routes: (url: string) => Response | Error): { fetch: typeof fetch; calls: string[] } {
  const calls: string[] = [];
  const f = (async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    const r = routes(url);
    if (r instanceof Error) throw r;
    return r;
  }) as typeof fetch;
  return { fetch: f, calls };
}
const json = (v: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(v), { status: 200, ...init });

test("client: maps the API issue to a snapshot", async () => {
  const s = stub(() => json(ISSUE));
  const r = await fetchIssue(REF, { fetch: s.fetch });
  assert.deepEqual(r, {
    ok: true,
    issue: { ref: REF, url: ISSUE.html_url, title: "t", body: "b", state: "open", labels: ["bug", "x"], comments: [], dependencies: [] },
  });
  assert.deepEqual(s.calls, ["https://api.github.com/repos/o/r/issues/1"], "no comment request when there are none");
});

test("client: a null body becomes an empty string", async () => {
  const r = await fetchIssue(REF, { fetch: stub(() => json({ ...ISSUE, body: null })).fetch });
  assert.ok(r.ok && r.issue.body === "");
});

test("client: pages through comments until a short page", async () => {
  const page = (n: number) => Array.from({ length: n }, (_, i) => ({ user: { login: "u" }, body: `c${i}`, created_at: "2026-01-01T00:00:00Z" }));
  const s = stub((u) => (u.includes("/comments") ? json(page(u.endsWith("&page=1") ? 100 : 3)) : json({ ...ISSUE, comments: 103 })));
  const r = await fetchIssue(REF, { fetch: s.fetch });
  assert.ok(r.ok);
  assert.equal(r.issue.comments.length, 103);
  assert.equal(s.calls.length, 3);
});

test("client: declines rather than judging on a truncated thread", async () => {
  const full = Array.from({ length: 100 }, () => ({ user: null, body: null, created_at: "x" }));
  const s = stub((u) => (u.includes("/comments") ? json(full) : json({ ...ISSUE, comments: 5000 })));
  assert.deepEqual(await fetchIssue(REF, { fetch: s.fetch }), { ok: false, kind: "too_many_comments", limit: MAX_COMMENT_PAGES * 100 });
});

test("client: a pull request served by the issues endpoint is refused", async () => {
  const r = await fetchIssue(REF, { fetch: stub(() => json({ ...ISSUE, pull_request: {} })).fetch });
  assert.deepEqual(r, { ok: false, kind: "is_pull_request" });
});

test("client: 404 is not_found (not 'does not exist')", async () => {
  const r = await fetchIssue(REF, { fetch: stub(() => new Response("{}", { status: 404 })).fetch });
  assert.deepEqual(r, { ok: false, kind: "not_found" });
});

test("client: rate limit is distinguished from other 403s", async () => {
  const limited = new Response("{}", { status: 403, headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1800000000" } });
  assert.deepEqual(await fetchIssue(REF, { fetch: stub(() => limited).fetch }), { ok: false, kind: "rate_limited", resetAt: "2027-01-15T08:00:00.000Z" });
  const forbidden = new Response("{}", { status: 403, headers: { "x-ratelimit-remaining": "10" } });
  assert.deepEqual(await fetchIssue(REF, { fetch: stub(() => forbidden).fetch }), { ok: false, kind: "unexpected_status", status: 403 });
});

test("client: a network error is unreachable, not not_found", async () => {
  const r = await fetchIssue(REF, { fetch: stub(() => new TypeError("fetch failed")).fetch });
  assert.deepEqual(r, { ok: false, kind: "unreachable", detail: "fetch failed" });
});

test("client: the token is sent only when given", async () => {
  let seen: Record<string, string> = {};
  const f = (async (_u: string, init?: RequestInit) => {
    seen = init?.headers as Record<string, string>;
    return json(ISSUE);
  }) as unknown as typeof fetch;
  await fetchIssue(REF, { fetch: f });
  assert.equal(seen.authorization, undefined);
  await fetchIssue(REF, { fetch: f, token: "T" });
  assert.equal(seen.authorization, "Bearer T");
});

// Dependencies: the issue names them; each is a separate GET to the issues endpoint.
const DEP_PATH = /\/repos\/o\/r\/issues\/(\d+)$/;
const withDeps = (body: string, dep: (n: number) => Response | Error) => stub((url) => {
  const m = DEP_PATH.exec(url);
  return m && m[1] !== "1" ? dep(Number(m[1])) : json({ ...ISSUE, body });
});
const outcomes = async (body: string, dep: (n: number) => Response | Error) => {
  const s = withDeps(body, dep);
  const r = await fetchIssue(REF, { fetch: s.fetch });
  assert.ok(r.ok);
  return { deps: r.issue.dependencies.map((d) => d.outcome), depCalls: s.calls.length - 1 };
};

test("client: a dependency's state and state_reason become its outcome", async () => {
  const states: Record<number, object> = {
    12: { state: "open" },
    13: { state: "closed", state_reason: "completed" },
    14: { state: "closed", state_reason: "not_planned" },
    15: { state: "closed", state_reason: null },
    16: { state: "open", pull_request: {} },
  };
  const r = await outcomes("Blocked by #12, #13, #14, #15, #16", (n) => json({ ...ISSUE, ...states[n] }));
  assert.deepEqual(r.deps, ["open", "completed", "closed_not_completed", "closed_not_completed", "is_pull_request"]);
});

test("client: each way a dependency fails to load is told apart, never taken as done", async () => {
  const fail: Record<number, Response | Error> = {
    12: new Response("", { status: 404 }),
    13: new Response("", { status: 403, headers: { "x-ratelimit-remaining": "0" } }),
    14: new Error("ECONNRESET"),
    15: new Response("", { status: 500 }),
  };
  const r = await outcomes("depends on #12 #13 #14 #15", (n) => fail[n]);
  assert.deepEqual(r.deps, ["not_found", "rate_limited", "unreachable", "unexpected_status"]);
});

test("client: no dependency named means no request beyond the issue", async () => {
  const r = await outcomes("Fix #12 and see #13.", () => { throw new Error("must not be called"); });
  assert.deepEqual(r, { deps: [], depCalls: 0 });
});

test("client: at most MAX_DEPENDENCIES are fetched; the rest are not_checked", async () => {
  const r = await outcomes("Blocked by #2, #3, #4, #5, #6, #7, #8", () => json({ ...ISSUE, state: "closed", state_reason: "completed" }));
  assert.equal(MAX_DEPENDENCIES, 5);
  assert.equal(r.depCalls, 5);
  assert.deepEqual(r.deps, ["completed", "completed", "completed", "completed", "completed", "not_checked", "not_checked"]);
});

// hidetzu/decide-first#23: each of these used to throw out of fetchIssue.
const MALFORMED: Record<string, () => Response> = {
  "HTML with status 200": () => new Response("<html>oops</html>", { status: 200 }),
  "JSON cut short": () => new Response('{"title":"t","bo', { status: 200 }),
  "JSON without labels": () => json({ message: "x" }),
};

test("client: a malformed issue body is malformed_response, never a throw (hidetzu/decide-first#23)", async () => {
  for (const [name, make] of Object.entries(MALFORMED)) {
    const r = await fetchIssue(REF, { fetch: stub(() => make()).fetch });
    assert.deepEqual(r, { ok: false, kind: "malformed_response" }, name);
  }
});

test("client: a malformed comment page is malformed_response", async () => {
  const s = stub((url) => (url.includes("/comments") ? new Response("<html>", { status: 200 }) : json({ ...ISSUE, comments: 3 })));
  assert.deepEqual(await fetchIssue(REF, { fetch: s.fetch }), { ok: false, kind: "malformed_response" });
});

test("client: a malformed dependency is unexpected_status, and judging goes on", async () => {
  const s = stub((url) => (url.endsWith("/issues/1") ? json({ ...ISSUE, body: "Blocked by #2" }) : new Response("<html>", { status: 200 })));
  const r = await fetchIssue(REF, { fetch: s.fetch });
  assert.ok(r.ok);
  assert.deepEqual(r.issue.dependencies.map((d) => d.outcome), ["unexpected_status"]);
});
