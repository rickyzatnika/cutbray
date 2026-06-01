import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { Transaction } from "@/lib/models/Transaction"
import { getPrice } from "@/lib/midtrans"

export async function PATCH(req: Request, props: { params: Promise<{ userId: string }> }) {
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

    const { userId } = await props.params
    const body = await req.json()

    const updateData: Record<string, any> = {}

    if (body.role) {
      if (!["user", "admin"].includes(body.role)) {
        return NextResponse.json({ error: "Role tidak valid" }, { status: 400 })
      }
      updateData.role = body.role
    }

    if (body.subscription) {
      const { tier, paymentVerified } = body.subscription
      if (tier && !["free", "pro", "ultra"].includes(tier)) {
        return NextResponse.json({ error: "Tier tidak valid" }, { status: 400 })
      }

      const subData: Record<string, any> = {}
      if (tier) subData.tier = tier
      if (typeof paymentVerified === "boolean") subData.paymentVerified = paymentVerified

      if (tier && tier !== "free") {
        subData.startDate = new Date()
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + 1)
        subData.endDate = endDate
      } else if (tier === "free") {
        subData.startDate = null
        subData.endDate = null
        subData.paymentVerified = false
      }

      updateData.subscription = subData
    }

    const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Sync transaction kalo admin set subscription ke paid tier + verified
    if (body.subscription?.tier && body.subscription.tier !== "free" && body.subscription.paymentVerified) {
      const hasSuccessTx = await Transaction.findOne({
        user: userId,
        tier: body.subscription.tier,
        status: "success",
      })
      if (!hasSuccessTx) {
        const pendingTx = await Transaction.findOneAndUpdate(
          { user: userId, tier: body.subscription.tier, status: "pending" },
          { $set: { status: "success", verifiedByAdmin: true, verifiedAt: new Date() } },
          { sort: { createdAt: -1 } }
        )
        if (!pendingTx) {
          await Transaction.create({
            user: userId,
            tier: body.subscription.tier,
            amount: getPrice(body.subscription.tier),
            status: "success",
            paymentMethod: "demo",
            paymentRef: "ADMIN-MANUAL",
            verifiedByAdmin: true,
            verifiedAt: new Date(),
          })
        }
      }
    }

    const msg = body.subscription ? "Subscription diupdate" : "Role diupdate"
    return NextResponse.json({ message: msg, user: { role: user.role, subscription: user.subscription } })
  } catch (error) {
    console.error("[ADMIN_USER_PATCH]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ userId: string }> }) {
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

    const { userId } = await props.params
    if (userId === admin._id.toString()) {
      return NextResponse.json({ error: "Tidak bisa hapus diri sendiri" }, { status: 400 })
    }

    await User.findByIdAndDelete(userId)
    await Transaction.deleteMany({ user: userId })

    return NextResponse.json({ message: "User dan transaksi berhasil dihapus" })
  } catch (error) {
    console.error("[ADMIN_USER_DELETE]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
