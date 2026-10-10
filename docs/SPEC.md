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
| github/url | `https://github.com/owner/repo/issues/N` を受け付ける（末尾 `/`・query・fragment 可）。PR URL は「PR」として、それ以外は「Issue URL でない」として拒否する | owner の [brief](brief.md)「MVP」 | `url: accepts a plain issue URL`, `url: accepts trailing slash, fragment, query and surrounding spaces`, `url: a pull request URL is reported as a PR, not as invalid`, `url: rejects what is not a github.com issue URL` |
| github/client | 認証なしの REST API で title / body / state / labels / comments を取得する。comments は `PER_PAGE` ずつ `MAX_COMMENT_PAGES` ページまで取得し、それを超えたら判定を断る | GitHub REST API (issues, issue comments), [brief](brief.md)「MVP」 | `client: maps the API issue to a snapshot`, `client: pages through comments until a short page`, `client: declines rather than judging on a truncated thread` |
| github/client | 取得失敗を区別する: 404/410 → not_found（⚠ 存在しないとは言わない）、PR → is_pull_request、残数 0 の 403/429 → rate_limited、例外 → unreachable、その他 → unexpected_status、200 でも本文が JSON でない・途中で切れた・読む項目がない → malformed_response（例外を投げない） | `.claude/rules/evidence.md` § Outcomes | `client: 404 is not_found (not 'does not exist')`, `client: rate limit is distinguished from other 403s`, `client: a network error is unreachable, not not_found`, `client: a pull request served by the issues endpoint is refused`, `client: a malformed issue body is malformed_response, never a throw (hidetzu/decide-first#23)`, `client: a malformed comment page is malformed_response`, `client: a malformed dependency is unexpected_status, and judging goes on` |
| github/client | 本文とコメントから取り出した依存（`extractDependencies`）を、先頭 `MAX_DEPENDENCIES`（5、仮の値）件まで GET し、`state` と `state_reason` から outcome にする。取得失敗は種類を区別し、解消とはみなさない。超えた分は取得せず `not_checked`。依存がなければ追加の GET はしない | `docs/adr/0009`, GitHub REST API (issues) | `client: a dependency's state and state_reason become its outcome`, `client: each way a dependency fails to load is told apart, never taken as done`, `client: no dependency named means no request beyond the issue`, `client: at most MAX_DEPENDENCIES are fetched; the rest are not_checked` |
| core/evaluate | 判定は check の missing の有無と種類だけで決まる。structural が missing → NOT_READY、そうでなく blocking が missing → NEEDS_CLARIFICATION、なし → READY。decisions が空 ⇔ READY。NOT_READY の decisions は structural のものだけ。同じ入力から同じ出力 | `docs/adr/0002`, `docs/adr/0006` | `evaluate: all checks met -> READY with no decisions`, `evaluate: any missing -> NEEDS_CLARIFICATION, one decision per missing check, in order`, `evaluate: decisions is empty exactly when the verdict is READY`, `evaluate: deterministic — the same snapshot gives the same evaluation`, `evaluate: NOT_READY lists the structural decisions only (docs/adr/0006)` |
| core/dependencies | 本文とコメント（コードブロック・HTML コメント・インラインコードの外）から、`blocked by` / `depends on` / `依存:` のあとに並ぶ参照（`#N` は同じ repository、`owner/repo#N`、`/issues/N` の URL）を、最初に出てきた順に 1 回ずつ取り出す。Issue 自身と `/pull/N` は除く。github/client が取りに行く先を決めるのに使う | `docs/adr/0009` | `dependencies: a bare #N is in the same repository`, `dependencies: owner/repo#N names another repository`, `dependencies: 依存: with an issue URL`, `dependencies: a list after one keyword is read in order`, `dependencies: inside a code block or an HTML comment is not a dependency`, `dependencies: a comment can name one`, `dependencies: each once, in first-seen order, and never the issue itself`, `dependencies: none named gives an empty list`, `dependencies: a pull request URL is not a dependency`, `dependencies: an example in inline code is not a dependency (hidetzu/decide-first#21)`, `dependencies: outside inline code still counts, even on a line that has some` |
| core/rules | Goal: 本文またはコメントに、中身のある Goal / Problem / Summary / Description / Describe the bug / Feature request / Motivation / 目的 / ゴール / 概要 / 問題 の見出し（`Goals …` を含む前方一致）がある。missing のとき decision と guidance（数値なし）を持つ | `docs/design.md` §2, `docs/research.md` §1 (Copilot docs) | `goal: met by a non-empty Goal heading, and the evidence names it`, `goal: met by an issue-form heading such as Describe the bug`, `goal: an empty Goal heading is missing, with a decision and the owner's guidance`, `goal: found in a comment, and the evidence names the comment`, `goal: Goals and non-goals counts, Goalkeeper does not` |
| core/rules | Scope / Out of Scope: 中身のある Scope 系（Scope / In scope / 対象 / 範囲）と Out of Scope 系（Out of scope / Non-goals / Not in scope / 対象外 / やらないこと）の見出しが、本文またはコメントに両方ある。片方なら欠けた側を、両方ないなら両方を 1 つの decision で名指しする。guidance は数値なし | `docs/design.md` §2, `docs/research.md` §1 (Devin docs) | `scope: met when both Scope and Out of Scope have content, and the evidence names both`, `scope: Scope alone is missing, and the decision names the Out of Scope side`, `scope: Out of Scope alone is missing, and the decision names the side that may change`, `scope: neither is still one decision, naming both`, `scope: Non-goals counts as Out of Scope`, `scope: an Out of Scope heading is not taken for the Scope side`, `scope: a missing result carries the owner's guidance, with no number` |
| core/rules | Dependencies: 名指しされた依存がない、またはすべて完了（`state_reason: completed`）で閉じていれば met。open・完了以外で閉じた・取得できなかった（404 / rate limit / 接続不可 / 想定外の応答 / PR）・上限を超えて確認しなかった依存があれば missing。取得できなかった理由はそれぞれ違う言葉で evidence に書く。decision は終わっていない依存を「、」で並べた 1 つ | `docs/adr/0009` | `dependencies: an open dependency is missing, named in the evidence and the decision`, `dependencies: met when none are named, or all are closed as completed`, `dependencies: closed but not as completed does not resolve it (docs/adr/0009)`, `dependencies: each way of failing to read one is missing, and says something different`, `dependencies: two unresolved are one decision listing both`, `dependencies: beyond the limit is unresolved, and the evidence says how many were checked`, `dependencies: a missing result carries the owner's guidance` |
| core/rules | Acceptance criteria: 本文またはコメントに、中身のある該当見出し、またはコードブロック外の task list がある（インラインコードだけの項目も数える） | `docs/design.md` §2, `docs/research.md` §1 (Copilot docs) | `acceptance-criteria: met by a non-empty heading, in English or Japanese`, `acceptance-criteria: met by a task list, and the evidence quotes it`, `acceptance-criteria: an empty template heading is missing, with a decision`, `acceptance-criteria: a task list inside a code block does not count`, `acceptance-criteria: found in a comment, and the evidence names the comment`, `acceptance-criteria: a task list item that is only inline code still counts` |
| core/rules | Verification: 中身のある確認方法・テスト・再現手順の見出しがある | `docs/design.md` §2 | `verification: met by Verify / How to test / 確認方法 / Steps to reproduce`, `verification: a heading that merely starts with the same letters does not count` |
| core/rules | No open decisions: 未決を示すラベル、またはコード・HTML コメント・インラインコード外の TBD / TBC / 未定 / 要検討 / 要確認 / 要相談 があれば missing | `docs/design.md` §2, `docs/research.md` §2 (Ambig-SWE) | `open-questions: a question-type label is an open decision`, `open-questions: TBD / 未定 in prose is an open decision, quoted in the decision`, `open-questions: markers inside code or HTML comments are not findings`, `open-questions: TBD inside inline code is an example, not an open decision (hidetzu/decide-first#21)`, `open-questions: TBD outside inline code still counts, even on a line that has some` |
| core/rules | Issue is open（structural）: state が closed なら missing で、evidence に closed とある | `docs/design.md` §2 | `evaluate: a closed issue is NOT_READY, and issue-open says closed` |
| core/rules | Body（structural）: 本文（コメントは見ない）が空、または見出し・HTML コメント・`_No response_` だけなら missing。コードブロックは書かれた内容として数える。met の evidence は最初の行を引用する | `docs/design.md` §2 | `evaluate: an empty body or a template with nothing filled in is NOT_READY`, `evaluate: a code block alone counts as a written body`, `evaluate: an ordinary open issue with a body is not NOT_READY, and structural checks quote what they found` |
| app / web | URL から評価または失敗の文章を返す。`GET /` はページ、`GET /view.js` は描画モジュール（text/javascript）、`GET /api/evaluate?url=` は JSON（成功 200 / 失敗 422 / 想定外の例外 500。どれでもプロセスは落ちない）。CLI も同じ文を返し、スタックトレースを出さない（exit 2） | `docs/adr/0003`, `docs/adr/0004` | `app: a URL becomes an evaluation`, `app: failures become a sentence, and 404 never claims non-existence alone`, `server: GET / serves the page, /view.js its view module; /api/evaluate returns the JSON verdict`, `app: a malformed answer from GitHub becomes the owner's sentence (hidetzu/decide-first#23)`, `server: a malformed answer or an unforeseen throw is JSON, and the process keeps serving (hidetzu/decide-first#23)`, `cli: a malformed answer is one line on stderr, no stack trace, exit 2 (hidetzu/decide-first#23)`, `cli: no argument prints the usage and exits 2` |
| web/view | 結果カードの HTML を返す純粋関数。最初の画面（`<details>` より前）には判定と decision だけを出し、check の label と evidence はすべて `<details>` の中に出す。READY では decision の一覧を出さない。Issue から来た文字列はすべてエスケープする | `docs/adr/0004` | `view: the first screen shows the verdict and the decisions, and no check (docs/adr/0004)`, `view: every check label and evidence is inside 詳細を見る`, `view: READY has no decision list on the first screen`, `view: text quoted from the issue is escaped (the issue is hostile input)` |
| core/rules + web/view + CLI | missing の check は、根拠（grounds）・出典（source）・書き方の雛形（example）を持つ。met の check は持たない。研究の数値を添える根拠には、数値・出典・対象の範囲・「相関」を含める。出典に数値がない check（Verification）は数字を含まない。画面では各 decision を `<details class="decision">` にし、根拠はその中にだけ出す。CLI では各 decision の下に出す。文言は owner が決めたもの（hidetzu/decide-first#12） | `docs/adr/0008`, `docs/research.md` §2 | `guidance: every missing check carries grounds, a source and an example; met checks carry none`, `guidance: a research figure comes with its number, source, scope, and the word 相関 (docs/adr/0008)`, `guidance: verification borrows no number, since the source has none`, `guidance: in the view each decision opens to its grounds, which appear nowhere else`, `guidance: the CLI prints grounds, source and example under each decision` |
| boundaries | core は github/ と web/ を import しない。src/ は書き込み HTTP method を使わない | `docs/adr/0001`, `docs/adr/0003` | `boundary: src/core imports nothing from github/ or web/ (docs/adr/0003)`, `boundary: nothing in src/ uses a write HTTP method (docs/adr/0001)` |

