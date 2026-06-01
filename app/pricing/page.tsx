"use client"

import { Zap, Check, X } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { TIER_LIMITS, TIER_COLORS, formatPrice, type Tier } from "@/lib/limits"

const FEATURES = [
  { key: "maxFileSizeMB", label: "Maks ukuran file", type: "fileSize" as const },
  { key: "batchSize", label: "Batch per proses", type: "value" as const },
  { key: "highRes", label: "High resolution", type: "bool" as const },
]

export default function PricingPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const tiers = Object.entries(TIER_LIMITS) as [Tier, typeof TIER_LIMITS[Tier]][]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Squish</span>
          </a>
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Kembali
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-16 w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground">Harga Terjangkau</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Pilih paket yang sesuai dengan kebutuhanmu
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map(([tier, limits]) => {
            const isFree = tier === "free"
            const isPopular = tier === "pro"

            return (
              <div
                key={tier}
                className={`relative rounded-xl border p-6 flex flex-col ${
                  isPopular
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-card"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                    Paling Populer
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-lg font-semibold ${TIER_COLORS[tier]}`}>
                    {limits.label}
                  </h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-foreground">
                      {limits.price}
                    </span>
                    {!isFree && (
                      <span className="text-sm text-muted-foreground ml-1">
                        /bulan
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 flex-1 mb-6">
                  {FEATURES.map(feature => {
                    const val = limits[feature.key as keyof typeof limits]
                    return (
                      <li key={feature.key} className="flex items-center gap-3 text-sm">
                        {feature.type === "bool" ? (
                          val ? (
                            <Check className="w-4 h-4 text-green-500 shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground shrink-0" />
                          )
                        ) : (
                          <Check className="w-4 h-4 text-green-500 shrink-0" />
                        )}
                        <span className="text-foreground">
                          {feature.type === "fileSize"
                            ? `${val}MB`
                            : feature.type === "value"
                            ? `${val} gambar`
                            : val}
                        </span>
                        <span className="text-muted-foreground">
                          {feature.label}
                        </span>
                      </li>
                    )
                  })}
                </ul>

                <button
                  onClick={() => {
                    if (!session) {
                      router.push("/login")
                    } else if (isFree) {
                      router.push("/")
                    } else {
                      router.push("/dashboard")
                    }
                  }}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isPopular
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : isFree
                      ? "bg-secondary text-foreground hover:bg-secondary/80"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {isFree ? "Mulai Gratis" : "Upgrade Sekarang"}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Pembayaran akan diverifikasi oleh admin sebelum akses premium aktif.
        </p>
      </main>
    </div>
  )
}
