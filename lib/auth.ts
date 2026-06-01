import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { connectDB } from "./mongodb"
import { User } from "./models/User"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }

        await connectDB()
        const user = await User.findOne({ email })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || "user"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB()
        const existing = await User.findOne({ email: user.email })
        if (!existing) {
          await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            emailVerified: new Date(),
            subscription: { tier: "free", paymentVerified: false },
          })
        }
      }
      return true
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  session: { strategy: "jwt" },
})
