# 0010 Web は Cloudflare Workers で公開し、そのためだけにビルド（wrangler）を足す

- 日付: 2026-10-10
- 状態: 採用（owner が決定）

## 背景

- リリースの前に全体を読み直した。owner は「リリース」を、Web として公開することまで含むと決めた。公開先は Cloudflare Workers（無料枠）。
- Cloudflare の文書（2026-10-10 に確認）による Workers Free の上限:
  - 1 日 100,000 リクエスト
  - CPU 時間 10 ms / リクエスト。ネットワークの待ち時間は数えない
  - subrequest 50 回 / リクエスト
  - メモリ 128 MB
- 1 回の判定での GitHub への呼び出しは最大 16 回（Issue 1 + コメント最大 10 ページ + 依存最大 5）。50 回に収まる。
- ⚠ CPU 10 ms に収まるかは、まだ測っていない。コメントが多い Issue が最悪の場合になる。

## 決めたこと

- **公開先は Cloudflare Workers。** `src/worker.ts` を入口にする。
  - `src/app.ts`・`src/core/`・`src/github/` はそのまま使う。どれもグローバルの `fetch` だけを使う。
- **ビルドを足す。** Workers では TypeScript をそのまま動かせないため、wrangler で 1 ファイルにまとめる。
  - CLAUDE.md §3 は、サーバのビルドの追加に ADR を求めている。これがその ADR。
  - wrangler は npm の依存にしない。GitHub Actions のワークフローの `env` の 1 か所で版を固定し、`npx --yes wrangler@<版>` で使う（hidetzu/konjaku と同じ）。
  - 手元の Node サーバ（`npm start`）と CLI は、ビルドなしのまま残す。
- **GitHub API には、権限なしの fine-grained トークンを使う。** Workers の secret `GITHUB_TOKEN` に置き、利用者全員で共有する（上限 5000 回 / 時間）。
  - 理由: Workers の出口の IP は共有されるので、認証なし（60 回 / 時間 / IP）ではすぐ上限に当たると考えられる。⚠ これは推測で、実測していない。
  - トークンは読む範囲を広げない。public の Issue を読むだけ（docs/adr/0001）。
- **v1 では、こちらで回数制限を設けない。**
  - 受け入れた代償: 1 人が大量に使うとトークンの上限を使い切り、最大 1 時間、全員が使えなくなる。
- **デプロイは GitHub Actions で行う**（owner の決定。hidetzu/konjaku の仕組みにならう）。
  - check.yml の中に deploy ジョブを置く。検査のジョブがすべて green のときだけ（`needs:`）、**main への push のときだけ**走る。PR では走らない（fork の PR に secret を渡さない）。
  - 公開の承認は、main への merge の承認が兼ねる。merge が唯一の人の関門である、という形は変わらない（`.claude/rules/owner-decisions.md`）。
  - 「デプロイが成功した」は「配られている」ではない。配られた実体を取り直して確かめる。その判定は、テストできる 1 か所に置く。
  - 確かめたあとで、その commit に版のタグを打つ。
  - Cloudflare 側の Workers Builds（git 連携の自動ビルド）は切っておく。検査を待たずに出る経路になるため。⚠ これは検査では止められないので、owner が確かめる。

## 捨てたもの

- **Node サーバをそのまま動かせる別のホスティング。** owner が Workers の無料枠を選んだ。
- **認証なしで呼ぶこと。** 共有 IP の上限に当たる見込みが高い。
- **IP ごとの回数制限（Workers の rate limiting）。** v1 の範囲を広げる。
- **手での `wrangler deploy`。** 検査を通ったものだけが出る、と言えなくなる。
- **Cloudflare の Workers Builds。** GitHub の検査の結果を待てない。

## 追記: Web 版のコメントの上限（2026-10-10、hidetzu/decide-first#26）

- 手元で CPU 時間を測ったところ、コメントが多い Issue では、Workers Free の上限 10 ms を超えることがあった。
  - 測定の条件と値は、hidetzu/decide-first#26 の PR に書いた（ADR には測定値を書かない）。
- owner の決定: **Web 版（Worker）だけ、コメントを 3 ページ（300 件）までにする。** 手元の Node サーバと CLI は今までどおり 10 ページ。
  - 超えたときは、Cloudflare のエラー画面ではなく、既存の「コメントが N 件を超える Issue は現在対象外です」の文を返す。
- 捨てたもの
  - **すべてを 300 件にすること。** 手元では CPU の上限がない。
  - **1000 件のまま公開して、ログで測ってから決めること。** 測るまでの間、大きな Issue で Cloudflare のエラー画面が出る。

## 追記: 公開する名前（2026-10-10）

- owner の決定: **公開する名前は `https://decide-first.hidetzu.work`。**
  - 元は独自ドメインを対象外にしていた。owner がこれを変えた。
- **独自ドメインは Cloudflare の画面で付ける。`wrangler.jsonc` には書かない**（hidetzu/konjaku と同じ）。
  - こちらの API トークンに、ゾーンを触る権限を足さずに済む。
- deploy ジョブの確認は、repository variable `SITE_ORIGIN`（= この URL）に対して行う。
  - ⚠ 独自ドメインが Worker に付いていなければ、公開後の確認は「取れなかった」で失敗する。⚠ その失敗は「配られていない」の証明ではない。
