"use client"

import { useEffect, useState } from "react"

export function GridBackground() {
  const [pos, setPos] = useState({ x: -1000, y: -1000 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY })
    const onLeave = () => setPos({ x: -1000, y: -1000 })
    window.addEventListener("pointermove", onMove)
    document.addEventListener("pointerleave", onLeave)
    return () => {
      window.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerleave", onLeave)
    }
  }, [])

  const gridStyle = `
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
  `

  return (
    <>
      {/* Base grid — gradient fade di tepi */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: gridStyle,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 70% 60% at center, black 20%, transparent 65%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at center, black 20%, transparent 65%)",
        }}
      />

      {/* Spotlight grid — animasi ngikutin cursor */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: gridStyle,
          backgroundSize: "60px 60px",
          opacity: 0.6,
          maskImage: `radial-gradient(220px circle at ${pos.x}px ${pos.y}px, black 20%, transparent 70%)`,
          WebkitMaskImage: `radial-gradient(220px circle at ${pos.x}px ${pos.y}px, black 20%, transparent 70%)`,
          animation: "gridBreathe 2.5s ease-in-out infinite",
        }}
      />

      {/* Cursor glow */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `radial-gradient(350px circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.04) 0%, transparent 50%)`,
        }}
      />
    </>
  )
}
