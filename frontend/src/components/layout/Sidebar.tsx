import { NavLink } from 'react-router-dom'
import {
  Calendar,
  LayoutDashboard,
  CalendarDays,
  Users,
  Bell,
  Megaphone,
  Palmtree,
  PartyPopper,
  Plane,
  UserCog,
  FolderKanban,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { AerotechLogo } from '@/components/brand/AerotechLogo'
import { SidebarMountains } from '@/components/brand/BrandArt'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/schedules', label: 'Schedules', icon: CalendarDays, adminOnly: true },
  { to: '/meetings', label: 'Meetings', icon: Users },
  { to: '/reminders', label: 'Reminders', icon: Bell },
  { to: '/events', label: 'Events', icon: PartyPopper, adminOnly: true },
  { to: '/leave', label: 'Leave', icon: Palmtree },
  { to: '/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/holidays', label: 'Holidays', icon: Plane, adminOnly: true },
  { to: '/employees', label: 'Employees', icon: UserCog, adminOnly: true },
]

export function Sidebar() {
  const { isAdmin } = useAuth()
  const filteredItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <aside className="hidden w-[248px] flex-shrink-0 flex-col bg-white md:flex">
      <div className="flex h-[92px] items-center border-b border-border bg-white px-5 md:px-6">
        <AerotechLogo />
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#03366F]">
        <nav className="relative z-10 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 pt-3">
          {filteredItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors',
                  isActive
                    ? 'bg-[#0A52B8] text-white shadow-sm'
                    : 'text-white/90 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>

        <SidebarMountains />
      </div>
    </aside>
  )
}
