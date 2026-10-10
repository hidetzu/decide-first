新規リポジトリ `issue-ready` を立ち上げます。

このプロダクトが答える質問は一つだけです。

「このGitHub IssueをAI Coding Agentへ渡して大丈夫か？」

Claude Code、Codex、GitHub Copilotなど特定製品には依存させません。

GitHub IssueのURLを入力するとIssueを解析し、

READY
NEEDS CLARIFICATION
NOT READY

のように判定してください。

ただし単なる点数付けサービスにはしません。

最も重要なのは、

「AIに渡す前に、人間があと何を決めればよいか」

を短く明確に示すことです。

例:

🟡 NEEDS CLARIFICATION

✓ Goal
✓ Scope
✓ Relevant artifacts
✗ Acceptance criteria
✗ Verification

人間が決めること

1. 正常終了と判断する条件
2. 既存挙動を維持すべき範囲

この2点が決まればAIへ渡せます。

という体験を目指してください。

## 背景

AI Coding Agentの能力そのものではなく、
AIへ渡す仕事の定義品質を改善するサービスです。

特に、

- 曖昧なゴール
- scope不明
- acceptance criteria不足
- relevant artifactの手掛かり不足
- verify方法不足
- 人間にしか決められない仕様判断

をAI実装開始前に発見することを目的とします。

## 最初に調査すること

実装前に、

- GitHub Copilot Coding Agent等のIssue記述ガイド
- AI Coding Agentへ渡しやすいIssueについての研究
- agent-ready / ready-for-agent等の既存OSS
- issue qualityに関する既存研究やツール

を調査してください。

特に、
"What Makes a GitHub Issue Ready for Copilot?"
で提案されている観点も確認してください。

ただし既存ツールとの差別化を明確にしてください。

このサービスは、

「repositoryがAI-readyか」

ではなく、

「この1件のIssueは、今この瞬間AIへ渡せる状態か」

だけを判定します。

## MVP

対象はpublic GitHub repositoryのIssueだけとします。

GitHub Issue URL:

https://github.com/owner/repo/issues/123

を入力するとGitHub APIから、

- title
- body
- labels
- comments

など必要最低限の情報を取得して評価してください。

初期版ではGitHub OAuthやprivate repository対応は不要です。

## 判定項目

最初から項目を固定せず、調査結果を踏まえて決定してください。

少なくとも以下は候補として検討してください。

- Goalが明確か
- Expected behaviorが明確か
- Scopeが明確か
- Out of scopeが必要か
- Acceptance criteriaがあるか
- Relevant files / modules / artifactsへの手掛かりがあるか
- Implementation constraintsがあるか
- Verification方法が分かるか
- External dependencyが明確か
- 未決定の仕様判断が残っていないか
- Issueが大きすぎないか
- Issue本文とコメントに矛盾がないか

重要なのは項目数ではありません。

AIに渡してよいかどうかを人間が数秒で判断できることを優先してください。

## 判定ロジック

MVPでは可能な限り、

決定論的・説明可能なルール

を優先してください。

いきなりLLMへIssue全文を投げて0〜100点を返す仕組みにはしないでください。

なぜその判定になったかをテスト可能にします。

どうしても意味理解が必要な判定だけ、将来的にLLM利用を検討できる構造にしてください。

つまり、

Rule-based core +
optional semantic evaluator

へ拡張可能な構造が望ましいです。

## UI

最初に表示する情報は極力少なくしてください。

例:

Issue #123

🟡 NEEDS CLARIFICATION

AIに渡す前に
人間が2つ決める必要があります。

[ 詳細を見る ]

詳細を開いたときだけ評価項目を表示してください。

0〜100点を巨大表示するUIより、

「今渡していい / まだダメ」

の判断を優先します。

## MVPでやらないこと

- Issue自動実装
- Coding Agent起動
- PR作成
- merge
- repository全体のAI readiness判定
- private repository
- GitHub OAuth
- GitLab
- Jira
- Backlog
- 自動Issue書き換え
- AIによるIssue生成

特に、自動実装ツールへ発展させないでください。

IssueReadyはagent orchestrationではなく、
agentへ仕事を渡す直前のQuality Gateです。

## 将来候補

MVP後には、

「AI-readyなIssueに直す」

機能を追加できる設計にはしておいてください。

ただし初期版では実装しません。

また将来的にはGitHub Actionとして、

issue
↓
IssueReady
↓
ready-for-ai label

のような利用も考えられます。

## 開発の進め方

実装開始前に、

1. 競合調査
2. 関連研究調査
3. IssueReadyの一文での定義
4. 評価モデル
5. MVPのユーザーフロー
6. 最小アーキテクチャ
7. MVP完了条件

を整理してください。

重要な判断だけADRへ残してください。

その後、GitHub Issuesへ実装単位を分割してください。

各Issueには、

- Goal
- Scope
- Acceptance Criteria
- Verify

を記載してください。

これはIssueReady自身が評価できる品質のIssueにしてください。

最初のvertical sliceは、

GitHub Issue URL入力
→ Issue取得
→ 2〜3個の単純ルールで評価
→ READY / NEEDS CLARIFICATION表示

までとします。

評価項目を最初から大量に実装しないでください。

調査→設計→Issue分割→最小vertical sliceまで自律的に進めてください。

明確に判断可能なものについて逐一確認は不要です。
プロダクトの方向を変える判断だけ人間へ戻してください。

最後に、

- 決めたこと
- 捨てたこと
- 根拠
- 次に作るIssue
- 人間の判断が必要なこと

だけを短く報告してください。
