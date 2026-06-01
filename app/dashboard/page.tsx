import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { Transaction } from "@/lib/models/Transaction"
import { TIER_LIMITS, TIER_COLORS, type Tier } from "@/lib/limits"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UpgradeCard } from "./upgrade-card"
import { isMidtransConfigured } from "@/lib/midtrans"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  await connectDB()
  const user = await User.findOne({ email: session.user.email })

  // Auto-heal 1: ada transaksi sukses tapi belum verified
  if (user && user.subscription?.tier !== "free" && !user.subscription?.paymentVerified) {
    const healedTx = await Transaction.findOne({
      user: user._id,
      tier: user.subscription.tier,
      status: "success",
    }).sort({ createdAt: -1 })
    if (healedTx) {
      await User.findByIdAndUpdate(user._id, {
        $set: { "subscription.paymentVerified": true },
      })
      user.subscription!.paymentVerified = true
    }
  }

  // Auto-heal 2: paymentVerified true tapi ga ada transaksi sukses → reset
  if (user && user.subscription?.tier !== "free" && user.subscription?.paymentVerified) {
    const successTx = await Transaction.findOne({
      user: user._id,
      tier: user.subscription.tier,
      status: "success",
    }).sort({ createdAt: -1 })
    if (!successTx) {
      await User.findByIdAndUpdate(user._id, {
        $set: {
          "subscription.paymentVerified": false,
          "subscription.tier": "free",
          "subscription.startDate": null,
          "subscription.endDate": null,
        },
      })
      user.subscription!.paymentVerified = false
      user.subscription!.tier = "free"
    }
  }

  const tier = (user?.subscription?.tier || "free") as Tier

  const transactions = await Transaction.find({ user: user?._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">cutbray</span>
          </a>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{session.user.name}</span>
            <form
              action={async () => {
                "use server"
                await signOut()
              }}
            >
              <Button type="submit" variant="secondary" size="sm">
                Keluar
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl font-bold text-foreground mb-8">Dashboard</h1>

        {/* Subscription Status */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Subscription</p>
              <p className={`text-2xl font-bold capitalize ${TIER_COLORS[tier]}`}>{tier}</p>
              {tier !== "free" && user?.subscription?.endDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Aktif sampai {new Date(user.subscription.endDate).toLocaleDateString("id-ID")}
                </p>
              )}
            </div>
          </div>

          {tier !== "free" && !user?.subscription?.paymentVerified && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-600">
              Pembayaranmu sedang menunggu verifikasi admin. Kamu masih dalam mode Free sampai diverifikasi.
            </div>
          )}
        </div>

        {/* Upgrade Card */}
        <UpgradeCard currentTier={tier} userId={user?._id.toString() || ""} isDemo={!isMidtransConfigured()} />

        {/* Transaction History */}
        {transactions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Riwayat Transaksi</h2>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tier</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Verifikasi</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: any) => (
                    <tr key={tx._id.toString()} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-foreground font-medium capitalize">{tx.tier}</td>
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
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {tx.verifiedByAdmin ? "✅" : "⏳"}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
