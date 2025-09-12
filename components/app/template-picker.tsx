"use client"

import { Mail } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { MailTemplate as EmailTemplate } from "@/app/templates/mailTemplates"

interface TemplatePickerProps {
  templates: EmailTemplate[]
  selectedTemplate: EmailTemplate
  onTemplateChange: (template: EmailTemplate) => void
}

export function TemplatePicker({ templates, selectedTemplate, onTemplateChange }: TemplatePickerProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Mail className="size-5" />
        テンプレート選択
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`
              cursor-pointer transition-all duration-200 glass-card border-white/20
              ${
                selectedTemplate.id === template.id
                  ? "bg-primary/20 border-primary/40 shadow-lg"
                  : "hover:bg-white/20 hover:border-white/30"
              }
            `}
            onClick={() => onTemplateChange(template)}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Mail className="size-6 text-primary" />
              </div>
              <h3
                className={`
                font-medium text-sm text-balance
                ${selectedTemplate.id === template.id ? "text-primary" : "text-foreground"}
              `}
              >
                {template.title}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
