import { cn } from '@/lib/utils'

interface AerotechLogoProps {
  className?: string
  markClassName?: string
  showWordmark?: boolean
  compact?: boolean
  inverted?: boolean
}

export function AerotechMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-10 w-10', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="aero-top" x1="32" y1="2" x2="32" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5BA3F7" />
          <stop offset="45%" stopColor="#2F6FDB" />
          <stop offset="100%" stopColor="#1E4FA8" />
        </linearGradient>
        <linearGradient id="aero-top-inner" x1="22" y1="14" x2="42" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="aero-bot" x1="32" y1="33" x2="32" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9CA3AF" />
          <stop offset="55%" stopColor="#4B5563" />
          <stop offset="100%" stopColor="#1F2937" />
        </linearGradient>
        <linearGradient id="aero-bot-inner" x1="22" y1="36" x2="44" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E5E7EB" />
          <stop offset="100%" stopColor="#6B7280" />
        </linearGradient>
      </defs>
      <path d="M32 3 58 29.2H47.1L32 14.6 16.9 29.2H6L32 3Z" fill="url(#aero-top)" />
      <path d="M32 10.8 47.1 29.2H16.9L32 10.8Z" fill="url(#aero-top-inner)" />
      <path d="M32 61 6 34.8h10.9L32 49.4 47.1 34.8H58L32 61Z" fill="url(#aero-bot)" />
      <path d="M32 53.2 16.9 34.8h30.2L32 53.2Z" fill="url(#aero-bot-inner)" />
    </svg>
  )
}

export function AerotechLogo({
  className,
  markClassName,
  showWordmark = true,
  compact = false,
}: AerotechLogoProps) {
  if (showWordmark) {
    return (
      <img
        src="/brand/aerotech-logo.png"
        alt="Aerotech Bhutan"
        className={cn(
          'w-auto max-w-full object-contain object-left',
          compact ? 'h-10' : 'h-[52px]',
          className,
        )}
      />
    )
  }

  return <AerotechMark className={cn(compact ? 'h-8 w-8' : 'h-11 w-11', markClassName, className)} />
}
