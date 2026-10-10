import { test } from "node:test";
import assert from "node:assert/strict";
import { extractDependencies } from "../src/core/dependencies.ts";
import { comment, issue } from "./helpers.ts";

const at = (number: number) => ({ owner: "o", repo: "r", number });
/** Dependencies of o/r#50 (not #1, so #1 in a list is not the issue itself). */
const deps = (body: string, comments: string[] = []) =>
  extractDependencies(issue({ ref: at(50), body, comments: comments.map((c) => comment(c)) }));

test("dependencies: a bare #N is in the same repository", () => {
  assert.deepEqual(deps("Blocked by #12"), [at(12)]);
});

test("dependencies: owner/repo#N names another repository", () => {
  assert.deepEqual(deps("depends on other/repo#3"), [{ owner: "other", repo: "repo", number: 3 }]);
});

test("dependencies: 依存: with an issue URL", () => {
  assert.deepEqual(deps("依存: https://github.com/a/b/issues/9"), [{ owner: "a", repo: "b", number: 9 }]);
});

test("dependencies: a list after one keyword is read in order", () => {
  assert.deepEqual(deps("Depends on #1, #2、x/y#3"), [at(1), at(2), { owner: "x", repo: "y", number: 3 }]);
});

test("dependencies: inside a code block or an HTML comment is not a dependency", () => {
  assert.deepEqual(deps("```\nBlocked by #5\n```\n<!-- Blocked by #6 -->"), []);
});

test("dependencies: a comment can name one", () => {
  assert.deepEqual(deps("no deps here", ["blocked by #7"]), [at(7)]);
});

test("dependencies: each once, in first-seen order, and never the issue itself", () => {
  assert.deepEqual(deps("Blocked by #8\nDepends on #50, #8", ["depends on #9, #8"]), [at(8), at(9)]);
  assert.deepEqual(extractDependencies(issue({ body: "Blocked by #1" })), [], "o/r#1 naming #1 is itself");
});

test("dependencies: none named gives an empty list", () => {
  assert.deepEqual(deps("Fix #12 and see other/repo#3."), []);
});

test("dependencies: a pull request URL is not a dependency", () => {
  assert.deepEqual(deps("Blocked by https://github.com/a/b/pull/4"), []);
});
