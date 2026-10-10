# 0009 依存は「完了」で閉じたときだけ解消とみなし、取得できなかったものは解消とみなさない

- 日付: 2026-10-10
- 状態: 採用（owner が決定。hidetzu/decide-first#4 の判定への回答）

## 背景

- hidetzu/decide-first#4 は、Issue が名指しした依存 Issue が終わっていなければ NEEDS CLARIFICATION にする、という Issue。
- issue-ready の判定は NO（分割が必要）だった。理由は 3 つ。
  - 依存の取り出しをどの層に置くかが決まっていない
  - 依存先を取得できなかった場合の結果（outcome）を区別していない
  - 依存先を取りに行く件数の上限がない

## 決めたこと

- **依存の取り出しは `src/core/` の純粋関数にする。** `src/github/` がそれを import して、取りに行く先を決める。
  - 新しい層は作らない。github → core の import は今もある（型）。境界のルール（core は github / web を import しない）には反しない。
- **依存が解消したとみなすのは、依存先が「完了」（GitHub の `state_reason: completed`）で閉じているときだけ。**
  - `not_planned` や `duplicate` で閉じたものは解消とみなさない。「始めて、終えられる」という前提が成り立たないため。
- **依存先を取得できなかったときは、次の結果を区別して evidence に書く。どれも解消とはみなさない**（`.claude/rules/evidence.md`: 取得できなかった ≠ 存在しない）。
  - 404（存在しない、または private）
  - rate limit
  - 接続できない
  - 想定外のステータス
  - Pull Request だった
- **1 つの Issue から取りに行く依存は 5 件まで。** 超えた分は取りに行かず、「N 件中 5 件だけ確認した」と書く。
  - ⚠ 5 は仮の値。Issue がふつう何件の依存を名指しするかは測っていない。
  - 根拠は、認証なしの API が 60 回/時間しか使えないこと。
- **依存が終わっていなければ NEEDS CLARIFICATION にする**（blocking）。人間が「待つか、依存を外すか」を決めれば渡せるため。
- 文言（人が読むもの。owner が決定）:
  - decision: 「依存している <owner/repo#N> の完了を待つか、依存を外すか」。複数あれば「、」で並べて 1 つの decision にする。
  - guidance（根拠）: 「依存が終わっていない Issue は、始められても終えられません。」
  - guidance（出典）: 「Decide First の判定基準（研究の数値ではない）」
  - guidance（例）: `## Dependencies` / `- Depends on <owner>/<repo>#<番号>`
- **2 つの Issue に分ける。**
  - hidetzu/decide-first#4: 依存の取り出し（純粋関数）
  - 新しい Issue: 依存先の取得と、依存 check

## 捨てたもの

- **依存先が閉じていれば、理由を問わず解消とみなすこと。** `not_planned` の依存は、終わる見込みがない。
- **取得できなかった依存を「依存なし」と同じに扱うこと。** 存在しないのか、見えないだけなのかを区別できない。
- **依存が終わっていないことを NOT READY にすること。** 待てば渡せるので、Issue の作り直しは要らない。
- **依存の取り出しのために、core でも github でもない新しい層を作ること。**
