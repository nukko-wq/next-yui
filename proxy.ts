import { type NextRequest, NextResponse } from 'next/server'
import { auth } from './auth'

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 認証不要のパス
  const publicPaths = ['/auth/signin', '/auth/error', '/api/auth']

  // パブリックパスは認証をスキップ
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 認証状態を確認
  const session = await auth()

  // ルートパスで未認証の場合はサインインページにリダイレクト
  if (pathname === '/' && !session) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - socket.io (Socket.IO requests)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|socket.io).*)',
  ],
}
