import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types'

interface MiniCalendarProps {
  events?: CalendarEvent[]
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function MiniCalendar({ events = [] }: MiniCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date())

  const { year, month, days, eventDates } = useMemo(() => {
    const y = viewDate.getFullYear()
    const m = viewDate.getMonth()
    const firstDay = new Date(y, m, 1).getDay()
    const daysInMonth = new Date(y, m + 1, 0).getDate()

    const cells: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    const datesWithEvents = new Set(
      events.map((e) => {
        const raw = e.start.slice(0, 10)
        const [year, month, day] = raw.split('-').map(Number)
        if (year === y && month - 1 === m) return day
        return null
      }).filter(Boolean) as number[],
    )

    return { year: y, month: m, days: cells, eventDates: datesWithEvents }
  }, [viewDate, events])

  const today = new Date()
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="rounded-md p-1 hover:bg-accent"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-[13px] font-semibold text-foreground">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="rounded-md p-1 hover:bg-accent"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[11px]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 font-semibold uppercase tracking-wide text-muted-foreground">{d}</div>
        ))}
        {days.map((day, i) => (
          <div key={i} className="py-0.5">
            {day != null && (
              <span
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs',
                  isToday(day) && 'bg-[#2563eb] text-white font-semibold',
                  !isToday(day) && eventDates.has(day) && 'font-semibold text-primary',
                  !isToday(day) && !eventDates.has(day) && 'text-foreground',
                )}
              >
                {day}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
