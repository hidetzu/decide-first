import type { IssueRef } from "../core/types.ts";

export type ParseResult =
  | { ok: true; ref: IssueRef }
  | { ok: false; reason: "not_an_issue_url" | "pull_request_url" };

// owner: GitHub user/org names. repo: letters, digits, '.', '-', '_'.
const ISSUE = /^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]{1,100})\/(issues|pull)\/(\d{1,10})\/?(?:[?#].*)?$/;

/** Accepts https://github.com/owner/repo/issues/123 (trailing slash, query, #fragment allowed). */
export function parseIssueUrl(input: string): ParseResult {
  const m = ISSUE.exec(input.trim());
  if (!m) return { ok: false, reason: "not_an_issue_url" };
  // ⚠ A PR is well-formed but out of scope (docs/SPEC.md §2) — say so instead of "invalid".
  if (m[3] === "pull") return { ok: false, reason: "pull_request_url" };
  const number = Number(m[4]);
  if (!Number.isSafeInteger(number) || number < 1) return { ok: false, reason: "not_an_issue_url" };
  return { ok: true, ref: { owner: m[1], repo: m[2], number } };
}
