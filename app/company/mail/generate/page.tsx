"use client"

import { useState } from "react"

import { HomeButton } from "@/components/app/home-button"
import { TemplatePicker } from "@/components/app/template-picker"
import { DynamicTemplateFields } from "@/components/app/dynamic-template-fields"
import { MailPreview } from "@/components/app/mail-preview"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Save, RotateCcw } from "lucide-react"
import type { MailTemplate } from "@/app/templates/mailTemplates" // ← 期待型

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  fields: {
    id: string
    label: string
    type: "text" | "email" | "textarea" | "date" | "time" | "select"
    required: boolean
    placeholder?: string
    options?: string[]
  }[]
}

const emailTemplates: EmailTemplate[] = [
  {
    id: "ob-visit",
    name: "OB・OG訪問依頼",
    subject: "【{university}】OB・OG訪問のお願い - {name}",
    body: `{recipient}様

お忙しい中、突然のご連絡失礼いたします。
{university}{department}の{name}と申します。

{company}にて{position}としてご活躍されている{recipient}様にOB・OG訪問をお願いしたく、ご連絡いたしました。

{reason}

もしお時間をいただけるようでしたら、以下の候補日程からご都合の良い日時をお教えいただけますでしょうか。

【候補日程】
{dates}

場所につきましては、{recipient}様のご都合に合わせて調整させていただきます。

お忙しい中恐縮ですが、ご検討のほどよろしくお願いいたします。

{signature}`,
    fields: [
      { id: "recipient", label: "宛先", type: "text", required: true, placeholder: "田中様" },
      { id: "name", label: "お名前", type: "text", required: true, placeholder: "山田太郎" },
      { id: "university", label: "大学名", type: "text", required: true, placeholder: "○○大学" },
      { id: "department", label: "学部・学科", type: "text", required: true, placeholder: "経済学部" },
      { id: "company", label: "企業名", type: "text", required: true, placeholder: "株式会社○○" },
      { id: "position", label: "職種", type: "text", required: false, placeholder: "営業部" },
      { id: "reason", label: "訪問理由", type: "textarea", required: true, placeholder: "貴社の事業内容について..." },
      {
        id: "dates",
        label: "候補日程",
        type: "textarea",
        required: true,
        placeholder: "・12月15日(金) 14:00-16:00\n・12月18日(月) 10:00-12:00",
      },
      {
        id: "signature",
        label: "署名",
        type: "textarea",
        required: true,
        placeholder: "山田太郎\n○○大学経済学部\nメール: yamada@example.com\n電話: 090-1234-5678",
      },
    ],
  },
  {
    id: "interview-schedule",
    name: "面接日程調整",
    subject: "面接日程のご相談 - {name}",
    body: `{recipient}様

いつもお世話になっております。
{name}です。

この度は、面接の機会をいただき、誠にありがとうございます。

面接の日程についてご相談させていただきたく、ご連絡いたしました。
以下の候補日程の中から、ご都合の良い日時をお教えいただけますでしょうか。

【候補日程】
{dates}

上記以外の日程でも調整可能ですので、お気軽にお申し付けください。

何かご不明な点がございましたら、お気軽にお声がけください。
よろしくお願いいたします。

{signature}`,
    fields: [
      { id: "recipient", label: "宛先", type: "text", required: true, placeholder: "採用担当者様" },
      { id: "name", label: "お名前", type: "text", required: true, placeholder: "山田太郎" },
      {
        id: "dates",
        label: "候補日程",
        type: "textarea",
        required: true,
        placeholder: "・12月20日(水) 10:00-12:00\n・12月21日(木) 14:00-16:00",
      },
      {
        id: "signature",
        label: "署名",
        type: "textarea",
        required: true,
        placeholder: "山田太郎\n○○大学経済学部\nメール: yamada@example.com\n電話: 090-1234-5678",
      },
    ],
  },
  {
    id: "thank-you",
    name: "お礼メール",
    subject: "面接のお礼 - {name}",
    body: `{recipient}様

本日はお忙しい中、貴重なお時間をいただき、誠にありがとうございました。
{name}です。

{content}

改めて、本日は貴重な機会をいただき、ありがとうございました。
今後ともどうぞよろしくお願いいたします。

{signature}`,
    fields: [
      { id: "recipient", label: "宛先", type: "text", required: true, placeholder: "採用担当者様" },
      { id: "name", label: "お名前", type: "text", required: true, placeholder: "山田太郎" },
      {
        id: "content",
        label: "お礼内容",
        type: "textarea",
        required: true,
        placeholder: "面接では、貴社の事業内容について詳しくお聞かせいただき...",
      },
      {
        id: "signature",
        label: "署名",
        type: "textarea",
        required: true,
        placeholder: "山田太郎\n○○大学経済学部\nメール: yamada@example.com\n電話: 090-1234-5678",
      },
    ],
  },
  {
    id: "orientation-contact",
    name: "内定式連絡",
    subject: "内定式について - {name}",
    body: `{recipient}様

いつもお世話になっております。
{name}です。

内定式についてご連絡いたします。

{content}

ご不明な点がございましたら、お気軽にお声がけください。
当日はよろしくお願いいたします。

{signature}`,
    fields: [
      { id: "recipient", label: "宛先", type: "text", required: true, placeholder: "人事部様" },
      { id: "name", label: "お名前", type: "text", required: true, placeholder: "山田太郎" },
      {
        id: "content",
        label: "連絡内容",
        type: "textarea",
        required: true,
        placeholder: "内定式の件でご連絡いたします...",
      },
      {
        id: "signature",
        label: "署名",
        type: "textarea",
        required: true,
        placeholder: "山田太郎\n○○大学経済学部\nメール: yamada@example.com\n電話: 090-1234-5678",
      },
    ],
  },
]

