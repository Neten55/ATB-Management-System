import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventContentArg } from '@fullcalendar/core'
import { Search, Filter, Download, X, Megaphone, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MiniCalendar } from '@/components/dashboard/MiniCalendar'
import { WaveFooter } from '@/components/brand/BrandArt'
import { calendarApi, dashboardApi } from '@/services/api'
import { mockCalendarEvents, mockDashboard, delay } from '@/services/mockData'
import type { Announcement, CalendarEvent, CompanyEvent, DashboardData, EventCategory, Meeting } from '@/types'
import { EVENT_CATEGORY_LABELS } from '@/types'
import { formatTime, localIsoDate } from '@/lib/utils'
import { EVENT_PILL, eventIcon } from '@/components/calendar/eventStyles'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

const ALL_CATEGORIES: EventCategory[] = [
  'Meeting', 'Reminder', 'CompanyEvent', 'Holiday', 'Leave',
  'Deadline', 'Training', 'Workshop', 'Birthday', 'Schedule',
]

const emptyDashboard: DashboardData = {
  todaySchedules: [],
  upcomingMeetings: [],
  upcomingEvents: [],
  recentAnnouncements: [],
  todayReminders: [],
  onLeaveToday: [],
  miniCalendarEvents: [],
  pendingLeave: [],
}

