# Decide First

**この GitHub Issue を AI Coding Agent へ渡して大丈夫か？** — その 1 つの問いにだけ答え、
渡す前に **人間が先に決めること** を示します。

```text
cli/cli#14627  `gh` fails with obscure errors when access token misses some permissionts

🟡 NEEDS CLARIFICATION

AIに渡す前に、人間が1つ決める必要があります。

1. ラベル「needs-triage」が示す未決事項への結論
```

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
| Acceptance criteria | 中身のある「Acceptance Criteria / Expected behavior / 受け入れ条件 …」見出し、または task list（`- [ ]`） |
| Verification | 中身のある「Verify / How to test / 確認方法 / 再現手順 …」見出し |
| No open decisions | `question` / `needs-info` 等のラベル、または TBD / 未定 等の記述 |

本文とコメントの両方を見ます。旧名は IssueReady です（[docs/adr/0005](docs/adr/0005-renamed-to-decide-first-and-differentiated-by-always-answering.md)）。主張してよい範囲は [docs/SPEC.md](docs/SPEC.md)、今後の check は [docs/design.md](docs/design.md)、調査は [docs/research.md](docs/research.md) にあります。

## 開発

- 進め方は [CLAUDE.md](CLAUDE.md) と [.claude/rules/](.claude/rules/README.md)。[hidetzu/claude-dev-template](https://github.com/hidetzu/claude-dev-template) を元にしています。
- 検証は `npm run check` と `node .claude/tools/docs-check.mjs`（[verify](.claude/skills/verify/SKILL.md)）。
