import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Transaction } from "@/lib/models/Transaction"
import { User } from "@/lib/models/User"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { transaction_status, order_id } = body

    await connectDB()

    const transaction = await Transaction.findOne({ paymentRef: order_id })
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (transaction_status === "settlement" || transaction_status === "capture") {
      transaction.status = "success"

      const user = await User.findById(transaction.user)
      if (user) {
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + 1)
        user.subscription = {
          tier: transaction.tier,
          startDate: new Date(),
          endDate,
          paymentVerified: false,
        }
        await user.save()
      }
    } else if (["deny", "expire", "cancel"].includes(transaction_status)) {
      transaction.status = "failed"
    }

    await transaction.save()

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[MIDTRANS_WEBHOOK]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
