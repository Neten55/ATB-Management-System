import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export function formatDate(date: string | Date): string {
  const parsed = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)
    ? (() => {
        const [year, month, day] = date.slice(0, 10).split('-').map(Number)
        return new Date(year, month - 1, day)
      })()
    : new Date(date)

  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Convert Buddhist-era (or mis-parsed) yyyy-MM-dd values to Gregorian. */
export function gregorianIsoDate(value: string): string {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return value
  let year = Number(match[1])
  if (year >= 2400) year -= 543
  else if (year > 1300 && year < 1900) year += 543
  return `${String(year).padStart(4, '0')}-${match[2]}-${match[3]}`
}

export function localIsoDate(date = new Date()): string {
  return gregorianIsoDate(
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
  )
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
