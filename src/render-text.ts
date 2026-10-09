import type { Evaluation, Verdict } from "./core/types.ts";

export const VERDICT_LABEL: Record<Verdict, string> = {
  READY: "🟢 READY",
  NEEDS_CLARIFICATION: "🟡 NEEDS CLARIFICATION",
  NOT_READY: "🔴 NOT READY",
};

/** Plain-text form of the same screen the web UI shows: verdict and decisions first, detail after. */
export function render(e: Evaluation): string {
  const lines = [`${e.issue.owner}/${e.issue.repo}#${e.issue.number}  ${e.title}`, "", VERDICT_LABEL[e.verdict], ""];
  if (e.decisions.length === 0) {
    lines.push("人間が決めることは見つかりませんでした。AIへ渡せます。");
  } else {
    lines.push(`AIに渡す前に、人間が${e.decisions.length}つ決める必要があります。`, "");
    e.decisions.forEach((d, i) => lines.push(`${i + 1}. ${d}`));
  }
  lines.push("", "詳細:");
  for (const c of e.checks) lines.push(`  ${c.status === "met" ? "✓" : "✗"} ${c.label} — ${c.evidence}`);
  return lines.join("\n");
}
