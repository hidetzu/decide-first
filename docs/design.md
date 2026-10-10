# Decide First 設計

⚠ **これは計画であり、主張ではない。** 実装済みで主張してよいものは [`SPEC.md`](SPEC.md) に、判断の理由は [`adr/`](adr/) に置く。調査結果と出典は [`research.md`](research.md)。

## 1. 一文での定義

> **Decide First は、GitHub Issue 1 件を AI Coding Agent へ今渡してよいかを判定し、渡す前に人間が決めることだけを短く示す Quality Gate である。**

## 2. 評価モデル

### 判定（3 値。⚠ 点数は出さない）

| 判定 | 意味 | 導き方 |
|---|---|---|
| 🟢 READY | 人間が決めることが見つからない | blocking な check がすべて met |
| 🟡 NEEDS CLARIFICATION | 人間がいくつか決めれば渡せる | blocking な check のどれかが missing |
| 🔴 NOT READY | 答えを足すだけでは足りず、Issue の作り直し（分割・書き直し）か、人間の仕事にする判断が要る | structural な check のどれかが missing。decision は structural のものだけ出す（[ADR 0006](adr/0006-not-ready-shows-only-the-structural-decisions.md)） |

- 各 check の結果は `met` か `missing` で、必ず **evidence**（見つけた行、または探したもの）を持つ。
- `missing` の check は **decision**（人間が決めること）を 1 つ持つ。
- 画面に出す「人間が決めること」は decision の並びそのものになる。
- ⚠ 判定は「どの check が missing か」だけから決まる（[ADR 0002](adr/0002-the-verdict-is-derived-from-named-rule-checks-never-a-score.md)）。

### Check の一覧

| Check | 種別 | 状態 | 根拠 |
|---|---|---|---|
| Acceptance criteria — 中身のある見出し、または task list | blocking | ✅ slice | Copilot docs、Sayagh "expected behaviors" |
| Verification — 確認方法・再現手順の見出し | blocking | ✅ slice | Sayagh "validation guidance"、Devin docs |
| No open decisions — `question` / `needs-info` 等のラベル、TBD / 未定 の記述 | blocking | ✅ slice | Ambig-SWE、Sayagh "ambiguity avoidance" |
| Goal / problem — 何を達成するかの記述 | blocking | ✅ hidetzu/decide-first#2 | Copilot docs、SWE-bench underspecification |
| Scope / Out of scope | blocking | ✅ hidetzu/decide-first#3 | Devin docs（scope と境界）。Sayagh の scope（+16.44）は Issue の大きさの観点で、見出しの有無ではない |
| 名指しされた依存（`blocked by owner/repo#N`）が open | blocking | ✅ hidetzu/decide-first#4, hidetzu/decide-first#18 | 依存が閉じていないと、始められても終わらない |
| Issue が closed | structural → NOT READY | ✅ hidetzu/decide-first#1 | 閉じた仕事は渡すものではない |
| 本文が空、またはテンプレートのみ | structural → NOT READY | ✅ hidetzu/decide-first#1 | 決める対象そのものがない |
| 大きすぎる（独立した goal が複数 / epic） | structural → NOT READY | 後 | Ehsani: 大きい PR ほど失敗する |
| Sensitive（security / incident ラベル） | structural → NOT READY | 後 | Copilot docs: 人間に残す仕事 |
| Relevant artifacts — ファイルパスやシンボル | **advisory**（判定に影響しない） | 後 | Copilot docs: agent が自力で見つけられることが多い |
| 本文とコメントの矛盾 | semantic evaluator | 将来 | 決定論的には判定できない |

### 捨てたもの

- **0–100 点・総合スコア。** 点数からは「何を決めればよいか」が分からないため。
- **Sayagh の "General" 特徴量**（本文の長さ、PR 履歴）。予測には効くが、人間が直せる行動につながらないため。
- **repository の AI readiness**（[ADR 0001](adr/0001-issueready-judges-one-issue-and-never-acts-on-it.md)）。
- **全文を LLM に渡して採点する方式**（ADR 0002）。
- **最初から全観点を実装すること。** 最初の slice は 3 つの check に絞った。

