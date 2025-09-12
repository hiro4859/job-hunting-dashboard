"use client"

import { Mail, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MailPasteBoxProps {
  value: string
  onChange: (value: string) => void
  onParse: () => void
  isAnalyzing: boolean
}

export function MailPasteBox({ value, onChange, onParse, isAnalyzing }: MailPasteBoxProps) {
  return (
    <Card className="glass-card border-white/20">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Mail className="size-5" />
          メール本文
          {isAnalyzing && <Loader2 className="size-4 animate-spin text-primary" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="解析したいメール本文をここに貼り付けてください...

例:
件名: 二次面接のご案内

○○様

この度は、一次面接にお越しいただき、ありがとうございました。
厳正な審査の結果、二次面接にお進みいただくことになりました。

【面接詳細】
日時: 2024年12月20日（金） 14:00-15:30
会場: 東京都千代田区丸の内1-1-1 ○○ビル 15階 会議室A
面接官: 人事部長 田中、営業部長 佐藤

【お持ちいただくもの】
・履歴書
・職務経歴書
・筆記用具

参加可否について、12月18日（水）17:00までにご返信ください。

何かご不明な点がございましたら、お気軽にお問い合わせください。

株式会社○○
人事部 採用担当
山田太郎"
          className="glass-panel border-white/20 min-h-80 resize-none font-mono text-sm"
          disabled={isAnalyzing}
        />

        <div className="mt-3 flex justify-between items-center text-sm text-muted-foreground">
          <span>文字数: {value.length}</span>
          <span>日時、会場、締切などの情報を自動抽出します</span>
        </div>
      </CardContent>
    </Card>
  )
}
