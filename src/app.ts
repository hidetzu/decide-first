// The one path from a URL a person typed to an evaluation or a sentence saying why not.
// ⚠ Both the web server and the CLI go through here, so the words a person reads exist once
// (CLAUDE.md §4).

import { evaluate } from "./core/evaluate.ts";
import { DEFAULT_CHECKS } from "./core/rules/index.ts";
import type { Evaluation } from "./core/types.ts";
import { fetchIssue, type ClientOptions, type FetchFailure } from "./github/client.ts";
import { parseIssueUrl } from "./github/url.ts";

export type AssessResult = { ok: true; evaluation: Evaluation } | { ok: false; message: string };

export async function assess(url: string, opts: ClientOptions = {}): Promise<AssessResult> {
  const parsed = parseIssueUrl(url);
  if (!parsed.ok) {
    return {
      ok: false,
      message:
        parsed.reason === "pull_request_url"
          ? "Pull Request は対象外です。Issue の URL（https://github.com/owner/repo/issues/123）を入力してください。"
          : "GitHub Issue の URL を入力してください。例: https://github.com/owner/repo/issues/123",
    };
  }
  const fetched = await fetchIssue(parsed.ref, opts);
  if (!fetched.ok) return { ok: false, message: describeFailure(fetched) };
  return { ok: true, evaluation: evaluate(fetched.issue, DEFAULT_CHECKS) };
}

function describeFailure(f: FetchFailure): string {
  switch (f.kind) {
    case "not_found":
      // ⚠ "見つかりません" alone would claim it does not exist; a private repo answers the same.
      return "Issue を取得できませんでした。存在しないか、private repository の Issue です（private repository は現在対象外です）。";
    case "is_pull_request":
      return "この番号は Pull Request です。Pull Request は対象外です。";
    case "rate_limited":
      return `GitHub API の利用上限に達しました。${f.resetAt ? `${f.resetAt} 以降に` : "しばらくしてから"}再度お試しください。`;
    case "unreachable":
      return "GitHub API に接続できませんでした。ネットワークを確認して再度お試しください。";
    case "unexpected_status":
      return `GitHub API が想定外の応答（HTTP ${f.status}）を返しました。しばらくしてから再度お試しください。`;
    case "too_many_comments":
      return `コメントが ${f.limit} 件を超える Issue は現在対象外です。途中までのコメントで判定すると、後のコメントでの決定を見落とすためです。`;
  }
}
