"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { RoadmapEvent } from "@/app/roadmap/page"

interface RoadmapTimelineProps {
  events: RoadmapEvent[]
}

export function RoadmapTimeline({ events }: RoadmapTimelineProps) {
  const timelinePeriods = [
    { label: "大学2年後期", period: "2023-09", color: "bg-gray-500" },
    { label: "大学3年前期", period: "2024-04", color: "bg-blue-500" },
    { label: "大学3年後期", period: "2024-09", color: "bg-green-500" },
    { label: "大学4年前期", period: "2025-04", color: "bg-orange-500" },
    { label: "大学4年後期", period: "2025-09", color: "bg-red-500" },
  ]

  const getCurrentPosition = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    // Calculate position based on current date
    if (currentYear === 2024 && currentMonth >= 9) {
      return 60 // 3年後期
    } else if (currentYear === 2024) {
      return 40 // 3年前期
    } else if (currentYear === 2025 && currentMonth < 4) {
      return 60 // Still 3年後期
    } else if (currentYear === 2025 && currentMonth < 9) {
      return 80 // 4年前期
    }
    return 20 // Default to early position
  }

  return (
    <Card className="glass-panel border-white/20 mx-6 mb-6">
      <CardContent className="p-6">
        <div className="relative">
          {/* Timeline Bar */}
          <div className="h-3 bg-gradient-to-r from-gray-500 via-blue-500 via-green-500 via-orange-500 to-red-500 rounded-full relative">
            {/* Current Position Indicator */}
            <div
              className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-primary rounded-full border-4 border-white shadow-lg animate-pulse"
              style={{ left: `${getCurrentPosition()}%` }}
            />
          </div>

          {/* Timeline Labels */}
          <div className="flex justify-between mt-4">
            {timelinePeriods.map((period, index) => (
              <div key={period.period} className="text-center flex-1">
                <div className={`w-3 h-3 ${period.color} rounded-full mx-auto mb-2`} />
                <div className="text-xs text-muted-foreground font-medium">{period.label}</div>
              </div>
            ))}
          </div>

          {/* Event Markers */}
          <div className="absolute top-0 left-0 right-0 h-3">
            {events.map((event) => {
              const eventDate = new Date(event.date)
              const position = Math.min(
                Math.max(
                  ((eventDate.getTime() - new Date("2023-09-01").getTime()) /
                    (new Date("2025-12-31").getTime() - new Date("2023-09-01").getTime())) *
                    100,
                  0,
                ),
                100,
              )

              return (
                <div
                  key={event.id}
                  className="absolute top-0 w-2 h-3 bg-white rounded-sm shadow-sm transform -translate-x-1/2"
                  style={{ left: `${position}%` }}
                  title={event.title}
                />
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
