import { test } from "node:test";
import assert from "node:assert/strict";
import { hasContent, normalizeHeading, sections } from "../src/core/markdown.ts";

test("markdown: splits on ATX and bold-line headings", () => {
  const s = sections("intro\n## Goal\nship it\n**Scope:**\nonly a\n### Verify\nnpm test\n");
  assert.deepEqual(s.map((x) => x.heading), ["Goal", "Scope", "Verify"]);
  assert.equal(s[0].content.trim(), "ship it");
  assert.equal(s[2].content.trim(), "npm test");
});

test("markdown: a # inside a fenced block is not a heading", () => {
  const s = sections("## Verify\n```sh\n# run this\nnpm test\n```\n");
  assert.deepEqual(s.map((x) => x.heading), ["Verify"]);
});

test("markdown: template scaffolding is not content", () => {
  assert.equal(hasContent("\n<!-- describe the criteria -->\n\n"), false);
  assert.equal(hasContent("\n_No response_\n"), false);
  assert.equal(hasContent("- [ ] exits 0"), true);
});

test("markdown: headings inside HTML comments are ignored", () => {
  assert.deepEqual(sections("<!--\n## Acceptance Criteria\n-->\ntext").length, 0);
});

test("markdown: normalizeHeading ignores case and punctuation", () => {
  assert.equal(normalizeHeading("**Acceptance-Criteria:**"), "acceptance criteria");
  assert.equal(normalizeHeading("受け入れ条件（必須）"), "受け入れ条件 必須");
});
