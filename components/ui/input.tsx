﻿"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-sm outline-none",
          "placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
