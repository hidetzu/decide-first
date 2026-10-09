import { test } from "node:test";
import assert from "node:assert/strict";
import { acceptanceCriteria } from "../src/core/rules/acceptance-criteria.ts";
import { verification } from "../src/core/rules/verification.ts";
import { openQuestions } from "../src/core/rules/open-questions.ts";
import { comment, issue } from "./helpers.ts";

test("acceptance-criteria: met by a non-empty heading, in English or Japanese", () => {
  for (const body of ["## Acceptance Criteria\n- exits 0", "**Expected behavior:**\nit returns 200", "### 受け入れ条件\n- 200 を返す", "### Expected vs actual behavior\nshould say which scope is missing"]) {
    assert.equal(acceptanceCriteria.run(issue({ body })).status, "met", body);
  }
});

test("acceptance-criteria: met by a task list, and the evidence quotes it", () => {
  const r = acceptanceCriteria.run(issue({ body: "Do X.\n\n- [ ] returns 200 for /health" }));
  assert.equal(r.status, "met");
  assert.match(r.evidence, /- \[ \] returns 200 for \/health/);
});

test("acceptance-criteria: an empty template heading is missing, with a decision", () => {
  for (const body of ["## Acceptance Criteria\n<!-- list them -->\n", "### Acceptance criteria\n\n_No response_\n", "Please fix the login."]) {
    const r = acceptanceCriteria.run(issue({ body }));
    assert.equal(r.status, "missing", body);
    assert.ok(r.decision, "a missing check must say what a human decides");
  }
});

test("acceptance-criteria: a task list inside a code block does not count", () => {
  assert.equal(acceptanceCriteria.run(issue({ body: "```md\n- [ ] x\n```" })).status, "missing");
});

test("acceptance-criteria: found in a comment, and the evidence names the comment", () => {
  const r = acceptanceCriteria.run(issue({ body: "fix it", comments: [comment("## Acceptance Criteria\n- 200")] }));
  assert.equal(r.status, "met");
  assert.match(r.evidence, /コメント \(@maint\)/);
});

test("verification: met by Verify / How to test / 確認方法 / Steps to reproduce", () => {
  for (const body of ["## Verify\n`npm test`", "### How to test\nrun it", "## 確認方法\nnpm test", "### Steps to reproduce\n1. open"]) {
    assert.equal(verification.run(issue({ body })).status, "met", body);
  }
});

test("verification: a heading that merely starts with the same letters does not count", () => {
  assert.equal(verification.run(issue({ body: "## Testimonials\nnice" })).status, "missing");
});

test("open-questions: a question-type label is an open decision", () => {
  const r = openQuestions.run(issue({ labels: ["bug", "Needs-Info"] }));
  assert.equal(r.status, "missing");
  assert.match(r.evidence, /Needs-Info/);
});

test("open-questions: TBD / 未定 in prose is an open decision, quoted in the decision", () => {
  const r = openQuestions.run(issue({ body: "## Scope\n- timeout: TBD" }));
  assert.equal(r.status, "missing");
  assert.match(r.decision ?? "", /timeout: TBD/);
  assert.equal(openQuestions.run(issue({ body: "上限値は未定" })).status, "missing");
});

test("open-questions: markers inside code or HTML comments are not findings", () => {
  assert.equal(openQuestions.run(issue({ body: "```\n// TBD\n```\n<!-- TBD -->\nok" })).status, "met");
  assert.equal(openQuestions.run(issue({ body: "the TBDX flag" })).status, "met");
});
