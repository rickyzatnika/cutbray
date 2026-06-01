"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, CheckCircle2, XCircle } from "lucide-react"

interface TxData {
  _id: string
  user: { _id: string; name: string; email: string }
  tier: string
  amount: number
  status: string
  paymentMethod: string
  paymentRef: string
  verifiedByAdmin: boolean
  createdAt: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID")
}

export function TransactionTable({ transactions: initial }: { transactions: TxData[] }) {
  const router = useRouter()
  const [txs, setTxs] = useState(initial)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<string>("all")

  const filtered = txs.filter(tx => {
    const matchSearch =
      tx.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      tx.user?.email?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === "all" ||
      (filter === "unverif" && tx.status === "success" && !tx.verifiedByAdmin) ||
      (filter === "verified" && tx.verifiedByAdmin) ||
      (filter === "pending" && tx.status === "pending") ||
      (filter === "success" && tx.status === "success")
    return matchSearch && matchFilter
  })

  const handleVerify = async (txId: string, verified: boolean) => {
    const res = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId: txId, verified }),
    })
    if (res.ok) {
      setTxs(prev =>
        prev.map(tx =>
          tx._id === txId ? { ...tx, verifiedByAdmin: verified } : tx
        )
      )
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari user..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Semua</option>
          <option value="unverif">Pending Verifikasi</option>
          <option value="verified">Terverifikasi</option>
          <option value="pending">Pending Payment</option>
          <option value="success">Sukses</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">User</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tier</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Method</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Jumlah</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Tanggal</th>
              <th className="text-center px-4 py-3 text-muted-foreground font-medium">Verifikasi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Transaksi tidak ditemukan
                </td>
              </tr>
            ) : (
              filtered.map(tx => (
                <tr key={tx._id} className="border-b border-border last:border-0">
                  <td
                    className="px-4 py-3 cursor-pointer hover:text-primary"
                    onClick={() => tx.user?._id && router.push(`/admin/users/${tx.user._id}`)}
                  >
                    <div className="text-foreground">{tx.user?.name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{tx.user?.email}</div>
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
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{tx.paymentMethod}</td>
                  <td className="px-4 py-3 text-right text-foreground">
                    Rp{tx.amount.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatDate(tx.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {tx.verifiedByAdmin ? (
                      <span className="text-green-500 text-xs flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : tx.status === "success" ? (
                      <button
                        onClick={() => handleVerify(tx._id, true)}
                        className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:opacity-90 transition-opacity"
                      >
                        Verifikasi
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
