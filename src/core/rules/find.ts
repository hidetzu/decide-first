import { hasContent, normalizeHeading, sections, stripComments } from "../markdown.ts";
import type { IssueSnapshot } from "../types.ts";

export interface Hit {
  /** Where, in words a person reads: 本文 / コメント (@user). */
  where: string;
  heading: string;
}

function places(issue: IssueSnapshot): Array<{ where: string; text: string }> {
  // ⚠ Comments count: a decision made mid-flight often exists only in a comment
  //   (.claude/rules/owner-decisions.md).
  return [
    { where: "本文", text: issue.body },
    ...issue.comments.map((c) => ({ where: `コメント (@${c.author || "unknown"})`, text: c.body })),
  ];
}

/** First non-empty section, in body then comments, whose normalized heading starts with a name. */
export function findSection(issue: IssueSnapshot, names: readonly string[]): Hit | null {
  for (const p of places(issue)) {
    for (const s of sections(p.text)) {
      const h = normalizeHeading(s.heading);
      if (names.some((n) => h === n || h.startsWith(n + " ")) && hasContent(s.content)) {
        return { where: p.where, heading: s.heading };
      }
    }
  }
  return null;
}

/** Lines outside fenced code and HTML comments, so a `TODO` in a snippet is not a finding. */
export function proseLines(text: string): string[] {
  const out: string[] = [];
  let inFence = false;
  for (const line of stripComments(text).split("\n")) {
    if (/^\s{0,3}(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (!inFence) out.push(line);
  }
  return out;
}

export function firstLine(issue: IssueSnapshot, re: RegExp): { where: string; line: string } | null {
  for (const p of places(issue)) {
    const line = proseLines(p.text).find((l) => re.test(l));
    if (line !== undefined) return { where: p.where, line: line.trim() };
  }
  return null;
}
