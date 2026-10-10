# 0007 作業ブランチへの `git push` には毎回の許可を取らない

- 日付: 2026-10-10
- 状態: 採用（owner が決定）

## 背景

- これまで `.claude/rules/git.md` は、`git push` のたびに許可を取ることを求めていた。例外は Loop Controller の中だけだった。
- owner は、Claude Code の権限ファイル（`.claude/settings.local.json`。commit しない）で `git push` を許可した。そのうえで、ルールも同じにそろえるよう指示した。

## 決めたこと

- **作業ブランチ（`<type>/<short-name>`）への `git push` には許可を取らない。**
- 次のことは変えない。
  - default branch へは push しない。
  - force push は、指示がない限りしない。
  - 他の人が作業しているブランチへは、聞かずに push しない。
  - **merge には毎回許可を取る。** auto-merge、merge queue、`--admin` は禁止のまま。
- push の前に、公開してはいけないもの（`git.md` の「Never put the working environment into anything public」）が commit に入っていないかを確かめる。

## 根拠

- 作業ブランチは消せる。merge されるまでは default branch に何も届かない。
- 戻せない操作は merge で、人間の gate はそこに残っている（`.claude/rules/owner-decisions.md`）。

## 受け入れた代償

- push した時点で、commit は読める状態になる。commit 本文を消すには force push が要り、古い SHA は host が回収するまで読める。
  - このため、push の前の確認は省かない。
