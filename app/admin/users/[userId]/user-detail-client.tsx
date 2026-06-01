"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { TIER_LIMITS, TIER_COLORS } from "@/lib/limits"

interface UserData {
  _id: string
  name: string
  email: string
  role: string
  subscription: {
    tier: string
    paymentVerified: boolean
    startDate: string | null
    endDate: string | null
  }
  dailyUsage: { date: string; count: number }
  createdAt: string
}

interface TxData {
  _id: string
  tier: string
  amount: number
  status: string
  paymentMethod: string
  verifiedByAdmin: boolean
  createdAt: string
}

export function UserDetailClient({ user: initial, transactions }: { user: UserData; transactions: TxData[] }) {
  const router = useRouter()
  const [user, setUser] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")

  const updateSubscription = async (tier: string, paymentVerified: boolean) => {
    setLoading(true)
    setMsg("")
    const res = await fetch(`/api/admin/users/${user._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: { tier, paymentVerified } }),
    })
    const data = await res.json()
    if (res.ok) {
      setUser(prev => ({
        ...prev,
        subscription: { ...prev.subscription, tier, paymentVerified },
      }))
      setMsg("Subscription berhasil diupdate")
    } else {
      setMsg(data.error || "Gagal update")
    }
    setLoading(false)
  }

  const toggleRole = async () => {
    setLoading(true)
    setMsg("")
    const newRole = user.role === "admin" ? "user" : "admin"
    const res = await fetch(`/api/admin/users/${user._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) {
      setUser(prev => ({ ...prev, role: newRole }))
      setMsg(`Role diubah ke ${newRole}`)
    }
    setLoading(false)
  }

  const deleteUser = async () => {
    if (!confirm(`Yakin hapus user ${user.name}?`)) return
    setLoading(true)
    const res = await fetch(`/api/admin/users/${user._id}`, { method: "DELETE" })
    if (res.ok) {
      router.push("/admin/users")
    }
    setLoading(false)
  }

  const tiers = ["free", "pro", "ultra"] as const

  return (
    <div>
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{user.name || "Tanpa Nama"}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleRole} disabled={loading} className="px-3 py-1.5 text-xs rounded-lg bg-secondary text-foreground hover:bg-secondary/80">
            {user.role === "admin" ? "Revoke Admin" : "Jadikan Admin"}
          </button>
          <button onClick={deleteUser} disabled={loading} className="px-3 py-1.5 text-xs rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {msg && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-green-500/10 border border-green-500/30 text-green-600">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Management */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="font-semibold text-foreground mb-4">Manage Subscription</h2>
          <p className="text-xs text-muted-foreground mb-3">Saat ini: <span className={`font-medium ${TIER_COLORS[user.subscription.tier as keyof typeof TIER_COLORS]}`}>{user.subscription.tier.toUpperCase()}</span></p>

          <div className="space-y-2">
            {tiers.map(t => {
              const isActive = t === user.subscription.tier && user.subscription.paymentVerified
              return (
                <button
                  key={t}
                  onClick={() => updateSubscription(t, t !== "free")}
                  disabled={loading || isActive}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-all ${
                    isActive
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background text-foreground hover:border-muted-foreground"
                  }`}
                >
                  <span className="font-medium capitalize">{t}</span>
                  <span className="text-muted-foreground">{TIER_LIMITS[t as keyof typeof TIER_LIMITS]?.price || "Rp0"}</span>
                </button>
              )
            })}
          </div>

          {user.subscription.tier !== "free" && user.subscription.startDate && (
            <div className="mt-4 text-xs text-muted-foreground">
              <p>Mulai: {new Date(user.subscription.startDate).toLocaleDateString("id-ID")}</p>
              {user.subscription.endDate && (
                <p>Berakhir: {new Date(user.subscription.endDate).toLocaleDateString("id-ID")}</p>
              )}
            </div>
          )}
        </div>

        {/* Usage & Info */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="font-semibold text-foreground mb-3">Info User</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="text-foreground">{user.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daftar</span>
                <span className="text-foreground">{new Date(user.createdAt).toLocaleDateString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily Usage</span>
                <span className="text-foreground">{user.dailyUsage.count} gambar ({user.dailyUsage.date || "—"})</span>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="font-semibold text-foreground mb-3">Riwayat Transaksi</h2>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada transaksi</p>
            ) : (
              <div className="space-y-2">
                {transactions.map(tx => (
                  <div key={tx._id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                    <div>
                      <span className="capitalize text-foreground">{tx.tier}</span>
                      <span className="text-muted-foreground ml-2">Rp{tx.amount.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        tx.status === "success" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {tx.status}
                      </span>
                      {tx.verifiedByAdmin && <span className="text-xs text-green-500">✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
