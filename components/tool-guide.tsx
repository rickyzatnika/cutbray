"use client"

import { useState, useEffect } from "react"
import { X, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToolGuideProps {
  toolId: string
  title: string
  steps: string[]
}

export function ToolGuide({ toolId, title, steps }: ToolGuideProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(`guide-${toolId}`)
    if (!seen) setOpen(true)
  }, [toolId])

  const dismiss = () => {
    setOpen(false)
    localStorage.setItem(`guide-${toolId}`, "1")
  }

  if (!open) return null

  return (
    <div className="mb-6 p-4 bg-card border border-border rounded-lg relative">
      <button onClick={dismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Info className="w-4 h-4 text-primary" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <ol className="list-decimal list-inside space-y-1">
            {steps.map((s, i) => (
              <li key={i} className="text-xs text-muted-foreground">{s}</li>
            ))}
          </ol>
          <button onClick={dismiss} className="text-xs text-primary hover:underline mt-1 inline-block">
            Paham, tutup
          </button>
        </div>
      </div>
    </div>
  )
}
