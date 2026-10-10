# SPEC — what may be claimed

⚠ **This file holds what this project may claim about itself.** ⚠ Nothing else.
**How to work** is [`CLAUDE.md`](../CLAUDE.md); **how to write it** is
[`.claude/rules/`](../.claude/rules/); **why** is [`adr/`](adr/).

⚠ **Never write a count in here** ([`evidence.md`](../.claude/rules/evidence.md)).
⚠ **Counts are announced by whatever produced them**, at the moment it runs.
⚠ **A count written down here is stale from the moment it is written, and it makes every
parallel change conflict.**

---

## 1. What this implements

⚠ **A row goes in here only once the behaviour exists and a check asserts it.**
⚠ **Planned is not implemented.**

⚠ **"What asserts it" names a case, not a file.** ⚠ **A file name says where to look; it does not
say that anything in there asserts this claim** — and a reader takes the column at its word.
⚠ **Run the case before filling the row in, and read whether it covers every clause of the claim.**

⚠ **Grounds: this went wrong in the project this template was extracted from.** A row named two
files as asserting a claim; ⚠ **neither did**, ⚠ **the gap had already been written down in a
completion report**, and the row was left standing anyway.
⚠ **Saying a gap in one place is not permission to claim it in another.**

⚠ **A static check can stop a row that names a file and no case, a row that names nothing, and a
case name that does not exist.** ⚠ **Nothing mechanical can stop a case that exists and does not
cover the clause** — ⚠ **reading the case is the reviewer's job, and that is the half that gets
skipped.** ⚠ **Write that check early.**

