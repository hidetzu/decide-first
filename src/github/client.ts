// Fetches the minimum the core needs for one public issue: title, body, state, labels, comments.
// ⚠ Unauthenticated by default (docs/SPEC.md §2: no OAuth). GITHUB_TOKEN, when set, only raises
// the rate limit; it never widens what is read.

import type { IssueRef, IssueSnapshot } from "../core/types.ts";

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

interface ApiIssue {
  title: string;
  body: string | null;
  state: string;
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
    "user-agent": "issue-ready",
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

  return {
    ok: true,
    issue: {
      ref,
      url: issue.html_url,
      title: issue.title,
      body: issue.body ?? "",
      state: issue.state === "closed" ? "closed" : "open",
      labels: issue.labels.map((l) => (typeof l === "string" ? l : (l.name ?? ""))).filter(Boolean),
      comments,
    },
  };
}
