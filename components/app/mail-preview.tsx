"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MailPreviewProps {
  subject: string
  body: string
}

export function MailPreview({ subject, body }: MailPreviewProps) {
  // Count placeholders that haven't been filled
  const placeholderCount = (subject + body).match(/\{[^}]+\}/g)?.length || 0

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      {placeholderCount > 0 && (
        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
          未入力項目: {placeholderCount}個
        </Badge>
      )}

      {/* Subject Preview */}
      <Card className="glass-panel border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">件名</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="font-medium text-foreground text-balance">{subject || "件名が入力されていません"}</p>
        </CardContent>
      </Card>

      {/* Body Preview */}
      <Card className="glass-panel border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">本文</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
              {body || "本文が生成されていません"}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Email Format Info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• 敬語表現を使用した日本のビジネスメール形式</p>
        <p>• 赤色の項目は必須入力です</p>
        <p>• プレビューはリアルタイムで更新されます</p>
      </div>
    </div>
  )
}
