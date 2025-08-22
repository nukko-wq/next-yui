import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl

  // 認証が必要なパス（ルートパス '/' 以外のすべて）
  const protectedPaths = ['/']

  // 認証不要のパス
  const publicPaths = ['/auth/signin', '/auth/error']

  // パブリックパスは認証をスキップ
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // プロテクトされたパスで未認証の場合はサインインページにリダイレクト
  if (
    protectedPaths.some(
      (path) => pathname === path || pathname.startsWith(path),
    )
  ) {
    if (!req.auth) {
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  return NextResponse.next()
})

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
