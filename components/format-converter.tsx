"use client"

import { useState, useRef, useEffect } from "react"
import { Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const FORMATS = [
  { label: "JPEG", ext: "jpg", mime: "image/jpeg" },
  { label: "PNG", ext: "png", mime: "image/png" },
  { label: "WebP", ext: "webp", mime: "image/webp" },
  { label: "AVIF", ext: "avif", mime: "image/avif" },
]

export function FormatConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState("")
  const [result, setResult] = useState("")
  const [outputFormat, setOutputFormat] = useState(FORMATS[0])
  const [quality, setQuality] = useState(0.9)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const convert = () => {
    const img = imgRef.current
    if (!img) return
    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(img, 0, 0)
    canvas.toBlob(b => {
      if (b) setResult(URL.createObjectURL(b))
    }, outputFormat.mime, quality)
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
      convert()
    }
    i.src = u
  }

  useEffect(() => {
    if (imgRef.current) convert()
  }, [outputFormat, quality])

  const download = () => {
    if (!result || !file) return
    const a = document.createElement("a")
    a.href = result
    a.download = `${file.name.replace(/\.[^.]+$/, "")}.${outputFormat.ext}`
    a.click()
  }

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]) }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
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
          <p className="text-lg font-medium">Convert Image Format</p>
          <p className="text-sm text-muted-foreground mt-1">JPG, PNG, WebP, AVIF — semua bisa di-convert</p>
        </div>
      )}

      {file && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Convert ke:</span>
            {FORMATS.map(f => (
              <button key={f.ext} onClick={() => setOutputFormat(f)} className={cn("px-3 py-1.5 rounded-md border text-xs transition-all", outputFormat.ext === f.ext ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground")}>
                {f.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Quality</span>
              <input type="range" min="0.1" max="1" step="0.1" value={quality} onChange={e => setQuality(parseFloat(e.target.value))} className="w-24 accent-primary" />
              <span className="text-xs font-mono">{Math.round(quality * 100)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Original (.{file.name.split(".").pop()})</p>
              <div className="bg-secondary rounded-lg overflow-hidden">
                <img src={url} alt="" className="w-full object-contain max-h-[400px]" />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Hasil (.{outputFormat.ext})</p>
              <div className="bg-secondary rounded-lg overflow-hidden">
                {result && <img src={result} alt="" className="w-full object-contain max-h-[400px]" />}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={download} className="flex-1">
              <Download className="w-4 h-4 mr-2" /> Download {outputFormat.label}
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
