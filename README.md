# Decide First

**この GitHub Issue を AI Coding Agent へ渡して大丈夫か？** — その 1 つの問いにだけ答え、
渡す前に **人間が先に決めること** を示します。

```text
cli/cli#14627  `gh` fails with obscure errors when access token misses some permissionts

🟡 NEEDS CLARIFICATION

AIに渡す前に、人間が2つ決める必要があります。

1. 変更してよい範囲と、触れてはいけない範囲（Out of Scope）
   根拠: 研究の数値はありません。
   出典: Devin のガイドが scope と境界を書くよう求めている
   例:
     ## Scope
     <変更してよいファイル・機能>
     ## Out of Scope
     <触れてはいけないもの>
2. ラベル「needs-triage」が示す未決事項への結論
   根拠: 曖昧さの少ない Issue は、merge 率が 8.4 ポイント高かった。質問できれば成績が最大 74% 改善した研究もある。
   出典: Sayagh 2025・Copilot の PR 3,180 件・相関 ／ Ambig-SWE 2025
   例:
     結論を書き、未決の印（ラベルや TBD）を外す
     決定: <結論>（理由: <…>）
```

（2026-10-10T03:09Z、commit `fc3a54d` で `node src/cli.ts https://github.com/cli/cli/issues/14627` を実行した出力の冒頭。Issue の中身が変われば、出力も変わります）

public repository の Issue URL を入れると、title・body・labels・comments を GitHub API から読み、
`READY` / `NEEDS CLARIFICATION` / `NOT READY` と **「渡す前に人間が決めること」** を返します。
⚠ 点数は出しません。判定はどれも、名前のついた決定論的な check と、その根拠の行までたどれます
（[docs/adr/0002](docs/adr/0002-the-verdict-is-derived-from-named-rule-checks-never-a-score.md)）。

⚠ Decide First は Agent に仕事を渡す直前の **Quality Gate** です。実装・PR 作成・Issue の書き換えはしません。
repository 全体の AI readiness も判定しません（[docs/adr/0001](docs/adr/0001-issueready-judges-one-issue-and-never-acts-on-it.md)）。

## 使い方

Node.js 22.18 以上（TypeScript をビルドせずにそのまま実行します）。

```bash
npm install          # devDependencies（typescript, @types/node）のみ
npm start            # http://127.0.0.1:3000/
node src/cli.ts https://github.com/owner/repo/issues/123   # exit 0 = READY
```

`GITHUB_TOKEN` を設定すると API の rate limit が上がります。読む範囲は変わりません。

## 現在の check

| Check | 何を見るか |
|---|---|
| Goal | 中身のある「Goal / Problem / Describe the bug / 目的 / 概要 …」見出し |
| Scope / Out of Scope | 中身のある「Scope / 対象 / 範囲 …」と「Out of Scope / Non-goals / 対象外 …」の両方の見出し |
| Acceptance criteria | 中身のある「Acceptance Criteria / Expected behavior / 受け入れ条件 …」見出し、または task list（`- [ ]`） |
| Verification | 中身のある「Verify / How to test / 確認方法 / 再現手順 …」見出し |
| No open decisions | `question` / `needs-info` 等のラベル、または TBD / 未定 等の記述 |
| Dependencies | `blocked by` / `depends on` / `依存:` で名指しされた Issue が、すべて完了で閉じているか（5 件まで確認） |
| Issue is open | Issue が closed なら 🔴 NOT READY |
| Body | 本文が空、または見出しと HTML コメントだけなら 🔴 NOT READY |

「人間が決めること」の各項目は開けて、根拠（研究の数値と出典。相関であることも示す）と書き方の雛形が出ます（[docs/adr/0008](docs/adr/0008-evidence-and-an-example-open-from-each-decision.md)）。CLI では各項目の下に出ます。

上の 6 つは本文とコメントの両方を見て、欠けていれば 🟡 NEEDS CLARIFICATION にします。Body は本文だけを見ます。旧名は IssueReady です（[docs/adr/0005](docs/adr/0005-renamed-to-decide-first-and-differentiated-by-always-answering.md)）。主張してよい範囲は [docs/SPEC.md](docs/SPEC.md)、もとになったブリーフは [docs/brief.md](docs/brief.md)、今後の check は [docs/design.md](docs/design.md)、調査は [docs/research.md](docs/research.md) にあります。

## 開発

- 進め方は [CLAUDE.md](CLAUDE.md) と [.claude/rules/](.claude/rules/README.md)。[hidetzu/claude-dev-template](https://github.com/hidetzu/claude-dev-template) を元にしています。
- 検証は `npm run check` と `node .claude/tools/docs-check.mjs`（[verify](.claude/skills/verify/SKILL.md)）。

## ライセンス

[MIT](LICENSE)
