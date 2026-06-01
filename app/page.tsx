"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { ImageCompressor } from "@/components/image-compressor"
import { BackgroundRemover } from "@/components/background-remover"
import { BulkResizer } from "@/components/bulk-resizer"
import { Zap, Shield, Sparkles, Maximize, FileDown, LogIn, LayoutDashboard, UserCog } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Tool = "compress" | "remove-bg" | "resize"

const tools = [
  { id: "compress" as Tool, label: "Compress", icon: FileDown, description: "Reduce file size" },
  { id: "remove-bg" as Tool, label: "Remove BG", icon: Sparkles, description: "AI background removal" },
  { id: "resize" as Tool, label: "Resize", icon: Maximize, description: "Bulk resize images" },
]

export default function Home() {
  const [activeTool, setActiveTool] = useState<Tool>("compress")
  const { data: session } = useSession()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">cutbray</span>
          </div>
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
              <Link href="/login">
                <Button variant="default" size="sm">
                  <LogIn className="w-4 h-4 mr-1" />
                  Masuk
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight text-balance">
              Image tools that just work.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Compress, remove backgrounds, and resize images. All in your browser, 100% private.
            </p>
          </div>

          {/* Tool Tabs */}
          <div className="max-w-md mx-auto mb-12">
            <div className="flex bg-card border border-border rounded-lg p-1">
              {tools.map(tool => {
                const Icon = tool.icon
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-md transition-all",
                      activeTool === tool.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{tool.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active Tool */}
          <div className="px-4">
            {activeTool === "compress" && <ImageCompressor />}
            {activeTool === "remove-bg" && <BackgroundRemover />}
            {activeTool === "resize" && <BulkResizer />}
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-card/50">
          <div className="max-w-5xl mx-auto px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto bg-secondary rounded-full flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">
                  Process images in seconds using advanced browser-based algorithms.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto bg-secondary rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">100% Private</h3>
                <p className="text-sm text-muted-foreground">
                  Your images never leave your device. All processing happens locally.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto bg-secondary rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">AI Powered</h3>
                <p className="text-sm text-muted-foreground">
                  Smart background removal using AI that runs entirely in your browser.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4">
        <div className="max-w-5xl mx-auto text-center text-sm text-muted-foreground">
          Built with speed in mind. No ads. No tracking.
        </div>
      </footer>
    </div>
  )
}
