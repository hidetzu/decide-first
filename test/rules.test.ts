import { test } from "node:test";
import assert from "node:assert/strict";
import { acceptanceCriteria } from "../src/core/rules/acceptance-criteria.ts";
import { goal } from "../src/core/rules/goal.ts";
import { verification } from "../src/core/rules/verification.ts";
import { openQuestions } from "../src/core/rules/open-questions.ts";
import { scope } from "../src/core/rules/scope.ts";
import { dependencies } from "../src/core/rules/dependencies.ts";
import type { DependencyOutcome } from "../src/core/types.ts";
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

test("goal: met by a non-empty Goal heading, and the evidence names it", () => {
  const r = goal.run(issue({ body: "## Goal\nログイン失敗時に理由を表示する" }));
  assert.equal(r.status, "met");
  assert.match(r.evidence, /「Goal」/);
});

test("goal: met by an issue-form heading such as Describe the bug", () => {
  assert.equal(goal.run(issue({ body: "### Describe the bug\nクラッシュする" })).status, "met");
});

test("goal: an empty Goal heading is missing, with a decision and the owner's guidance", () => {
  const r = goal.run(issue({ body: "## Goal\n<!-- -->" }));
  assert.equal(r.status, "missing");
  assert.equal(r.decision, "この Issue で達成すること（1 文で）");
  assert.deepEqual(r.guidance, {
    grounds: "研究の数値はありません。",
    source: "GitHub Copilot のガイドが、解く問題の明確な説明を最初に求めている",
    example: "## Goal\n<この Issue で達成すること（1 文で）>",
  });
  assert.doesNotMatch(`${r.guidance!.grounds} ${r.guidance!.source}`, /[\d%]/);
});

test("goal: found in a comment, and the evidence names the comment", () => {
  const r = goal.run(issue({ body: "x", comments: [comment("## Goal\nfix it", "alice")] }));
  assert.equal(r.status, "met");
  assert.match(r.evidence, /コメント \(@alice\)/);
});

test("goal: Goals and non-goals counts, Goalkeeper does not", () => {
  assert.equal(goal.run(issue({ body: "## Goals and non-goals\nship X, not Y" })).status, "met");
  assert.equal(goal.run(issue({ body: "## Goalkeeper\nnot a goal" })).status, "missing");
});

test("scope: met when both Scope and Out of Scope have content, and the evidence names both", () => {
  const r = scope.run(issue({ body: "## Scope\n- src/a.ts\n## Out of Scope\n- src/b.ts" }));
  assert.equal(r.status, "met");
  assert.match(r.evidence, /「Scope」/);
  assert.match(r.evidence, /「Out of Scope」/);
});

test("scope: Scope alone is missing, and the decision names the Out of Scope side", () => {
  const r = scope.run(issue({ body: "## Scope\n- src/a.ts" }));
  assert.equal(r.status, "missing");
  assert.equal(r.decision, "触れてはいけない範囲（Out of Scope）");
});

test("scope: Out of Scope alone is missing, and the decision names the side that may change", () => {
  const r = scope.run(issue({ body: "## Out of Scope\n- src/b.ts" }));
  assert.equal(r.status, "missing");
  assert.equal(r.decision, "変更してよい範囲");
});

test("scope: neither is still one decision, naming both", () => {
  const r = scope.run(issue({ body: "Please fix the login." }));
  assert.equal(r.status, "missing");
  assert.equal(r.decision, "変更してよい範囲と、触れてはいけない範囲（Out of Scope）");
});

test("scope: Non-goals counts as Out of Scope", () => {
  assert.equal(scope.run(issue({ body: "## Scope\nx\n## Non-goals\ny" })).status, "met");
});

test("scope: an Out of Scope heading is not taken for the Scope side", () => {
  const r = scope.run(issue({ body: "## Out of Scope\n- src/b.ts\n## Out-of-scope\n- more" }));
  assert.equal(r.status, "missing");
  assert.equal(r.decision, "変更してよい範囲");
});

