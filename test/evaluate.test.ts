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
  assert.deepEqual(e.checks.filter((c) => c.kind === "blocking").map((c) => c.status), ["missing", "missing", "met"]);
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

// #1: structural checks. Four snapshots: closed / empty body / template only / ordinary.
const TEMPLATE_ONLY = "## Goal\n<!-- what should change -->\n## Verify\n_No response_\n";

test("evaluate: a closed issue is NOT_READY, and issue-open says closed", () => {
  const e = evaluate(issue({ body: READY_BODY, state: "closed" }), DEFAULT_CHECKS);
  assert.equal(e.verdict, "NOT_READY");
  const c = e.checks.find((c) => c.id === "issue-open");
  assert.equal(c?.status, "missing");
  assert.match(c?.evidence ?? "", /closed/);
});

test("evaluate: an empty body or a template with nothing filled in is NOT_READY", () => {
  for (const body of ["", "  \n", TEMPLATE_ONLY, "**Goal**\n<!--\n-->\n"]) {
    const e = evaluate(issue({ body }), DEFAULT_CHECKS);
    assert.equal(e.verdict, "NOT_READY", JSON.stringify(body));
    assert.equal(e.checks.find((c) => c.id === "has-body")?.status, "missing", JSON.stringify(body));
  }
});

test("evaluate: NOT_READY lists the structural decisions only (docs/adr/0006)", () => {
  const closed = evaluate(issue({ body: "Please fix the login.", state: "closed" }), DEFAULT_CHECKS);
  assert.deepEqual(closed.decisions, ["この Issue を開き直すか、残りの作業を新しい Issue に切り出すか"]);
  const empty = evaluate(issue({ body: TEMPLATE_ONLY, state: "closed" }), DEFAULT_CHECKS);
  assert.equal(empty.decisions.length, 2);
  assert.ok(empty.checks.filter((c) => c.status === "missing" && c.kind === "structural").every((c) => empty.decisions.includes(c.decision!)));
});

test("evaluate: an ordinary open issue with a body is not NOT_READY, and structural checks quote what they found", () => {
  const e = evaluate(issue({ body: "## Goal\nログイン後に 500 になる" }), DEFAULT_CHECKS);
  assert.equal(e.verdict, "NEEDS_CLARIFICATION");
  assert.ok(e.checks.filter((c) => c.kind === "structural").every((c) => c.status === "met"));
  assert.match(e.checks.find((c) => c.id === "has-body")?.evidence ?? "", /ログイン後に 500 になる/);
});

test("evaluate: a code block alone counts as a written body", () => {
  const e = evaluate(issue({ body: "## Repro\n```\n# crash.sh\n```" }), DEFAULT_CHECKS);
  assert.equal(e.checks.find((c) => c.id === "has-body")?.status, "met");
});
