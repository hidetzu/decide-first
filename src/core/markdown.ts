// Splits an issue body into headed sections, deterministically.
// ⚠ Deliberately not a full markdown parser: it only has to answer "is there a non-empty section
// whose heading means X", and every answer has to be explainable by pointing at a line.

export interface Section {
  heading: string;
  /** The text under the heading, up to the next heading of any level. */
  content: string;
}

// GitHub issue forms write this into an optional field the reporter left blank.
const NO_RESPONSE = /^_no response_$/i;

/** Removes HTML comments — issue templates leave their instructions in them. */
export function stripComments(text: string): string {
  return text.replace(/<!--[\s\S]*?(?:-->|$)/g, "");
}

/** True when a section holds something a person wrote, not just template scaffolding. */
export function hasContent(content: string): boolean {
  const lines = stripComments(content)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "" && !NO_RESPONSE.test(l));
  return lines.length > 0;
}

// `## Heading`, or a line that is only bold text: `**Heading**` / `**Heading:**`.
const ATX = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/;
const BOLD_LINE = /^\s{0,3}(?:\*\*|__)(.+?)(?:\*\*|__)\s*:?\s*$/;
const FENCE = /^\s{0,3}(```|~~~)/;

export function sections(body: string): Section[] {
  const out: Section[] = [];
  let current: { heading: string; lines: string[] } | null = null;
  let inFence = false;

  for (const line of stripComments(body).split("\n")) {
    if (FENCE.test(line)) inFence = !inFence;
    // ⚠ A `#` inside a code block is a shell comment, not a heading.
    const m = inFence ? null : (ATX.exec(line) ?? BOLD_LINE.exec(line));
    if (m) {
      if (current) out.push({ heading: current.heading, content: current.lines.join("\n") });
      current = { heading: m[1].replace(/:$/, "").trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) out.push({ heading: current.heading, content: current.lines.join("\n") });
  return out;
}

/** Lowercases and drops punctuation so "Acceptance Criteria:" and "acceptance-criteria" match. */
export function normalizeHeading(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[`*_:：()（）\[\]#.\-–—/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
