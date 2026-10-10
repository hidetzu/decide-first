import type { Check } from "../types.ts";
import { findSection } from "./find.ts";

// Grounds: Sayagh (arXiv:2512.21426) "validation guidance"; Devin docs "specify validation steps"
// (docs/research.md). ⚠ Only presence is judged: whether the steps are runnable is not knowable
// from the issue text alone.
const NAMES = ["verify", "verification", "how to verify", "how to test", "testing", "test plan", "tests", "steps to reproduce", "reproduction steps", "to reproduce", "確認方法", "検証", "検証方法", "テスト", "テスト方法", "再現手順"];

export const verification: Check = {
  id: "verification",
  label: "Verification",
  kind: "blocking",
  run(issue) {
    const base = { id: this.id, label: this.label, kind: this.kind, source: "rule" as const };
    const sec = findSection(issue, NAMES);
    if (sec) return { ...base, status: "met", evidence: `${sec.where}の見出し「${sec.heading}」` };
    return {
      ...base,
      status: "missing",
      evidence: "「Verify」「How to test」「確認方法」「再現手順」等の見出しが見つかりませんでした",
      decision: "完了をどう確かめるか（実行するテスト・コマンド・確認手順）",
    };
  },
};
