"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, Download, Sparkles, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { removeBackground } from "@imgly/background-removal"

const STICKER_SIZE = 512

export function StickerMaker() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [resultPreview, setResultPreview] = useState("")
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [status, setStatus] = useState<"idle" | "processing" | "ready">("idle")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const process = useCallback(async (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStatus("processing")

    try {
      const noBg = await removeBackground(f, { progress: () => {} })

      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = URL.createObjectURL(noBg)
      })

      const canvas = document.createElement("canvas")
      canvas.width = STICKER_SIZE
      canvas.height = STICKER_SIZE
      const ctx = canvas.getContext("2d")!

      const scale = Math.min(STICKER_SIZE / img.width, STICKER_SIZE / img.height) * 0.85
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const x = (STICKER_SIZE - w) / 2
      const y = (STICKER_SIZE - h) / 2

      ctx.drawImage(img, x, y, w, h)

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob failed")), "image/webp", 0.9)
      )
      setResultBlob(blob)
      setResultPreview(URL.createObjectURL(blob))
      setStatus("ready")
    } catch {
      setStatus("idle")
    }
  }, [])

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return
    process(f)
  }, [process])

  const download = useCallback(() => {
    if (!resultBlob) return
    const url = URL.createObjectURL(resultBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sticker.webp"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [resultBlob])

  const reset = useCallback(() => {
    setFile(null)
    setPreview("")
    setResultPreview("")
    setResultBlob(null)
    setStatus("idle")
  }, [])

  return (
    <div className="w-full max-w-3xl mx-auto">
      {status === "idle" && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-muted-foreground transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Smile className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Buat Sticker WhatsApp</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload gambar, background dihapus, jadi sticker 512x512 WebP
          </p>
        </div>
      )}

      {status === "processing" && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Membuat sticker...</p>
          <p className="text-xs text-muted-foreground">Remove BG + convert WebP</p>
        </div>
      )}

      {status === "ready" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Original</p>
              <div className="aspect-square bg-secondary rounded-lg overflow-hidden">
                <img src={preview} alt="" className="w-full h-full object-contain" />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Sticker (512x512)</p>
              <div className="aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgZmlsbD0iI2ZmZiIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIi8+PHJlY3QgZmlsbD0iI2UwZTBlMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIi8+PHJlY3QgZmlsbD0iI2UwZTBlMCIgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiLz48L3N2Zz4=')] rounded-lg overflow-hidden">
                {resultPreview && (
                  <img src={resultPreview} alt="" className="w-full h-full object-contain" />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={download} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download Sticker (.webp)
            </Button>
            <Button onClick={reset} variant="secondary">
              Buat Lagi
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
