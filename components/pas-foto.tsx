"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Upload, Download, Sparkles, Check, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { removeBackground } from "@imgly/background-removal"

const BG_COLORS = [
  { label: "Merah", value: "#D32F2F" },
  { label: "Biru", value: "#1565C0" },
  { label: "Putih", value: "#FFFFFF" },
]

const PHOTO_SIZES = [
  { label: "2x3", width: 600, height: 900, desc: "2x3 cm (300 dpi)" },
  { label: "3x4", width: 900, height: 1200, desc: "3x4 cm (300 dpi)" },
  { label: "4x6", width: 1200, height: 1800, desc: "4x6 cm (300 dpi)" },
]

export function PasFoto() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [transparentBlob, setTransparentBlob] = useState<Blob | null>(null)
  const [status, setStatus] = useState<"idle" | "processing" | "ready">("idle")
  const [bgColor, setBgColor] = useState(BG_COLORS[0].value)
  const [size, setSize] = useState(PHOTO_SIZES[0])
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultPreview, setResultPreview] = useState("")
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStatus("processing")
    setResultBlob(null)
    setResultPreview("")

    try {
      const blob = await removeBackground(f, {
        progress: () => {},
      })
      setTransparentBlob(blob)
      setStatus("ready")
      renderPreview(blob, BG_COLORS[0].value, PHOTO_SIZES[0], 1, { x: 0, y: 0 })
    } catch {
      setStatus("idle")
    }
  }, [])

  const renderPreview = async (blob: Blob, color: string, sz: typeof PHOTO_SIZES[0], z: number, off: typeof offset) => {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = URL.createObjectURL(blob)
    })

    const canvas = document.createElement("canvas")
    canvas.width = sz.width
    canvas.height = sz.height
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = color
    ctx.fillRect(0, 0, sz.width, sz.height)

    const baseScale = (sz.height * 0.92) / img.height
    const finalScale = baseScale * z
    const w = Math.round(img.width * finalScale)
    const h = Math.round(img.height * finalScale)
    const x = Math.round((sz.width - w) / 2 + off.x)
    const y = Math.round((sz.height - h) / 2 + off.y)

    ctx.drawImage(img, x, y, w, h)

    const outBlob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob failed")), "image/jpeg", 0.95)
    )
    setResultBlob(outBlob)
    setResultPreview(URL.createObjectURL(outBlob))
  }

  const handleColorChange = (color: string) => {
    setBgColor(color)
    if (transparentBlob) renderPreview(transparentBlob, color, size, zoom, offset)
  }

  const handleSizeChange = (sz: typeof PHOTO_SIZES[0]) => {
    setSize(sz)
    if (transparentBlob) renderPreview(transparentBlob, bgColor, sz, zoom, offset)
  }

  const handleZoomChange = (z: number) => {
    setZoom(z)
    if (transparentBlob) renderPreview(transparentBlob, bgColor, size, z, offset)
  }

  const handleDragStart = (e: React.MouseEvent) => {
    setDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handleDragMove = (e: React.MouseEvent) => {
    if (!dragging) return
    const newOff = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }
    setOffset(newOff)
    if (transparentBlob) renderPreview(transparentBlob, bgColor, size, zoom, newOff)
  }

  const handleDragEnd = () => setDragging(false)

  useEffect(() => {
    window.addEventListener("mouseup", handleDragEnd)
    return () => window.removeEventListener("mouseup", handleDragEnd)
  }, [])

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return
    processFile(f)
  }, [processFile])

  const downloadResult = useCallback(() => {
    if (!resultBlob) return
    const url = URL.createObjectURL(resultBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pas-foto-${size.label.replace("x", "_")}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [resultBlob, size])

  // Cleanup
  const reset = useCallback(() => {
    setFile(null)
    setPreview("")
    setTransparentBlob(null)
    setResultBlob(null)
    setResultPreview("")
    setStatus("idle")
    setBgColor(BG_COLORS[0].value)
    setSize(PHOTO_SIZES[0])
    setZoom(1)
    setOffset({ x: 0, y: 0 })
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
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Upload foto untuk pas foto online</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload selfie, background akan dihapus otomatis
          </p>
        </div>
      )}

      {status === "processing" && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Memproses foto...</p>
        </div>
      )}

      {status === "ready" && (
        <div className="space-y-6">
          {/* Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Original</p>
              <div className="aspect-[3/4] bg-secondary rounded-lg overflow-hidden">
                <img src={preview} alt="" className="w-full h-full object-contain" />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Hasil ({size.label}) — geser untuk atur posisi</p>
              <div
                className="bg-secondary rounded-lg overflow-hidden mx-auto relative cursor-grab active:cursor-grabbing select-none"
                style={{ aspectRatio: `${size.width}/${size.height}`, maxHeight: 400 }}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
              >
                {resultPreview && (
                  <img src={resultPreview} alt="" className="w-full h-full object-contain pointer-events-none" draggable={false} />
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            {/* Background Color */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Background</p>
              <div className="flex gap-2">
                {BG_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => handleColorChange(c.value)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-md border text-sm transition-all",
                      bgColor === c.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <span
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: c.value }}
                    />
                    {c.label}
                    {bgColor === c.value && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Ukuran</p>
              <div className="flex gap-2">
                {PHOTO_SIZES.map(s => (
                  <button
                    key={s.label}
                    onClick={() => handleSizeChange(s)}
                    className={cn(
                      "px-4 py-2 rounded-md border text-sm transition-all",
                      size.label === s.label
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Zoom: {Math.round(zoom * 100)}%
              </p>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.05}
                value={zoom}
                onChange={e => handleZoomChange(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button onClick={downloadResult} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download JPG
              </Button>
              <Button onClick={reset} variant="secondary">
                Baru
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
