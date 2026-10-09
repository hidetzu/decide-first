import type { Check } from "../types.ts";
import { findSection, firstLine } from "./find.ts";

// Grounds: GitHub Copilot coding agent docs ask for "complete acceptance criteria";
// Sayagh (arXiv:2512.21426) "expected and edge behaviors" (docs/research.md).
const NAMES = ["acceptance criteria", "acceptance", "done when", "definition of done", "expected behavior", "expected behaviour", "expected vs actual", "expected and actual", "expected result", "受け入れ条件", "受入条件", "完了条件", "期待する動作", "期待される動作", "期待結果"];
// A GitHub task list item: `- [ ] ...` / `* [x] ...`.
const TASK = /^\s*[-*+]\s+\[[ xX]\]\s+\S/;

export const acceptanceCriteria: Check = {
  id: "acceptance-criteria",
  label: "Acceptance criteria",
  run(issue) {
    const base = { id: this.id, label: this.label, source: "rule" as const };
    const sec = findSection(issue, NAMES);
    if (sec) return { ...base, status: "met", evidence: `${sec.where}の見出し「${sec.heading}」` };
    const task = firstLine(issue, TASK);
    if (task) return { ...base, status: "met", evidence: `${task.where}のチェックリスト「${task.line}」` };
    return {
      ...base,
      status: "missing",
      evidence: "「Acceptance Criteria」「受け入れ条件」「Expected behavior」等の見出しも、チェックリスト（- [ ]）も見つかりませんでした",
      decision: "完了と判断する条件（何がどうなっていれば完了か）",
    };
  },
};
