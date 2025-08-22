import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  // Socket.IOの初期化（開発環境での対応）
  if (process.env.NODE_ENV === 'development') {
    // 開発環境でのSocket.IO初期化は別途対応が必要
    return new Response('Socket.IO endpoint - use WebSocket connection', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }

  return new Response('Socket.IO server initialized', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
