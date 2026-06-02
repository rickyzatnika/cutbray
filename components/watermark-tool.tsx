"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Download, Upload, Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const POSITIONS = [
  { label: "Top Left", value: "nw" },
  { label: "Top Right", value: "ne" },
  { label: "Bottom Left", value: "sw" },
  { label: "Bottom Right", value: "se" },
  { label: "Center", value: "center" },
]

export function WatermarkTool() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState("")
  const [result, setResult] = useState("")
  const [text, setText] = useState("© cutbray")
  const [fontSize, setFontSize] = useState(32)
  const [opacity, setOpacity] = useState(0.5)
  const [position, setPosition] = useState("se")
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const render = useCallback(() => {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return

    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(img, 0, 0)

    ctx.globalAlpha = opacity
    ctx.fillStyle = "#ffffff"
    ctx.font = `bold ${fontSize * (canvas.width / 800)}px sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    const margin = 40
    let x: number, y: number
    const w = canvas.width
    const h = canvas.height

    switch (position) {
      case "nw": x = margin; y = margin; ctx.textAlign = "left"; ctx.textBaseline = "top"; break
      case "ne": x = w - margin; y = margin; ctx.textAlign = "right"; ctx.textBaseline = "top"; break
      case "sw": x = margin; y = h - margin; ctx.textAlign = "left"; ctx.textBaseline = "bottom"; break
      case "se": x = w - margin; y = h - margin; ctx.textAlign = "right"; ctx.textBaseline = "bottom"; break
      default: x = w / 2; y = h / 2; break
    }

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.fillText(text, 0, 0)
    ctx.restore()

    ctx.globalAlpha = 1

    canvas.toBlob(b => {
      if (b) {
        setResult(URL.createObjectURL(b))
      }
    }, "image/png")
  }, [text, fontSize, opacity, position, rotation])

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) return
    setFile(f)
    const u = URL.createObjectURL(f)
    setUrl(u)
    setResult("")
    const i = new Image()
    i.onload = () => {
      imgRef.current = i
      render()
    }
    i.src = u
  }

  useEffect(() => { if (imgRef.current) render() }, [text, fontSize, opacity, position, rotation, render])

  const download = () => {
    if (!result || !file) return
    const a = document.createElement("a")
    a.href = result
    a.download = `${file.name.replace(/\.[^.]+$/, "")}-watermark.png`
    a.click()
  }

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]) }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {!file && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn("border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors", isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground")}
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Tambah Watermark</p>
          <p className="text-sm text-muted-foreground mt-1">Beri teks watermark di gambar kamu</p>
        </div>
      )}

      {file && (
        <>
          {/* Controls */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-card rounded-lg border border-border">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Teks</label>
              <input value={text} onChange={e => setText(e.target.value)} className="w-full px-2 py-1.5 bg-secondary rounded border border-border text-sm text-foreground" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Ukuran</label>
              <input type="range" min="12" max="120" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full accent-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Opacity</label>
              <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={e => setOpacity(Number(e.target.value))} className="w-full accent-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Rotasi</label>
              <input type="range" min="-90" max="90" value={rotation} onChange={e => setRotation(Number(e.target.value))} className="w-full accent-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Posisi</label>
              <select value={position} onChange={e => setPosition(e.target.value)} className="w-full px-2 py-1.5 bg-secondary rounded border border-border text-sm text-foreground">
                {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Original</p>
              <div className="bg-secondary rounded-lg overflow-hidden">
                <img src={url} alt="" className="w-full object-contain max-h-[400px]" />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Hasil</p>
              <div className="bg-secondary rounded-lg overflow-hidden">
                {result && <img src={result} alt="" className="w-full object-contain max-h-[400px]" />}
              </div>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-2">
            <Button onClick={download} className="flex-1">
              <Download className="w-4 h-4 mr-2" /> Download PNG
            </Button>
            <Button onClick={() => { setFile(null); setUrl(""); setResult(""); imgRef.current = null }} variant="secondary">
              Upload Baru
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
