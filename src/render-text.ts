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
    e.decisions.forEach((d, i) => {
      lines.push(`${i + 1}. ${d}`);
      // The web UI folds these under each decision; text has no folding, so they follow it, indented.
      const g = e.checks.find((c) => c.status === "missing" && c.decision === d)?.guidance;
      if (!g) return;
      lines.push(`   根拠: ${g.grounds}`, `   出典: ${g.source}`, "   例:", ...g.example.split("\n").map((l) => `     ${l}`));
    });
  }
  lines.push("", "詳細:");
  for (const c of e.checks) lines.push(`  ${c.status === "met" ? "✓" : "✗"} ${c.label} — ${c.evidence}`);
  return lines.join("\n");
}
