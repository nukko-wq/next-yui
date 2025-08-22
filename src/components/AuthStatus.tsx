'use client'

import { signOut, useSession } from 'next-auth/react'

export default function AuthStatus() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="text-green-400/60">認証状態を確認中...</div>
  }

  if (session?.user) {
    return (
      <div className="space-y-2">
        <div className="text-green-300 font-bold">認証済み</div>
        <div className="text-xs space-y-1 text-green-400/70">
          <div>ユーザー: {session.user.name}</div>
          <div>メール: {session.user.email}</div>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="w-full border border-red-400/30 p-2 hover:bg-red-400/10 transition-colors duration-200 text-red-400 text-xs"
        >
          サインアウト
        </button>
      </div>
    )
  }

  return <div className="text-red-400">未認証</div>
}
