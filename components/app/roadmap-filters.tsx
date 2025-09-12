"use client"

import { Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RoadmapFiltersProps {
  selectedPeriod: string
  selectedCategory: string
  onPeriodChange: (period: string) => void
  onCategoryChange: (category: string) => void
}

export function RoadmapFilters({
  selectedPeriod,
  selectedCategory,
  onPeriodChange,
  onCategoryChange,
}: RoadmapFiltersProps) {
  const periods = ["全期間", "2024年", "2025年"]
  const categories = ["全カテゴリ", "準備", "応募", "選考", "内定", "その他"]

  return (
    <div className="flex items-center gap-3">
      <Filter className="size-4 text-muted-foreground" />

      <Select value={selectedPeriod} onValueChange={onPeriodChange}>
        <SelectTrigger className="w-32 glass-panel border-white/20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periods.map((period) => (
            <SelectItem key={period} value={period}>
              {period}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-36 glass-panel border-white/20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
