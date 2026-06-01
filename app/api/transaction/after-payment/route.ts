import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Transaction } from "@/lib/models/Transaction"
import { User } from "@/lib/models/User"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { transactionId } = await req.json()
    if (!transactionId) {
      return NextResponse.json({ error: "transactionId required" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const transaction = await Transaction.findById(transactionId)
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (transaction.user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (transaction.status !== "pending") {
      return NextResponse.json({
        status: transaction.status,
        message: "Transaction already processed",
      })
    }

    transaction.status = "success"
    await transaction.save()

    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)
    user.subscription = {
      tier: transaction.tier,
      startDate: new Date(),
      endDate,
      paymentVerified: false,
    }
    await user.save()

    return NextResponse.json({ success: true, tier: transaction.tier })
  } catch (error) {
    console.error("[AFTER_PAYMENT]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
