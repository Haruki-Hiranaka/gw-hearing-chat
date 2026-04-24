# 道しるべ — GW Hearing Chat

> 対話型ヒアリングを通じて、ユーザーに合ったゴールデンウィークの過ごし方を提案する ChatAI。
> Gemini Challenge 2026 向けサブミッション。

**Stack**: Next.js 15 (App Router) / React 19 / TypeScript / Tailwind CSS / Gemini API (`@google/generative-ai`) / Vercel

---

## 設計ハイライト

### 1. 2 段構えの推論パイプライン

```
 [ヒアリング turn]              [提案生成]
  gemini-2.5-flash    ─────→   gemini-2.5-pro
  structured output             structured output
  (reply + slots + phase)       (summary + suggestions[])
```

- **`/api/chat`**: 毎ターンごとに `responseSchema` で JSON を強制。`slots`（4 軸）と `phase`（`hearing` | `ready_to_suggest`）を同時取得。
- **`/api/suggest`**: 全 slot 充足後、会話履歴＋slot を pro モデルに渡し、具体的提案 4 件を構造化出力。
- **`temperature`** は hearing 0.7 / suggest 0.85 に分離。前者は安定性、後者は提案の多様性を優先。

### 2. 4 軸 slot-filling

| slot | 意味 |
|---|---|
| `area` | 場所・エリア |
| `party` | 予算・人数・同行者 |
| `crowd_pref` | 混雑志向（定番 / 穴場） |
| `activity_type` | アクティビティ種別 |

- サーバー側で **merge + 再帰 null 回避** (`normalizeResponse`) を実装。モデルが一度埋めた slot を空に戻すことを防ぐ。
- `phase` は「モデル判断 OR 全 slot filled」の OR で決定的に遷移。モデルの phase 誤判定に頑健。

### 3. 状態設計

- API は完全に **stateless**（会話履歴はクライアント保持）。
- クライアント状態は `messages / slots / phase / ui` の 4 つのみ。Redux 等は未採用。
- 副作用は `useRef<boolean>` で二重送信を防止。

### 4. UI

- **和モダン editorial** 路線。Shippori Mincho B1 + Zen Kaku Gothic New。
- 朱色（vermillion）のアクセントをスタンプ・印章風に少量だけ使用。
- 画面右に **ProgressRail** を配置し、ヒアリング進捗をリアルタイム可視化。

---

## セットアップ

```bash
# 1. 依存インストール
npm install

# 2. API キーを取得（Google AI Studio）
#    https://aistudio.google.com/apikey

# 3. 環境変数を設定
cp .env.local.example .env.local
# .env.local を開き GEMINI_API_KEY=xxxx を記入

# 4. 起動
npm run dev
# → http://localhost:3000
```

### 任意: モデル切替

```bash
# .env.local
GEMINI_CHAT_MODEL=gemini-2.5-flash
GEMINI_SUGGEST_MODEL=gemini-2.5-pro
```

---

## Vercel デプロイ

```bash
# Vercel CLI
npm i -g vercel
vercel

# 初回設定後、環境変数を登録
vercel env add GEMINI_API_KEY production
vercel env add GEMINI_API_KEY preview
vercel env add GEMINI_API_KEY development

# 本番デプロイ
vercel --prod
```

または GitHub 連携で以下をダッシュボードで設定：
- Framework Preset: **Next.js**
- Environment Variables: `GEMINI_API_KEY`

---

## ディレクトリ構成

```
gw-hearing-chat/
├── app/
│   ├── api/
│   │   ├── chat/route.ts        # hearing turn endpoint
│   │   └── suggest/route.ts     # final proposal endpoint
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ChatView.tsx             # message list + autoscroll
│   ├── InputBar.tsx             # autogrow textarea
│   ├── MessageBubble.tsx        # bubbles + typing indicator
│   ├── ProgressRail.tsx         # 4-axis slot progress
│   └── SuggestionPanel.tsx      # final proposal cards
├── lib/
│   ├── gemini.ts                # SDK client + schemas + config
│   ├── prompts.ts               # system prompts
│   └── types.ts                 # shared types
├── .env.local.example
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## 動作確認シナリオ

1. 初期挨拶 →「場所」を回答 → 残 3 軸を順次ヒアリング
2. 全 slot 埋まる → 右下に **「提案を見る →」** ボタン出現
3. タップで suggestion 生成（2〜4 秒）→ 4 枚の提案カード表示
4. 「もう一度ヒアリング」でリセット

### 強制遷移 (escape hatch)

ユーザーが途中で「もう提案して」「おまかせ」等と送ると、未埋 slot を `"おまかせ"` で埋めて提案 phase に遷移するようプロンプトで指示済み。

---

## 今後の拡張余地

- **ストリーミング**: `@google/generative-ai` の `generateContentStream` で reply 部分を SSE 配信。
- **地理情報の検証**: Google Places API と組み合わせ、提案された場所の実在性・営業時間を裏付け。
- **プラン化**: 提案 → 選択 → タイムテーブル自動生成（3rd API 呼び出し）。
- **共有**: 提案結果の URL 化（Vercel KV に保存）。
