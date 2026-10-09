import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate } from "../src/core/evaluate.ts";
import { DEFAULT_CHECKS } from "../src/core/rules/index.ts";
import { issue } from "./helpers.ts";

const READY_BODY = "## Goal\nx\n## Acceptance Criteria\n- [ ] returns 200\n## Verify\nnpm test\n";

test("evaluate: all checks met -> READY with no decisions", () => {
  const e = evaluate(issue({ body: READY_BODY }), DEFAULT_CHECKS);
  assert.equal(e.verdict, "READY");
  assert.deepEqual(e.decisions, []);
  assert.ok(e.checks.every((c) => c.status === "met" && c.evidence));
});

test("evaluate: any missing -> NEEDS_CLARIFICATION, one decision per missing check, in order", () => {
  const e = evaluate(issue({ body: "Please fix the login." }), DEFAULT_CHECKS);
  assert.equal(e.verdict, "NEEDS_CLARIFICATION");
  assert.deepEqual(e.checks.map((c) => c.status), ["missing", "missing", "met"]);
  assert.equal(e.decisions.length, 2);
  assert.match(e.decisions[0], /完了と判断する条件/);
});

test("evaluate: decisions is empty exactly when the verdict is READY", () => {
  for (const body of [READY_BODY, READY_BODY + "\nlimit: TBD", "", "## Verify\nx"]) {
    const e = evaluate(issue({ body }), DEFAULT_CHECKS);
    assert.equal(e.decisions.length === 0, e.verdict === "READY", body);
  }
});

test("evaluate: deterministic — the same snapshot gives the same evaluation", () => {
  const i = issue({ body: "## Verify\nx\n- [ ] a", labels: ["question"] });
  assert.deepEqual(evaluate(i, DEFAULT_CHECKS), evaluate(i, DEFAULT_CHECKS));
});
