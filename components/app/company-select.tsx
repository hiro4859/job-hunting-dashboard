"use client"

import { useState } from "react"
import { Building2, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface CompanySelectProps {
  value: string
  onChange: (value: string) => void
}

const mockCompanies = [
  "株式会社テックイノベーション",
  "グローバル商事株式会社",
  "フューチャーコンサルティング",
  "デジタルマーケティング株式会社",
  "ファイナンシャルパートナーズ",
  "スマートマニュファクチャリング",
]

export function CompanySelect({ value, onChange }: CompanySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCompanies = mockCompanies.filter((company) => company.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleSelect = (company: string) => {
    onChange(company)
    setSearchQuery(company)
    setIsOpen(false)
  }

  return (
    <Card className="glass-card border-white/20">
      <CardContent className="p-6">
        <div className="space-y-3">
          <Label className="text-foreground font-medium flex items-center gap-2">
            <Building2 className="size-4" />
            企業名
          </Label>

          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="企業名を入力または選択してください"
              className="glass-panel border-white/20 pr-10"
            />
            <ChevronDown
              className="absolute right-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground cursor-pointer"
              onClick={() => setIsOpen(!isOpen)}
            />

            {/* Suggestions Dropdown */}
            {isOpen && filteredCompanies.length > 0 && (
              <Card className="absolute top-full left-0 right-0 z-10 mt-1 glass-card border-white/20 max-h-48 overflow-y-auto">
                <CardContent className="p-2">
                  {filteredCompanies.map((company) => (
                    <div
                      key={company}
                      className="p-3 rounded-xl hover:bg-white/20 cursor-pointer transition-colors text-foreground"
                      onClick={() => handleSelect(company)}
                    >
                      {company}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
