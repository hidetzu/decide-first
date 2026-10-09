# issue-ready — how we work

This file holds **how to work**.
**What may be claimed** goes in `docs/SPEC.md`; **why a decision was made** goes in `docs/adr/`.
⚠ **How to write code** (the language, the layer split, testing priorities, forbidden git
operations) lives in `.claude/rules/`.

⚠ **Never duplicate.** ⚠ **Written in two places, one of them goes stale.**
When the spec changes, fix the spec. Do not restate it here.

Before starting work, read `.claude/rules/README.md`.

⚠ **`⚠` marks "it hurts if you step on it".** ⚠ It is not decoration.

---

## 0. What this repository is

IssueReady takes **one public GitHub issue URL** and answers one question:
**can this issue be handed to an AI coding agent right now?** — `READY` / `NEEDS CLARIFICATION` /
`NOT READY`, ⚠ **with the short list of what a human still has to decide.**
⚠ **It is a quality gate in front of an agent, not an agent.** It never implements, never opens a PR,
never rewrites the issue, and never judges a whole repository (`docs/SPEC.md` §2, `docs/adr/0001`).
⚠ **How it is built is also a subject:** this repository's own issues are written so that IssueReady
itself would call them `READY`.

---

## 1. The first principle

⚠ **An explainable verdict before a clever one.** Every verdict must be traceable to named checks,
each pointing at the line it found or naming what it looked for (`docs/adr/0002`).

⚠ **Whatever it says, it never outranks the evidence rules.**
⚠ **Those are [`.claude/rules/evidence.md`](.claude/rules/evidence.md), and they hold everywhere** —
in the code, in the tests, and in every report.

⚠ **Never restate them here.** ⚠ **They are the one thing this template does not let a project
re-word**, because re-wording them is how they get softened.

---

## 2. Verification

⚠ **The contract is [`.claude/rules/verification.md`](.claude/rules/verification.md).**
⚠ **What to actually run is `.claude/skills/verify/SKILL.md`, which each project writes for itself.**
⚠ Neither belongs here (never two copies).

---

## 3. Architecture boundaries

```text
src/core/     pure: IssueSnapshot -> Evaluation. ⚠ no I/O, no imports from github/ or web/
src/github/   the only code that talks to GitHub. URL parsing and the REST client
src/app.ts    URL -> Evaluation or a sentence. ⚠ the only place failure wording lives
src/web/      node:http server + one static page.  src/cli.ts: the same, as text
```

⚠ **Not without a reason in an ADR:** a runtime dependency, a web framework, a build step for the
server (Node runs the TypeScript directly), a database, an LLM call inside `src/core/`
(`docs/adr/0002` — a semantic evaluator plugs in beside the rules, never inside them).

Two clauses hold regardless of the domain:

- ⚠ **Never keep two implementations that answer the same question.**
  If one is unavoidable, cross-check them mechanically.
  ⚠ **Writing the same decision in two places is how the two silently diverge.**
- ⚠ **A layer split belongs in an ADR before it belongs in code.**

---

## 4. Words

- **Never leak internal state into what a human reads.** Not an error code, but a sentence
  that says what happened and what to do about it.
- **Name things after the concept the domain already named, not after the data structure.**
  ⚠ **Borrow the existing name exactly.** ⚠ If a name here differs, that difference is a claim —
  justify it.
- **Never rename in bulk.** Changing a term does not license a sweep through the ADRs and past
  discussions.

Names come from the owner's brief and from GitHub's own vocabulary (issue, label, comment).
⚠ **`READY` / `NEEDS CLARIFICATION` / `NOT READY` are the only verdicts** — in code
`READY` / `NEEDS_CLARIFICATION` / `NOT_READY`. ⚠ **Never a score.**
⚠ **`ready-for-ai` is already spoken for** by `.claude/rules/owner-decisions.md` (this repository's own
workflow label). ⚠ **The product never applies a label in the MVP** (`docs/SPEC.md` §2).
⚠ **Text a user reads is Japanese**, as in the brief.

### 4-1. Never open with what does not work

⚠ **This is not about hiding anything.** §1 outranks it, and **limitations are always stated**.
What changes is the **order, the subject, and the tense** — not whether it is said.

- **Say what this does first.** What it does not do comes after, with the reason
  and with what to do instead.
- **Do not use the progressive tense for a state.** "not receiving" reads as something
  happening right now on the reader's machine.
- **Never phrase our own gap as the other side's fault.** If we never implemented it,
  do not report it as "no response". ⚠ **The reader's next move depends on which it is** —
  retry, wait, or give up.
- **Do not sound stalled.** "not implemented yet" beats "unavailable": leave a reason to come back.

---

## 5. Comments

Comments carry **why this, why this value, what is being avoided**. That is an asset.
⚠ **But a stale comment misleads harder than stale code**, because it is believed.

Change code, and update the whole set:

```
implementation → test → comment → README → docs/SPEC.md
```

⚠ **When a check reads documentation or comments, strip the comments first.**
⚠ Otherwise the check picks up the very words written to describe it.

---

## 6. How to write numbers

⚠ **Owned by [`.claude/rules/evidence.md`](.claude/rules/evidence.md).** ⚠ Not here.

---

## 7. How to proceed

1. **Measure before polishing.** Before fixing anything, state what it does now, in numbers.
2. Report **observation** (measured values, captured output) and **inference** (interpretation)
   separately.
3. Never report as confirmed what was not verified.
4. Do not widen a change past its `Non-goals`. The smallest change that meets the goal is the default.

⚠ **Deciding yourself vs. asking, and `ready-for-ai`, are owned by
[`.claude/rules/owner-decisions.md`](.claude/rules/owner-decisions.md).** ⚠ Not here.

---

## 8. git

⚠ **Owned by [`.claude/rules/git.md`](.claude/rules/git.md)** — Conventional Commits, permission
for `git push` and merge, how to split commits, and what never goes into anything public.
⚠ Not here.

---

## 9. Pitfalls we have stepped on

⚠ **This table starts empty, and that is correct.**

⚠ **Nothing goes in here that did not happen in this repository.** Not an analogy from another
project, not something plausible, not something an AI expects to be true.
⚠ **A pitfall is a measurement**: it names what happened, and what to do instead.

⚠ **This is not where engineering constraints go.** A rule that holds because of the language,
because of a protocol, or because the input is hostile ⚠ **belongs in `.claude/rules/`, and binds
already.**
⚠ **Never manufacture an incident to move a constraint in here**, and
⚠ **never soften a constraint on the grounds that this table has no row for it yet.**

⚠ **When you fill a row in, also leave the test behind.** A row with no test is a note;
a row with a test is a wall.
⚠ **If the incident also produces a new rule, the rule goes to `.claude/rules/` citing this row.**
⚠ **Both records stay. Neither replaces the other.**

| What happened | What to do instead |
|---|---|
| — | — |
