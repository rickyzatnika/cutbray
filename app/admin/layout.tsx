import { requireAdmin } from "@/lib/admin"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Zap, LayoutDashboard, Users, CreditCard, ArrowLeft } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin()
  } catch {
    redirect("/login")
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-foreground hover:bg-secondary transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-foreground hover:bg-secondary transition-colors"
          >
            <Users className="w-4 h-4" />
            Users
          </Link>
          <Link
            href="/admin/transactions"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-foreground hover:bg-secondary transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            Transaksi
          </Link>
        </nav>
        <div className="p-3 border-t border-border">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card z-50 flex">
        <Link href="/admin" className="flex-1 flex flex-col items-center py-2 text-xs text-muted-foreground">
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </Link>
        <Link href="/admin/users" className="flex-1 flex flex-col items-center py-2 text-xs text-muted-foreground">
          <Users className="w-5 h-5" />
          Users
        </Link>
        <Link href="/admin/transactions" className="flex-1 flex flex-col items-center py-2 text-xs text-muted-foreground">
          <CreditCard className="w-5 h-5" />
          Transaksi
        </Link>
      </div>

      {/* Content */}
      <main className="flex-1 p-6 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  )
}
