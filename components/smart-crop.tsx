"use client"

import { useState, useRef, useEffect } from "react"
import { Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PLATFORMS = [
  { label: "Shopee", dim: "1080x1080", w: 1080, h: 1080 },
  { label: "IG Feed", dim: "1080x1350", w: 1080, h: 1350 },
  { label: "IG Story", dim: "1080x1920", w: 1080, h: 1920 },
  { label: "TikTok", dim: "1080x1920", w: 1080, h: 1920 },
  { label: "Facebook", dim: "1200x628", w: 1200, h: 628 },
  { label: "Twitter", dim: "1200x675", w: 1200, h: 675 },
]

export function SmartCrop() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState("")
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [platform, setPlatform] = useState(PLATFORMS[0])
  const [result, setResult] = useState("")
  const [blob, setBlob] = useState<Blob | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, px: 0, py: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPos({ x: 0, y: 0 })
  }, [platform, img])

  const render = (px: number, py: number) => {
    const el = containerRef.current
    if (!el || !img) return
    const cw = el.clientWidth
    const ch = el.clientHeight

    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    const maxX = (dw - cw) / 2
    const maxY = (dh - ch) / 2
    const ox = Math.max(-maxX, Math.min(maxX, px))
    const oy = Math.max(-maxY, Math.min(maxY, py))

    const imgLeft = (cw - dw) / 2 + ox
    const imgTop = (ch - dh) / 2 + oy

    const sx = Math.max(0, -imgLeft / scale)
    const sy = Math.max(0, -imgTop / scale)
    const sw = Math.min(cw / scale, img.naturalWidth - sx)
    const sh = Math.min(ch / scale, img.naturalHeight - sy)

    const oc = document.createElement("canvas")
    oc.width = platform.w
    oc.height = platform.h
    const ctx = oc.getContext("2d")!
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, platform.w, platform.h)
    oc.toBlob(b => {
      if (b) { setBlob(b); setResult(URL.createObjectURL(b)) }
    }, "image/jpeg", 0.92)
  }

  useEffect(() => {
    if (img) render(pos.x, pos.y)
  }, [pos, img, platform])

  const clampAndRender = (px: number, py: number) => {
    const el = containerRef.current
    if (!el || !img) return
    const cw = el.clientWidth
    const ch = el.clientHeight
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    const maxX = (dw - cw) / 2
    const maxY = (dh - ch) / 2
    setPos({ x: Math.max(-maxX, Math.min(maxX, px)), y: Math.max(-maxY, Math.min(maxY, py)) })
  }

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) return
    setFile(f)
    const u = URL.createObjectURL(f)
    setUrl(u)
    const i = new Image()
    i.onload = () => setImg(i)
    i.src = u
  }

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY, px: pos.x, py: pos.y })
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    clampAndRender(dragStart.px + e.clientX - dragStart.x, dragStart.py + e.clientY - dragStart.y)
  }

  const onMouseUp = () => setDragging(false)

  const download = () => {
    if (!blob) return
    const u = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = u
    a.download = `${platform.label.toLowerCase()}-${platform.w}x${platform.h}.jpg`
    a.click()
    URL.revokeObjectURL(u)
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {!file && (
        <div onClick={() => inputRef.current?.click()} className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-muted-foreground transition-colors">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Crop untuk Marketplace</p>
          <p className="text-sm text-muted-foreground mt-1">Upload foto, atur posisi, download sesuai ukuran platform</p>
        </div>
      )}

      {file && (
        <>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button key={p.label} onClick={() => setPlatform(p)} className={cn("px-3 py-1.5 rounded-md border text-xs transition-all", platform.label === p.label ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground")}>
                {p.label} <span className="text-muted-foreground">({p.dim})</span>
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-lg">
              <p className="text-xs text-muted-foreground mb-2">Drag foto untuk atur posisi</p>
              <div ref={containerRef} className="relative bg-secondary rounded-lg overflow-hidden select-none" style={{ aspectRatio: `${platform.w}/${platform.h}`, maxHeight: 500 }} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
                <div className="w-full h-full" onMouseDown={onMouseDown}>
                  <img src={url} alt="" className={cn("w-full h-full object-cover pointer-events-none", dragging ? "cursor-grabbing" : "cursor-grab")} style={{ objectPosition: `calc(50% + ${pos.x}px) calc(50% + ${pos.y}px)` }} draggable={false} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={download} className="flex-1">
              <Download className="w-4 h-4 mr-2" /> Download {platform.dim}
            </Button>
            <Button onClick={() => { setFile(null); setUrl(""); setImg(null); setResult(""); setBlob(null); setPos({ x: 0, y: 0 }) }} variant="secondary">
              Upload Baru
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
