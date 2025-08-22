'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'AccessDenied':
        return 'アクセスが拒否されました。許可されたメールアドレスではありません。'
      case 'Signin':
        return 'サインイン中にエラーが発生しました。'
      case 'OAuthSignin':
        return 'OAuth認証でエラーが発生しました。'
      case 'OAuthCallback':
        return 'OAuth認証の処理中にエラーが発生しました。'
      case 'OAuthCreateAccount':
        return 'アカウントの作成中にエラーが発生しました。'
      case 'EmailCreateAccount':
        return 'メール認証でアカウント作成中にエラーが発生しました。'
      case 'Callback':
        return '認証コールバック中にエラーが発生しました。'
      case 'OAuthAccountNotLinked':
        return 'このアカウントは既に別の認証方法でリンクされています。'
      case 'EmailSignin':
        return 'メール送信中にエラーが発生しました。'
      case 'CredentialsSignin':
        return '認証情報が正しくありません。'
      case 'SessionRequired':
        return 'このページにアクセスするにはサインインが必要です。'
      default:
        return '認証中に予期しないエラーが発生しました。'
    }
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="border border-red-400/30 p-6">
            <div className="text-2xl font-bold text-red-300 mb-2">
              認証エラー
            </div>
            <div className="text-red-400/70">ACCESS DENIED</div>
          </div>
        </div>

        {/* Error Message */}
        <div className="border border-red-400/30 p-6 space-y-4">
          <div className="text-center">
            <div className="text-red-300 font-bold mb-2">エラー詳細</div>
            <div className="text-sm text-red-400/90 leading-relaxed">
              {getErrorMessage(error)}
            </div>
          </div>

          {error === 'AccessDenied' && (
            <div className="border-t border-red-400/20 pt-4 text-xs text-red-400/70">
              <div className="mb-2">
                管理者に連絡して、アクセス許可を依頼してください：
              </div>
              <ul className="list-disc list-inside space-y-1">
                <li>使用したメールアドレスを伝える</li>
                <li>アクセス理由を説明する</li>
                <li>許可までお待ちください</li>
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="block w-full text-center border border-green-400/30 p-3 hover:bg-green-400/10 transition-colors duration-200 text-green-400"
          >
            再度サインインを試す
          </Link>

          <Link
            href="/"
            className="block w-full text-center border border-gray-400/30 p-3 hover:bg-gray-400/10 transition-colors duration-200 text-gray-400"
          >
            ホームページに戻る
          </Link>
        </div>

        {/* Debug Info */}
        {error && (
          <div className="border border-gray-400/20 p-4 text-xs">
            <div className="text-gray-400 mb-1">Debug Info:</div>
            <div className="text-gray-500 font-mono">Error Code: {error}</div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-red-400/40 space-y-1">
          <div>&gt; SECURITY SYSTEM ACTIVE</div>
          <div>&gt; Unauthorized Access Prevented</div>
        </div>
      </div>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-red-400">
          Loading...
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  )
}
