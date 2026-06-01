"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

interface UserData {
  _id: string
  name: string
  email: string
  role: string
  subscription: {
    tier: string
    paymentVerified: boolean
    startDate?: string
    endDate?: string
  }
  dailyUsage: {
    date: string
    count: number
  }
  createdAt: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID")
}

export function AdminUserTable({ users: initial }: { users: UserData[] }) {
  const router = useRouter()
  const [users, setUsers] = useState(initial)
  const [search, setSearch] = useState("")

  const filtered = users.filter(
    u =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin"
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    })
    if (res.ok) {
      setUsers(prev =>
        prev.map(u => (u._id === userId ? { ...u, role: newRole } : u))
      )
    }
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari user..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Nama</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Email</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Role</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tier</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Verified</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Daftar</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  User tidak ditemukan
                </td>
              </tr>
            ) : (
              filtered.map(u => (
                <tr
                  key={u._id}
                  onClick={() => router.push(`/admin/users/${u._id}`)}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-3 text-foreground">{u.name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        u.role === "admin"
                          ? "bg-purple-500/10 text-purple-500"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-foreground">{u.subscription.tier}</td>
                  <td className="px-4 py-3">
                    {u.subscription.paymentVerified ? (
                      <span className="text-green-500">✅</span>
                    ) : (
                      <span className="text-muted-foreground">❌</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={e => { e.stopPropagation(); toggleAdmin(u._id, u.role) }}
                      className="text-xs text-primary hover:underline"
                    >
                      {u.role === "admin" ? "Revoke Admin" : "Jadikan Admin"}
                    </button>
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