⚠ **assert しているのは `view.js` が返す HTML まで。** ブラウザでの見た目（CSS、幅、テーマ）を assert する case はない。

## 2. What this deliberately does not implement

⚠ **A gap named here is a decision.** ⚠ **An unnamed gap is just something not done yet** —
they are different things and the difference is stated, not implied.

| Not implemented | Deliberate? | Why |
|---|---|---|
| repository 全体の AI readiness | yes | `docs/adr/0001` |
| 自動実装・Agent 起動・PR 作成・merge・Issue の書き換え・ラベル付与 | yes | `docs/adr/0001` |
| private repository、OAuth、GitLab、Jira、Backlog | yes | [brief](brief.md)「MVPでやらないこと」 |
| Pull Request の判定 | yes | 対象は Issue のみ |
| 点数 | yes | `docs/adr/0002` |
| 大きすぎる Issue・sensitive な Issue を NOT_READY にする check | no | `docs/design.md` §2 の「後」 |
| 語への言及と、本当の未決・依存の区別（例: 「「TBD」などの未決の印」と書いただけで未決と判定する） | no | 文字の並びだけでは区別できない。インラインコードの中は読まない（hidetzu/decide-first#21）が、かぎ括弧などで言及した語は拾う。2026-10-10 に hidetzu/decide-first#21 自身で観測した。扱いは owner が別途決める |
| semantic evaluator（LLM） | no | 将来。`docs/adr/0002` |

## 3. Measured numbers

⚠ **Every number here carries the denominator of its claim, the date, and the conditions**
([`evidence.md`](../.claude/rules/evidence.md)): the versions that matter, how the environment was
built, how many runs, which percentile.

⚠ **A number without those is deleted, not corrected.**

まだ測った数値はない。
