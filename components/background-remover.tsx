"use client"

import { useState, useCallback, useRef } from "react"
import { removeBackground } from "@imgly/background-removal"
import { Upload, Download, Trash2, Sparkles, Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLimits } from "@/hooks/use-limits"
import { ToolGuide } from "@/components/tool-guide"
import { BeforeAfterSlider } from "@/components/before-after-slider"

interface ProcessedImage {
  id: string
  originalFile: File
  resultBlob: Blob | null
  preview: string
  resultPreview: string
  status: "pending" | "processing" | "done" | "error"
  error?: string
  progress: number
}

export function BackgroundRemover() {
  const [images, setImages] = useState<ProcessedImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [limitError, setLimitError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { tier, limits, loading } = useLimits()

  const processImage = async (image: ProcessedImage): Promise<ProcessedImage> => {
    const maxProgressRef = { current: 0 }
    const updateProgress = (current: number, total: number) => {
      const pct = Math.min(Math.round((current / total) * 100), 99)
      if (pct > maxProgressRef.current) {
        maxProgressRef.current = pct
        setImages(prev =>
          prev.map(img =>
            img.id === image.id ? { ...img, progress: pct } : img
          )
        )
      }
    }

    try {
      let file = image.originalFile

      // Downscale biar gak buang waktu decode image gede
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = URL.createObjectURL(file)
      })

      const MAX = 1024
      let { width, height } = img
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, width, height)

        const resizedBlob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob failed")), "image/jpeg", 0.9)
        )
        file = new File([resizedBlob], file.name, { type: "image/jpeg" })
      }
      URL.revokeObjectURL(img.src)

      const blob = await removeBackground(file, {
        progress: (key, current, total) => updateProgress(current, total),
      })

      const resultPreview = URL.createObjectURL(blob)

      return {
        ...image,
        resultBlob: blob,
        resultPreview,
        status: "done",
        progress: 100,
      }
    } catch (error) {
      return {
        ...image,
        status: "error",
        error: error instanceof Error ? error.message : "Processing failed",
      }
    }
  }

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setLimitError("")

    if (loading) return

    const validFiles = Array.from(files).filter(file =>
      file.type.startsWith("image/") &&
      ["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )

    if (validFiles.length === 0) return

    const oversized = validFiles.filter(f => f.size > limits.maxFileSizeMB * 1024 * 1024)
    const okFiles = validFiles.filter(f => f.size <= limits.maxFileSizeMB * 1024 * 1024)

    if (okFiles.length === 0) {
      setLimitError(`Ukuran file maksimal ${limits.maxFileSizeMB}MB untuk paket ${tier}. Upgrade untuk ukuran lebih besar.`)
      return
    }

    const batchFiles = okFiles.slice(0, limits.batchSize)

    if (okFiles.length > limits.batchSize) {
      setLimitError(`Paket ${tier} hanya bisa memproses ${limits.batchSize} gambar per batch. ${okFiles.length - limits.batchSize} gambar tidak diproses.`)
    }

    if (oversized.length > 0) {
      setLimitError(prev => {
        const msg = `${oversized.length} gambar dilewati karena ukuran > ${limits.maxFileSizeMB}MB.`
        return prev ? `${prev} ${msg}` : msg
      })
    }

    const newImages: ProcessedImage[] = batchFiles.map(file => ({
      id: crypto.randomUUID(),
      originalFile: file,
      resultBlob: null,
      preview: URL.createObjectURL(file),
      resultPreview: "",
      status: "pending",
      progress: 0,
    }))

    setImages(prev => [...prev, ...newImages])

    for (const image of newImages) {
      setImages(prev =>
        prev.map(img =>
          img.id === image.id ? { ...img, status: "processing" } : img
        )
      )

      const processed = await processImage(image)

      setImages(prev =>
        prev.map(img =>
          img.id === image.id ? processed : img
        )
      )
    }
  }, [tier, limits, loading])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    processFiles(e.dataTransfer.files)
  }, [processFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
    }
  }, [processFiles])

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id)
      if (image) {
        URL.revokeObjectURL(image.preview)
        if (image.resultPreview) URL.revokeObjectURL(image.resultPreview)
      }
      return prev.filter(img => img.id !== id)
    })
  }, [])

  const downloadImage = useCallback((image: ProcessedImage) => {
    if (!image.resultBlob) return

    const url = URL.createObjectURL(image.resultBlob)
    const a = document.createElement("a")
    a.href = url
    const name = image.originalFile.name.replace(/\.[^.]+$/, "")
    a.download = `${name}-nobg.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const downloadAll = useCallback(() => {
    images.forEach(image => {
      if (image.status === "done" && image.resultBlob) {
        downloadImage(image)
      }
    })
  }, [images, downloadImage])

  const clearAll = useCallback(() => {
    images.forEach(image => {
      URL.revokeObjectURL(image.preview)
      if (image.resultPreview) URL.revokeObjectURL(image.resultPreview)
    })
    setImages([])
    setLimitError("")
  }, [images])

  const completedCount = images.filter(img => img.status === "done").length

  return (
    <div className="w-full max-w-5xl mx-auto">
      <ToolGuide
        toolId="remove-bg"
        title="Cara Hapus Background"
        steps={["Upload foto (JPG, PNG, WebP)", "Tunggu AI process — jalan di browser kamu", "Download hasil PNG dengan background transparan"]}
      />

      {/* Limit Banner */}
      {tier === "free" && !loading && (
        <div className="mb-6 p-3 bg-muted/50 border border-border rounded-lg flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Paket Free: maks {limits.maxFileSizeMB}MB, {limits.batchSize} gambar/batch
          </p>
          <a href="/pricing" className="text-xs text-primary font-medium hover:underline">Upgrade</a>
        </div>
      )}

      {/* Limit Error */}
      {limitError && (
        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{limitError}</p>
        </div>
      )}

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground hover:bg-card/50",
          images.length > 0 && "p-8"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
            isDragging ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          )}>
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <p className="text-lg font-medium text-foreground">
              {isDragging ? "Drop images here" : "Drop images here or click to upload"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered background removal. Supports JPG, PNG, WebP.
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      {images.length === 0 && (
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Uses AI model running 100% in your browser - your images stay private</span>
        </div>
      )}

      {/* Results */}
      {images.length > 0 && (
        <div className="mt-8 space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Processing with AI in your browser</span>
            </div>
            <div className="flex items-center gap-2">
              {completedCount > 0 && (
                <Button onClick={downloadAll} variant="default" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download All ({completedCount})
                </Button>
              )}
              <Button onClick={clearAll} variant="secondary" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {images.map(image => (
              <div key={image.id} className="bg-card rounded-lg border border-border overflow-hidden relative">
                {/* Before/After Slider */}
                {image.resultPreview ? (
                  <BeforeAfterSlider before={image.preview} after={image.resultPreview} className="w-full" />
                ) : (
                  <div className="aspect-square relative bg-secondary">
                    {image.status === "processing" && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/50">
                        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                        <div className="text-center">
                          <p className="text-xs font-medium text-foreground">Removing background...</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Processing in browser</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {image.status === "done" && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center z-10">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}

                {/* Image Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-foreground truncate" title={image.originalFile.name}>
                    {image.originalFile.name}
                  </p>

                  {image.status === "error" && (
                    <p className="text-xs text-destructive mt-1">{image.error}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    {image.status === "done" && (
                      <Button
                        onClick={() => downloadImage(image)}
                        size="sm"
                        variant="default"
                        className="flex-1"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download PNG
                      </Button>
                    )}
                    <Button
                      onClick={() => removeImage(image.id)}
                      size="sm"
                      variant="secondary"
                      className={image.status !== "done" ? "flex-1" : ""}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
