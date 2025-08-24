# API 設計書

## 概要

Next-YUIのREST API仕様とSocket.IO通信プロトコルの詳細設計です。

## REST API仕様

### 共通仕様

#### ベースURL
- **開発環境**: `http://localhost:3000`
- **本番環境**: `https://{domain}`

#### 共通レスポンス形式

```typescript
interface BaseResponse {
  success: boolean
  error?: string
  timestamp?: string
}

interface ChatResponse extends BaseResponse {
  response: string
  sessionId?: string
  model?: string
  processing?: boolean
  action?: string
}
```

#### 認証
- すべてのAPI呼び出しはNextAuth.jsによる認証が必要
- セッションCookieまたはJWTトークンによる認証

### エンドポイント詳細

#### 1. チャット API

##### POST /api/chat
AIとの会話メッセージを送信

**リクエスト**
```typescript
interface ChatRequest {
  message: string       // 送信メッセージ（必須）
  sessionId: string     // セッションID（必須）
}
```

**レスポンス**
```typescript
interface ChatResponse {
  response: string      // AI応答テキスト
  success: boolean      // 成功フラグ
  model: string         // 使用モデル名
  sessionId: string     // セッションID
  error?: string        // エラーメッセージ
}
```

**使用例**
```bash
curl -X POST /api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "こんにちは",
    "sessionId": "session_123"
  }'
```

**レスポンス例**
```json
{
  "response": "こんにちは！今日はどんなお話をしましょうか？",
  "success": true,
  "model": "gemini-2.0-flash",
  "sessionId": "session_123"
}
```

**エラーレスポンス**
```json
{
  "response": "メッセージが空です。",
  "success": false,
  "error": "empty_message"
}
```

##### GET /api/chat
会話履歴を取得

**パラメータ**
- `sessionId` (string, required): セッションID

**レスポンス**
```typescript
interface HistoryResponse {
  history: Content[]    // 会話履歴配列
  success: boolean      // 成功フラグ
  sessionId: string     // セッションID
  error?: string        // エラーメッセージ
}

interface Content {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}
```

**使用例**
```bash
curl -X GET "/api/chat?sessionId=session_123"
```

**レスポンス例**
```json
{
  "history": [
    {
      "role": "user",
      "parts": [{ "text": "こんにちは" }]
    },
    {
      "role": "model", 
      "parts": [{ "text": "こんにちは！..." }]
    }
  ],
  "success": true,
  "sessionId": "session_123"
}
```

##### DELETE /api/chat
セッションをクリア（会話履歴削除）

**リクエスト**
```typescript
interface ClearRequest {
  sessionId: string     // セッションID（必須）
}
```

**レスポンス**
```typescript
interface ClearResponse {
  response: string      // 完了メッセージ
  success: boolean      // 成功フラグ
  action: string        // 実行アクション
  error?: string        // エラーメッセージ
}
```

**使用例**
```bash
curl -X DELETE /api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session_123"}'
```

**レスポンス例**
```json
{
  "response": "会話履歴をクリアしました。",
  "success": true,
  "action": "session_cleared"
}
```

#### 2. ヘルスチェック API

##### GET /api/health
システム状態を確認

**レスポンス**
```typescript
interface HealthResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  services: {
    gemini_initialized: boolean
    active_sessions: number
    memory_usage?: number
  }
  version?: string
}
```

**使用例**
```bash
curl -X GET /api/health
```

**レスポンス例**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "gemini_initialized": true,
    "active_sessions": 5
  },
  "version": "0.1.0"
}
```

#### 3. 認証 API

##### GET|POST /api/auth/[...nextauth]
NextAuth.js認証エンドポイント

NextAuth.jsが自動的に処理するため、詳細な仕様は[NextAuth.js公式ドキュメント](https://authjs.dev/)を参照。

**主要エンドポイント**
- `GET /api/auth/signin` - サインインページ
- `POST /api/auth/signin/google` - Googleサインイン
- `POST /api/auth/signout` - サインアウト
- `GET /api/auth/session` - セッション情報取得

#### 4. Socket接続 API（開発環境専用）

##### GET /api/socket
Socket.IOサーバーを初期化

**レスポンス**
```typescript
interface SocketResponse {
  message: string
  socketId?: string
}
```

## Socket.IO通信仕様（開発環境）

### 接続

```typescript
import { io } from 'socket.io-client'

