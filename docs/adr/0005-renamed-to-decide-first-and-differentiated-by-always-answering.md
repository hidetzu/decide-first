# 0005 名前を Decide First に変え、「必ず答える」ことで whyiug/issueready と差別化する

- 日付: 2026-10-10
- 状態: 採用（owner が決定）
- 旧名: IssueReady（ADR 0001–0004 と `docs/research.md` は旧名のまま残す。CLAUDE.md §4「一括で改名しない」に従う）

## 背景

- [whyiug/issueready](https://github.com/whyiug/issueready)（MIT, v0.1.1）は、Issue 1 件を決定論的に判定するという設計がこのプロダクトと重なる。名前もほぼ同じ。
- 2026-10-10 に `npx issueready@0.1.1` を 3 件の public Issue にかけた。
  - 対象: cli/cli#14627、cli/cli#14621、hidetzu/issue-ready#1
  - 結果: 3 件とも `Specification: INDETERMINATE` / `Delegation: UNKNOWN` だった。
  - 原因: v0.1.1 は意味の判定を LLM adapter に任せていて、その adapter が同梱されていない（同ツールの `docs/cli.md`「Semantic coverage」）。

## 決めたこと

- **差別化して開発を続ける。** 合流はしない。
- **名前を Decide First に変える。** 主出力が「AI に渡す前に人間が先に決めること」であることを、名前で示す。
- **差別化の軸**
  1. **答えは必ず 3 値のどれか 1 つ。** 粗い手掛かり（見出し・task list・ラベル）でも答えを出し、必ずその根拠を示す。
  2. **主出力は「人間が決めること」の短いリスト。** 機械向けの所見リストではない。
  3. **URL を貼るだけで使える。** 設定も repo ポリシーも要らない。

## 受け入れた代償

- 「必ず答える」以上、**見出しのない書き方には誤判定が出る。** 例: 本文に完了条件があるのに、見出しがない。
  - whyiug/issueready はこの誤判定を避けるために UNKNOWN を返す。こちらは、誤判定を「人間が確認すれば済む問い」として出す方を選んだ。
  - ⚠ **この誤判定の頻度はまだ測っていない。** 測るまでは「誤判定は少ない」と主張しない（`.claude/rules/evidence.md`）。

## 捨てたもの

- whyiug/issueready への合流（contribute）。
- 同ツールのように、判定を 3 本（Evaluation / Specification / Delegation）並べること。
