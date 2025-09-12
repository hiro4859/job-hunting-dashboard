import type React from "react"
export type Company = {
  id: string
  name: string
  logoSrc?: string
  industry?: string
  priority?: number
  deadline?: string
  status?: "未着手" | "書類" | "面接" | "内定"
}

export type CalendarEvent = {
  id: string
  title: string
  date: string
  companyId?: string
}

export type ParseItem = {
  key: "日時" | "会場" | "締切" | "合否" | "その他"
  value: string
}

export type TabSpec = {
  id: string
  title: string
  content: React.ReactNode
}

export { default as ResizableLayout } from "@/components/app/resizable-layout"
