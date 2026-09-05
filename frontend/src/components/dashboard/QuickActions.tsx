import { Link } from 'react-router-dom'
import {
  Calendar,
  CalendarDays,
  Users,
  Bell,
  Megaphone,
  Palmtree,
  PartyPopper,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/context/AuthContext'

const employeeActions = [
  { to: '/calendar', label: 'View Calendar', icon: Calendar, variant: 'default' as const },
  { to: '/reminders', label: 'Add Reminder', icon: Bell, variant: 'outline' as const },
  { to: '/leave', label: 'Apply Leave', icon: Palmtree, variant: 'outline' as const },
  { to: '/meetings', label: 'New Meeting', icon: Users, variant: 'outline' as const },
]

const adminActions = [
  { to: '/schedules', label: 'New Schedule', icon: CalendarDays, variant: 'default' as const },
  { to: '/meetings', label: 'New Meeting', icon: Users, variant: 'outline' as const },
  { to: '/announcements', label: 'Post Notice', icon: Megaphone, variant: 'outline' as const },
  { to: '/events', label: 'Add Event', icon: PartyPopper, variant: 'outline' as const },
]

export function QuickActions() {
  const { isAdmin } = useAuth()
  const actions = isAdmin ? adminActions : employeeActions

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map(({ to, label, icon: Icon, variant }) => (
            <Link
              key={to}
              to={to}
              className={
                variant === 'default'
                  ? 'flex items-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors'
                  : 'flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors'
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
