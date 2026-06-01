import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"

// Seed admin — panggil ini sekali aja pas pertama kali
export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 })
    }

    await connectDB()

    const existingAdmin = await User.findOne({ role: "admin" })
    if (existingAdmin) {
      return NextResponse.json({
        message: "Admin sudah ada",
        admin: { name: existingAdmin.name, email: existingAdmin.email },
      })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ error: "User dengan email tersebut tidak ditemukan" }, { status: 404 })
    }

    user.role = "admin"
    await user.save()

    return NextResponse.json({
      message: `User ${email} sekarang jadi admin`,
      user: { name: user.name, email: user.email, role: user.role },
    })
  } catch (error) {
    console.error("[SEED_ADMIN]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
