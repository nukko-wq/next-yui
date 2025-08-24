# Next-YUI プロジェクト設計書

## 概要

Next-YUIは、Next.js 15とGoogle Gemini AIを使用したリアルタイムチャットアプリケーションです。16歳の女性AI「YUI（結）」との自然な対話を提供し、タイプライター効果、音響エフェクト、アバター表示などのリッチなUIを特徴とします。

## プロジェクト情報

- **プロジェクト名**: next-yui
- **バージョン**: 0.1.0
- **フレームワーク**: Next.js 15 (App Router)
- **AI エンジン**: Google Gemini 2.5 Flash (最新@google/genai SDK)
- **認証**: NextAuth.js v5
- **UI**: Tailwind CSS
- **開発言語**: TypeScript

## 主要機能

### 1. AI チャット機能
- **マルチターン会話**: セッション管理により連続した会話が可能
- **リアルタイム通信**: Socket.IO（開発）/ HTTP API（本番）
- **タイプライター効果**: 文字が1文字ずつ表示される演出
- **音響エフェクト**: タイプ音やビープ音
- **スマート自動スクロール**: AI応答中の自動追従

### 2. アバター・UI機能
- **リップシンク**: AI応答中の口パク演出
- **ターミナル風UI**: レトロなコマンドライン風デザイン
- **レスポンシブデザイン**: モバイル・デスクトップ対応

### 3. セキュリティ機能
- **Google OAuth認証**: 許可されたメールアドレスのみアクセス可能
- **セッション管理**: 安全な認証状態の管理
- **検索エンジン非表示**: robots metaタグで非公開設定

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────┐
│                Frontend (Next.js)               │
├─────────────────────────────────────────────────┤
│  YuiChat.tsx                                    │
│  ├─ TypewriterText.tsx                          │
│  ├─ AuthStatus.tsx                              │
│  └─ hooks/ (useTypewriter, useTypeSound)        │
├─────────────────────────────────────────────────┤
│  Chat Client (chat-client.ts)                  │
│  ├─ Socket.IO Client (開発環境)                  │
│  └─ HTTP Client (本番環境)                      │
├─────────────────────────────────────────────────┤
│                Middleware                       │
│  ├─ 認証チェック                                 │
│  └─ ルート保護                                   │
├─────────────────────────────────────────────────┤
│                Backend APIs                     │
│  ├─ /api/chat (POST, GET, DELETE)              │
│  ├─ /api/auth/[...nextauth]                    │
│  ├─ /api/health                                │
│  └─ /api/socket                                │
├─────────────────────────────────────────────────┤
│                AI Integration                   │
│  ├─ gemini.ts (TypeScript)                     │
│  ├─ gemini-server.js (CommonJS)                │
│  └─ Google GenAI SDK                           │
├─────────────────────────────────────────────────┤
│                External Services                │
│  ├─ Google Gemini 2.5 Flash                    │
│  └─ Google OAuth 2.0                           │
└─────────────────────────────────────────────────┘
```

## ディレクトリ構造

```
next-yui/
├── docs/                    # 設計書・ドキュメント
├── public/                  # 静的アセット
│   ├── yui_mouth_*.webp    # アバター画像
│   └── *.svg               # アイコン類
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/           # API Routes
│   │   ├── auth/          # 認証ページ
│   │   ├── layout.tsx     # ルートレイアウト
│   │   └── page.tsx       # ホームページ
│   ├── components/        # Reactコンポーネント
│   ├── hooks/            # カスタムHooks
│   └── lib/              # ユーティリティ・設定
├── server.js             # Socket.IOサーバー（開発用）
└── 設定ファイル群
```

## 主要コンポーネント

### YuiChat.tsx
- チャットメインコンポーネント
- 会話履歴の管理とUI表示
- スクロール制御とアニメーション

### TypewriterText.tsx
- タイプライター効果の実装
- 音響エフェクトとの連携

### chat-client.ts
- 環境に応じたクライアント切り替え
- Socket.IO / HTTP APIのアダプター

### gemini.ts / gemini-server.js
- Gemini AIとの通信
- マルチターン会話の管理
- セッション別履歴保持

## 技術的特徴

1. **最新SDK使用**: @google/genai v1.15.0のchats APIを使用
2. **デュアル通信**: 開発時Socket.IO、本番時HTTP API
3. **セッション管理**: セッション別の会話履歴を自動管理
4. **スマートスクロール**: ユーザー操作とAI応答を考慮した自動スクロール
5. **型安全**: TypeScriptによる厳格な型チェック

## セキュリティ設計

- **認証必須**: 全ページでNextAuth.jsによる認証チェック
- **メール制限**: 環境変数ALLOWED_EMAILSで許可リスト管理
- **非公開設定**: robots metaタグで検索エンジン非表示
- **セッション保護**: サーバーサイドでのセッション検証

## パフォーマンス最適化

- **Next.js 15**: 最新のTurbopackでの高速ビルド
- **コンポーネント最適化**: useCallback、useMemoによる再レンダリング制御
- **AI応答最適化**: セッション管理によるコンテキスト保持
- **画像最適化**: Next.js Imageコンポーネントの使用

---

詳細な設計については、各専門分野のドキュメントを参照してください：
- [技術仕様書](./technical-specifications.md)
- [API設計書](./api-design.md)
- [スラッシュコマンド設計書](./slash-commands-design.md)