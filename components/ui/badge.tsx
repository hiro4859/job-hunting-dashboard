"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

type Props = React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "outline" }
export function Badge({ className, variant = "default", ...props }: Props) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs border"
  const style =
    variant === "outline"
      ? "bg-transparent border-white/20 text-foreground"
      : "bg-primary/20 text-primary border-primary/30"
  return <span className={cn(base, style, className)} {...props} />
}
