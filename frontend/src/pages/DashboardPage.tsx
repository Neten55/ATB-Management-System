import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlarmClock, ArrowRight, Bell, CalendarDays, Clock3, Megaphone, Palmtree, PartyPopper, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MiniCalendar } from '@/components/dashboard/MiniCalendar'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { useAuth } from '@/context/AuthContext'
import { dashboardApi } from '@/services/api'
import { delay, mockDashboard } from '@/services/mockData'
import type { DashboardData } from '@/types'
import { formatTime } from '@/lib/utils'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const emptyDashboard: DashboardData = { todaySchedules: [], upcomingMeetings: [], upcomingEvents: [], recentAnnouncements: [], todayReminders: [], onLeaveToday: [], miniCalendarEvents: [], pendingLeave: [] }

function displayDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function relativeDate(value: string) {
  const date = new Date(value)
  const today = new Date()
  const days = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / 86400000)
  return days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`
}

function EmptyState({ children }: { children: string }) { return <p className="py-7 text-center text-sm text-muted-foreground">{children}</p> }
function SectionLink({ to }: { to: string }) { return <Link to={to} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">View all <ArrowRight className="h-3.5 w-3.5" /></Link> }

export function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData>(emptyDashboard)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function loadDashboard() {
      try {
        const response = USE_MOCK ? await delay(mockDashboard) : await dashboardApi.get().then((res) => res.data)
        if (active) setData({ ...emptyDashboard, ...response, pendingLeave: response.pendingLeave ?? [] })
      } catch {
        if (active) setData(USE_MOCK ? mockDashboard : emptyDashboard)
      } finally { if (active) setLoading(false) }
    }
    loadDashboard()
    return () => { active = false }
  }, [])

  const greetingDate = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }), [])
  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  const stats = [
    { label: "Today's schedule", value: data.todaySchedules.length, icon: Clock3, tone: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
    { label: 'Upcoming meetings', value: data.upcomingMeetings.length, icon: Users, tone: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' },
    { label: "Today's reminders", value: data.todayReminders.length, icon: Bell, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
    { label: 'On leave today', value: data.onLeaveToday.length, icon: Palmtree, tone: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400' },
  ]

  return <div className="space-y-5">
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div><p className="text-sm font-medium text-primary">{greetingDate}</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Good day, {user?.firstName || 'there'}</h1><p className="mt-1 text-sm text-muted-foreground">Here is a clear view of your day at Aerotech Bhutan.</p></div>
      <Link to="/calendar" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"><CalendarDays className="h-4 w-4" />Open calendar</Link>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon, tone }) => <Card key={label} className="rounded-xl border-border shadow-sm"><CardContent className="flex items-center gap-3 p-4"><div className={`rounded-lg p-2.5 ${tone}`}><Icon className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>)}</section>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.9fr)]">
      <div className="space-y-5">
        <Card className="rounded-2xl border-border shadow-sm"><CardHeader className="flex-row items-center justify-between p-5 pb-3"><CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-4 w-4 text-primary" />Today's schedule</CardTitle><SectionLink to="/schedules" /></CardHeader><CardContent className="p-5 pt-1">{data.todaySchedules.length === 0 ? <EmptyState>No schedules for today</EmptyState> : <div className="divide-y divide-border">{data.todaySchedules.slice(0, 4).map((item) => <div key={item.id} className="flex gap-3 py-3 first:pt-2"><div className="w-16 shrink-0 text-xs font-semibold text-primary">{formatTime(item.startTime)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{formatTime(item.startTime)} – {formatTime(item.endTime)}{item.location ? ` · ${item.location}` : ''}</p></div><Badge variant="outline" className="h-fit text-[11px]">{item.priority}</Badge></div>)}</div>}</CardContent></Card>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="rounded-2xl border-border shadow-sm"><CardHeader className="flex-row items-center justify-between p-5 pb-3"><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" />Upcoming meetings</CardTitle><SectionLink to="/meetings" /></CardHeader><CardContent className="p-5 pt-1">{data.upcomingMeetings.length === 0 ? <EmptyState>No upcoming meetings</EmptyState> : <div className="space-y-3">{data.upcomingMeetings.slice(0, 3).map((item) => <div key={item.id} className="flex gap-3 rounded-xl bg-muted/50 p-3"><div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" /><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{displayDate(item.meetingDate)} · {formatTime(item.startTime)}{item.location ? ` · ${item.location}` : ''}</p></div></div>)}</div>}</CardContent></Card>
          <Card className="rounded-2xl border-border shadow-sm"><CardHeader className="flex-row items-center justify-between p-5 pb-3"><CardTitle className="flex items-center gap-2 text-base"><PartyPopper className="h-4 w-4 text-primary" />Upcoming events</CardTitle><SectionLink to="/events" /></CardHeader><CardContent className="p-5 pt-1">{data.upcomingEvents.length === 0 ? <EmptyState>No upcoming events</EmptyState> : <div className="space-y-3">{data.upcomingEvents.slice(0, 3).map((item) => <div key={item.id} className="flex gap-3 rounded-xl bg-muted/50 p-3"><div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-fuchsia-500" /><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{displayDate(item.startDate)}{item.startTime ? ` · ${formatTime(item.startTime)}` : ''}{item.location ? ` · ${item.location}` : ''}</p></div></div>)}</div>}</CardContent></Card>
        </div>
      </div>
      <aside className="space-y-5">
        <QuickActions />
        <Card className="rounded-2xl border-border shadow-sm"><CardHeader className="p-5 pb-3"><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4 text-primary" />This month</CardTitle></CardHeader><CardContent className="p-5 pt-0"><MiniCalendar events={data.miniCalendarEvents} /></CardContent></Card>
        <Card className="rounded-2xl border-border shadow-sm"><CardHeader className="flex-row items-center justify-between p-5 pb-3"><CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-4 w-4 text-primary" />Announcements</CardTitle><SectionLink to="/announcements" /></CardHeader><CardContent className="space-y-3 p-5 pt-1">{data.recentAnnouncements.length === 0 ? <EmptyState>No announcements yet</EmptyState> : data.recentAnnouncements.slice(0, 3).map((item) => <div key={item.id} className="rounded-xl border border-border p-3"><div className="flex gap-2"><p className="min-w-0 flex-1 truncate text-sm font-semibold">{item.title}</p>{item.isUrgent && <Badge variant="destructive" className="text-[10px]">Urgent</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">{relativeDate(item.createdAt)}</p></div>)}</CardContent></Card>
        <Card className="rounded-2xl border-border shadow-sm"><CardHeader className="flex-row items-center justify-between p-5 pb-3"><CardTitle className="flex items-center gap-2 text-base"><Palmtree className="h-4 w-4 text-primary" />Leave overview</CardTitle><SectionLink to="/leave" /></CardHeader><CardContent className="p-5 pt-1">{data.onLeaveToday.length === 0 ? <EmptyState>Everyone is available today</EmptyState> : <div className="space-y-3">{data.onLeaveToday.slice(0, 4).map((item) => <div key={item.id} className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300">{item.userName.split(' ').map((name) => name[0]).join('').slice(0, 2)}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.userName}</p><p className="text-xs text-muted-foreground">{item.leaveType} leave</p></div></div>)}</div>}</CardContent></Card>
        {data.todayReminders.length > 0 && <Card className="rounded-2xl border-border shadow-sm"><CardHeader className="p-5 pb-3"><CardTitle className="flex items-center gap-2 text-base"><AlarmClock className="h-4 w-4 text-primary" />Today's reminders</CardTitle></CardHeader><CardContent className="space-y-2 p-5 pt-0">{data.todayReminders.slice(0, 3).map((item) => <div key={item.id} className="flex items-center gap-2 text-sm"><Bell className="h-3.5 w-3.5 shrink-0 text-amber-500" /><span className="truncate">{item.title}</span></div>)}</CardContent></Card>}
      </aside>
    </div>
  </div>
}