| Layer | What is supported | Which authority, which section | What asserts it |
|---|---|---|---|
| github/url | `https://github.com/owner/repo/issues/N` を受け付ける（末尾 `/`・query・fragment 可）。PR URL は「PR」として、それ以外は「Issue URL でない」として拒否する | owner の brief「MVP」 | `url: accepts a plain issue URL`, `url: accepts trailing slash, fragment, query and surrounding spaces`, `url: a pull request URL is reported as a PR, not as invalid`, `url: rejects what is not a github.com issue URL` |
| github/client | 認証なしの REST API で title / body / state / labels / comments を取得する。comments は `PER_PAGE` ずつ `MAX_COMMENT_PAGES` ページまで取得し、それを超えたら判定を断る | GitHub REST API (issues, issue comments), brief「MVP」 | `client: maps the API issue to a snapshot`, `client: pages through comments until a short page`, `client: declines rather than judging on a truncated thread` |
| github/client | 取得失敗を区別する: 404/410 → not_found（⚠ 存在しないとは言わない）、PR → is_pull_request、残数 0 の 403/429 → rate_limited、例外 → unreachable、その他 → unexpected_status | `.claude/rules/evidence.md` § Outcomes | `client: 404 is not_found (not 'does not exist')`, `client: rate limit is distinguished from other 403s`, `client: a network error is unreachable, not not_found`, `client: a pull request served by the issues endpoint is refused` |
| core/evaluate | 判定は check の missing の有無と種類だけで決まる。structural が missing → NOT_READY、そうでなく blocking が missing → NEEDS_CLARIFICATION、なし → READY。decisions が空 ⇔ READY。NOT_READY の decisions は structural のものだけ。同じ入力から同じ出力 | `docs/adr/0002`, `docs/adr/0006` | `evaluate: all checks met -> READY with no decisions`, `evaluate: any missing -> NEEDS_CLARIFICATION, one decision per missing check, in order`, `evaluate: decisions is empty exactly when the verdict is READY`, `evaluate: deterministic — the same snapshot gives the same evaluation`, `evaluate: NOT_READY lists the structural decisions only (docs/adr/0006)` |
| core/rules | Acceptance criteria: 本文またはコメントに、中身のある該当見出し、またはコードブロック外の task list がある | `docs/design.md` §2, `docs/research.md` §1 (Copilot docs) | `acceptance-criteria: met by a non-empty heading, in English or Japanese`, `acceptance-criteria: met by a task list, and the evidence quotes it`, `acceptance-criteria: an empty template heading is missing, with a decision`, `acceptance-criteria: a task list inside a code block does not count`, `acceptance-criteria: found in a comment, and the evidence names the comment` |
| core/rules | Verification: 中身のある確認方法・テスト・再現手順の見出しがある | `docs/design.md` §2 | `verification: met by Verify / How to test / 確認方法 / Steps to reproduce`, `verification: a heading that merely starts with the same letters does not count` |
| core/rules | No open decisions: 未決を示すラベル、またはコード・HTML コメント外の TBD / TBC / 未定 / 要検討 / 要確認 / 要相談 があれば missing | `docs/design.md` §2, `docs/research.md` §2 (Ambig-SWE) | `open-questions: a question-type label is an open decision`, `open-questions: TBD / 未定 in prose is an open decision, quoted in the decision`, `open-questions: markers inside code or HTML comments are not findings` |
| core/rules | Issue is open（structural）: state が closed なら missing で、evidence に closed とある | `docs/design.md` §2 | `evaluate: a closed issue is NOT_READY, and issue-open says closed` |
| core/rules | Body（structural）: 本文（コメントは見ない）が空、または見出し・HTML コメント・`_No response_` だけなら missing。コードブロックは書かれた内容として数える。met の evidence は最初の行を引用する | `docs/design.md` §2 | `evaluate: an empty body or a template with nothing filled in is NOT_READY`, `evaluate: a code block alone counts as a written body`, `evaluate: an ordinary open issue with a body is not NOT_READY, and structural checks quote what they found` |
| app / web | URL から評価または失敗の文章を返す。`GET /` はページ、`GET /api/evaluate?url=` は JSON（成功 200 / 失敗 422） | `docs/adr/0003`, `docs/adr/0004` | `app: a URL becomes an evaluation`, `app: failures become a sentence, and 404 never claims non-existence alone`, `server: GET / serves the page; /api/evaluate returns the JSON verdict` |
| boundaries | core は github/ と web/ を import しない。src/ は書き込み HTTP method を使わない | `docs/adr/0001`, `docs/adr/0003` | `boundary: src/core imports nothing from github/ or web/ (docs/adr/0003)`, `boundary: nothing in src/ uses a write HTTP method (docs/adr/0001)` |

⚠ **Web UI の表示（最初の画面は判定と decision のみ、check は `<details>` 内）を assert する case はまだない。**
⚠ **ページが `詳細を見る` を含むことだけが `server: …` で確認されている。** 描画は手動で確認した。

## 2. What this deliberately does not implement

⚠ **A gap named here is a decision.** ⚠ **An unnamed gap is just something not done yet** —
they are different things and the difference is stated, not implied.

| Not implemented | Deliberate? | Why |
|---|---|---|
| repository 全体の AI readiness | yes | `docs/adr/0001` |
| 自動実装・Agent 起動・PR 作成・merge・Issue の書き換え・ラベル付与 | yes | `docs/adr/0001` |
| private repository、OAuth、GitLab、Jira、Backlog | yes | brief「MVPでやらないこと」 |
| Pull Request の判定 | yes | 対象は Issue のみ |
| 点数 | yes | `docs/adr/0002` |
| 大きすぎる Issue・sensitive な Issue を NOT_READY にする check | no | `docs/design.md` §2 の「後」 |
| Goal / Scope / 依存 の check | no | `docs/design.md` §2 の「次」。まだ実装していない |
| semantic evaluator（LLM） | no | 将来。`docs/adr/0002` |

## 3. Measured numbers

⚠ **Every number here carries the denominator of its claim, the date, and the conditions**
([`evidence.md`](../.claude/rules/evidence.md)): the versions that matter, how the environment was
built, how many runs, which percentile.

⚠ **A number without those is deleted, not corrected.**

まだ測った数値はない。
