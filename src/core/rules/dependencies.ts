import type { Check, Dependency, DependencyOutcome, Guidance } from "../types.ts";

// Grounds: a dependency that is not finished means the work can be started and not finished
// (docs/adr/0009). ⚠ Only a dependency closed as completed resolves it; anything we could not
// read is reported as such and never taken as done (rules/evidence.md).

// Decision and guidance settled by the owner on hidetzu/decide-first#18 (docs/adr/0009).
// ⚠ Do not reword here.
const GUIDANCE: Guidance = {
  grounds: "依存が終わっていない Issue は、始められても終えられません。",
  source: "Decide First の判定基準（研究の数値ではない）",
  example: "## Dependencies\n- Depends on <owner>/<repo>#<番号>",
};

// What each outcome means, in words a person reads. ⚠ Each one distinct: the next move differs
// (wait, retry later, check access, or give up), so they are never folded together.
const SAYS: Record<Exclude<DependencyOutcome, "completed" | "not_checked">, string> = {
  open: "まだ open",
  closed_not_completed: "閉じているが、完了ではない",
  not_found: "取得できなかった（存在しないか、private repository）",
  rate_limited: "GitHub API の利用上限で確認できなかった",
  unreachable: "GitHub API に接続できず確認できなかった",
  unexpected_status: "GitHub API の想定外の応答で確認できなかった",
  is_pull_request: "Pull Request で、依存 Issue として確認できない",
};

const name = (d: Dependency) => `${d.ref.owner}/${d.ref.repo}#${d.ref.number}`;

export const dependencies: Check = {
  id: "dependencies",
  label: "Dependencies",
  kind: "blocking",
  run(issue) {
    const base = { id: this.id, label: this.label, kind: this.kind, source: "rule" as const };
    const deps = issue.dependencies;
    if (deps.length === 0) {
      return { ...base, status: "met", evidence: "依存の記述（blocked by / depends on / 依存:）は見つかりませんでした" };
    }
    const unresolved = deps.filter((d) => d.outcome !== "completed");
    if (unresolved.length === 0) {
      return { ...base, status: "met", evidence: `依存 ${deps.map(name).join("、")} はすべて完了しています` };
    }
    const unchecked = deps.filter((d) => d.outcome === "not_checked").length;
    const said = unresolved.filter((d) => d.outcome !== "not_checked").map((d) => `${name(d)}（${SAYS[d.outcome as keyof typeof SAYS]}）`);
    const limit = unchecked > 0 ? `依存 ${deps.length} 件中 ${deps.length - unchecked} 件だけ確認しました` : "";
    return {
      ...base,
      status: "missing",
      evidence: [said.length ? `終わっていない依存: ${said.join("、")}` : "", limit].filter(Boolean).join("。"),
      decision: `依存している ${unresolved.map(name).join("、")} の完了を待つか、依存を外すか`,
      guidance: GUIDANCE,
    };
  },
};
