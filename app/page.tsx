"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { ImageCompressor } from "@/components/image-compressor"
import { BackgroundRemover } from "@/components/background-remover"
import { BulkResizer } from "@/components/bulk-resizer"
import { PasFoto } from "@/components/pas-foto"
import { StickerMaker } from "@/components/sticker-maker"
import { SmartCrop } from "@/components/smart-crop"
import { SiteFooter } from "@/components/site-footer"
import { Zap, Shield, Sparkles, Maximize, FileDown, LogIn, LayoutDashboard, UserCog, Camera, Smile, Crop, Server, Lock, Cpu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Tool = "compress" | "remove-bg" | "resize" | "pas-foto" | "sticker" | "smart-crop"

const tools = [
  { id: "compress" as Tool, label: "Compress", icon: FileDown, description: "Reduce file size" },
  { id: "remove-bg" as Tool, label: "Remove BG", icon: Sparkles, description: "AI background removal" },
  { id: "resize" as Tool, label: "Resize", icon: Maximize, description: "Bulk resize images" },
  { id: "pas-foto" as Tool, label: "Pas Foto", icon: Camera, description: "Bikin pas foto online" },
  { id: "sticker" as Tool, label: "Sticker", icon: Smile, description: "Buat sticker WA" },
  { id: "smart-crop" as Tool, label: "Crop", icon: Crop, description: "Crop buat marketplace" },
]

const toolIdMap: Record<string, Tool> = {
  compress: "compress",
  "remove-bg": "remove-bg",
  resize: "resize",
  "pas-foto": "pas-foto",
  sticker: "sticker",
  "smart-crop": "smart-crop",
}

export default function Home() {
  const [activeTool, setActiveTool] = useState<Tool>("compress")
  const { data: session } = useSession()

  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (hash && toolIdMap[hash]) setActiveTool(toolIdMap[hash])
  }, [])

  const switchTool = (id: Tool) => {
    setActiveTool(id)
    window.history.replaceState(null, "", `#${id}`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">cutbray</span>
          </Link>
          <div className="flex items-center gap-3">
            {session ? (
              <>
                {session.user?.role === "admin" ? (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm">
                      <UserCog className="w-4 h-4 mr-1" />
                      Admin
                    </Button>
                  </Link>
                ) : (
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      <LayoutDashboard className="w-4 h-4 mr-1" />
                      Dashboard
                    </Button>
                  </Link>
                )}
                <span className="text-sm text-muted-foreground hidden sm:block">{session.user?.name}</span>
                <Button variant="secondary" size="sm" onClick={() => signOut()}>
                  Keluar
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/pricing">
                  <Button variant="ghost" size="sm">Harga</Button>
                </Link>
                <Link href="/login">
                  <Button variant="default" size="sm">
                    <LogIn className="w-4 h-4 mr-1" />
                    Masuk
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-4xl mx-auto text-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary mb-6">
              <Cpu className="w-3 h-3" />
              100% client-side — data kamu tetap aman
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight text-balance leading-[1.1]">
              Compress, hapus background,{" "}
              <span className="text-accent">resize & crop</span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Semua tool image gratis yang jalan di browser kamu. Tanpa upload server, tanpa ribet.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              {tools.slice(0, 3).map(t => {
                const Icon = t.icon
                return (
                  <button key={t.id} onClick={() => switchTool(t.id)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors text-sm text-foreground">
                    <Icon className="w-4 h-4 text-primary" />
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Tool Section */}
        <section id="tools" className="pb-12 px-4">
          {/* Tool Tabs */}
          <div className="max-w-2xl mx-auto mb-8 overflow-x-auto">
            <div className="flex bg-card border border-border rounded-lg p-1 min-w-max">
              {tools.map(tool => {
                const Icon = tool.icon
                return (
                  <button
                    key={tool.id}
                    onClick={() => switchTool(tool.id)}
                    className={cn(
                      "flex items-center gap-1.5 py-2.5 px-3 rounded-md transition-all whitespace-nowrap",
                      activeTool === tool.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tool.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active Tool */}
          <div className="max-w-6xl mx-auto">
            {activeTool === "compress" && <ImageCompressor />}
            {activeTool === "remove-bg" && <BackgroundRemover />}
            {activeTool === "resize" && <BulkResizer />}
            {activeTool === "pas-foto" && <PasFoto />}
            {activeTool === "sticker" && <StickerMaker />}
            {activeTool === "smart-crop" && <SmartCrop />}
          </div>
        </section>

        {/* Trust Features */}
        <section className="border-t border-border bg-card/30">
          <div className="max-w-5xl mx-auto px-4 py-16">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
              Kenapa ribuan orang pake <span className="text-accent">Cutbray</span>?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-14 h-14 mx-auto bg-secondary rounded-2xl flex items-center justify-center mb-4">
                  <Server className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">100% Client-Side</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Semua proses jalan di browser kamu. Kami tidak punya server yang lihat gambar kamu.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-14 h-14 mx-auto bg-secondary rounded-2xl flex items-center justify-center mb-4">
                  <Lock className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Privasi Terjamin</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Gambar kamu gak pernah diupload. Aman buat dokumen pribadi, KTP, atau foto sensitif.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-14 h-14 mx-auto bg-secondary rounded-2xl flex items-center justify-center mb-4">
                  <Zap className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Gratis Selamanya</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Semua fitur dasar gratis tanpa batas. Upgrade cuma kalau butuh fitur tambahan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Banner */}
        <section className="border-t border-border">
          <div className="max-w-3xl mx-auto px-4 py-12 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Shield className="w-4 h-4 text-accent" />
              No servers. No uploads. No tracking.
            </div>
            <p className="text-sm text-muted-foreground">
              Cutbray dibangun dengan privasi-by-design. Semua tool menggunakan WebAssembly, Canvas API, dan AI model yang jalan langsung di browser kamu.
            </p>
            <Link href="/privacy" className="inline-block mt-4 text-sm text-primary hover:underline">
              Pelajari lebih lanjut →
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
