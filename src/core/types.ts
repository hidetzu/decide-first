// The shapes every layer agrees on. ⚠ Nothing in src/core may import from src/github or src/web:
// the core judges a snapshot it is handed and never fetches one (docs/adr/0003).

export interface IssueRef {
  owner: string;
  repo: string;
  number: number;
}

export interface IssueComment {
  author: string;
  body: string;
  createdAt: string;
}

/** What the core is allowed to see. ⚠ Only what the GitHub API returned for this one issue. */
export interface IssueSnapshot {
  ref: IssueRef;
  url: string;
  title: string;
  body: string;
  state: "open" | "closed";
  labels: string[];
  comments: IssueComment[];
}

export type CheckStatus = "met" | "missing";

/**
 * What a missing result means for the verdict (docs/design.md §2).
 * blocking: a human can answer it, then hand the issue over -> NEEDS_CLARIFICATION.
 * structural: answering is not enough; the issue itself has to be reopened or rewritten -> NOT_READY.
 */
export type CheckKind = "blocking" | "structural";

export interface CheckResult {
  id: string;
  /** Short name shown in the detail list, e.g. "Acceptance criteria". */
  label: string;
  kind: CheckKind;
  status: CheckStatus;
  /** Where it was found, or what was looked for and not found. ⚠ Always set: it is the "why". */
  evidence: string;
  /** What a human has to decide when this is missing. Unset when met. */
  decision?: string;
  /** Which kind of evaluator produced it. Only "rule" exists today (docs/adr/0002). */
  source: "rule" | "semantic";
}

export type Verdict = "READY" | "NEEDS_CLARIFICATION" | "NOT_READY";

export interface Evaluation {
  issue: IssueRef;
  title: string;
  verdict: Verdict;
  checks: CheckResult[];
  /**
   * The decisions left to a human, in check order. Empty exactly when verdict is READY.
   * ⚠ For NOT_READY, only the structural ones: asking for acceptance criteria on a closed issue is
   *   noise (owner decision, docs/adr/0006).
   */
  decisions: string[];
}

/** One deterministic rule. ⚠ Pure: same snapshot in, same result out, no I/O. */
export interface Check {
  id: string;
  label: string;
  kind: CheckKind;
  run(issue: IssueSnapshot): CheckResult;
}
