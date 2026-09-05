import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { announcementsApi, remindersApi } from '@/services/api'
import { mockReminders, mockAnnouncements, delay } from '@/services/mockData'
import { formatDate, localIsoDate } from '@/lib/utils'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

interface NotificationItem {
  id: number
  title: string
  message: string
  type: 'reminder' | 'announcement'
  date: string
  urgent?: boolean
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [coords, setCoords] = useState({ top: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    try {
      if (USE_MOCK) {
        const reminders = (await delay(mockReminders)).map((r) => ({
          id: r.id,
          title: r.title,
          message: r.description || 'Reminder',
          type: 'reminder' as const,
          date: r.reminderDate,
        }))
        const announcements = (await delay(mockAnnouncements))
          .filter((a) => a.isUrgent)
          .map((a) => ({
            id: 100 + a.id,
            title: a.title,
            message: a.content,
            type: 'announcement' as const,
            date: a.createdAt,
            urgent: a.isUrgent,
          }))
        setItems([...announcements, ...reminders].slice(0, 8))
        return
      }

      const today = localIsoDate()
      const [reminderRes, announcementRes] = await Promise.all([
        remindersApi.getAll(),
        announcementsApi.getAll(),
      ])
      const reminders = reminderRes.data
        .filter((r) => r.reminderDate >= today)
        .slice(0, 5)
        .map((r) => ({
          id: r.id,
          title: r.title,
          message: r.description || 'Reminder',
          type: 'reminder' as const,
          date: r.reminderDate,
        }))
      const announcements = announcementRes.data
        .slice(0, 5)
        .map((a) => ({
          id: 1000 + a.id,
          title: a.title,
          message: a.content,
          type: 'announcement' as const,
          date: a.createdAt,
          urgent: a.isUrgent,
        }))
      setItems([...announcements.filter((a) => a.urgent), ...reminders, ...announcements.filter((a) => !a.urgent)].slice(0, 8))
    } catch {
      setItems([])
    }
  }

  useEffect(() => {
    load()
    const onVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  useEffect(() => {
    if (!open || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setCoords({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        onClick={() => setOpen(!open)}
        className="relative rounded-full bg-card text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
      >
        <Bell className="h-4 w-4" />
        {items.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#2563eb] px-1 text-[10px] font-bold text-white">
            {items.length > 9 ? '9+' : items.length}
          </span>
        )}
      </Button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: coords.top, right: coords.right }}
            className="fixed z-[80] w-80 rounded-lg border border-border bg-card shadow-lg"
          >
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">No new notifications</p>
              ) : (
                items.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="border-b border-border px-4 py-3 last:border-0 hover:bg-accent/50">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(item.date)}</p>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-border px-4 py-2">
              <Link
                to="/announcements"
                onClick={() => setOpen(false)}
                className="text-xs text-primary hover:underline"
              >
                View all announcements
              </Link>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
