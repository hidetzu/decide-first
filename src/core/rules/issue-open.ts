import type { Check } from "../types.ts";

// Grounds: closed work is not work to hand over (docs/design.md §2). Answering questions on it does
// not change that, so this is structural: missing -> NOT_READY.
export const issueOpen: Check = {
  id: "issue-open",
  label: "Issue is open",
  kind: "structural",
  run(issue) {
    const base = { id: this.id, label: this.label, kind: this.kind, source: "rule" as const };
    if (issue.state === "open") return { ...base, status: "met", evidence: "Issue は open です" };
    return {
      ...base,
      status: "missing",
      evidence: "Issue は closed です",
      decision: "この Issue を開き直すか、残りの作業を新しい Issue に切り出すか",
    };
  },
};
