# 0006 NOT READY のときは structural な check の decision だけを出す

- 日付: 2026-10-10
- 状態: 採用（owner が決定。hidetzu/decide-first#1 の計画への回答）

## 背景

- hidetzu/decide-first#1 で、check に `blocking` / `structural` の種別を足した。structural な check（Issue is open、Body）が 1 つでも missing なら NOT READY になる。
- このとき、blocking な check も同時に missing になることが多い。たとえば closed の Issue に、Acceptance criteria や Verification がないことがある。

## 決めたこと

- **NOT READY のとき、「人間が決めること」には structural な check の decision だけを出す。**
- NEEDS CLARIFICATION のときは、今までどおり missing な check の decision をすべて出す。
- check の一覧（「詳細を見る」の中）には、種別に関係なく全部の check を出す。

## 捨てたもの

- **missing な check の decision をすべて出すこと。**
  - NOT READY は「答えを足しても渡せない」という意味である（`docs/design.md` §2）。
  - それなのに closed の Issue に「完了条件を決めて」と出すと、答えれば渡せるように読めてしまう。
