"use client"

import { useState } from "react"

import { HomeButton } from "@/components/app/home-button"
import { RoadmapTimeline } from "@/components/app/roadmap-timeline"
import { RoadmapCards } from "@/components/app/roadmap-cards"
import { RoadmapFilters } from "@/components/app/roadmap-filters"
import { FloatingCharacter } from "@/components/app/floating-character"

export interface RoadmapEvent {
  id: string
  title: string
  description: string
  date: string
  category: "準備" | "応募" | "選考" | "内定" | "その他"
  status: "完了" | "進行中" | "予定"
  company?: string
}

const mockEvents: RoadmapEvent[] = [
  {
    id: "1",
    title: "自己分析開始",
    description: "自分の強み・弱み、価値観の整理を行う",
    date: "2024-04-01",
    category: "準備",
    status: "完了",
  },
  {
    id: "2",
    title: "業界研究",
    description: "IT業界、金融業界、コンサル業界の研究",
    date: "2024-05-15",
    category: "準備",
    status: "完了",
  },
  {
    id: "3",
    title: "インターンシップ応募",
    description: "夏季インターンシップへの応募開始",
    date: "2024-06-01",
    category: "応募",
    status: "完了",
  },
  {
    id: "4",
    title: "テックイノベーション 一次面接",
    description: "株式会社テックイノベーションの一次面接",
    date: "2024-11-20",
    category: "選考",
    status: "完了",
    company: "株式会社テックイノベーション",
  },
  {
    id: "5",
    title: "テックイノベーション 最終面接",
    description: "株式会社テックイノベーションの最終面接",
    date: "2024-12-16",
    category: "選考",
    status: "進行中",
    company: "株式会社テックイノベーション",
  },
  {
    id: "6",
    title: "グローバル商事 書類選考",
    description: "グローバル商事株式会社への応募",
    date: "2024-12-20",
    category: "応募",
    status: "予定",
    company: "グローバル商事株式会社",
  },
  {
    id: "7",
    title: "内定式",
    description: "内定企業の内定式参加",
    date: "2025-04-01",
    category: "内定",
    status: "予定",
  },
]

export default function RoadmapPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("全期間")
  const [selectedCategory, setSelectedCategory] = useState<string>("全カテゴリ")
  const [selectedEvent, setSelectedEvent] = useState<RoadmapEvent | null>(null)

  const filteredEvents = mockEvents.filter((event) => {
    const periodMatch =
      selectedPeriod === "全期間" ||
      (selectedPeriod === "2024年" && event.date.startsWith("2024")) ||
      (selectedPeriod === "2025年" && event.date.startsWith("2025"))

    const categoryMatch = selectedCategory === "全カテゴリ" || event.category === selectedCategory

    return periodMatch && categoryMatch
  })

  const handleEventClick = (event: RoadmapEvent) => {
    setSelectedEvent(event)
    console.log("[v0] Roadmap event clicked:", event.title)
  }

  const handleCloseDetail = () => {
    setSelectedEvent(null)
  }

  return (
  <>
    <div className="min-h-screen p-6 relative overflow-hidden pb-32">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 relative z-20">
        <h1 className="text-2xl font-bold text-foreground">選考ロードマップ</h1>
        <div className="flex items-center gap-4">
          <RoadmapFilters
            selectedPeriod={selectedPeriod}
            selectedCategory={selectedCategory}
            onPeriodChange={setSelectedPeriod}
            onCategoryChange={setSelectedCategory}
          />
          <HomeButton />
        </div>
      </div>

      {/* Floating Character */}
      <FloatingCharacter />

      {/* Main Content - Cards */}
      <div className="relative z-10 mb-8">
        <RoadmapCards
          events={filteredEvents}
          onEventClick={handleEventClick}
          selectedEvent={selectedEvent}
          onCloseDetail={handleCloseDetail}
        />
      </div>
    </div>

    <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-background/80 backdrop-blur-sm border-t">
      <div className="max-w-7xl mx-auto">
        <RoadmapTimeline events={mockEvents} />
      </div>
    </div>
  </>
)

}