test("scope: a missing result carries the owner's guidance, with no number", () => {
  const r = scope.run(issue({ body: "x" }));
  assert.deepEqual(r.guidance, {
    grounds: "研究の数値はありません。",
    source: "Devin のガイドが scope と境界を書くよう求めている",
    example: "## Scope\n<変更してよいファイル・機能>\n## Out of Scope\n<触れてはいけないもの>",
  });
  assert.doesNotMatch(`${r.guidance!.grounds} ${r.guidance!.source}`, /[\d%]/);
});

const dep = (number: number, outcome: DependencyOutcome) => ({ ref: { owner: "o", repo: "r", number }, outcome });

test("dependencies: an open dependency is missing, named in the evidence and the decision", () => {
  const r = dependencies.run(issue({ dependencies: [dep(12, "open")] }));
  assert.equal(r.status, "missing");
  assert.match(r.evidence, /o\/r#12（まだ open）/);
  assert.equal(r.decision, "依存している o/r#12 の完了を待つか、依存を外すか");
});

test("dependencies: met when none are named, or all are closed as completed", () => {
  assert.equal(dependencies.run(issue({})).status, "met");
  assert.equal(dependencies.run(issue({ dependencies: [dep(12, "completed"), dep(13, "completed")] })).status, "met");
});

test("dependencies: closed but not as completed does not resolve it (docs/adr/0009)", () => {
  const r = dependencies.run(issue({ dependencies: [dep(12, "closed_not_completed")] }));
  assert.equal(r.status, "missing");
  assert.match(r.evidence, /完了ではない/);
});

test("dependencies: each way of failing to read one is missing, and says something different", () => {
  const kinds: DependencyOutcome[] = ["not_found", "rate_limited", "unreachable", "unexpected_status", "is_pull_request"];
  const evidence = kinds.map((k) => {
    const r = dependencies.run(issue({ dependencies: [dep(12, k)] }));
    assert.equal(r.status, "missing", k);
    return r.evidence;
  });
  assert.equal(new Set(evidence).size, kinds.length, evidence.join(" | "));
});

test("dependencies: two unresolved are one decision listing both", () => {
  const r = dependencies.run(issue({ dependencies: [dep(12, "open"), dep(13, "not_found")] }));
  assert.equal(r.decision, "依存している o/r#12、o/r#13 の完了を待つか、依存を外すか");
});

test("dependencies: beyond the limit is unresolved, and the evidence says how many were checked", () => {
  const r = dependencies.run(issue({ dependencies: [1, 2, 3, 4, 5].map((n) => dep(n, "completed")).concat([dep(6, "not_checked"), dep(7, "not_checked")]) }));
  assert.equal(r.status, "missing");
  assert.match(r.evidence, /依存 7 件中 5 件だけ確認しました/);
  assert.match(r.decision!, /o\/r#6、o\/r#7/);
});

test("dependencies: a missing result carries the owner's guidance", () => {
  assert.deepEqual(dependencies.run(issue({ dependencies: [dep(12, "open")] })).guidance, {
    grounds: "依存が終わっていない Issue は、始められても終えられません。",
    source: "Decide First の判定基準（研究の数値ではない）",
    example: "## Dependencies\n- Depends on <owner>/<repo>#<番号>",
  });
});

// hidetzu/decide-first#21: both inputs are copied from the issues that were misjudged.
test("open-questions: TBD inside inline code is an example, not an open decision (hidetzu/decide-first#21)", () => {
  const r = openQuestions.run(issue({ body: "決めた文言: `結論を書き、未決の印（ラベルや TBD）を外す`" }));
  assert.equal(r.status, "met", r.evidence);
});

test("open-questions: TBD outside inline code still counts, even on a line that has some", () => {
  assert.equal(openQuestions.run(issue({ body: "上限: TBD（`MAX` の値）" })).status, "missing");
  assert.equal(openQuestions.run(issue({ body: "a lone `TBD with no closing backtick" })).status, "missing");
});

test("acceptance-criteria: a task list item that is only inline code still counts", () => {
  // ⚠ The second input is the one that guards it: with the code blanked out, nothing would be left.
  for (const body of ["- [ ] `npm test` が通る", "- [ ] `npm test`"]) {
    assert.equal(acceptanceCriteria.run(issue({ body })).status, "met", body);
  }
});
