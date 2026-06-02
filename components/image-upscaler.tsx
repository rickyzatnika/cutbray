"use client"

import { useState, useRef } from "react"
import { Download, Upload, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const SCALES = [
  { label: "2x", value: 2 },
  { label: "3x", value: 3 },
  { label: "4x", value: 4 },
]

export function ImageUpscaler() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState("")
  const [result, setResult] = useState("")
  const [scale, setScale] = useState(2)
  const [sharpness, setSharpness] = useState(0.3)
  const [processing, setProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const unsharpMask = (ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) => {
    const imgData = ctx.getImageData(0, 0, w, h)
    const data = imgData.data
    const blurred = new Uint8ClampedArray(data.length)

    // Simple Gaussian blur (3x3 kernel)
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4
        let r = 0, g = 0, b = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pi = ((y + ky) * w + (x + kx)) * 4
            const wg = kx === 0 && ky === 0 ? 4 : 1
            r += data[pi] * wg
            g += data[pi + 1] * wg
            b += data[pi + 2] * wg
          }
        }
        const sum = 16
        blurred[i] = r / sum
        blurred[i + 1] = g / sum
        blurred[i + 2] = b / sum
        blurred[i + 3] = data[i + 3]
      }
    }

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + amount * (data[i] - blurred[i])))
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + amount * (data[i + 1] - blurred[i + 1])))
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + amount * (data[i + 2] - blurred[i + 2])))
    }
    ctx.putImageData(imgData, 0, 0)
  }

  const upscale = (s?: number) => {
    const img = imgRef.current
    if (!img) return
    const factor = s ?? scale
    setProcessing(true)

    setTimeout(() => {
      const nw = img.naturalWidth * factor
      const nh = img.naturalHeight * factor

      const canvas = document.createElement("canvas")
      canvas.width = nw
      canvas.height = nh
      const ctx = canvas.getContext("2d")!

      // First pass: draw scaled up with high quality
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, 0, 0, nw, nh)

      // Second pass: unsharp mask for sharpness
      if (sharpness > 0) {
        unsharpMask(ctx, nw, nh, sharpness)
      }

      canvas.toBlob(b => {
        if (b) {
          setResult(URL.createObjectURL(b))
          setProcessing(false)
        }
      }, "image/png")
    }, 100)
  }

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) return
    setFile(f)
    const u = URL.createObjectURL(f)
    setUrl(u)
    setResult("")
    const i = new Image()
    i.onload = () => {
      imgRef.current = i
      upscale()
    }
    i.src = u
  }

  const download = () => {
    if (!result || !file) return
    const a = document.createElement("a")
    a.href = result
    a.download = `${file.name.replace(/\.[^.]+$/, "")}-${scale}x.png`
    a.click()
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {!file && (
        <div onClick={() => inputRef.current?.click()} className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-muted-foreground transition-colors">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <ZoomIn className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">AI Upscaler</p>
          <p className="text-sm text-muted-foreground mt-1">Perbesar resolusi gambar 2x, 3x, atau 4x — hasil tetap tajam</p>
        </div>
      )}

      {file && (
        <>
          <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border border-border">
            <span className="text-sm text-muted-foreground">Scale:</span>
            {SCALES.map(s => (
              <button key={s.label} onClick={() => { setScale(s.value); setTimeout(() => upscale(s.value), 50) }} className={cn("px-3 py-1.5 rounded-md border text-xs transition-all", scale === s.value ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground")}>
                {s.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sharpness</span>
              <input type="range" min="0" max="1" step="0.1" value={sharpness} onChange={e => { setSharpness(Number(e.target.value)); setTimeout(() => upscale(), 50) }} className="w-24 accent-primary" />
              <span className="text-xs font-mono">{Math.round(sharpness * 100)}%</span>
            </div>
          </div>

          {processing && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <span className="ml-3 text-sm text-muted-foreground">Processing...</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Original ({imgRef.current?.naturalWidth}x{imgRef.current?.naturalHeight})</p>
              <div className="bg-secondary rounded-lg overflow-hidden">
                <img src={url} alt="" className="w-full object-contain max-h-[350px]" />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Hasil {scale}x ({imgRef.current ? `${imgRef.current.naturalWidth * scale}x${imgRef.current.naturalHeight * scale}` : ""})
              </p>
              <div className="bg-secondary rounded-lg overflow-hidden">
                {result && <img src={result} alt="" className="w-full object-contain max-h-[350px]" />}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={download} className="flex-1" disabled={!result || processing}>
              <Download className="w-4 h-4 mr-2" /> Download {scale}x PNG
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
