import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));
// ⚠ Comments stripped first, or the check finds the words written to describe it (CLAUDE.md §5).
const code = (f: string) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

test("boundary: src/core imports nothing from github/ or web/ (docs/adr/0003)", () => {
  const bad = files("src/core").filter((f) => /(?:from|import)\s*\(?\s*["'][^"']*\/(github|web)\//.test(code(f)));
  assert.deepEqual(bad, []);
});

test("boundary: nothing in src/ uses a write HTTP method (docs/adr/0001)", () => {
  const bad = files("src").filter((f) => f.endsWith(".ts") && /method\s*:\s*["'`](POST|PATCH|PUT|DELETE)/i.test(code(f)));
  assert.deepEqual(bad, []);
});
