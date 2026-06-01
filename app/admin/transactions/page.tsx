import { requireAdmin } from "@/lib/admin"
import { connectDB } from "@/lib/mongodb"
import { Transaction } from "@/lib/models/Transaction"
import { TransactionTable } from "./transaction-table"

export default async function AdminTransactionsPage() {
  await requireAdmin()
  await connectDB()

  const transactions = await Transaction.find()
    .sort({ createdAt: -1 })
    .populate("user", "name email")
    .lean()

  const serialized = transactions.map(tx => {
    const u = tx.user as any
    return {
      _id: tx._id.toString(),
      user: u ? {
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
      } : { _id: "", name: "", email: "" },
      tier: tx.tier,
      amount: tx.amount,
      status: tx.status,
      paymentMethod: tx.paymentMethod,
      paymentRef: tx.paymentRef,
      verifiedByAdmin: tx.verifiedByAdmin,
      createdAt: (tx.createdAt as Date).toISOString(),
    }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Verifikasi Transaksi</h1>
      <TransactionTable transactions={serialized} />
    </div>
  )
}
