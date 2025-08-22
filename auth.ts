import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

// 許可されたメールアドレスのリスト
const ALLOWED_EMAILS = [
  // ここに許可したいメールアドレスを追加
  'example@gmail.com',
  'your-email@gmail.com',
]

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? '',
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        // メールアドレスのホワイトリストをチェック
        return ALLOWED_EMAILS.includes(profile.email)
      }
      return false
    },
    async session({ session }) {
      return session
    },
    async jwt({ token }) {
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
})
