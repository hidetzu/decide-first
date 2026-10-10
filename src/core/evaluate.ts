import type { Check, Evaluation, IssueSnapshot, Verdict } from "./types.ts";

/**
 * Runs every check and derives the verdict from their results alone:
 * a structural check missing -> NOT_READY, else a blocking one missing -> NEEDS_CLARIFICATION, else READY.
 * ⚠ The verdict is a function of which checks are missing — never a score, never a threshold
 *   (docs/adr/0002). That is what makes "why this verdict" answerable by pointing at checks.
 */
export function evaluate(issue: IssueSnapshot, checks: readonly Check[]): Evaluation {
  const results = checks.map((c) => c.run(issue));
  const missing = results.filter((r) => r.status === "missing");
  const structural = missing.filter((r) => r.kind === "structural");
  const verdict: Verdict = structural.length > 0 ? "NOT_READY" : missing.length > 0 ? "NEEDS_CLARIFICATION" : "READY";
  // ⚠ NOT_READY shows only what makes it NOT_READY: asking for acceptance criteria on a closed
  //   issue is noise (owner decision, docs/adr/0006).
  const decisions = (verdict === "NOT_READY" ? structural : missing).flatMap((r) => (r.decision ? [r.decision] : []));
  return { issue: issue.ref, title: issue.title, verdict, checks: results, decisions };
}
