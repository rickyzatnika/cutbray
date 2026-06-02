"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Download, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const SCALES = [
  { label: "2x", value: 2 },
  { label: "4x", value: 4 },
]

export function ImageUpscaler() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState("")
  const [result, setResult] = useState("")
  const [scale, setScale] = useState(4)
  const [processing, setProcessing] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [modelLoading, setModelLoading] = useState(false)
  const [useCanvas, setUseCanvas] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const upscalerRef = useRef<any>(null)

  const loadModel = useCallback(async (s: number) => {
    upscalerRef.current = null
    setModelLoaded(false)
    setModelLoading(true)
    try {
      const tf = await import("@tensorflow/tfjs")
      await tf.ready()
      try { await tf.setBackend("webgl") } catch { await tf.setBackend("cpu") }
      const Upscaler = (await import("upscaler")).default
      const modelModule = s === 4
        ? await import("@upscalerjs/esrgan-slim/4x")
        : await import("@upscalerjs/esrgan-slim/2x")
      upscalerRef.current = new Upscaler({ model: modelModule.default })
      setModelLoaded(true)
    } catch {
      setUseCanvas(true)
      setModelLoaded(true)
    }
    setModelLoading(false)
  }, [])

  useEffect(() => { loadModel(scale) }, [])

  const handleScaleChange = async (s: number) => {
    setScale(s)
    setResult("")
    setUseCanvas(false)
    await loadModel(s)
  }

  const upscaleWithAI = async (): Promise<string> => {
    return upscalerRef.current.upscale(url)
  }

  const upscale = () => {
    if (!url) return
    setProcessing(true)

    if (useCanvas || !upscalerRef.current) {
      const img = new Image()
      img.onload = () => {
        const c = document.createElement("canvas")
        c.width = img.naturalWidth * scale
        c.height = img.naturalHeight * scale
        const ctx = c.getContext("2d")!
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, 0, 0, c.width, c.height)
        setResult(c.toDataURL("image/png"))
        setProcessing(false)
      }
      img.src = url
      return
    }

    upscaleWithAI()
      .then(r => { setResult(r); setProcessing(false) })
      .catch(() => {
        const img = new Image()
        img.onload = () => {
          const c = document.createElement("canvas")
          c.width = img.naturalWidth * scale
          c.height = img.naturalHeight * scale
          const ctx = c.getContext("2d")!
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"
          ctx.drawImage(img, 0, 0, c.width, c.height)
          setResult(c.toDataURL("image/png"))
          setProcessing(false)
        }
        img.src = url
      })
  }

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) return
    setFile(f)
    setUrl(URL.createObjectURL(f))
    setResult("")
  }

  const reset = () => { setFile(null); setUrl(""); setResult("") }

  const download = () => {
    if (!result || !file) return
    const a = document.createElement("a")
    a.href = result
    a.download = `${file.name.replace(/\.[^.]+$/, "")}-${scale}x.png`
    a.click()
  }

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]) }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {!file && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn("border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors", isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground")}
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <ZoomIn className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">AI Upscaler</p>
          <p className="text-sm text-muted-foreground mt-1">Perbesar resolusi gambar pake AI — hasil lebih besar & detail tajam</p>
        </div>
      )}

      {file && (
        <>
          {modelLoading && (
            <div className="p-4 bg-card rounded-lg border border-border flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <div>
                <p className="text-sm text-foreground">Menyiapkan AI model...</p>
                <p className="text-xs text-muted-foreground">Download model dari CDN, sekali doang</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border border-border">
            <span className="text-sm text-muted-foreground">Scale:</span>
            {SCALES.map(s => (
              <button
                key={s.label}
                onClick={() => handleScaleChange(s.value)}
                className={cn("px-3 py-1.5 rounded-md border text-xs transition-all", scale === s.value ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground")}
              >
                {s.label}
              </button>
            ))}
            <div className="ml-auto">
              <Button onClick={upscale} disabled={!modelLoaded || processing || !!result} size="sm">
                {processing ? "Processing..." : result ? "Selesai" : "Upscale"}
              </Button>
            </div>
          </div>

          {useCanvas && modelLoaded && (
            <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-600">
              AI model gagal di-load. Pake canvas interpolation sebagai alternatif (resolusi naik, detail standar).
            </div>
          )}

          {processing && (
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground">{useCanvas ? "Resizing..." : "AI processing..."} {scale}x</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Original</p>
              <div className="bg-secondary rounded-lg overflow-hidden">
                <img src={url} alt="" className="w-full object-contain max-h-[350px]" />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Hasil {scale}x</p>
              <div className="bg-secondary rounded-lg overflow-hidden">
                {result && <img src={result} alt="" className="w-full object-contain max-h-[350px]" />}
                {!result && !processing && (
                  <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                    Klik "Upscale" untuk mulai
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={download} className="flex-1" disabled={!result}>
              <Download className="w-4 h-4 mr-2" /> Download {scale}x PNG
            </Button>
            <Button onClick={reset} variant="secondary">
              Upload Baru
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
