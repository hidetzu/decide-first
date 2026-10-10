import type { Check, Guidance } from "../types.ts";
import { findSection } from "./find.ts";

// Grounds: Devin's guide asks for the scope and its boundaries (docs/research.md §1). An agent can
// often infer where to change from the goal and the code, but not what it must leave alone: that
// is a human's preference, so both halves are required.
// ⚠ Names are matched after normalizeHeading, so "Out of Scope" never matches "scope" (it does not
//   start with it) and "Non-goals" arrives as "non goals".
const IN = ["scope", "in scope", "対象", "範囲"];
const OUT = ["out of scope", "non goals", "not in scope", "対象外", "やらないこと"];

// Decisions and guidance settled by the owner on hidetzu/decide-first#3 (docs/adr/0008).
// ⚠ Do not reword here. ⚠ When both halves are missing it is still one decision, naming both:
//   one missing check is one decision, so "人間が N つ決める" keeps counting checks.
const DECISION = {
  in: "変更してよい範囲",
  out: "触れてはいけない範囲（Out of Scope）",
  both: "変更してよい範囲と、触れてはいけない範囲（Out of Scope）",
};
const GUIDANCE: Guidance = {
  grounds: "研究の数値はありません。",
  source: "Devin のガイドが scope と境界を書くよう求めている",
  example: "## Scope\n<変更してよいファイル・機能>\n## Out of Scope\n<触れてはいけないもの>",
};
const LOOKED_FOR = {
  in: "「Scope」「In scope」「対象」「範囲」等",
  out: "「Out of Scope」「Non-goals」「対象外」「やらないこと」等",
};

export const scope: Check = {
  id: "scope",
  label: "Scope / Out of Scope",
  kind: "blocking",
  run(issue) {
    const base = { id: this.id, label: this.label, kind: this.kind, source: "rule" as const };
    const inside = findSection(issue, IN);
    const outside = findSection(issue, OUT);
    if (inside && outside) {
      return { ...base, status: "met", evidence: `${inside.where}の見出し「${inside.heading}」と、${outside.where}の見出し「${outside.heading}」` };
    }
    const which = !inside && !outside ? "both" : !inside ? "in" : "out";
    const looked = which === "both" ? `${LOOKED_FOR.in}の見出しも、${LOOKED_FOR.out}の見出しも` : `${LOOKED_FOR[which]}の見出しが`;
    return { ...base, status: "missing", evidence: `${looked}見つかりませんでした`, decision: DECISION[which], guidance: GUIDANCE };
  },
};
