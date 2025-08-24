# Next-YUI 技術仕様書

## システム概要

Next-YUIは、最新のWeb技術とAI技術を組み合わせたリアルタイムチャットアプリケーションです。

## 技術スタック

### フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 15.5.0 | Reactフレームワーク、App Router |
| React | 19.1.0 | UIライブラリ |
| TypeScript | 5.x | 型安全性 |
| Tailwind CSS | 4.x | スタイリング |
| Socket.IO Client | 4.8.1 | リアルタイム通信（開発） |

### バックエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Node.js | 20.x+ | ランタイム |
| Next.js API Routes | 15.5.0 | REST API |
| Socket.IO | 4.8.1 | WebSocket通信（開発） |
| NextAuth.js | 5.0.0-beta.29 | 認証 |

### AI・外部サービス

| サービス | バージョン | 用途 |
|---------|-----------|------|
| Google Gemini 2.5 Flash | latest | AI対話エンジン |
| @google/genai | 1.15.0 | Google AI SDK |
| Google OAuth 2.0 | - | ユーザー認証 |

### 開発・ビルド

| ツール | バージョン | 用途 |
|-------|-----------|------|
| Biome | 2.2.0 | リンター・フォーマッター |
| Turbopack | - | 高速ビルド |

## アーキテクチャ詳細

### レイヤー構成

```
┌─────────────────────────────────────┐
│         Presentation Layer          │  React Components
├─────────────────────────────────────┤
│           Service Layer             │  Custom Hooks, Utils
├─────────────────────────────────────┤
│          Business Layer             │  Chat Logic, Command System
├─────────────────────────────────────┤
│       Data Access Layer             │  AI API, Session Management
├─────────────────────────────────────┤
│        Infrastructure Layer         │  NextAuth, Socket.IO
└─────────────────────────────────────┘
```

### コンポーネント設計

#### 主要コンポーネント階層

```
App
├── AuthStatus          # 認証状態表示
└── YuiChat            # メインチャット
    ├── TypewriterText # タイプライター効果
    ├── CommandSuggestions # コマンドサジェスト（計画中）
    └── Avatar Display # YUIアバター表示
```

#### Hooks設計

```typescript
// カスタムHooks
useTypewriter(text, options)    // タイプライター効果
useTypeSound()                  // 音響エフェクト
useSlashCommands()             // スラッシュコマンド（計画中）
```

### 状態管理

#### ローカル状態（useState）

```typescript
// YuiChat.tsx での状態管理
const [messages, setMessages] = useState<Message[]>([])           // 会話履歴
const [inputMessage, setInputMessage] = useState('')             // 入力中テキスト
const [isConnected, setIsConnected] = useState(false)           // 接続状態
const [sessionId, setSessionId] = useState<string>('')          // セッションID
const [avatarState, setAvatarState] = useState<'open'|'closed'>('closed') // アバター状態
const [isUserScrolling, setIsUserScrolling] = useState(false)   // スクロール状態
const [isBotTyping, setIsBotTyping] = useState(false)          // AI応答中状態
```

#### セッション管理

```typescript
// サーバーサイドセッション管理
Map<SessionID, ChatInstance> sessionChats  // AI会話セッション
Map<SessionID, Content[]> historyStore     // 会話履歴
```

### 通信設計

#### デュアル通信システム

```typescript
interface ChatClient {
  connect(): Promise<void>
  disconnect(): void
  sendMessage(message: string): Promise<void>
  clearSession(): Promise<void>
  onStatusChange(callback: (status: SessionStatus) => void): void
  onResponse(callback: (response: ChatResponse) => void): void
  isConnected(): boolean
}

// 実装クラス
class SocketIOClient implements ChatClient  // 開発環境
class HTTPClient implements ChatClient      // 本番環境
```

#### API エンドポイント設計

| エンドポイント | メソッド | 機能 | レスポンス |
|---------------|---------|------|-----------|
| `/api/chat` | POST | メッセージ送信 | ChatResponse |
| `/api/chat` | GET | 会話履歴取得 | History[] |
| `/api/chat` | DELETE | セッションクリア | Status |
| `/api/health` | GET | ヘルスチェック | SystemStatus |
| `/api/auth/[...nextauth]` | * | 認証処理 | NextAuth |

### AI統合設計

#### Gemini APIラッパー

