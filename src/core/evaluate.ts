import type { Check, Evaluation, IssueSnapshot, Verdict } from "./types.ts";

/**
 * Runs every check and derives the verdict from their results alone.
 * ⚠ The verdict is a function of which checks are missing — never a score, never a threshold
 *   (docs/adr/0002). That is what makes "why this verdict" answerable by pointing at checks.
 */
export function evaluate(issue: IssueSnapshot, checks: readonly Check[]): Evaluation {
  const results = checks.map((c) => c.run(issue));
  const decisions = results.flatMap((r) => (r.status === "missing" && r.decision ? [r.decision] : []));
  // ⚠ NOT_READY is part of the vocabulary but no check produces it yet (docs/SPEC.md §2).
  const verdict: Verdict = results.some((r) => r.status === "missing") ? "NEEDS_CLARIFICATION" : "READY";
  return { issue: issue.ref, title: issue.title, verdict, checks: results, decisions };
}
