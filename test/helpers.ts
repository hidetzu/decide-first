import type { IssueSnapshot } from "../src/core/types.ts";

export function issue(over: Partial<IssueSnapshot> = {}): IssueSnapshot {
  return { ref: { owner: "o", repo: "r", number: 1 }, url: "https://github.com/o/r/issues/1", title: "t", body: "", state: "open", labels: [], comments: [], ...over };
}
export const comment = (body: string, author = "maint") => ({ author, body, createdAt: "2026-01-01T00:00:00Z" });
