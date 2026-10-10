import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate } from "../src/core/evaluate.ts";
import { DEFAULT_CHECKS } from "../src/core/rules/index.ts";
import { render } from "../src/render-text.ts";
import { renderEvaluation } from "../src/web/view.js";
import { issue } from "./helpers.ts";

// Every check missing at once: closed, template-only body, and a question label.
const ALL_MISSING = issue({ state: "closed", body: "## Goal\n<!-- -->", labels: ["question"] });
const results = () => DEFAULT_CHECKS.map((c) => c.run(ALL_MISSING));

test("guidance: every missing check carries grounds, a source and an example; met checks carry none", () => {
  for (const r of results()) {
    assert.equal(r.status, "missing", r.id);
    assert.ok(r.guidance?.grounds && r.guidance.source && r.guidance.example, r.id);
  }
  const met = evaluate(issue({ body: "## Goal\nx\n## Scope\nsrc/a.ts\n## Out of Scope\nsrc/b.ts\n## Acceptance Criteria\n- [ ] a\n## Verify\nnpm test" }), DEFAULT_CHECKS);
  for (const r of met.checks) assert.equal(r.guidance, undefined, r.id);
});

test("guidance: a research figure comes with its number, source, scope, and the word 相関 (docs/adr/0008)", () => {
  const cited = results().filter((r) => /Sayagh|Ambig-SWE/.test(r.guidance!.source));
  assert.deepEqual(cited.map((r) => r.id).sort(), ["acceptance-criteria", "open-questions"]);
  for (const r of cited) {
    const g = `${r.guidance!.grounds} ${r.guidance!.source}`;
    assert.match(g, /\d/, `${r.id}: number`);
    assert.match(g, /Sayagh 2025|Ambig-SWE 2025/, `${r.id}: source`);
    assert.match(g, /Copilot の PR 3,180 件/, `${r.id}: scope`);
    assert.match(g, /相関/, `${r.id}: correlation`);
  }
});

test("guidance: verification borrows no number, since the source has none", () => {
  const v = results().find((r) => r.id === "verification")!;
  assert.doesNotMatch(`${v.guidance!.grounds} ${v.guidance!.source}`, /[\d%]/);
});

test("guidance: in the view each decision opens to its grounds, which appear nowhere else", () => {
  const e = evaluate(issue({ body: "Please fix the login.", labels: ["question"] }), DEFAULT_CHECKS);
  const html = renderEvaluation(e);
  const blocks = [...html.matchAll(/<details class="decision">([\s\S]*?)<\/details>/g)].map((m) => m[1]);
  assert.equal(blocks.length, e.decisions.length);
  for (const [i, d] of e.decisions.entries()) assert.ok(blocks[i].startsWith(`<summary>${d}</summary>`), d);
  const outside = html.replace(/<details class="decision">[\s\S]*?<\/details>/g, "");
  for (const r of e.checks.filter((c) => c.guidance)) {
    assert.ok(!outside.includes(r.guidance!.grounds), `${r.id}: grounds only inside its <details>`);
  }
});

test("guidance: the CLI prints grounds, source and example under each decision", () => {
  const e = evaluate(issue({ body: "Please fix the login." }), DEFAULT_CHECKS);
  const out = render(e);
  for (const [i, d] of e.decisions.entries()) {
    const g = e.checks.find((c) => c.decision === d)!.guidance!;
    const at = out.indexOf(`${i + 1}. ${d}`);
    const next = e.decisions[i + 1] ? out.indexOf(`${i + 2}. `, at) : out.indexOf("詳細:");
    const block = out.slice(at, next);
    assert.match(block, new RegExp(`根拠: ${g.grounds.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    assert.ok(block.includes(`出典: ${g.source}`));
    for (const l of g.example.split("\n")) assert.ok(block.includes(l), l);
  }
});
