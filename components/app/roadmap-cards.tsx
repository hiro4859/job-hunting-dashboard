"use client"

import { Calendar, Building2, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { RoadmapEvent } from "@/app/roadmap/page"

interface RoadmapCardsProps {
  events: RoadmapEvent[]
  onEventClick: (event: RoadmapEvent) => void
  selectedEvent: RoadmapEvent | null
  onCloseDetail: () => void
}

const getStatusColor = (status: RoadmapEvent["status"]) => {
  switch (status) {
    case "完了":
      return "bg-green-500/20 text-green-700 border-green-500/30"
    case "進行中":
      return "bg-blue-500/20 text-blue-700 border-blue-500/30"
    default:
      return "bg-gray-500/20 text-gray-700 border-gray-500/30"
  }
}

const getCategoryColor = (category: RoadmapEvent["category"]) => {
  switch (category) {
    case "準備":
      return "bg-purple-500/20 text-purple-700 border-purple-500/30"
    case "応募":
      return "bg-blue-500/20 text-blue-700 border-blue-500/30"
    case "選考":
      return "bg-orange-500/20 text-orange-700 border-orange-500/30"
    case "内定":
      return "bg-green-500/20 text-green-700 border-green-500/30"
    default:
      return "bg-gray-500/20 text-gray-700 border-gray-500/30"
  }
}




export function RoadmapCards({ events, onEventClick, selectedEvent, onCloseDetail }: RoadmapCardsProps) {
  if (selectedEvent) {
    return (
      <Card className="glass-card border-white/20 max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl text-foreground">{selectedEvent.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getCategoryColor(selectedEvent.category)}>{selectedEvent.category}</Badge>
              <Badge className={getStatusColor(selectedEvent.status)}>{selectedEvent.status}</Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCloseDetail} className="hover:bg-white/20">
            <X className="size-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-4" />
                <span>{new Date(selectedEvent.date).toLocaleDateString("ja-JP")}</span>
              </div>

              {selectedEvent.company && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="size-4" />
                  <span>{selectedEvent.company}</span>
                </div>
              )}
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 className="font-medium text-foreground mb-2">詳細</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">{selectedEvent.description}</p>
            </div>
          </div>

          {/* Additional mock details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-panel border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">85%</div>
                <div className="text-sm text-muted-foreground">進捗率</div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">3</div>
                <div className="text-sm text-muted-foreground">関連タスク</div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">2</div>
                <div className="text-sm text-muted-foreground">残り日数</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {events.map((event) => (
        <Card
          key={event.id}
          className="glass-card border-white/20 cursor-pointer hover:bg-white/20 transition-all duration-200 transform hover:scale-[1.02]"
          onClick={() => onEventClick(event)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
                  <Badge className={getCategoryColor(event.category)}>{event.category}</Badge>
                  <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                </div>

                <p className="text-muted-foreground text-sm mb-3">{event.description}</p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="size-4" />
                    <span>{new Date(event.date).toLocaleDateString("ja-JP")}</span>
                  </div>

                  {event.company && (
                    <div className="flex items-center gap-1">
                      <Building2 className="size-4" />
                      <span>{event.company}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">クリックで詳細</div>
                <div className="w-2 h-8 bg-primary/30 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {events.length === 0 && (
        <Card className="glass-card border-white/20">
          <CardContent className="p-12 text-center">
            <Calendar className="size-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">選択した条件に一致するイベントがありません。</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