```typescript
class GeminiChatBot {
  private genAI: GoogleGenAI
  private sessionChats: Map<string, Chat>
  
  // 主要メソッド
  async generateResponse(sessionId: string, message: string): Promise<ChatResponse>
  getSessionHistory(sessionId: string): Content[]
  clearSession(sessionId: string): void
  
  // プライベートメソッド
  private getOrCreateChat(sessionId: string): Chat
}
```

#### 会話履歴管理

```typescript
// セッションごとのChat インスタンス管理
const chat = genAI.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    temperature: 0.8,
    maxOutputTokens: 8192,
    systemInstruction: YUI_PERSONA
  }
})

// 自動履歴管理
await chat.sendMessage({ message: userInput })
const history = chat.getHistory()  // 自動的に履歴を保持
```

## パフォーマンス設計

### フロントエンド最適化

1. **React最適化**
   ```typescript
   // 再レンダリング制御
   const addMessage = useCallback((message: Message) => {
     setMessages(prev => [...prev, message])
   }, [])
   
   // 重い計算のメモ化
   const expensiveValue = useMemo(() => 
     computeExpensiveValue(data), [data]
   )
   ```

2. **スクロール最適化**
   - AI応答中の適応的自動スクロール
   - ユーザー操作の検知と制御
   - タイムアウトベースの状態管理

3. **画像最適化**
   ```typescript
   // Next.js Image コンポーネント
   <Image 
     src="/yui_mouth_open.webp"
     alt="YUI Avatar"
     width={150} height={150}
     priority
   />
   ```

### バックエンド最適化

1. **AIリクエスト最適化**
   - セッション別インスタンス再利用
   - 接続プールの管理
   - タイムアウト設定

2. **メモリ管理**
   - セッションの自動クリーンアップ
   - 古い履歴の自動削除
   - ガベージコレクション最適化

## セキュリティ設計

### 認証・認可

```typescript
// NextAuth.js設定
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  ],
  callbacks: {
    signIn: ({ profile }) => {
      const allowedEmails = getAllowedEmails()
      return allowedEmails.includes(profile?.email)
    }
  }
})
```

### ミドルウェア保護

```typescript
// middleware.ts
export default async function middleware(request: NextRequest) {
  const session = await auth()
  
  if (pathname === '/' && !session) {
    return NextResponse.redirect('/auth/signin')
  }
  
  return NextResponse.next()
}
```

### データ保護

1. **入力検証**
   - メッセージの文字数制限
   - HTMLエスケープ処理
   - 悪意のあるコード実行防止

2. **セッション保護**
   - セッションID生成の安全性
   - セッション固定攻撃対策
   - 適切なタイムアウト設定

## エラーハンドリング

### 階層別エラー処理

```typescript
// AIリクエストエラー
try {
  const response = await chat.sendMessage({ message })
  return { response: response.text, success: true }
} catch (error) {
  return { 
    response: `エラーが発生しました: ${String(error)}`,
    success: false,
    error: String(error)
  }
}

// 通信エラー
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message, sessionId })
})

if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`)
}
```

### ユーザー体験

1. **優雅な劣化**
   - AI応答失敗時の代替メッセージ
   - 接続エラー時の再接続機能
   - タイムアウト時の適切な通知

2. **エラー通知**
   - システムメッセージでの通知
   - 非侵入的なエラー表示
   - 回復可能なエラーの自動リトライ

## 監視・ロギング

### ログ設計

```typescript
// サーバーサイドログ
console.log(`Created new chat session for ${sessionId}`)
console.error('Error generating response:', error)

// クライアントサイドログ
console.log('Typewriter started for message:', message.id)
console.log('Connected to server')
```

### 監視項目

1. **パフォーマンス指標**
   - AI応答時間
   - 接続確立時間
   - メモリ使用量

2. **エラー監視**
   - AI APIエラー率
   - 認証失敗率
   - セッションタイムアウト率

## デプロイメント設計

### 環境設定

```bash
# 必須環境変数
AUTH_SECRET=           # NextAuth secret
AUTH_GOOGLE_ID=        # Google OAuth Client ID
AUTH_GOOGLE_SECRET=    # Google OAuth Client Secret
ALLOWED_EMAILS=        # カンマ区切りの許可メールアドレス
GEMINI_API_KEY=        # Google Gemini API キー
```

### ビルド最適化

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    turbo: true        // Turbopack使用
  },
  images: {
    formats: ['image/webp']  // 画像最適化
  }
}
```

### パフォーマンス監視

- Next.js Analytics
- Vercel Speed Insights
- カスタムパフォーマンス計測

---

この技術仕様書は実装の詳細ガイドとして使用し、新機能追加時には適切に更新してください。