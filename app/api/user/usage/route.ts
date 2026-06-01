import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const today = new Date().toISOString().split("T")[0]
    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.dailyUsage?.date === today) {
      user.dailyUsage.count += 1
    } else {
      user.dailyUsage = { date: today, count: 1 }
    }

    await user.save()

    return NextResponse.json({ usage: user.dailyUsage })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
