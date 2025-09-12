"use client"

import type React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface CompanySearchBarProps {
  value?: string
  onChange?: (value: string) => void
  onSearch?: (query: string) => void
  placeholder?: string
}

export function CompanySearchBar({
  value = "",
  onChange,
  onSearch,
  placeholder = "企業名業界キーワード",
}: CompanySearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(value)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative glass-card p-2">
        <div className="flex items-center gap-2">
          <Search className="size-5 text-muted-foreground ml-2" />
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6">
            検索
          </Button>
        </div>
      </div>
    </form>
  )
}
