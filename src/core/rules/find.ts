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

// A code span: a run of backticks, then the shortest text up to a run of the same length
// (CommonMark). ⚠ A lone backtick opens nothing, so `TBD with no closer is still read.
const CODE_SPAN = /(`+)(.+?)(?<!`)\1(?!`)/g;

/**
 * The line with its inline code spans blanked out. hidetzu/decide-first#21: an example quoted in
 * backticks (`depends on other/repo#3`, `… TBD …`) was read as a real dependency and a real open
 * question. ⚠ Only for findings that would be wrong to take from an example; a task list item
 * that is only code (`- [ ] \`npm test\``) still counts as a task.
 */
export function withoutInlineCode(line: string): string {
  return line.replace(CODE_SPAN, (m) => " ".repeat(m.length));
}

export function firstLine(
  issue: IssueSnapshot,
  re: RegExp,
  opts: { skipInlineCode?: boolean } = {},
): { where: string; line: string } | null {
  for (const p of places(issue)) {
    const line = proseLines(p.text).find((l) => re.test(opts.skipInlineCode ? withoutInlineCode(l) : l));
    if (line !== undefined) return { where: p.where, line: line.trim() };
  }
  return null;
}
