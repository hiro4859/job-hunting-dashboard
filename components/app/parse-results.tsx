"use client"

import { Calendar, MapPin, Clock, CheckCircle, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ParseItem } from "@/types"

interface ParseResultsProps {
  results: ParseItem[]
}

const getIcon = (key: ParseItem["key"]) => {
  switch (key) {
    case "日時":
      return <Calendar className="size-5 text-primary" />
    case "会場":
      return <MapPin className="size-5 text-green-600" />
    case "締切":
      return <Clock className="size-5 text-orange-600" />
    case "合否":
      return <CheckCircle className="size-5 text-blue-600" />
    default:
      return <Info className="size-5 text-purple-600" />
  }
}

const getColor = (key: ParseItem["key"]) => {
  switch (key) {
    case "日時":
      return "bg-primary/20 text-primary border-primary/30"
    case "会場":
      return "bg-green-500/20 text-green-700 border-green-500/30"
    case "締切":
      return "bg-orange-500/20 text-orange-700 border-orange-500/30"
    case "合否":
      return "bg-blue-500/20 text-blue-700 border-blue-500/30"
    default:
      return "bg-purple-500/20 text-purple-700 border-purple-500/30"
  }
}

export function ParseResults({ results }: ParseResultsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">解析結果</h3>

      <div className="grid gap-4">
        {results.map((result, index) => (
          <Card key={index} className="glass-card border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getIcon(result.key)}
                  <span className="text-foreground">{result.key}</span>
                </div>
                <Badge className={getColor(result.key)}>抽出済み</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-foreground whitespace-pre-wrap">{result.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-sm text-muted-foreground bg-white/5 rounded-xl p-4 border border-white/10">
        <p className="font-medium mb-2">解析のヒント:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>日時情報は「年月日」「曜日」「時間」の形式で認識されます</li>
          <li>会場情報は住所や建物名、部屋番号を含む文章から抽出されます</li>
          <li>締切は「まで」「期限」などのキーワードから判定されます</li>
          <li>合否情報は「通過」「不合格」「内定」などから判定されます</li>
        </ul>
      </div>
    </div>
  )
}
