"use client"

import { useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

interface BeforeAfterSliderProps {
  before: string
  after: string
  className?: string
}

export function BeforeAfterSlider({ before, after, className }: BeforeAfterSliderProps) {
  const [pos, setPos] = useState(50)
  const dragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const updatePos = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((clientX - rect.left) / rect.width) * 100
    setPos(Math.max(0, Math.min(100, x)))
  }, [])

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    updatePos(e.clientX)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return
    updatePos(e.clientX)
  }

  const stopDrag = () => { dragging.current = false }

  return (
    <div
      ref={containerRef}
      className={cn("relative select-none overflow-hidden rounded-lg", className)}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      style={{ aspectRatio: "1/1", maxHeight: 400 }}
    >
      {/* After (processed) */}
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" draggable={false} />

      {/* Before (original) - clipped */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={before} alt="Before" className="absolute top-0 left-0 w-full h-full object-cover max-w-none" style={{ width: `${100 / (pos / 100)}%` }} draggable={false} />
      </div>

      {/* Slider handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize z-10"
        style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#666" strokeWidth="1.5">
            <path d="M6 3L2 8L6 13" />
            <path d="M10 3L14 8L10 13" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded">Original</span>
      <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded">Hasil</span>
    </div>
  )
}
