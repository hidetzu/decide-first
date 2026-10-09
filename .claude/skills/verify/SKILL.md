---
name: verify
description: What to actually run to verify a change in issue-ready, tier by tier. Use before a PR, and whenever a change needs PASS / FAIL / NOT-VERIFIED.
---

# Verify — issue-ready

⚠ **The contract is [`rules/verification.md`](../../rules/verification.md).** This file names the commands.

| Tier | Entry point | What it sees | ⚠ What it cannot show |
|---|---|---|---|
| **Fast / inner** (no network) | `npm run check` (= `tsc --noEmit` + `node --test "test/**/*.test.ts"`) | Pure rules against fixtures; the GitHub client against a stubbed `fetch`; the HTTP server on an ephemeral port against a stubbed GitHub; static boundaries | ⚠ **Whether the real GitHub API still returns that shape** |
| **Final gate** | `node .claude/tools/docs-check.mjs` and the fast tier, on the branch to be PR'd | Docs consistency (links, no count in SPEC, telemetry ignore line) | ⚠ Rendering in a browser |
| **External** (⚠ GitHub's real API, read-only GET) | `node src/cli.ts <public issue URL>` (exit 0 READY / 1 not READY / 2 could not judge) | That fetch → evaluate → render works against something we did not write | ⚠ **Not evidence about our code when GitHub rate-limits or is down** — that is an external FAIL |

## Running in part

```bash
node --test --test-name-pattern="acceptance-criteria" "test/**/*.test.ts"   # one case family
node --test test/rules.test.ts                                              # one file
node .claude/tools/docs-check.mjs --only=links
```

⚠ **Counting without running:** `grep -ho '^test("[^"]*' test/*.test.ts | sort` names every case and loads nothing.
⚠ **The runner announces the count** (`ℹ tests N`). Copy it from there and never write it down.

## ⚠ Notes

- The external tier makes unauthenticated GETs (60/h per IP). Set `GITHUB_TOKEN` to raise the limit; ⚠ it never widens what is read.
- ⚠ **The external tier never writes**: `src/` has no write method (`boundary:` case, `docs/adr/0001`).
- ⚠ **UI rendering is not asserted by any case.** When `src/web/index.html` changes, start it
  (`npm start`) and look; ⚠ report it as NOT-VERIFIED otherwise.
