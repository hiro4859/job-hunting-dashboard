"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { CalendarEvent } from "@/types"

interface WeekCalendarProps {
  startDate: Date
  events: CalendarEvent[]
  onPrevWeek: () => void
  onNextWeek: () => void
  onSelectEvent?: (event: CalendarEvent) => void
}

export function WeekCalendar({ startDate, events, onPrevWeek, onNextWeek, onSelectEvent }: WeekCalendarProps) {
  const weekDays = ["月","火","水","木","金","土","日"]

  const getWeekDates = (start: Date) => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates(startDate)

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return events.filter((event) => event.date === dateStr)
  }

  return (
    <Card className="glass-card border-white/20 z-0">
      <CardContent className="p-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-foreground text-sm">
            {startDate.getFullYear()}年 {startDate.getMonth() + 1}月
          </h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onPrevWeek} className="hover:bg-white/20 h-6 w-6">
              <ChevronLeft className="size-3" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onNextWeek} className="hover:bg-white/20 h-6 w-6">
              <ChevronRight className="size-3" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((date, index) => {
            const dayEvents = getEventsForDate(date)
            const isToday = date.toDateString() === new Date().toDateString()

            return (
              <div key={date.toISOString()} className={`p-1 rounded-lg min-h-10 ${isToday ? "bg-primary/20 border border-primary/30" : "bg-white/5 border border-white/10"}`}>
                <div className="text-center mb-0.5">
                  <div className="text-xs text-foreground font-medium">{weekDays[index]}</div>
                  <div className={`text-sm font-bold ${isToday ? "text-white" : "text-foreground"}`}>{date.getDate()}</div>
                </div>
                <div className="space-y-0.5">
                  {dayEvents.map((event) => (
                    <div key={event.id} className="text-xs px-1 py-0.5 bg-primary/20 text-primary rounded cursor-pointer hover:bg-primary/30 transition-colors" onClick={() => onSelectEvent?.(event)}>
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
