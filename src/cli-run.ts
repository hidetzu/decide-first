// The CLI without the process around it, so it can be tested with a stubbed GitHub.
// ⚠ src/cli.ts only wires this to argv, stdout/stderr and the exit code.
import { assess, UNREADABLE } from "./app.ts";
import type { ClientOptions } from "./github/client.ts";
import { render } from "./render-text.ts";

export interface CliResult {
  /** 0 READY, 1 not READY, 2 could not judge. */
  code: 0 | 1 | 2;
  out: string;
  err: string;
}

export async function runCli(url: string | undefined, opts: ClientOptions = {}): Promise<CliResult> {
  if (!url) return { code: 2, out: "", err: "使い方: node src/cli.ts https://github.com/owner/repo/issues/123" };
  try {
    const result = await assess(url, opts);
    if (!result.ok) return { code: 2, out: "", err: result.message };
    return { code: result.evaluation.verdict === "READY" ? 0 : 1, out: render(result.evaluation), err: "" };
  } catch {
    // ⚠ Never a stack trace at a person (CLAUDE.md §4, hidetzu/decide-first#23).
    return { code: 2, out: "", err: UNREADABLE };
  }
}
