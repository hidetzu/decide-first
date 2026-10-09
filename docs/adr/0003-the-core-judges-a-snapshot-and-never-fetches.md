# 0003 core は渡された snapshot を判定するだけで、自分では取得しない

- 日付: 2026-10-10
- 状態: 採用

## 決めたこと

- `src/core/` は `IssueSnapshot -> Evaluation` の純粋関数にする。
  - I/O を持たない。`src/github/` と `src/web/` から import しない。
- GitHub との通信は `src/github/` だけが行う。
- 人間が読む失敗文言は `src/app.ts` の 1 か所に置く。

## 理由

- rule を fixture だけでテストでき、GitHub が落ちていても検証できる（`.claude/rules/verification.md`）。
- 取得元を後から増やすときも、core は変えなくてよい。将来の GitHub Action はイベント payload を使い、ローカルの草稿はファイルを使う。

## 捨てたもの

- rule が自分で API を呼ぶ構成。例: 依存 Issue の state を rule の中で取得する。
  - そうした情報が必要になったら、snapshot に載せてから渡す。
