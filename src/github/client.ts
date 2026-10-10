// Fetches the minimum the core needs for one public issue: title, body, state, labels, comments,
// and the state of the issues it names as dependencies.
// ⚠ Unauthenticated by default (docs/SPEC.md §2: no OAuth). GITHUB_TOKEN, when set, only raises
// the rate limit; it never widens what is read.

import { extractDependencies } from "../core/dependencies.ts";
import type { Dependency, IssueRef, IssueSnapshot } from "../core/types.ts";

export type FetchFailure =
  // ⚠ GitHub answers 404 both for "no such issue" and for "private repository".
  //   We cannot tell them apart, so neither is reported as "does not exist" (rules/evidence.md).
  | { ok: false; kind: "not_found" }
  | { ok: false; kind: "is_pull_request" }
  | { ok: false; kind: "rate_limited"; resetAt?: string }
  | { ok: false; kind: "unreachable"; detail: string }
  | { ok: false; kind: "unexpected_status"; status: number }
  | { ok: false; kind: "too_many_comments"; limit: number };

export type FetchResult = { ok: true; issue: IssueSnapshot } | FetchFailure;

export interface ClientOptions {
  fetch?: typeof fetch;
  token?: string;
  apiBase?: string;
}

export const PER_PAGE = 100;
// ⚠ A bound, so one issue cannot make us page forever. Beyond it we decline rather than judge
//   on a partial thread: a later comment may override the body (rules/owner-decisions.md).
export const MAX_COMMENT_PAGES = 10;

// ⚠ Provisional (docs/adr/0009): unauthenticated, the API allows 60 requests an hour, and how
//   many dependencies an issue usually names has not been measured. Beyond it: not_checked.
export const MAX_DEPENDENCIES = 5;

interface ApiIssue {
  title: string;
  body: string | null;
  state: string;
  state_reason?: string | null;
  html_url: string;
  labels: Array<string | { name?: string }>;
  pull_request?: unknown;
  comments: number;
}
interface ApiComment {
  user: { login: string } | null;
  body: string | null;
  created_at: string;
}

export async function fetchIssue(ref: IssueRef, opts: ClientOptions = {}): Promise<FetchResult> {
  const doFetch = opts.fetch ?? fetch;
  const base = opts.apiBase ?? "https://api.github.com";
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "decide-first",
  };
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  const path = `${base}/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}/issues/${ref.number}`;

  const get = async (url: string): Promise<Response | FetchFailure> => {
    let res: Response;
    try {
      res = await doFetch(url, { headers });
    } catch (e) {
      return { ok: false, kind: "unreachable", detail: e instanceof Error ? e.message : String(e) };
    }
    if (res.ok) return res;
    if (res.status === 404 || res.status === 410) return { ok: false, kind: "not_found" };
    if ((res.status === 403 || res.status === 429) && res.headers.get("x-ratelimit-remaining") === "0") {
      const reset = Number(res.headers.get("x-ratelimit-reset"));
      return { ok: false, kind: "rate_limited", resetAt: reset ? new Date(reset * 1000).toISOString() : undefined };
    }
    return { ok: false, kind: "unexpected_status", status: res.status };
  };

  const issueRes = await get(path);
  if (!(issueRes instanceof Response)) return issueRes;
  const issue = (await issueRes.json()) as ApiIssue;
  // ⚠ The issues endpoint also serves pull requests. A PR is out of scope (docs/SPEC.md §2).
  if (issue.pull_request) return { ok: false, kind: "is_pull_request" };

  const comments: IssueSnapshot["comments"] = [];
  if (issue.comments > 0) {
    for (let page = 1; ; page++) {
      if (page > MAX_COMMENT_PAGES) return { ok: false, kind: "too_many_comments", limit: MAX_COMMENT_PAGES * PER_PAGE };
      const res = await get(`${path}/comments?per_page=${PER_PAGE}&page=${page}`);
      if (!(res instanceof Response)) return res;
      const batch = (await res.json()) as ApiComment[];
      for (const c of batch) comments.push({ author: c.user?.login ?? "", body: c.body ?? "", createdAt: c.created_at });
      if (batch.length < PER_PAGE) break;
    }
  }

  const snapshot: IssueSnapshot = {
    ref,
    url: issue.html_url,
    title: issue.title,
    body: issue.body ?? "",
    state: issue.state === "closed" ? "closed" : "open",
    labels: issue.labels.map((l) => (typeof l === "string" ? l : (l.name ?? ""))).filter(Boolean),
    comments,
    dependencies: [],
  };
  const named = extractDependencies(snapshot);
  for (const [i, dep] of named.entries()) {
    snapshot.dependencies.push({ ref: dep, outcome: i < MAX_DEPENDENCIES ? await dependencyOutcome(dep) : "not_checked" });
  }
  return { ok: true, issue: snapshot };

  async function dependencyOutcome(dep: IssueRef): Promise<Dependency["outcome"]> {
    const res = await get(`${base}/repos/${encodeURIComponent(dep.owner)}/${encodeURIComponent(dep.repo)}/issues/${dep.number}`);
    if (!(res instanceof Response)) return res.kind === "too_many_comments" ? "unexpected_status" : res.kind;
    const d = (await res.json()) as ApiIssue;
    if (d.pull_request) return "is_pull_request";
    if (d.state !== "closed") return "open";
    // ⚠ Only "completed" resolves a dependency; not_planned, duplicate and no reason do not (docs/adr/0009).
    return d.state_reason === "completed" ? "completed" : "closed_not_completed";
  }
}