function relativeTime(isoDate: string) {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number)
  const then = new Date(y, m - 1, d).getTime()
  const today = new Date()
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const days = Math.round((now - then) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function shortDate(isoDate: string) {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function toIcsDate(value: string, allDay: boolean) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.replace(/[-:]/g, '').slice(0, 8)
  if (allDay) {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  }
  return `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
}

function exportIcs(events: CalendarEvent[]) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aerotech Bhutan//Company Calendar//EN',
    ...events.flatMap((event) => [
      'BEGIN:VEVENT',
      `UID:${event.id}@aerotech.bt`,
      `SUMMARY:${event.title.replace(/\n/g, ' ')}`,
      `DTSTART${event.allDay ? ';VALUE=DATE' : ''}:${toIcsDate(event.start, event.allDay)}`,
      `DTEND${event.allDay ? ';VALUE=DATE' : ''}:${toIcsDate(event.end, event.allDay)}`,
      event.location ? `LOCATION:${event.location}` : '',
      'END:VEVENT',
    ].filter(Boolean)),
    'END:VCALENDAR',
  ]
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'aerotech-calendar.ics'
  a.click()
  URL.revokeObjectURL(url)
}

function EventPill({ event }: { event: EventContentArg }) {
  const category = (event.event.extendedProps.category || 'Meeting') as EventCategory
  const pill = EVENT_PILL[category] ?? EVENT_PILL.Meeting
  const Icon = eventIcon(category)
  return (
    <span
      className="flex w-full min-w-0 items-center gap-1 overflow-hidden rounded-md px-1.5 py-[2px] text-[11px] font-medium leading-tight"
      style={{ background: pill.bg, color: pill.text, border: `1px solid ${pill.border}` }}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span className="truncate">{event.timeText ? `${event.timeText} ${event.event.title}` : event.event.title}</span>
    </span>
  )
}

export function CalendarWorkspace() {
  const calendarRef = useRef<InstanceType<typeof FullCalendar>>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [dash, setDash] = useState<DashboardData>(emptyDashboard)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategories, setActiveCategories] = useState<EventCategory[]>(ALL_CATEGORIES)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchResults, setSearchResults] = useState<CalendarEvent[]>([])
  const [searching, setSearching] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(false)
  const searchWrapRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (USE_MOCK) {
        setEvents(await delay(mockCalendarEvents))
        setDash(await delay(mockDashboard))
      } else {
        const now = new Date()
        const start = localIsoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
        const end = localIsoDate(new Date(now.getFullYear(), now.getMonth() + 2, 0))
        const [cal, board] = await Promise.all([
          calendarApi.getEvents(start, end),
          dashboardApi.get(),
        ])
        setEvents(cal.data)
        setDash({ ...emptyDashboard, ...board.data, pendingLeave: board.data.pendingLeave ?? [] })
      }
    } catch {
      setEvents(USE_MOCK ? mockCalendarEvents : [])
      setDash(USE_MOCK ? mockDashboard : emptyDashboard)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [load])

  useEffect(() => {
    const term = search.trim()
    if (!term) {
      setSearchResults([])
      setResultsOpen(false)
      setSearching(false)
      return
    }
    setResultsOpen(true)
    setSearching(true)
    const timeout = setTimeout(async () => {
      try {
        if (USE_MOCK) {
          const results = mockCalendarEvents.filter((e) => e.title.toLowerCase().includes(term.toLowerCase()))
          setSearchResults(results.slice(0, 50))
        } else {
          const { data } = await calendarApi.search(term)
          setSearchResults(data)
        }
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    if (!resultsOpen) return
    const onClick = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) setResultsOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [resultsOpen])

  const openSearchResult = (item: CalendarEvent) => {
    setResultsOpen(false)
    setSearch('')
    setSelectedEvent(item)
    calendarRef.current?.getApi().gotoDate(item.start)
  }

  const filteredEvents = events.filter((e) => {
    const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase())
    return matchesSearch && activeCategories.includes(e.category)
  })

  const fcEvents = filteredEvents.map((e) => ({
    id: String(e.id),
    title: e.title,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    extendedProps: e,
  }))

  const upcoming = useMemo(() => {
    const items: { key: string; title: string; when: string; color: string }[] = []
    dash.upcomingMeetings.slice(0, 3).forEach((m: Meeting) => {
      items.push({
        key: `m-${m.id}`,
        title: m.title,
        when: `${m.meetingDate === localIsoDate() ? 'Today' : shortDate(m.meetingDate)} · ${formatTime(m.startTime)}`,
        color: EVENT_PILL.Meeting.text,
      })
    })
    dash.upcomingEvents.slice(0, 3).forEach((e: CompanyEvent) => {
      items.push({
        key: `e-${e.id}`,
        title: e.title,
        when: `${shortDate(e.startDate)}${e.startTime ? ` · ${formatTime(e.startTime)}` : ''}`,
        color: EVENT_PILL.CompanyEvent.text,
      })
    })
    return items.slice(0, 3)
  }, [dash])

  const announcements: Announcement[] = dash.recentAnnouncements.slice(0, 2)

  const toggleCategory = (cat: EventCategory) => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 xl:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-foreground">Company Calendar</h1>
            <p className="text-sm text-muted-foreground">Schedules, meetings, events, and more.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64" ref={searchWrapRef}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => search.trim() && setResultsOpen(true)}
                className="h-9 rounded-lg border-border bg-card pl-9 shadow-sm"
              />
              {resultsOpen && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
                  {searching ? (
                    <p className="px-3 py-3 text-sm text-muted-foreground">Searching…</p>
                  ) : searchResults.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-muted-foreground">No matching calendar entries found.</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {searchResults.map((item) => (
                        <li key={`${item.category}-${item.id}`}>
                          <button
                            type="button"
                            onClick={() => openSearchResult(item)}
                            className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-accent/50"
                          >
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: EVENT_PILL[item.category]?.text }} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
                              <span className="block text-xs text-muted-foreground">
                                {new Date(item.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {EVENT_CATEGORY_LABELS[item.category]}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Toggle filters"
              className="h-9 w-9 rounded-lg border-border bg-card shadow-sm"
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportIcs(filteredEvents)}
              className="h-9 rounded-lg border-border bg-card shadow-sm"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className="transition-opacity"
                  style={{ opacity: activeCategories.includes(cat) ? 1 : 0.35 }}
                >
                  <Badge style={{ backgroundColor: EVENT_PILL[cat].bg, color: EVENT_PILL[cat].text, border: `1px solid ${EVENT_PILL[cat].border}` }}>
                    {EVENT_CATEGORY_LABELS[cat]}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="aerotech-calendar overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent" />
            </div>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
              }}
              events={fcEvents}
              eventClick={(info: EventClickArg) => setSelectedEvent(info.event.extendedProps as CalendarEvent)}
              eventContent={(arg) => <EventPill event={arg} />}
              height="auto"
              aspectRatio={1.55}
              nowIndicator
              dayMaxEvents={3}
              eventDisplay="block"
              displayEventTime
              eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
              slotMinTime="07:00:00"
              slotMaxTime="20:00:00"
              allDayText="All Day"
              buttonText={{
                today: 'Today',
                month: 'Month',
                week: 'Week',
                day: 'Day',
                list: 'Agenda',
              }}
            />
          )}
        </div>
      </div>

      <aside className="w-full shrink-0 space-y-4 xl:w-[280px]">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <MiniCalendar events={dash.miniCalendarEvents.length ? dash.miniCalendarEvents : events} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Upcoming Events</h2>
            <Link to="/calendar" className="text-xs font-medium text-[#2563eb] hover:underline">View all</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">No upcoming events</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((item) => (
                <div key={item.key} className="flex gap-2.5">
                  <span className="mt-0.5 w-1 shrink-0 rounded-full" style={{ background: item.color }} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.when}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Company Announcements</h2>
            <Link to="/announcements" className="text-xs font-medium text-[#2563eb] hover:underline">View all</Link>
          </div>
          {announcements.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">No announcements yet</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-primary dark:bg-sky-950/50">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{relativeTime(a.createdAt)}</p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </div>

        <WaveFooter />
      </aside>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setSelectedEvent(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-4 flex items-start gap-3">
              <div
                className="mt-1 h-4 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: EVENT_PILL[selectedEvent.category]?.text }}
              />
              <div>
                <h2 className="text-lg font-semibold text-foreground">{selectedEvent.title}</h2>
                <Badge
                  className="mt-1"
                  style={{
                    backgroundColor: EVENT_PILL[selectedEvent.category]?.bg,
                    color: EVENT_PILL[selectedEvent.category]?.text,
                    border: `1px solid ${EVENT_PILL[selectedEvent.category]?.border}`,
                  }}
                >
                  {EVENT_CATEGORY_LABELS[selectedEvent.category]}
                </Badge>
              </div>
            </div>
            <div className="space-y-2 text-sm text-foreground">
              <p><span className="text-muted-foreground">Start:</span> {new Date(selectedEvent.start).toLocaleString()}</p>
              <p><span className="text-muted-foreground">End:</span> {new Date(selectedEvent.end).toLocaleString()}</p>
              {selectedEvent.location && <p><span className="text-muted-foreground">Location:</span> {selectedEvent.location}</p>}
              {selectedEvent.departmentName && <p><span className="text-muted-foreground">Department:</span> {selectedEvent.departmentName}</p>}
              {selectedEvent.description && <p className="mt-2 text-muted-foreground">{selectedEvent.description}</p>}
            </div>
            <Button className="mt-4 w-full" onClick={() => setSelectedEvent(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  )
}
