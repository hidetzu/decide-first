import { firstWrittenLine } from "../markdown.ts";
import type { Check, Guidance } from "../types.ts";

// Grounds: with no body there is nothing to decide about (docs/design.md §2). A template whose
// headings were never filled in is the same thing. Structural: missing -> NOT_READY.
// ⚠ Only the body is read, not comments (hidetzu/decide-first#1 Acceptance Criteria).
// Wording settled by the owner on hidetzu/decide-first#12 (docs/adr/0008). ⚠ Do not reword here.
const GUIDANCE: Guidance = {
  grounds: "本文のない Issue は渡す仕事として扱いません。",
  source: "Decide First の判定基準（研究の数値ではない）",
  example: "## Goal\n<この Issue で達成すること>\n## Acceptance Criteria\n- [ ] <入力・操作> のとき <観測できる結果> になる",
};

export const hasBody: Check = {
  id: "has-body",
  label: "Body",
  kind: "structural",
  run(issue) {
    const base = { id: this.id, label: this.label, kind: this.kind, source: "rule" as const };
    const line = firstWrittenLine(issue.body);
    if (line !== null) return { ...base, status: "met", evidence: `本文の「${line.slice(0, 80)}」` };
    return {
      ...base,
      status: "missing",
      evidence: issue.body.trim() === "" ? "本文が空です" : "本文には見出しと HTML コメントしかありません（書かれた内容が見つかりませんでした）",
      decision: "この Issue で何をするのか（本文に書く）",
      guidance: GUIDANCE,
    };
  },
};
