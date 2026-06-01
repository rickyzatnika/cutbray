import { requireAdmin } from "@/lib/admin"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { Transaction } from "@/lib/models/Transaction"
import Link from "next/link"
import { Users, CreditCard, DollarSign, TrendingUp } from "lucide-react"

export default async function AdminDashboard() {
  await requireAdmin()
  await connectDB()

  const [totalUsers, totalTransactions, pendingVerifications, revenueAgg] = await Promise.all([
    User.countDocuments(),
    Transaction.countDocuments(),
    Transaction.countDocuments({ status: "success", verifiedByAdmin: false }),
    Transaction.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ])

  const revenue = revenueAgg[0]?.total || 0

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users },
    { label: "Transaksi", value: totalTransactions, icon: CreditCard },
    { label: "Pending Verify", value: pendingVerifications, icon: TrendingUp },
    { label: "Revenue", value: `Rp${revenue.toLocaleString("id-ID")}`, icon: DollarSign },
  ]

  const recentTransactions = await Transaction.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("user", "name email")
    .lean()

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard Admin</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-xs">{stat.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Recent Transactions */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-foreground">Transaksi Terbaru</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">User</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tier</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Jumlah</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Belum ada transaksi
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx: any) => (
                  <tr key={tx._id.toString()} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${tx.user?._id}`} className="text-foreground hover:text-primary transition-colors">
                        {tx.user?.name || tx.user?.email || "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize text-foreground">{tx.tier}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          tx.status === "success"
                            ? "bg-green-500/10 text-green-500"
                            : tx.status === "failed"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        {tx.status}
                        {tx.status === "success" && !tx.verifiedByAdmin && " (unverif)"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">
                      Rp{tx.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
