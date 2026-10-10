# 0011 main への push は本番の公開なので、main は PR と検査なしには変えられないようにする

- 日付: 2026-10-10
- 状態: 採用（owner が決定。設定は AI が反映した。hidetzu/decide-first#32）

## 背景

- main への push は、検査のあとにそのまま https://decide-first.hidetzu.work への公開になる（docs/adr/0010）。
- それなのに main は保護されていなかった。PR も検査も経ない直接の push ができた。
- repository は public で、OSS として公開している。ほかに次のものもなかった。
  - 脆弱性の報告の経路
  - 依存の更新の仕組み
  - repository の説明

## 決めたこと

- **main に ruleset を置く**（名前: `main: PR and checks required`、例外なし）
  - PR を経ずには変えられない
  - `check (22.18)`・`check (24)`・`bundle` の成功が必須。GitHub Actions からの結果に限る（ほかの仕組みが同じ名前の結果を送って、検査を偽装できないように）
  - force push と削除を禁止する
- **脆弱性は、GitHub の非公開の脆弱性報告で受ける**（`SECURITY.md`）。
- **Dependabot**
  - アラートを有効にする
  - `github-actions` と `npm` の更新を、月 1 回 PR にする（`.github/dependabot.yml`）。Action を SHA で固定したので、更新を知らせる仕組みが要る。
- repository の説明・ホームページ・トピックを設定し、使っていない Wiki を切る。

## 捨てたもの

- **レビューの承認の必須化。** maintainer が 1 人で、自分の PR は承認できない。
  - merge の人の関門は、owner が merge を承認すること（`.claude/rules/owner-decisions.md`）。ruleset はその前に検査を強制する。
- **CONTRIBUTING.md、CODE_OF_CONDUCT.md、Issue テンプレート。** 今は必要が見えていない。
