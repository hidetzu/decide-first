import { firstWrittenLine } from "../markdown.ts";
import type { Check } from "../types.ts";

// Grounds: with no body there is nothing to decide about (docs/design.md §2). A template whose
// headings were never filled in is the same thing. Structural: missing -> NOT_READY.
// ⚠ Only the body is read, not comments (hidetzu/decide-first#1 Acceptance Criteria).
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
    };
  },
};
