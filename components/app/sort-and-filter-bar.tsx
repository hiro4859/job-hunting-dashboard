"use client"

import { ArrowUpDown, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SortAndFilterBarProps {
  sort: "created" | "deadline"
  onSortChange: (sort: "created" | "deadline") => void
  industries: string[]
  selected: string[]
  onToggle: (industry: string) => void
}

const availableIndustries = [
  "ITソフトウェア","金融保険","製造業","商社","コンサルティング",
  "広告マーケティング","不動産","小売流通","医療福祉","教育",
]

export function SortAndFilterBar({ sort, onSortChange, industries, selected, onToggle }: SortAndFilterBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 glass-panel border-white/20 rounded-2xl">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="size-4 text-muted-foreground" />
          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger className="w-32 bg-white/10 border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">登録順</SelectItem>
              <SelectItem value="deadline">期限優先</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">業界:</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {availableIndustries.map((industry) => (
          <Badge
            key={industry}
            variant={selected.includes(industry) ? "default" : "outline"}
            className={`cursor-pointer transition-all duration-200 ${ selected.includes(industry)
              ? "bg-primary text-primary-foreground"
              : "bg-white/10 text-foreground hover:bg-white/20 border-white/20" }`}
            onClick={() => onToggle(industry)}
          >
            {industry}
          </Badge>
        ))}
      </div>
    </div>
  )
}
