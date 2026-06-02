"use client"

import { useState, useCallback, useRef } from "react"
import imageCompression from "browser-image-compression"
import { Upload, Download, Trash2, Image as ImageIcon, Zap, Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLimits } from "@/hooks/use-limits"
import { TIER_LIMITS } from "@/lib/limits"
import { ToolGuide } from "@/components/tool-guide"

interface CompressedImage {
  id: string
  originalFile: File
  compressedFile: File | null
  originalSize: number
  compressedSize: number
  preview: string
  status: "pending" | "compressing" | "done" | "error"
  error?: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

function calculateSavings(original: number, compressed: number): number {
  if (original === 0) return 0
  return Math.round(((original - compressed) / original) * 100)
}

export function ImageCompressor() {
  const [images, setImages] = useState<CompressedImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [quality, setQuality] = useState(0.8)
  const [limitError, setLimitError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { tier, limits, loading } = useLimits()

  const compressImage = async (image: CompressedImage): Promise<CompressedImage> => {
    try {
      const originalSizeMB = image.originalFile.size / (1024 * 1024)
      const targetSizeMB = Math.max(0.1, originalSizeMB * quality * 0.5)

      const options = {
        maxSizeMB: targetSizeMB,
        maxWidthOrHeight: quality < 0.5 ? 1920 : quality < 0.8 ? 2560 : 4096,
        useWebWorker: true,
        initialQuality: quality,
        alwaysKeepResolution: quality >= 0.9,
        fileType: image.originalFile.type === "image/png" ? "image/webp" as const : undefined,
      }

      const compressedFile = await imageCompression(image.originalFile, options)

      return {
        ...image,
        compressedFile,
        compressedSize: compressedFile.size,
        status: "done",
      }
    } catch (error) {
      return {
        ...image,
        status: "error",
        error: error instanceof Error ? error.message : "Compression failed",
      }
    }
  }

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setLimitError("")

    if (loading) return

    const validFiles = Array.from(files).filter(file =>
      file.type.startsWith("image/") &&
      ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)
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

    const newImages: CompressedImage[] = batchFiles.map(file => ({
      id: crypto.randomUUID(),
      originalFile: file,
      compressedFile: null,
      originalSize: file.size,
      compressedSize: 0,
      preview: URL.createObjectURL(file),
      status: "pending",
    }))

    setImages(prev => [...prev, ...newImages])

    for (const image of newImages) {
      setImages(prev =>
        prev.map(img =>
          img.id === image.id ? { ...img, status: "compressing" } : img
        )
      )

      const compressed = await compressImage(image)

      setImages(prev =>
        prev.map(img =>
          img.id === image.id ? compressed : img
        )
      )
    }
  }, [quality, tier, limits, loading])

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
      }
      return prev.filter(img => img.id !== id)
    })
  }, [])

  const downloadImage = useCallback((image: CompressedImage) => {
    if (!image.compressedFile) return

    const url = URL.createObjectURL(image.compressedFile)
    const a = document.createElement("a")
    a.href = url
    const ext = image.originalFile.name.split(".").pop() || "jpg"
    const name = image.originalFile.name.replace(/\.[^.]+$/, "")
    a.download = `${name}-compressed.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const downloadAll = useCallback(() => {
    images.forEach(image => {
      if (image.status === "done" && image.compressedFile) {
        downloadImage(image)
      }
    })
  }, [images, downloadImage])

  const clearAll = useCallback(() => {
    images.forEach(image => URL.revokeObjectURL(image.preview))
    setImages([])
    setLimitError("")
  }, [images])

  const totalOriginal = images.reduce((acc, img) => acc + img.originalSize, 0)
  const totalCompressed = images.reduce((acc, img) => acc + img.compressedSize, 0)
  const completedCount = images.filter(img => img.status === "done").length

  return (
    <div className="w-full max-w-5xl mx-auto">
      <ToolGuide
        toolId="compress"
        title="Cara Compress Gambar"
        steps={["Upload gambar (JPG, PNG, WebP, GIF)", "Atur kualitas pakai slider", "Download hasilnya — PNG otomatis jadi WebP"]}
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
          accept="image/jpeg,image/png,image/webp,image/gif"
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
              Supports JPG, PNG, WebP, GIF - PNG will be converted to WebP for better compression
            </p>
          </div>
        </div>
      </div>

      {/* Quality Slider */}
      {images.length === 0 && (
        <div className="mt-8 flex items-center justify-center gap-6">
          <span className="text-sm text-muted-foreground">Quality:</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Low</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-32 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-sm text-muted-foreground">High</span>
          </div>
          <span className="text-sm font-mono text-foreground">{Math.round(quality * 100)}%</span>
        </div>
      )}

      {/* Results */}
      {images.length > 0 && (
        <div className="mt-8 space-y-6">
          {/* Stats Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Original</p>
                <p className="text-lg font-semibold text-foreground">{formatBytes(totalOriginal)}</p>
              </div>
              <div className="text-muted-foreground">→</div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Compressed</p>
                <p className="text-lg font-semibold text-accent">{formatBytes(totalCompressed)}</p>
              </div>
              {totalCompressed > 0 && (
                <div className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                  -{calculateSavings(totalOriginal, totalCompressed)}% saved
                </div>
              )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map(image => (
              <div key={image.id} className="relative bg-card rounded-lg border border-border overflow-hidden group">
                {/* Image Preview */}
                <div className="aspect-video relative bg-secondary">
                  <img
                    src={image.preview}
                    alt={image.originalFile.name}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {image.status === "compressing" && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-foreground">
                        <Zap className="w-5 h-5 animate-pulse text-accent" />
                        <span className="text-sm">Compressing...</span>
                      </div>
                    </div>
                  )}
                  {image.status === "done" && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-accent-foreground" />
                    </div>
                  )}
                </div>

                {/* Image Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-foreground truncate" title={image.originalFile.name}>
                    {image.originalFile.name}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">{formatBytes(image.originalSize)}</span>
                      {image.status === "done" && (
                        <>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-accent font-medium">{formatBytes(image.compressedSize)}</span>
                          <span className="text-accent">
                            (-{calculateSavings(image.originalSize, image.compressedSize)}%)
                          </span>
                        </>
                      )}
                    </div>
                  </div>

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
                        Download
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
