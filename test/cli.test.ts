import { test } from "node:test";
import assert from "node:assert/strict";
import { UNREADABLE } from "../src/app.ts";
import { runCli } from "../src/cli-run.ts";

const URL_ = "https://github.com/o/r/issues/5";
const html = (async () => new Response("<html>oops</html>", { status: 200 })) as unknown as typeof fetch;
const broken = (async () => null) as unknown as typeof fetch;

test("cli: a malformed answer is one line on stderr, no stack trace, exit 2 (hidetzu/decide-first#23)", async () => {
  for (const githubFetch of [html, broken]) {
    const r = await runCli(URL_, { fetch: githubFetch });
    assert.deepEqual(r, { code: 2, out: "", err: UNREADABLE });
    assert.doesNotMatch(r.err, /^\s+at /m);
  }
});

test("cli: no argument prints the usage and exits 2", async () => {
  const r = await runCli(undefined);
  assert.equal(r.code, 2);
  assert.match(r.err, /^使い方: /);
});
