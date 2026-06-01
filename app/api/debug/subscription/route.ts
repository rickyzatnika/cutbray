import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { Transaction } from "@/lib/models/Transaction"
import { getPrice } from "@/lib/midtrans"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email }).lean()
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const transactions = await Transaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean()

    const tier = user.subscription?.tier || "free"
    const paymentVerified = user.subscription?.paymentVerified || false
    const isPaid = tier !== "free"

    const fixes: string[] = []
    let txFixed = false

    // Fix 1: tier non-free tapi belum verified — set paymentVerified + sync transaction
    if (isPaid && !paymentVerified) {
      await User.updateOne(
        { email: session.user.email },
        { $set: { "subscription.paymentVerified": true } }
      )
      fixes.push("Auto-heal: paymentVerified → true")

      // Mark pending transaction as success
      const pendingTx = await Transaction.findOneAndUpdate(
        { user: user._id, tier, status: "pending" },
        { $set: { status: "success", verifiedByAdmin: true, verifiedAt: new Date() } },
        { sort: { createdAt: -1 } }
      )
      if (pendingTx) {
        txFixed = true
        fixes.push(`Transaction ${pendingTx._id} → success`)
      }
    }

    // Fix 2: paymentVerified udah true tapi ga ada success transaction
    if (isPaid && paymentVerified) {
      const hasSuccessTx = transactions.some(
        (t: any) => t.status === "success" && t.tier === tier
      )
      if (!hasSuccessTx) {
        const pendingTx = await Transaction.findOneAndUpdate(
          { user: user._id, tier, status: "pending" },
          { $set: { status: "success", verifiedByAdmin: true, verifiedAt: new Date() } },
          { sort: { createdAt: -1 }, new: true }
        )
        if (pendingTx) {
          txFixed = true
          fixes.push(`Transaction ${pendingTx._id} pending → success`)
        } else {
          // Ga ada pending transaction, create baru
          await Transaction.create({
            user: user._id,
            tier,
            amount: getPrice(tier),
            status: "success",
            paymentMethod: "demo",
            paymentRef: "DEBUG-AUTO-FIX",
            verifiedByAdmin: true,
            verifiedAt: new Date(),
          })
          txFixed = true
          fixes.push("Transaction baru dibuat (success)")
        }
      }
    }

    // Re-fetch after fixes
    const [userAfter, transactionsAfter] = await Promise.all([
      User.findOne({ email: session.user.email }).lean(),
      txFixed
        ? Transaction.find({ user: user._id }).sort({ createdAt: -1 }).lean()
        : null,
    ])

    return NextResponse.json({
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        subscription: user.subscription,
      },
      transactions: transactions.map((t: any) => ({
        _id: t._id?.toString(),
        tier: t.tier,
        amount: t.amount,
        status: t.status,
        verifiedByAdmin: t.verifiedByAdmin,
        paymentMethod: t.paymentMethod,
        createdAt: t.createdAt,
      })),
      fixes,
      autoHealTriggered: fixes.length > 0,
      userAfterFix: userAfter
        ? { subscription: userAfter.subscription }
        : null,
      transactionsAfter: transactionsAfter
        ? transactionsAfter.map((t: any) => ({
            _id: t._id?.toString(),
            tier: t.tier,
            status: t.status,
            verifiedByAdmin: t.verifiedByAdmin,
          }))
        : null,
    })
  } catch (error) {
    console.error("[DEBUG_SUBSCRIPTION]", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
