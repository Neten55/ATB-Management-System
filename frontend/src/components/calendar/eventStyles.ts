import type { EventCategory } from '@/types'
import {
  Users,
  Bell,
  Palmtree,
  PartyPopper,
  GraduationCap,
  Clock,
  Shield,
  Plane,
  Cake,
  Megaphone,
  type LucideIcon,
} from 'lucide-react'

export const EVENT_PILL: Record<EventCategory, { bg: string; text: string; border: string }> = {
  Meeting: { bg: '#D1FAE5', text: '#047857', border: '#A7F3D0' },
  Schedule: { bg: '#D1FAE5', text: '#047857', border: '#A7F3D0' },
  Leave: { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' },
  Training: { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
  Workshop: { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' },
  CompanyEvent: { bg: '#EDE9FE', text: '#6D28D9', border: '#DDD6FE' },
  Reminder: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  Deadline: { bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA' },
  Holiday: { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },
  Birthday: { bg: '#FCE7F3', text: '#BE185D', border: '#FBCFE8' },
  Announcement: { bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA' },
}

export const EVENT_ICONS: Record<EventCategory, LucideIcon> = {
  Meeting: Users,
  Schedule: Clock,
  Leave: Palmtree,
  Training: GraduationCap,
  Workshop: GraduationCap,
  CompanyEvent: PartyPopper,
  Reminder: Bell,
  Deadline: Bell,
  Holiday: Plane,
  Birthday: Cake,
  Announcement: Megaphone,
}

export function eventIcon(category: EventCategory) {
  return category === 'CompanyEvent' ? Shield : EVENT_ICONS[category]
}
