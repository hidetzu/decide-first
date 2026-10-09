# 0001 IssueReady は Issue 1 件を判定するだけで、その Issue に対して何もしない

- 日付: 2026-10-10
- 状態: 採用

## 決めたこと

IssueReady が答えるのは「この Issue 1 件を、今 AI に渡してよいか」だけ。
判定の対象は、その Issue の title・body・labels・comments・state に限る。

## 決めなかったこと（捨てたもの）

- **repository 全体の AI readiness の判定。** Factory Agent Readiness などが既に扱っていて（[research.md §3](../research.md)）、問いが違う。
- **Issue への作用。** 実装、Coding Agent の起動、PR 作成、merge、Issue の自動書き換え、ラベル付与は、どれもしない。
  - IssueReady は agent orchestration ではなく、渡す直前の Quality Gate。作用を持てば、それ自身が判定される側に回る。
  - ⚠ GitHub Action からの `ready-for-ai` ラベル付与は将来の候補として残す。MVP ではやらない。
- private repository、OAuth、GitLab、Jira、Backlog。

## 越えてはいけない境界

`src/` から GitHub への書き込み API（POST / PATCH / PUT / DELETE）を呼ばない。
