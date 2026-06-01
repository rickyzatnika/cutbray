import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { Transaction } from "@/lib/models/Transaction"
import { TIER_LIMITS, type Tier } from "@/lib/limits"
import { getPrice, isMidtransConfigured, createMidtransTransaction, demoPayment } from "@/lib/midtrans"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Harus login dulu" }, { status: 401 })
    }

    const { tier } = (await req.json()) as { tier: Tier }
    if (!tier || tier === "free") {
      return NextResponse.json({ error: "Tier tidak valid" }, { status: 400 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    // Cek subscription aktif
    const activeSub = user.subscription
    if (activeSub.tier !== "free" && activeSub.paymentVerified && activeSub.endDate && new Date(activeSub.endDate) > new Date()) {
      return NextResponse.json({ error: "Kamu sudah punya subscription aktif" }, { status: 400 })
    }

    const amount = getPrice(tier)
    const orderId = `SQ-${Date.now()}-${user._id.toString().slice(-6)}`

    // Cancel pending transaction sebelumnya untuk tier yang sama
    await Transaction.updateMany(
      { user: user._id, tier, status: "pending" },
      { $set: { status: "failed" } }
    )

    // Simpan transaction dulu
    const transaction = await Transaction.create({
      user: user._id,
      tier,
      amount,
      status: "pending",
      paymentMethod: isMidtransConfigured() ? "midtrans" : "demo",
      paymentRef: "",
    })

    if (isMidtransConfigured()) {
      // Mode Midtrans
      const midtrans = await createMidtransTransaction({
        orderId,
        grossAmount: amount,
        customerName: user.name || "User",
        customerEmail: user.email,
        tier,
      })

      transaction.paymentRef = orderId
      await transaction.save()

      return NextResponse.json({
        mode: "midtrans",
        token: midtrans.token,
        redirectUrl: midtrans.redirect_url,
        transactionId: transaction._id,
      })
    } else {
      // Mode Demo — langsung auto-verified
      const result = demoPayment()
      await Transaction.findByIdAndUpdate(transaction._id, {
        $set: {
          status: "success",
          verifiedByAdmin: true,
          verifiedAt: new Date(),
          paymentRef: result.transactionId,
        },
      })

      // Update user subscription (langsung aktif)
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1)

      await User.findByIdAndUpdate(user._id, {
        $set: {
          subscription: {
            tier,
            startDate: new Date(),
            endDate,
            paymentVerified: true,
          },
        },
      })

      // TODO: send email automation
      // sendEmail({ to: user.email, subject: "Pembayaran Sukses", ... })

      return NextResponse.json({
        mode: "demo",
        success: true,
        transactionId: transaction._id,
        tier,
        endDate: endDate.toISOString(),
        message: "Pembayaran berhasil! Package sekarang aktif.",
      })
    }
  } catch (error) {
    console.error("[TRANSACTION_CREATE]", error)
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
