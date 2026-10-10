import { test } from "node:test";
import assert from "node:assert/strict";
import { renderEvaluation } from "../src/web/view.js";
import type { CheckResult, Evaluation } from "../src/core/types.ts";

const check = (id: string, label: string, status: "met" | "missing", evidence: string): CheckResult =>
  ({ id, label, kind: "blocking", status, evidence, source: "rule" });
const evaluation = (over: Partial<Evaluation>): Evaluation => ({
  issue: { owner: "o", repo: "r", number: 7 }, title: "t", verdict: "READY", decisions: [],
  checks: [check("acceptance-criteria", "Acceptance criteria", "met", "本文の見出し「AC」")], ...over,
});
/** The part a human sees before opening 詳細を見る, and the part inside it. */
const split = (html: string) => {
  const i = html.indexOf("<details>");
  assert.ok(i > 0, "has a <details>");
  return { first: html.slice(0, i), inside: html.slice(i) };
};

const TWO = evaluation({
  verdict: "NEEDS_CLARIFICATION",
  decisions: ["完了と判断する条件", "完了をどう確かめるか"],
  checks: [
    check("acceptance-criteria", "Acceptance criteria", "missing", "見出しが見つかりませんでした"),
    check("verification", "Verification", "missing", "確認方法の見出しが見つかりませんでした"),
    check("open-questions", "No open decisions", "met", "未決の印は見つかりませんでした"),
  ],
});

test("view: the first screen shows the verdict and the decisions, and no check (docs/adr/0004)", () => {
  const { first } = split(renderEvaluation(TWO));
  assert.match(first, /🟡 NEEDS CLARIFICATION/);
  assert.match(first, /人間が2つ決める/);
  assert.match(first, /<li>完了と判断する条件<\/li>/);
  assert.match(first, /<li>完了をどう確かめるか<\/li>/);
  for (const c of TWO.checks) assert.ok(!first.includes(c.label), `${c.label} is not on the first screen`);
});

test("view: every check label and evidence is inside 詳細を見る", () => {
  const { inside } = split(renderEvaluation(TWO));
  assert.match(inside, /^<details><summary>詳細を見る<\/summary>/);
  for (const c of TWO.checks) {
    assert.ok(inside.includes(c.label), c.label);
    assert.ok(inside.includes(c.evidence), c.evidence);
  }
});

test("view: READY has no decision list on the first screen", () => {
  const { first } = split(renderEvaluation(evaluation({})));
  assert.match(first, /🟢 READY/);
  assert.ok(!first.includes("<ol>"));
  assert.match(first, /人間が決めることは見つかりませんでした/);
});

test("view: text quoted from the issue is escaped (the issue is hostile input)", () => {
  const html = renderEvaluation(evaluation({
    title: "<img src=x onerror=alert(1)>",
    verdict: "NEEDS_CLARIFICATION",
    decisions: ["未決: 「<script>alert(1)</script>」"],
    checks: [check("open-questions", "No open decisions", "missing", "本文に「<script>x</script> & y」")],
  }));
  assert.ok(!/<script|<img/i.test(html), html);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /&lt;script&gt;x&lt;\/script&gt; &amp; y/);
});
