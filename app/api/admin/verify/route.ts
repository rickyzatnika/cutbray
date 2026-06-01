import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { Transaction } from "@/lib/models/Transaction"

export async function POST(req: Request) {
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

    const { transactionId, verified } = await req.json()

    const transaction = await Transaction.findById(transactionId)
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (verified) {
      transaction.verifiedByAdmin = true
      transaction.verifiedAt = new Date()
      await transaction.save()

      // Update user subscription
      const user = await User.findById(transaction.user)
      if (user) {
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + 1)

        user.subscription = {
          tier: transaction.tier as "pro" | "ultra",
          startDate: new Date(),
          endDate,
          paymentVerified: true,
        }
        await user.save()
      }
    }

    return NextResponse.json({ message: verified ? "Terverifikasi" : "Dibatalkan" })
  } catch (error) {
    console.error("[ADMIN_VERIFY]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
