import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

// 環境変数から許可されたメールアドレスのリストを取得
const getAllowedEmails = (): string[] => {
  const allowedEmails = process.env.ALLOWED_EMAILS
  if (!allowedEmails) {
    console.warn('ALLOWED_EMAILS environment variable is not set')
    return []
  }
  return allowedEmails.split(',').map(email => email.trim())
}

const ALLOWED_EMAILS = getAllowedEmails()

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
