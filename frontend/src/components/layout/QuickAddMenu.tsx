import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  Plus,
  CalendarDays,
  Users,
  Bell,
  Megaphone,
  Palmtree,
  PartyPopper,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const employeeActions = [
  { to: '/meetings', label: 'New Meeting', icon: Users },
  { to: '/reminders', label: 'Add Reminder', icon: Bell },
  { to: '/leave', label: 'Apply Leave', icon: Palmtree },
]

const adminActions = [
  { to: '/schedules', label: 'New Schedule', icon: CalendarDays },
  { to: '/meetings', label: 'New Meeting', icon: Users },
  { to: '/events', label: 'Add Event', icon: PartyPopper },
  { to: '/announcements', label: 'Post Notice', icon: Megaphone },
]

export function QuickAddMenu() {
  const { isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ bottom: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const actions = isAdmin ? adminActions : employeeActions

  useEffect(() => {
    if (!open || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setCoords({
      bottom: window.innerHeight - rect.top + 10,
      right: window.innerWidth - rect.right,
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Quick add"
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-[#0b3a7a] text-white shadow-[0_10px_28px_rgba(11,58,122,0.35)] transition-transform hover:scale-105 hover:bg-[#072e66] active:scale-95 sm:bottom-6 sm:right-6 sm:h-auto sm:w-auto sm:rounded-full sm:px-5 sm:py-3.5"
      >
        <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
        <span className="hidden text-sm font-semibold sm:inline">Quick Add</span>
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ bottom: coords.bottom, right: coords.right }}
            className="fixed z-[80] w-48 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
          >
            {actions.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent"
              >
                <Icon className="h-4 w-4 text-[#2563eb]" />
                {label}
              </Link>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
