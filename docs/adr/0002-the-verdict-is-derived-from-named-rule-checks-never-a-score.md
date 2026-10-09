# 0002 判定は名前のついた rule check の結果から導き、点数にしない

- 日付: 2026-10-10
- 状態: 採用

## 決めたこと

- 判定は、各 check の `met` / `missing` だけから決める関数で出す。
  - missing が 1 つもなければ READY、1 つでもあれば NEEDS CLARIFICATION。
  - NOT READY は「構造的」な check から出す。
- 各 check は evidence（見つけた行、または探したもの）を必ず持つ。missing なら「人間が決めること」も持つ。
- core の check は決定論的な rule だけにする。同じ snapshot からは、必ず同じ評価が出る。
- 意味の理解が要る判定（例: 本文とコメントの矛盾）は、将来の **semantic evaluator** に任せる。
  - semantic evaluator は rule と同じ `CheckResult` を `source: "semantic"` つきで返し、**rule の横に並べる**。rule の中には入れない。

## 捨てたもの

- **0–100 点や重み付けの総合点。** 点数からは「何を決めればよいか」が分からない。閾値の根拠もテストできない。
- **Issue 全文を LLM に渡して採点させる方式。**
  - Sayagh（arXiv:2512.21426）は LLM 採点を使っていて、32 観点のうち 3 つで実行ごとの一致度が低かった。
  - 「なぜその判定か」をテストで固定できない。

## 根拠

- brief の要件: 「なぜその判定になったかをテスト可能にする」。
- Ambig-SWE（arXiv:2502.13069）: 役に立つのは振る舞いについての具体的な問いで、これは「人間が決めること」の形で出せる。
