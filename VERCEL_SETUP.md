# Vercelデプロイメント設定ガイド

## 1. Google OAuth設定

### Google Cloud Console設定
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新規プロジェクトを作成または既存プロジェクトを選択
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「OAuth 2.0 クライアントID」を選択
5. アプリケーションの種類：「ウェブアプリケーション」
6. 承認済みのリダイレクトURIに追加：
   ```
   https://your-app-name.vercel.app/api/auth/callback/google
   ```
7. クライアントIDとクライアントシークレットをメモ

## 2. Vercel環境変数設定

Vercelダッシュボードの「Settings」→「Environment Variables」で以下を設定：

### 必須環境変数
```bash
# NextAuth.js
AUTH_SECRET=ランダムな32文字以上の文字列
NEXTAUTH_URL=https://your-app-name.vercel.app

# Google OAuth
AUTH_GOOGLE_ID=Google Cloud Consoleで取得したクライアントID
AUTH_GOOGLE_SECRET=Google Cloud Consoleで取得したクライアントシークレット

# Gemini API (既存)
GEMINI_API_KEY=あなたのGemini APIキー
```

### AUTH_SECRETの生成
以下のコマンドでランダムな文字列を生成できます：
```bash
openssl rand -base64 32
```

## 3. ホワイトリスト設定

`auth.ts`ファイルの`ALLOWED_EMAILS`配列に許可するメールアドレスを追加：

```typescript
const ALLOWED_EMAILS = [
  "your-email@gmail.com",
  "admin@yourdomain.com",
  // 他の許可するメールアドレス...
]
```

## 4. デプロイ手順

1. GitHubにプッシュ
2. Vercelで新規プロジェクトを作成
3. GitHubリポジトリを接続
4. 環境変数を設定
5. デプロイ実行

## 5. 動作確認

デプロイ後、以下を確認：

1. `https://your-app-name.vercel.app/auth/signin`でログインページにアクセス
2. Googleアカウントでサインイン試行
3. ホワイトリストに登録されたメールのみアクセス可能か確認
4. 未許可メールでのアクセスが拒否されるか確認

## 6. セキュリティ注意事項

- `AUTH_SECRET`は本番環境で必ず変更
- Google OAuth設定で承認済みドメインを正確に設定
- ホワイトリストを定期的に見直し
- 不要になったアカウントは速やかに削除

## 7. トラブルシューティング

### よくある問題
1. **OAuth callback mismatch**: Google Cloud ConsoleのリダイレクトURIを確認
2. **AUTH_SECRET missing**: 環境変数が正しく設定されているか確認
3. **Session not found**: Cookieの設定やドメインを確認
4. **Access denied**: ホワイトリストにメールアドレスが追加されているか確認