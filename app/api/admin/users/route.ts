import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const admin = await User.findOne({ email: session.user.email })
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId, role } = await req.json()
    if (!userId || !["user", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Role updated", role: user.role })
  } catch (error) {
    console.error("[ADMIN_USERS]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
