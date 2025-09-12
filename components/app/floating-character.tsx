"use client"

import { User } from "lucide-react"

export function FloatingCharacter() {
  return (
    <div className="fixed top-1/2 right-12 transform -translate-y-1/2 z-30">
      <div className="relative">
        {/* Character */}
        <div className="w-16 h-20 bg-gradient-to-b from-primary/30 to-primary/20 rounded-t-full rounded-b-lg glass-card border-white/20 flex items-center justify-center animate-bounce">
          <User className="size-8 text-primary" />
        </div>

        {/* Shadow */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-3 bg-black/20 rounded-full blur-sm animate-pulse" />

        {/* Speech Bubble */}
        <div className="absolute -left-32 top-2 glass-card border-white/20 p-2 rounded-xl max-w-28">
          <p className="text-xs text-foreground text-center">頑張って！</p>
          <div className="absolute top-3 -right-1 w-0 h-0 border-l-4 border-t-2 border-b-2 border-l-white/20 border-t-transparent border-b-transparent" />
        </div>
      </div>
    </div>
  )
}
