"use client"

import { useState, useRef } from "react"
import { Download, Upload, FileText, X, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PAGE_SIZES = [
  { label: "A4", w: 210, h: 297 },
  { label: "Letter", w: 215.9, h: 279.4 },
  { label: "A3", w: 297, h: 420 },
]

export function ImageToPdf() {
  const [images, setImages] = useState<{ id: string; file: File; url: string }[]>([])
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait")
  const [margin, setMargin] = useState(10)
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | File[]) => {
    const newImages = Array.from(files)
      .filter(f => f.type.startsWith("image/"))
      .map(f => ({ id: crypto.randomUUID(), file: f, url: URL.createObjectURL(f) }))
    setImages(prev => [...prev, ...newImages])
  }

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id)
      if (img) URL.revokeObjectURL(img.url)
      return prev.filter(i => i.id !== id)
    })
  }

  const moveImage = (idx: number, dir: -1 | 1) => {
    const to = idx + dir
    if (to < 0 || to >= images.length) return
    setImages(prev => {
      const next = [...prev]
      ;[next[idx], next[to]] = [next[to], next[idx]]
      return next
    })
  }

  const generatePdf = async () => {
    if (images.length === 0) return
    setLoading(true)

    const { jsPDF } = await import("jspdf")
    const pdf = new jsPDF({
      orientation: orientation === "landscape" ? "l" : "p",
      unit: "mm",
      format: [pageSize.w, pageSize.h],
    })

    const marginMM = margin
    const pw = pageSize.w - marginMM * 2
    const ph = pageSize.h - marginMM * 2

    for (let i = 0; i < images.length; i++) {
      if (i > 0) pdf.addPage()

      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = images[i].url
      })

      const imgAspect = img.naturalWidth / img.naturalHeight
      const pageAspect = pw / ph

      let dw: number, dh: number
      if (imgAspect > pageAspect) {
        dw = pw
        dh = pw / imgAspect
      } else {
        dh = ph
        dw = ph * imgAspect
      }

      const x = (pageSize.w - dw) / 2
      const y = (pageSize.h - dh) / 2

      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9)

      pdf.addImage(dataUrl, "JPEG", x, y, dw, dh)
    }

    pdf.save("cutbray-document.pdf")
    setLoading(false)
  }

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {images.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn("border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors", isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground")}
        >
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Image ke PDF</p>
          <p className="text-sm text-muted-foreground mt-1">Gabung gambar jadi PDF — drag untuk atur urutan</p>
        </div>
      )}

      {images.length > 0 && (
        <>
          {/* Page Settings */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Ukuran:</span>
              {PAGE_SIZES.map(ps => (
                <button key={ps.label} onClick={() => setPageSize(ps)} className={cn("px-2 py-1 rounded border text-xs", pageSize.label === ps.label ? "border-primary bg-primary/10" : "border-border")}>
                  {ps.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Orientasi:</span>
              <button onClick={() => setOrientation("portrait")} className={cn("px-2 py-1 rounded border text-xs", orientation === "portrait" ? "border-primary bg-primary/10" : "border-border")}>Portrait</button>
              <button onClick={() => setOrientation("landscape")} className={cn("px-2 py-1 rounded border text-xs", orientation === "landscape" ? "border-primary bg-primary/10" : "border-border")}>Landscape</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Margin:</span>
              <input type="range" min="5" max="30" value={margin} onChange={e => setMargin(Number(e.target.value))} className="w-20 accent-primary" />
              <span className="text-xs font-mono">{margin}mm</span>
            </div>
          </div>

          {/* Image List */}
          <div className="space-y-2">
            {images.map((img, idx) => (
              <div key={img.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveImage(idx, -1)} disabled={idx === 0} className="disabled:opacity-30 text-muted-foreground hover:text-foreground leading-none">&uarr;</button>
                  <button onClick={() => moveImage(idx, 1)} disabled={idx === images.length - 1} className="disabled:opacity-30 text-muted-foreground hover:text-foreground leading-none">&darr;</button>
                </div>
                <div className="w-12 h-12 bg-secondary rounded overflow-hidden shrink-0">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{img.file.name}</p>
                  <p className="text-xs text-muted-foreground">{(img.file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <button onClick={() => removeImage(img.id)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={() => inputRef.current?.click()} variant="secondary" className="flex-1">
              <Upload className="w-4 h-4 mr-2" /> Tambah Gambar
            </Button>
            <Button onClick={generatePdf} disabled={loading} className="flex-1">
              <Download className="w-4 h-4 mr-2" /> {loading ? "Processing..." : `Download PDF (${images.length} halaman)`}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
