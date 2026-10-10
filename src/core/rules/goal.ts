import type { Check, Guidance } from "../types.ts";
import { findSection } from "./find.ts";

// Grounds: GitHub Copilot coding agent docs ask first for "a clear description of the problem to
// be solved" (docs/research.md §1). ⚠ Only a heading is judged: inferring a goal from unheaded
// prose needs reading for meaning, which belongs to a semantic evaluator (docs/adr/0002).
// `goals` is listed so "Goals and non-goals" matches; "Goalkeeper" still does not.
const NAMES = ["goal", "goals", "problem", "summary", "description", "describe the bug", "feature request", "motivation", "目的", "ゴール", "概要", "問題"];

// Wording settled by the owner on hidetzu/decide-first#2 (docs/adr/0008). ⚠ Do not reword here.
// ⚠ docs/research.md has no figure for a goal itself, so none is borrowed.
const GUIDANCE: Guidance = {
  grounds: "研究の数値はありません。",
  source: "GitHub Copilot のガイドが、解く問題の明確な説明を最初に求めている",
  example: "## Goal\n<この Issue で達成すること（1 文で）>",
};

export const goal: Check = {
  id: "goal",
  label: "Goal",
  kind: "blocking",
  run(issue) {
    const base = { id: this.id, label: this.label, kind: this.kind, source: "rule" as const };
    const sec = findSection(issue, NAMES);
    if (sec) return { ...base, status: "met", evidence: `${sec.where}の見出し「${sec.heading}」` };
    return {
      ...base,
      status: "missing",
      evidence: "「Goal」「Problem」「Describe the bug」「目的」「概要」等の見出しが見つかりませんでした",
      decision: "この Issue で達成すること（1 文で）",
      guidance: GUIDANCE,
    };
  },
};
