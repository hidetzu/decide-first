// Renders an Evaluation as the result card's HTML. Pure: the page and the tests both call it.
// ⚠ Plain JS with JSDoc types so the browser can load it as is: no build step (CLAUDE.md §3),
//   and `tsc --noEmit` still checks it (checkJs). Owner decision on hidetzu/decide-first#5.
// ⚠ First screen: verdict and what a human must decide. Checks only inside <details> (docs/adr/0004).

/** @typedef {import("../core/types.ts").Evaluation} Evaluation */
/** @typedef {import("../core/types.ts").Verdict} Verdict */
/** @typedef {import("../core/types.ts").CheckResult} CheckResult */

/** @type {Record<Verdict, string>} */
const LABEL = { READY: "🟢 READY", NEEDS_CLARIFICATION: "🟡 NEEDS CLARIFICATION", NOT_READY: "🔴 NOT READY" };

/**
 * Escapes text for an HTML text node. ⚠ Titles, evidence and decisions quote the issue, which is
 * hostile input. Escapes exactly what the browser escapes when it serializes a text node, so the
 * markup is the same as the DOM-built card this replaced.
 * @param {string} s
 */
const text = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/ /g, "&nbsp;");

/**
 * One decision. With guidance it opens to show the grounds and a template; the grounds stay inside
 * that <details> so the closed first screen is still verdict and decisions only (docs/adr/0008).
 * @param {string} d
 * @param {CheckResult | undefined} c the missing check the decision came from
 */
const decision = (d, c) => {
  const g = c?.guidance;
  if (!g) return `<li>${text(d)}</li>`;
  return `<li><details class="decision"><summary>${text(d)}</summary>` +
    `<span class="grounds">根拠: ${text(g.grounds)}</span>` +
    `<span class="source">出典: ${text(g.source)}</span>` +
    `<pre class="example">${text(g.example)}</pre></details></li>`;
};

/**
 * @param {Evaluation} e
 * @returns {string}
 */
export function renderEvaluation(e) {
  const head =
    `<p class="issue">${text(`${e.issue.owner}/${e.issue.repo}#${e.issue.number}  ${e.title}`)}</p>` +
    `<p class="verdict ${e.verdict}">${LABEL[e.verdict]}</p>`;
  const decisions = e.decisions.length === 0
    ? "<p>人間が決めることは見つかりませんでした。AIへ渡せます。</p>"
    : `<p>AIに渡す前に、人間が${e.decisions.length}つ決める必要があります。</p>` +
      `<ol>${e.decisions.map((d) => decision(d, e.checks.find((c) => c.status === "missing" && c.decision === d))).join("")}</ol>`;
  const checks = e.checks.map((c) =>
    `<li><span class="mark-${c.status}">${c.status === "met" ? "✓ " : "✗ "}</span>${text(c.label)}` +
    `<span class="evidence">${text(c.evidence)}</span></li>`).join("");
  return `<div class="card">${head}${decisions}<details><summary>詳細を見る</summary><ul class="checks">${checks}</ul></details></div>`;
}
