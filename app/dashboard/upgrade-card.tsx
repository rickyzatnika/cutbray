"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { TIER_LIMITS, TIER_COLORS, formatPrice, type Tier } from "@/lib/limits"

interface UpgradeCardProps {
  currentTier: Tier
  userId: string
  isDemo: boolean
}

export function UpgradeCard({ currentTier, isDemo }: UpgradeCardProps) {
  const router = useRouter()
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [snapReady, setSnapReady] = useState(false)
  const snapRef = useRef<HTMLScriptElement | null>(null)

  useEffect(() => {
    if (isDemo || snapRef.current) return
    const isProd = !process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.startsWith("SB-")
    const script = document.createElement("script")
    script.src = isProd
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js"
    script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "")
    script.async = true
    script.onload = () => setSnapReady(true)
    document.body.appendChild(script)
    snapRef.current = script

    return () => {
      if (snapRef.current?.parentNode) {
        snapRef.current.parentNode.removeChild(snapRef.current)
      }
    }
  }, [isDemo])

  const handleUpgrade = async (tier: Tier) => {
    setSelectedTier(tier)
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/transaction/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({ success: false, message: data.error || "Gagal memproses" })
        setLoading(false)
        return
      }

      if (data.mode === "midtrans" && data.token) {
        const snap = (window as any).snap
        if (snap) {
          snap.pay(data.token, {
            onSuccess: async () => {
              try {
                await fetch("/api/transaction/after-payment", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ transactionId: data.transactionId }),
                })
              } catch {}
              setResult({ success: true, message: "Pembayaran berhasil! Menunggu verifikasi admin." })
              setLoading(false)
              router.refresh()
            },
            onPending: () => {
              setResult({ success: true, message: "Pembayaran sedang diproses." })
              setLoading(false)
            },
            onError: () => {
              setResult({ success: false, message: "Pembayaran gagal. Coba lagi." })
              setLoading(false)
            },
            onClose: () => {
              setLoading(false)
            },
          })
        } else {
          setResult({ success: false, message: "Midtrans Snap belum siap. Refresh halaman." })
          setLoading(false)
        }
      } else if (data.mode === "demo") {
        setResult({ success: true, message: data.message })
        setLoading(false)
        router.refresh()
      }
    } catch {
      setResult({ success: false, message: "Terjadi kesalahan. Coba lagi." })
      setLoading(false)
    }
  }

  const paidTiers = Object.entries(TIER_LIMITS).filter(
    ([key]) => key !== "free"
  ) as [Tier, (typeof TIER_LIMITS)[Tier]][]

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Upgrade Paket</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {paidTiers.map(([tier, limits]) => {
          const isCurrent = tier === currentTier

          return (
            <div
              key={tier}
              className={`relative rounded-xl border p-5 ${
                isCurrent
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <h3 className={`text-lg font-semibold ${TIER_COLORS[tier]}`}>
                {limits.label}
              </h3>
              <p className="text-2xl font-bold text-foreground mt-1">
                {limits.price}
                <span className="text-sm text-muted-foreground font-normal">/bulan</span>
              </p>

              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  Batch: {limits.batchSize} gambar
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  Max file: {limits.maxFileSizeMB}MB
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  {limits.dailyLimit === Infinity ? "Unlimited" : `${limits.dailyLimit} gambar/hari`}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  High-res: {limits.highRes ? "✅" : "❌"}
                </li>
              </ul>

              <button
                onClick={() => handleUpgrade(tier)}
                disabled={loading || isCurrent}
                className={`w-full mt-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  loading && selectedTier === tier
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : isCurrent
                    ? "bg-secondary/50 text-muted-foreground cursor-not-allowed"
                    : tier === "pro"
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {loading && selectedTier === tier ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : isCurrent ? (
                  "Paket Saat Ini"
                ) : (
                  "Pilih"
                )}
              </button>
            </div>
          )
        })}
      </div>

      {result && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm border ${
            result.success
              ? "bg-green-500/10 border-green-500/30 text-green-600"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          {result.message}
        </div>
      )}

      {isDemo && (
        <p className="mt-3 text-xs text-muted-foreground">
          Mode demo aktif — pembayaran langsung sukses tanpa biaya.
        </p>
      )}
    </div>
  )
}
