import { test } from "node:test";
import assert from "node:assert/strict";
import { parseIssueUrl } from "../src/github/url.ts";

test("url: accepts a plain issue URL", () => {
  assert.deepEqual(parseIssueUrl("https://github.com/owner/repo/issues/123"), {
    ok: true,
    ref: { owner: "owner", repo: "repo", number: 123 },
  });
});

test("url: accepts trailing slash, fragment, query and surrounding spaces", () => {
  for (const u of [
    "https://github.com/o/r.js/issues/7/",
    "https://github.com/o/r.js/issues/7#issuecomment-1",
    "  https://github.com/o/r.js/issues/7?x=1 ",
  ]) {
    assert.deepEqual(parseIssueUrl(u), { ok: true, ref: { owner: "o", repo: "r.js", number: 7 } }, u);
  }
});

test("url: a pull request URL is reported as a PR, not as invalid", () => {
  assert.deepEqual(parseIssueUrl("https://github.com/o/r/pull/7"), { ok: false, reason: "pull_request_url" });
});

test("url: rejects what is not a github.com issue URL", () => {
  for (const u of [
    "",
    "owner/repo#123",
    "https://gitlab.com/o/r/issues/1",
    "https://github.com/o/r/issues/",
    "https://github.com/o/r/issues/0",
    "https://github.com/o/r/issues/abc",
    "https://github.com.evil.example/o/r/issues/1",
    "https://github.com/o/r/issues/1/extra",
  ]) {
    assert.deepEqual(parseIssueUrl(u), { ok: false, reason: "not_an_issue_url" }, u);
  }
});
