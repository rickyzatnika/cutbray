import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { redirect } from "next/navigation"

export async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  await connectDB()
  const user = await User.findOne({ email: session.user.email })

  if (!user || user.role !== "admin") redirect("/")

  return { session, user }
}
