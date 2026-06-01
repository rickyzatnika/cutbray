import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Transaction } from "@/lib/models/Transaction"
import { User } from "@/lib/models/User"

// Midtrans webhook handler
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { transaction_status, order_id, signature_key, status_code, gross_amount } = body

    // Validasi signature (production)
    // const serverKey = process.env.MIDTRANS_SERVER_KEY!
    // const computedSig = crypto.createHash("sha512").update(order_id + status_code + gross_amount + serverKey).digest("hex")
    // if (computedSig !== signature_key) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    // }

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
          paymentVerified: false, // admin verify
        }
        await user.save()
      }
    } else if (transaction_status === "deny" || transaction_status === "expire" || transaction_status === "cancel") {
      transaction.status = "failed"
    }

    await transaction.save()

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[MIDTRANS_NOTIFICATION]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
