import { cn } from '@/lib/utils'
import { AerotechMark } from '@/components/brand/AerotechLogo'

export function SidebarMountains({ className }: { className?: string }) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-[62%] overflow-hidden', className)}
      aria-hidden
    >
      <img
        src="/brand/sidebar-photo.webp"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[68%_22%] grayscale-[15%]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#03366F] from-0% via-[#03366F]/90 via-45% to-[#03366F]/45 to-100%" />
    </div>
  )
}

export function HeaderSky({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div
        className="absolute inset-y-0 right-0 hidden w-[62%] md:block"
        style={{
          backgroundImage: 'url(/brand/header-photo.webp)',
          backgroundSize: 'cover',
          backgroundPosition: '50% 20%',
          maskImage: 'linear-gradient(to left, black 55%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, black 55%, transparent 100%)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-card from-30% via-card/55 via-60% to-card/10" />
    </div>
  )
}

export function WaveFooter({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-2.5 px-4 py-4', className)}>
      <div className="h-px w-16 bg-gradient-to-r from-transparent via-border to-transparent" />
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        <AerotechMark className="h-3.5 w-3.5 opacity-70" />Together, we fly higher
      </p>
    </div>
  )
}
