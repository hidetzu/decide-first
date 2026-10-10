// Pulls the issues an issue names as its dependencies out of its body and comments.
// ⚠ Pure: text in, references out. Fetching them is src/github/'s job (hidetzu/decide-first#18);
//   this lives in core so both sides can use it without a new layer (docs/adr/0009).
import { proseLines } from "./rules/find.ts";
import type { IssueRef, IssueSnapshot } from "./types.ts";

// `blocked by`, `depends on` (optionally followed by a colon), or `依存:`. Case-insensitive.
const KEYWORD = /\b(?:blocked by|depends on)\b\s*[:：]?|依存\s*[:：]/gi;
// One reference, anchored at the current position. ⚠ Only /issues/ URLs: a pull request is not
// treated as a dependency (Out of Scope on hidetzu/decide-first#4).
const REF = [
  /^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/issues\/(\d+)\b/,
  /^([\w.-]+)\/([\w.-]+)#(\d+)\b/,
  /^#(\d+)\b/,
];
const SEPARATOR = /^[\s,、]+/;

/** The references after one keyword: as many as follow, separated by `,` `、` or spaces. */
function refsAfter(rest: string, self: IssueRef): IssueRef[] {
  const out: IssueRef[] = [];
  for (;;) {
    rest = rest.replace(SEPARATOR, "");
    const m = REF.map((re) => re.exec(rest)).find((x) => x);
    if (!m) return out;
    out.push(m.length === 2
      ? { owner: self.owner, repo: self.repo, number: Number(m[1]) }
      : { owner: m[1], repo: m[2], number: Number(m[3]) });
    rest = rest.slice(m[0].length);
  }
}

/** Every dependency named in the body, then in the comments, in order, once each, never itself. */
export function extractDependencies(issue: IssueSnapshot): IssueRef[] {
  const key = (r: IssueRef) => `${r.owner}/${r.repo}#${r.number}`.toLowerCase();
  const seen = new Set([key(issue.ref)]);
  const out: IssueRef[] = [];
  for (const text of [issue.body, ...issue.comments.map((c) => c.body)]) {
    for (const line of proseLines(text)) {
      for (const k of line.matchAll(KEYWORD)) {
        for (const r of refsAfter(line.slice(k.index + k[0].length), issue.ref)) {
          if (!seen.has(key(r))) {
            seen.add(key(r));
            out.push(r);
          }
        }
      }
    }
  }
  return out;
}
