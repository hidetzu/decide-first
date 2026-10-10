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

/**
 * What fetching one named dependency came to (docs/adr/0009). ⚠ Only `completed` resolves it:
 * a failure to read is never taken as "done" (rules/evidence.md: could not be obtained ≠ not there).
 */
export type DependencyOutcome =
  | "completed"            // closed with state_reason "completed"
  | "open"
  | "closed_not_completed" // closed as not_planned / duplicate, or with no reason recorded
  | "not_found"            // ⚠ 404: missing or private, indistinguishable
  | "rate_limited"
  | "unreachable"
  | "unexpected_status"
  | "is_pull_request"
  | "not_checked";         // beyond the fetch limit, so never asked

export interface Dependency {
  ref: IssueRef;
  outcome: DependencyOutcome;
}

/** What the core is allowed to see. ⚠ Only what the GitHub API returned for this issue and the issues it names. */
export interface IssueSnapshot {
  ref: IssueRef;
  url: string;
  title: string;
  body: string;
  state: "open" | "closed";
  labels: string[];
  comments: IssueComment[];
  /** The issues it names as dependencies, in the order named, each with what fetching it came to. */
  dependencies: Dependency[];
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
  /**
   * Why the decision matters, where that comes from, and a template to fill in (docs/adr/0008).
   * Set with the decision, unset when met. ⚠ Only figures docs/research.md records; where the
   * source has none, the grounds say so instead of borrowing a nearby one.
   */
  guidance?: Guidance;
  /** Which kind of evaluator produced it. Only "rule" exists today (docs/adr/0002). */
  source: "rule" | "semantic";
}

export interface Guidance {
  /** One short sentence a human reads first. */
  grounds: string;
  /** Source, scope and whether it is a correlation, shown as a smaller line. */
  source: string;
  /** A template with `<…>` placeholders. ⚠ Never text written for this issue (docs/adr/0001). */
  example: string;
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
