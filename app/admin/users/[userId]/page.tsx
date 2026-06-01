import { notFound, redirect } from "next/navigation"
import { requireAdmin } from "@/lib/admin"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { Transaction } from "@/lib/models/Transaction"
import { TIER_LIMITS, TIER_COLORS } from "@/lib/limits"
import { UserDetailClient } from "./user-detail-client"

export default async function UserDetailPage(props: { params: Promise<{ userId: string }> }) {
  await requireAdmin()
  const { userId } = await props.params
  await connectDB()

  const user = await User.findById(userId).lean()
  if (!user) notFound()

  const transactions = await Transaction.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()

  const serializedUser = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    subscription: {
      tier: user.subscription?.tier || "free",
      paymentVerified: user.subscription?.paymentVerified || false,
      startDate: user.subscription?.startDate?.toISOString() || null,
      endDate: user.subscription?.endDate?.toISOString() || null,
    },
    dailyUsage: {
      date: user.dailyUsage?.date || "",
      count: user.dailyUsage?.count || 0,
    },
    createdAt: (user.createdAt as Date).toISOString(),
  }

  const serializedTx = transactions.map(tx => ({
    _id: tx._id.toString(),
    tier: tx.tier,
    amount: tx.amount,
    status: tx.status,
    paymentMethod: tx.paymentMethod,
    verifiedByAdmin: tx.verifiedByAdmin,
    createdAt: (tx.createdAt as Date).toISOString(),
  }))

  return <UserDetailClient user={serializedUser} transactions={serializedTx} />
}
