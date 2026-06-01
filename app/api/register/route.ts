import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Semua field harus diisi" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 })
    }

    await connectDB()

    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await User.create({
      name,
      email,
      password: hashedPassword,
      subscription: { tier: "free", paymentVerified: false },
    })

    return NextResponse.json({ message: "Registrasi berhasil" }, { status: 201 })
  } catch (error) {
    console.error("[REGISTER]", error)
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
