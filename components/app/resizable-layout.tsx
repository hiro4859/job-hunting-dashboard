"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface ResizableLayoutProps {
  panes: React.ReactNode[]
  viewMode: "split-2" | "split-3"
  onResize: (sizes: number[]) => void
}

const ResizableLayout = ({ panes, viewMode, onResize }: ResizableLayoutProps) => {
  const [sizes, setSizes] = useState(viewMode === "split-2" ? [50, 50] : [33.33, 33.33, 33.34])

  const handleResize = (index: number, delta: number) => {
    const newSizes = [...sizes]
    const nextIndex = index + 1

    if (nextIndex < newSizes.length) {
      newSizes[index] = Math.max(20, Math.min(80, newSizes[index] + delta))
      newSizes[nextIndex] = Math.max(20, Math.min(80, newSizes[nextIndex] - delta))

      setSizes(newSizes)
      onResize(newSizes)
    }
  }

  const visiblePanes = viewMode === "split-2" ? panes.slice(0, 2) : panes.slice(0, 3)

  return (
    <div className="flex gap-2 h-[600px]">
      {visiblePanes.map((pane, index) => (
        <div key={index} className="flex">
          <Card className="glass-card border-white/20 overflow-hidden" style={{ width: `${sizes[index]}%` }}>
            <CardContent className="p-4 h-full overflow-y-auto">{pane}</CardContent>
          </Card>

          {/* Resize Handle */}
          {index < visiblePanes.length - 1 && (
            <div
              className="w-2 cursor-col-resize bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center group"
              onMouseDown={(e) => {
                const startX = e.clientX
                const startSizes = [...sizes]

                const handleMouseMove = (e: MouseEvent) => {
                  const deltaX = e.clientX - startX
                  const containerWidth = (e.target as HTMLElement).parentElement?.offsetWidth || 1000
                  const deltaPercent = (deltaX / containerWidth) * 100

                  handleResize(index, deltaPercent)
                }

                const handleMouseUp = () => {
                  document.removeEventListener("mousemove", handleMouseMove)
                  document.removeEventListener("mouseup", handleMouseUp)
                }

                document.addEventListener("mousemove", handleMouseMove)
                document.addEventListener("mouseup", handleMouseUp)
              }}
            >
              <div className="w-1 h-8 bg-white/30 rounded-full group-hover:bg-white/50 transition-colors" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export { ResizableLayout }
export default ResizableLayout