## 3. MVP のユーザーフロー

```text
URL を貼る -> [判定] -> Issue #123 / 🟡 NEEDS CLARIFICATION
                        AIに渡す前に、人間が2つ決める必要があります。
                        1. ...  2. ...
                        [詳細を見る]  -> ✓/✗ check と evidence
```

- 取得に失敗したときは、原因と次の行動を 1 文で示す。
- ⚠ 404 は「存在しない」とは言わない。private repository と区別できないため。

## 4. 最小アーキテクチャ

```text
URL ─ github/url.ts ─ github/client.ts ─(IssueSnapshot)─ core/evaluate.ts + core/rules/* ─(Evaluation)─ web/ | cli.ts
                                                            ↑
                                    将来: semantic evaluator（同じ CheckResult を返し、source: "semantic"）
```

- `src/core` は純粋関数で、I/O を持たない（[ADR 0003](adr/0003-the-core-judges-a-snapshot-and-never-fetches.md)）。
- 将来の拡張は次の 2 つで、どちらも core を変えずに足せる。
  - **「AI-ready に直す」**: `missing` の check と decision を入力にして、書き直し案を出す。
  - **GitHub Action**: CLI の終了コード（0 = READY）を使う。

## 5. MVP 完了条件

1. public Issue の URL から、3 値の判定と「人間が決めること」が出る。Web と CLI の両方。
2. 最初の画面は判定と decision だけを出し、check は「詳細を見る」の中に置く（[ADR 0004](adr/0004-the-first-screen-shows-only-the-verdict-and-the-decisions.md)）。
3. §2 の「次」の check が実装され、各 check に met と missing の両方を示すテストがある。
4. NOT READY を返す条件が 1 つ以上ある。
5. 取得失敗はすべて文章で返る: URL 不正 / PR / 404 / rate limit / 接続不可 / 想定外のステータス。
6. この repository の Issue は、`ready-for-ai` を付ける時点で Decide First にかけ、Issue is open 以外に missing がない。
   - 2026-10-10 に書き換えた（owner の決定）。元は「Decide First 自身にかけて READY になる」だった。close した Issue は設計上 NOT READY になるので、close したあとでは測れなかった。
7. Web は Cloudflare Workers で公開する（[ADR 0010](adr/0010-publish-on-cloudflare-workers-with-a-bundling-step.md)）。

## 6. 実装の単位

GitHub Issues に分割する。各 Issue には Goal / Scope / Out of Scope / Acceptance Criteria / Verify を書く。

## 7. owner が決めたこと

- **Web は Cloudflare Workers（無料枠）で公開する。そのためだけに wrangler のビルドを足す。GitHub API には権限なしのトークンを使う。v1 は回数制限なし、デプロイは GitHub Actions（main への push、検査のあと）**（2026-10-10、[ADR 0010](adr/0010-publish-on-cloudflare-workers-with-a-bundling-step.md)）。**未実装。**
- **依存は「完了」で閉じたときだけ解消とみなす。取得できなかったものは解消とみなさない。取り出しは `src/core/` の純粋関数。取りに行くのは 5 件まで（仮の値）**（2026-10-10、[ADR 0009](adr/0009-a-dependency-counts-as-done-only-when-closed-as-completed.md)）。
- **根拠（研究の数値。出典・範囲・相関つき）と書き方の例は、「人間が決めること」の各項目から開く**（2026-10-10、画面案を見比べて決定、[ADR 0008](adr/0008-evidence-and-an-example-open-from-each-decision.md)）。**未実装。**
- **NOT READY のときは structural の decision だけを出す。新しい check の文言は hidetzu/decide-first#1 の計画どおり**（2026-10-10、[ADR 0006](adr/0006-not-ready-shows-only-the-structural-decisions.md)）。
- **whyiug/issueready とは差別化して進める。名前は Decide First に変える**（2026-10-10、[ADR 0005](adr/0005-renamed-to-decide-first-and-differentiated-by-always-answering.md)）。
