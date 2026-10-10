import type { Check } from "../types.ts";
import { firstLine } from "./find.ts";

// Grounds: Ambig-SWE (arXiv:2502.13069) — agents rarely ask when a spec is underspecified;
// Sayagh (arXiv:2512.21426) "ambiguity avoidance". A marker someone left on purpose is the one
// kind of open question that can be found without reading for meaning (docs/research.md).
const LABELS = ["question", "needs-info", "needs info", "needs-design", "needs design", "needs-decision", "discussion", "needs-triage", "needs triage", "rfc"];
const MARKER = /\bTBD\b|\bTBC\b|未定|要検討|要確認|要相談/;

export const openQuestions: Check = {
  id: "open-questions",
  label: "No open decisions",
  kind: "blocking",
  run(issue) {
    const base = { id: this.id, label: this.label, kind: this.kind, source: "rule" as const };
    const label = issue.labels.find((l) => LABELS.includes(l.toLowerCase()));
    if (label) {
      return { ...base, status: "missing", evidence: `ラベル「${label}」が付いています`, decision: `ラベル「${label}」が示す未決事項への結論` };
    }
    const hit = firstLine(issue, MARKER);
    if (hit) {
      return { ...base, status: "missing", evidence: `${hit.where}に「${hit.line}」`, decision: `未決のまま残っている点: 「${hit.line.slice(0, 80)}」` };
    }
    return { ...base, status: "met", evidence: "未決を示すラベル（question / needs-info 等）も、TBD・未定 等の記述も見つかりませんでした" };
  },
};
