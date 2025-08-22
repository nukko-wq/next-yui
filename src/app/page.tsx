'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import YuiChat from '@/components/YuiChat'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // まだロード中

    if (!session) {
      // 未認証の場合はサインインページにリダイレクト
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  // ロード中の表示
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold text-green-300">YUI (結)</div>
          <div className="text-green-400/70">認証状態を確認中...</div>
          <div className="animate-pulse text-green-400">●●●</div>
        </div>
      </div>
    )
  }

  // 未認証の場合は何も表示しない（リダイレクト中）
  if (!session) {
    return null
  }

  // 認証済みの場合のみYuiChatを表示
  return <YuiChat />
}
