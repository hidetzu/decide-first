# 調査メモ — 競合と関連研究（2026-10-10 時点）

⚠ **ここに書くのは出典つきの調査結果だけ。** 判断は [`design.md`](design.md) と [`adr/`](adr/) に置く。
⚠ 数値はすべて各出典が報告した値で、IssueReady が測ったものではない。

## 1. 公式ガイド

| 出典 | Issue に求めるもの | 人間に残すべきとされる仕事 |
|---|---|---|
| GitHub Copilot coding agent — [Get the best results](https://docs.github.com/en/copilot/tutorials/coding-agent/get-the-best-results) | 解く問題の明確な説明 / **完全な acceptance criteria** / 変更すべきファイルの手掛かり（任意。agent が自力で見つけられることが多い） | 広範なリファクタ、依存やレガシーの知識が要る仕事、本番・セキュリティ・個人情報、**定義が不明確な仕事** |
| Devin — [Instructing Devin effectively](https://docs.devin.ai/essential-guidelines/instructing-devin-effectively) | 文脈 / 設計判断を先に決める / scope と境界 / 成功条件 / 既存コードの参照 / **検証手順** | — |
| OpenHands — [Prompting best practices](https://docs.openhands.dev/openhands/usage/tips/prompting-best-practices) | 具体的で場所を特定した指示、変更は小さく、エラーやログを添える | — |

## 2. 研究

- **Sayagh, "What Makes a GitHub Issue Ready for Copilot?"**（arXiv:2512.21426, 2025-12）
  [論文](https://arxiv.org/abs/2512.21426v1)
  - AIDev dataset の Copilot PR 3,180 件と、それに紐づく Issue を分析。
  - 32 の観点を 5 群に整理: Problem Definition / Acceptance and Validation / Implementation and Technical Context / Risk and Quality / Traceability and Completeness。採点は LLM（GPT-5-mini）による 0–5。
  - 高得点の Issue ほど merge 率が高かった観点: self-containment (+16.7%)、**scope (+16.4%)**、common task familiarity、**expected and edge behaviors (+10.7%)**、**ambiguity avoidance (+8.4%)**、actionability、localization。
  - 逆に低かった観点: reproduction steps (−11.5%)、environment setup、dependency awareness。
  - ⚠ どれも相関で、因果ではない。
  - 差の定義（2026-10-10 に原論文 v1 の本文で確認）:
    - その観点が 4〜5 点の Issue から出た PR の merge 率から、0〜3 点の Issue から出た PR の merge 率を引いた値。
    - 単位は明記されていない。論文中の例（77.11% と 45.91% の差を「31.2% higher」と書く）から、**ポイント差**と読める。
    - 原論文の値は小数第 2 位まで: self-containment +16.65、scope +16.44、expected and edge behaviors +10.69、ambiguity avoidance +8.38、reproduction steps −11.53。
    - 検定はカイ二乗（α = 0.05）。**効果量と、観点ごとの各群の件数は報告されていない。** 観点ごとに有意だったかは図にしかなく、本文からは確認できなかった。
    - **validation guidance（検証方法）の merge 率の差は、本文に報告がない。**
- **Ambig-SWE**（Vijayvargiya et al., arXiv:2502.13069, 2025）[論文](https://arxiv.org/html/2502.13069v2)
  - 仕様が不足した Issue では、agent がユーザーとやり取りできると成績が最大 74% 改善した。
  - モデルは促されない限りほとんど質問しない。
  - **役に立つのは振る舞いについての具体的な質問**で、コードを読めば分かる点を尋ねる質問はあまり効かない。
  - → IssueReady の主出力を「人間が決めること」にする根拠（[ADR 0002](adr/0002-the-verdict-is-derived-from-named-rule-checks-never-a-score.md)）。
- **SWE-bench Verified**（OpenAI, 2024）[記事](https://openai.com/index/introducing-swe-bench-verified/)
  - 各 Issue の「underspecified か」を人が 0–3 で注釈した。2 以上の Issue は除外した。
  - ⚠ 各段階の正確な文言は未確認（公式ページから 403 が返り、取得できなかった）。
- **Ehsani et al., "Where Do AI Coding Agents Fail?"**（MSR 2026, arXiv:2601.15195）
  - 失敗した PR は大きく、触るファイルが多く、CI に落ちやすい。
  - → 「大きすぎる Issue」を将来の NOT READY 条件の候補にする。
- **Zimmermann et al., "What Makes a Good Bug Report?"**（IEEE TSE 2010）
  - 開発者が最も役立つとしたのは再現手順・スタックトレース・テストケース。
  - ⚠ 再現手順は Sayagh では merge 率と負の相関だった。この食い違いは未解決のまま扱う。

## 3. 既存ツール

| ツール | 判定対象 | 方式 | 出力 |
|---|---|---|---|
| ⚠ **[whyiug/issueready](https://github.com/whyiug/issueready)**（MIT, 2026-07 作成, alpha, star 0 — `gh repo view` で確認） | **Issue 1 件**と repo の文脈（Issue Forms、ポリシー） | 決定論的な core。意味判定は UNKNOWN を返し、LLM adapter は任意 | CLI / Markdown / JSON。**3 つの別々の verdict**（Evaluation / Specification / Delegation）と、多数の版管理された rule |
| [ifBars/ghi](https://github.com/ifbars/ghi) | Issue 本文 | 決定論的 | **0–10 点**、score ラベル、コメント |
| [tracehubpm/reports-check-action](https://github.com/marketplace/actions/reports-check-action) | 新しい bug report | LLM | 問題点を最大 3 つ挙げるコメント |
| Matt Pocock の `github-triage` skill（`ready-for-agent` ラベル） | Issue 1 件 + メンテナ | LLM agent | ラベルと agent 向けの brief |
| [Factory Agent Readiness](https://docs.factory.com/agent-readiness/overview)、agent-ready、AgentLint ほか | **repository** | 主に決定論的（一部は未確認） | レベル / 100 点満点 |

## 4. 差別化

- **repository の AI readiness** は既存ツールが十分にカバーしている。IssueReady はやらない（[ADR 0001](adr/0001-issueready-judges-one-issue-and-never-acts-on-it.md)）。
- **LLM による Issue 批評**も既にある。IssueReady の core は LLM を使わない（ADR 0002）。
- ⚠ **「Issue 1 件 × 決定論的 × 説明可能」という設計は whyiug/issueready と重なる。**
- 残る差は次の 4 点。
  1. **答えは 3 値の 1 つだけ。** verdict を 3 本並べない。
  2. **主出力は「人間が決めること」の短いリスト**で、観点ごとの所見リストではない。Ambig-SWE の知見に沿う。
  3. **URL を貼るだけの Web UI。** 設定も repo ポリシーも要らない。
  4. **規則の数を絞る。** 項目数ではなく「数秒で判断できること」を優先する。
- ⚠ **名前の衝突と、競合するか合流するかはプロダクトの方向を変える判断なので、owner に戻す**（[design.md §7](design.md)）。
