"use client"

import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function HomeButton() {
  const pathname = usePathname()
  if (pathname === "/") return null
  return (
    <Button asChild variant="ghost" size="sm" className="glass-panel border-white/20 hover:bg-white/20 text-foreground">
      <Link href="/" className="flex items-center gap-2">
        <Home className="size-4" />
        <span className="hidden sm:inline">ホーム</span>
      </Link>
    </Button>
  )
}
