"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, Download, Trash2, Maximize, Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLimits, checkDailyLimit, trackUsage } from "@/hooks/use-limits"

interface ResizedImage {
  id: string
  originalFile: File
  resultBlob: Blob | null
  preview: string
  resultPreview: string
  originalDimensions: { width: number; height: number }
  newDimensions: { width: number; height: number }
  status: "pending" | "processing" | "done" | "error"
  error?: string
}

type PresetSize = {
  label: string
  width: number
  height: number
}

const PRESET_SIZES: PresetSize[] = [
  { label: "Instagram Post", width: 1080, height: 1080 },
  { label: "Instagram Story", width: 1080, height: 1920 },
  { label: "Facebook Cover", width: 820, height: 312 },
  { label: "Twitter Header", width: 1500, height: 500 },
  { label: "YouTube Thumbnail", width: 1280, height: 720 },
  { label: "LinkedIn Banner", width: 1584, height: 396 },
]

export function BulkResizer() {
  const [images, setImages] = useState<ResizedImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [targetWidth, setTargetWidth] = useState(1080)
  const [targetHeight, setTargetHeight] = useState(1080)
  const [maintainAspect, setMaintainAspect] = useState(true)
  const [selectedPreset, setSelectedPreset] = useState<string | null>("Instagram Post")
  const [limitError, setLimitError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { tier, limits, usage, loading } = useLimits()

  const resizeImage = async (
    file: File,
    width: number,
    height: number,
    keepAspect: boolean
  ): Promise<{ blob: Blob; dimensions: { width: number; height: number } }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        let finalWidth = width
        let finalHeight = height

        if (keepAspect) {
          const ratio = img.width / img.height
          if (width / height > ratio) {
            finalWidth = Math.round(height * ratio)
          } else {
            finalHeight = Math.round(width / ratio)
          }
        }

        canvas.width = finalWidth
        canvas.height = finalHeight

        ctx.drawImage(img, 0, 0, finalWidth, finalHeight)

        canvas.toBlob(
          blob => {
            if (blob) {
              resolve({ blob, dimensions: { width: finalWidth, height: finalHeight } })
            } else {
              reject(new Error("Failed to create blob"))
            }
          },
          file.type === "image/png" ? "image/png" : "image/jpeg",
          0.92
        )
      }
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.width, height: img.height })
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  const processImage = async (image: ResizedImage): Promise<ResizedImage> => {
    try {
      const { blob, dimensions } = await resizeImage(
        image.originalFile,
        targetWidth,
        targetHeight,
        maintainAspect
      )

      const resultPreview = URL.createObjectURL(blob)

      return {
        ...image,
        resultBlob: blob,
        resultPreview,
        newDimensions: dimensions,
        status: "done",
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

    const dailyOk = checkDailyLimit(usage, limits.dailyLimit)
    if (!dailyOk) {
      setLimitError(`Kamu sudah mencapai batas harian ${limits.dailyLimit} gambar. Upgrade ke Pro atau Ultra untuk kuota lebih.`)
      return
    }

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

    const newImages: ResizedImage[] = await Promise.all(
      batchFiles.map(async file => {
        const dimensions = await getImageDimensions(file)
        return {
          id: crypto.randomUUID(),
          originalFile: file,
          resultBlob: null,
          preview: URL.createObjectURL(file),
          resultPreview: "",
          originalDimensions: dimensions,
          newDimensions: { width: 0, height: 0 },
          status: "pending" as const,
        }
      })
    )

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

    trackUsage()
  }, [targetWidth, targetHeight, maintainAspect, tier, limits, usage, loading])

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

  const downloadImage = useCallback((image: ResizedImage) => {
    if (!image.resultBlob) return

    const url = URL.createObjectURL(image.resultBlob)
    const a = document.createElement("a")
    a.href = url
    const ext = image.originalFile.type === "image/png" ? "png" : "jpg"
    const name = image.originalFile.name.replace(/\.[^.]+$/, "")
    a.download = `${name}-${image.newDimensions.width}x${image.newDimensions.height}.${ext}`
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

  const handlePresetClick = (preset: PresetSize) => {
    setSelectedPreset(preset.label)
    setTargetWidth(preset.width)
    setTargetHeight(preset.height)
  }

  const completedCount = images.filter(img => img.status === "done").length

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Limit Banner */}
      {tier === "free" && !loading && (
        <div className="mb-6 p-3 bg-muted/50 border border-border rounded-lg flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Paket Free: {limits.dailyLimit === Infinity ? "Unlimited" : `${limits.dailyLimit} gambar/hari`}, maks {limits.maxFileSizeMB}MB, {limits.batchSize} gambar/batch
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

      {/* Size Settings */}
      {images.length === 0 && (
        <div className="mb-8 space-y-6">
          {/* Presets */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">Quick presets:</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_SIZES.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg border transition-colors",
                    selectedPreset === preset.label
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-muted-foreground"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Size */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Width:</label>
              <input
                type="number"
                value={targetWidth}
                onChange={e => {
                  setTargetWidth(Number(e.target.value))
                  setSelectedPreset(null)
                }}
                className="w-24 px-3 py-1.5 bg-input border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">px</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Height:</label>
              <input
                type="number"
                value={targetHeight}
                onChange={e => {
                  setTargetHeight(Number(e.target.value))
                  setSelectedPreset(null)
                }}
                className="w-24 px-3 py-1.5 bg-input border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">px</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={maintainAspect}
                onChange={e => setMaintainAspect(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-primary"
              />
              <span className="text-sm text-foreground">Maintain aspect ratio</span>
            </label>
          </div>
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
              Resize to {targetWidth} x {targetHeight}px. Supports JPG, PNG, WebP.
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      {images.length > 0 && (
        <div className="mt-8 space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Maximize className="w-4 h-4 text-primary" />
              <span>Resizing to {targetWidth} x {targetHeight}px</span>
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
              <div key={image.id} className="bg-card rounded-lg border border-border overflow-hidden">
                {/* Image Preview */}
                <div className="aspect-video relative bg-secondary">
                  <img
                    src={image.resultPreview || image.preview}
                    alt={image.originalFile.name}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {image.status === "processing" && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-foreground">
                        <Maximize className="w-5 h-5 animate-pulse text-primary" />
                        <span className="text-sm">Resizing...</span>
                      </div>
                    </div>
                  )}
                  {image.status === "done" && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Image Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-foreground truncate" title={image.originalFile.name}>
                    {image.originalFile.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{image.originalDimensions.width} x {image.originalDimensions.height}</span>
                    {image.status === "done" && (
                      <>
                        <span>-&gt;</span>
                        <span className="text-primary font-medium">
                          {image.newDimensions.width} x {image.newDimensions.height}
                        </span>
                      </>
                    )}
                  </div>

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