/** ★追加: EmailTemplate -> MailTemplate へのアダプタ（カテゴリを許可ユニオンに合致させる） */
const categoryById: Record<string, MailTemplate["category"]> = {
  "ob-visit": "OB訪問",
  "interview-schedule": "日程調整",
  "thank-you": "お礼",
  "orientation-contact": "説明会",
}

const mapFieldType = (
  t: EmailTemplate["fields"][number]["type"]
): "text" | "textarea" | "select" | "datetime" => {
  switch (t) {
    case "textarea":
      return "textarea"
    case "select":
      return "select"
    // "email" | "date" | "time" は MailTemplate 側の型に無いので text に寄せる
    default:
      return "text"
  }
}

const mailTemplates: MailTemplate[] = emailTemplates.map((t) => ({
  id: t.id,
  title: t.name,
  subject: t.subject,
  body: t.body,
  category: categoryById[t.id] ?? "質問", // ★修正: 許可済みユニオンのみ
  toHonorific: "様",
  fields: t.fields.map((f) => {
  const type = mapFieldType(f.type)
  if (type === "select") {
    return {
      key: f.id,
      label: f.label,
      type: "select" as const,
      options: f.options ?? [],
      required: f.required,
    }
  }
  if (type === "datetime") {
    return {
      key: f.id,
      label: f.label,
      type: "datetime" as const,
      required: f.required,
      placeholder: f.placeholder,
    }
  }
  if (type === "textarea") {
    return {
      key: f.id,
      label: f.label,
      type: "textarea" as const,
      required: f.required,
      placeholder: f.placeholder,
    }
  }
  // "text"
  return {
    key: f.id,
    label: f.label,
    type: "text" as const,
    required: f.required,
    placeholder: f.placeholder,
  }
}) as MailTemplate["fields"],

}))

export default function MailGeneratePage() {
  const [selectedTemplate, setSelectedTemplate] = useState<MailTemplate>(mailTemplates[0])
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})

  const handleTemplateChange = (template: MailTemplate) => {
    setSelectedTemplate(template)
    setFieldValues({})
  }

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  const generateEmail = () => {
    let subject = selectedTemplate.subject
    let body = selectedTemplate.body

    Object.entries(fieldValues).forEach(([key, value]) => {
      const placeholder = `{${key}}`
      subject = subject.replace(new RegExp(placeholder, "g"), value || `{${key}}`)
      body = body.replace(new RegExp(placeholder, "g"), value || `{${key}}`)
    })

    return { subject, body }
  }

  const handleCopy = async () => {
    const { subject, body } = generateEmail()
    const emailText = `件名: ${subject}\n\n${body}`

    try {
      await navigator.clipboard.writeText(emailText)
      console.log("[v0] Email copied to clipboard")
    } catch (err) {
      console.error("[v0] Failed to copy email:", err)
    }
  }

  const handleSave = () => {
    console.log("[v0] Saving email template with values:", fieldValues)
  }

  const handleReset = () => {
    setFieldValues({})
    console.log("[v0] Reset email form")
  }

  return (
  <div className="min-h-screen p-6">
    {/* Header */}
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-foreground">メール生成</h1>
      <HomeButton />
    </div>

    {/* Template Picker */}
    <div className="mb-6">
      <TemplatePicker
        templates={mailTemplates}
        selectedTemplate={selectedTemplate}
        onTemplateChange={handleTemplateChange}
      />
    </div>

    {/* Main Content - 2 Column Layout (Left: Settings, Right: Preview) */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
      {/* Left Column - Form */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-foreground">メール設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 overflow-y-auto max-h-[calc(100vh-300px)]">
          <DynamicTemplateFields template={selectedTemplate} values={fieldValues} onChange={handleFieldChange} />
        </CardContent>
      </Card>

      {/* Right Column - Preview */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-foreground">プレビュー</CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[calc(100vh-300px)]">
          <MailPreview subject={generateEmail().subject} body={generateEmail().body} />
        </CardContent>
      </Card>
    </div>

    {/* Action Buttons */}
    <div className="flex justify-center gap-4 mt-6">
      <Button onClick={handleCopy} className="bg-primary hover:bg-primary/90 text-primary-foreground">
        <Copy className="size-4 mr-2" />
        コピー
      </Button>
      <Button
        onClick={handleSave}
        className="glass-panel border-white/20 hover:bg白/20 bg-transparent"
      >
        <Save className="size-4 mr-2" />
        保存
      </Button>
      <Button
        onClick={handleReset}
        className="glass-panel border-white/20 hover:bg-white/20 bg-transparent"
      >
        <RotateCcw className="size-4 mr-2" />
        リセット
      </Button>
    </div>
  </div>
)

}
