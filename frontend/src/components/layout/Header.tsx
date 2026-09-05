import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/ui/Button'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { AerotechLogo } from '@/components/brand/AerotechLogo'
import { HeaderSky, SidebarMountains } from '@/components/brand/BrandArt'
import { cn } from '@/lib/utils'

const mobileNav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/meetings', label: 'Meetings' },
  { to: '/leave', label: 'Leave' },
  { to: '/profile', label: 'Profile' },
]

export function Header() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <header className="relative isolate flex h-[92px] items-center justify-between overflow-hidden border-b border-border bg-card px-5 shadow-[0_2px_14px_rgba(15,56,110,0.05)] md:px-6 dark:shadow-none">
        <HeaderSky />
        <div className="relative z-10 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-[15px] font-bold text-foreground">{today}</p>
            <p className="text-[15px] font-medium text-primary">
              Welcome back, {user?.firstName}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2.5">
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="rounded-full">
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <Link
            to="/profile"
            title={user?.fullName}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90"
          >
            {initials}
          </Link>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col overflow-hidden bg-card shadow-xl">
            <div className="flex items-center justify-between bg-card px-4 py-4">
              <AerotechLogo compact />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative flex-1 bg-[#03366F]">
              <nav className="relative z-10 space-y-1 p-3">
                {mobileNav.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-lg px-3 py-2.5 text-sm font-medium',
                        isActive ? 'bg-[#2F80ED] text-white' : 'text-white/90 hover:bg-white/10',
                      )
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>
              <SidebarMountains />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
