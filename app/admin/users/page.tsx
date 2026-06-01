import { requireAdmin } from "@/lib/admin"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { AdminUserTable } from "./user-table"

export default async function AdminUsersPage() {
  await requireAdmin()
  await connectDB()

  const users = await User.find()
    .sort({ createdAt: -1 })
    .lean()

  const serialized = users.map(u => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    subscription: {
      tier: u.subscription?.tier || "free",
      paymentVerified: u.subscription?.paymentVerified || false,
      startDate: u.subscription?.startDate?.toISOString() || null,
      endDate: u.subscription?.endDate?.toISOString() || null,
    },
    dailyUsage: {
      date: u.dailyUsage?.date || "",
      count: u.dailyUsage?.count || 0,
    },
    createdAt: (u.createdAt as Date).toISOString(),
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Manage Users</h1>
      <AdminUserTable users={serialized} />
    </div>
  )
}
