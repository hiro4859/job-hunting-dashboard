"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MailTemplate as EmailTemplate, Field } from "@/app/templates/mailTemplates"

// "YYYY-MM-DD HH:mm" ⇄ "YYYY-MM-DDTHH:mm"
const toDatetimeLocal = (v: string) => (v ? v.replace(" ", "T") : "")
const fromDatetimeLocal = (v: string) => (v ? v.replace("T", " ") : "")

// Field["type"] のユニオンに合わせる（email/tel/url/number は型に存在しない）
const inputTypeFor = (t: Field["type"]): React.HTMLInputTypeAttribute => {
  // 現状のユニオンでは "text" だけが <input> に直結
  return "text"
}

interface DynamicTemplateFieldsProps {
  template: EmailTemplate
  values: Record<string, string>
  onChange: (fieldId: string, value: string) => void
}

export function DynamicTemplateFields({ template, values, onChange }: DynamicTemplateFieldsProps) {
  const renderField = (field: EmailTemplate["fields"][0]) => {
    const value = values[field.key] || ""

    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            id={field.key}
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="glass-panel border-white/20 min-h-24 resize-none"
            required={field.required}
          />
        )

      case "select":
        return (
          <Select value={value} onValueChange={(val) => onChange(field.key, val)}>
            <SelectTrigger className="glass-panel border-white/20">
              {/* ▼ ここだけ修正（select 型には placeholder が無い） */}
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "datetime":
        return (
          <Input
            id={field.key}
            type="datetime-local"
            value={toDatetimeLocal(value)}
            onChange={(e) => onChange(field.key, fromDatetimeLocal(e.target.value))}
            placeholder={field.placeholder}
            className="glass-panel border-white/20"
            required={field.required}
          />
        )

      default:
        // "text" 想定
        return (
          <Input
            id={field.key}
            type={inputTypeFor(field.type)}
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="glass-panel border-white/20"
            required={field.required}
          />
        )
    }
  }

  return (
    <div className="space-y-4">
      {template.fields.map((field: Field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key} className="text-foreground font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {renderField(field)}
        </div>
      ))}
    </div>
  )
}