const socket = io('/', {
  path: '/socket.io/'
})
```

### イベント一覧

#### クライアント → サーバー

##### 1. message
メッセージ送信

**ペイロード**
```typescript
interface MessagePayload {
  message: string
}
```

**使用例**
```javascript
socket.emit('message', { message: 'こんにちは' })
```

##### 2. clear_session
セッション クリア

**ペイロード**: なし

**使用例**
```javascript
socket.emit('clear_session')
```

#### サーバー → クライアント

##### 1. connect
接続確立

**ペイロード**: なし

##### 2. disconnect  
接続切断

**ペイロード**: なし

##### 3. status
セッション状態通知

**ペイロード**
```typescript
interface SessionStatus {
  connected: boolean
  message: string
  sessionId: string
  timestamp?: string
}
```

**使用例**
```javascript
socket.on('status', (data) => {
  console.log(`Status: ${data.message}`)
  console.log(`Session: ${data.sessionId}`)
})
```

##### 4. response
AI応答受信

**ペイロード**
```typescript
interface ChatResponse {
  response: string
  success: boolean
  model?: string
  sessionId?: string
  error?: string
  processing?: boolean
}
```

**使用例**
```javascript
socket.on('response', (data) => {
  if (data.success) {
    console.log(`AI Response: ${data.response}`)
  } else {
    console.error(`Error: ${data.error}`)
  }
})
```

## エラーコード一覧

### HTTP ステータスコード

| コード | 意味 | 使用箇所 |
|-------|------|----------|
| 200 | 成功 | 正常なリクエスト |
| 400 | リクエスト不正 | パラメータ不足・不正 |
| 401 | 認証失敗 | 未認証アクセス |
| 403 | アクセス拒否 | 権限不足 |
| 500 | サーバーエラー | AI API エラー等 |

### カスタムエラーコード

| エラーコード | 説明 | 対処法 |
|-------------|------|---------|
| `empty_message` | メッセージが空 | 有効なメッセージを送信 |
| `missing_session_id` | セッションID不足 | セッションIDを含める |
| `api_not_initialized` | AI API未初期化 | APIキー確認・サーバー再起動 |
| `empty_response` | AI応答が空 | リクエスト再送信 |
| `session_failed` | セッション作成失敗 | しばらく待ってリトライ |

## レート制限

### API制限

- **チャット API**: 1分間に60リクエスト/セッション
- **ヘルスチェック**: 制限なし
- **履歴取得**: 1分間に30リクエスト/セッション

### Gemini API制限

- Google Gemini APIの制限に準拠
- リクエスト失敗時は適切なリトライロジックを実装

## 監視・ロギング

### リクエストログ

```typescript
// 成功ログ
{
  timestamp: "2024-01-01T00:00:00Z",
  method: "POST",
  url: "/api/chat",
  sessionId: "session_123",
  responseTime: 1500,
  status: 200
}

// エラーログ
{
  timestamp: "2024-01-01T00:00:00Z", 
  method: "POST",
  url: "/api/chat",
  sessionId: "session_123",
  error: "empty_message",
  status: 400
}
```

### パフォーマンス指標

- **平均応答時間**: < 2秒
- **AI応答時間**: < 3秒  
- **成功率**: > 99%
- **エラー率**: < 1%

## 開発・テスト

### APIテストの実行

```bash
# 開発サーバー起動
npm run dev

# APIテスト（例：curl）
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"テストメッセージ","sessionId":"test_session"}'
```

### モック設定

開発時には環境変数でモックモードを有効にできます：

```bash
MOCK_AI_RESPONSES=true npm run dev
```

### WebSocketテスト

```javascript
// Socket.IOクライアントテスト
const socket = io('http://localhost:3000')

socket.on('connect', () => {
  console.log('Connected')
  socket.emit('message', { message: 'テスト' })
})

socket.on('response', (data) => {
  console.log('Response:', data)
})
```

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| 0.1.0 | 2024-01-01 | 初期版作成 |

---

この API 設計書は実装の参考として使用し、機能追加・変更時には適切に更新してください。