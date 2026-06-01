import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { Transaction } from "@/lib/models/Transaction"
import { TIER_LIMITS, type Tier } from "@/lib/limits"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({
        tier: "free",
        limits: TIER_LIMITS.free,
        usage: { date: "", count: 0 },
      })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({
        tier: "free",
        limits: TIER_LIMITS.free,
        usage: { date: "", count: 0 },
      })
    }

    // Admin all access — skip subscription checks
    if (user.role === "admin") {
      return NextResponse.json({
        tier: "ultra",
        limits: TIER_LIMITS.ultra,
        usage: user.dailyUsage || { date: "", count: 0 },
        paymentVerified: true,
      })
    }

    let tier = (user.subscription?.tier || "free") as Tier
    let paymentVerified = user.subscription?.paymentVerified || false

    // Auto-heal 1: tier non-free tapi belum verified, cek transaksi sukses
    if (tier !== "free" && !paymentVerified) {
      const successTx = await Transaction.findOne({
        user: user._id,
        tier,
        status: "success",
      }).sort({ createdAt: -1 })

      if (successTx) {
        await User.findByIdAndUpdate(user._id, {
          $set: { "subscription.paymentVerified": true },
        })
        paymentVerified = true
      }
    }

    // Auto-heal 2: paymentVerified true tapi ga ada transaksi sukses → reset
    if (tier !== "free" && paymentVerified) {
      const successTx = await Transaction.findOne({
        user: user._id,
        tier,
        status: "success",
      })
      if (!successTx) {
        await User.findByIdAndUpdate(user._id, {
          $set: {
            "subscription.paymentVerified": false,
            "subscription.tier": "free",
            "subscription.startDate": null,
            "subscription.endDate": null,
          },
        })
        tier = "free"
        paymentVerified = false
      }
    }

    const canAccess = tier === "free" || paymentVerified

    return NextResponse.json({
      tier: canAccess ? tier : "free",
      limits: TIER_LIMITS[canAccess ? tier : "free"],
      usage: user.dailyUsage || { date: "", count: 0 },
      paymentVerified,
    })
  } catch {
    return NextResponse.json({
      tier: "free",
      limits: TIER_LIMITS.free,
      usage: { date: "", count: 0 },
    })
  }
}
