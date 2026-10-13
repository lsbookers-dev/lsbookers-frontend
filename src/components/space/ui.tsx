/** Éléments communs aux zones de Mon espace. */

import Link from 'next/link'

export type Person = { profileId: number; userId: number | null; role: string | null; name: string; avatar: string | null }

export function SpacePanel({ kicker, title, action, id, className = '', children }: {
  kicker: string
  title: React.ReactNode
  action?: React.ReactNode
  id?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className={`grid min-w-0 content-start gap-3 rounded-[18px] border border-line bg-surface/90 p-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-[.18em] text-violet-400">{kicker}</span>
          <h2 className="mt-0.5 text-base font-semibold tracking-tight text-white">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-lg border border-line px-2.5 py-1 text-xs text-accent-light transition hover:border-accent/40 hover:text-white">
      {children}
    </Link>
  )
}

export function DateBadge({ date }: { date: string | Date }) {
  const d = new Date(date)
  return (
    <div className="grid h-12 w-11 shrink-0 content-center justify-items-center rounded-[11px] border border-accent/30 bg-accent/15 text-accent-light">
      <b className="text-[17px] leading-none tabular-nums">{d.getDate()}</b>
      <span className="mt-0.5 text-[9px] uppercase tracking-wider">{d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}</span>
    </div>
  )
}

export function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-xs text-muted">{children}</p>
}

export const euro = (value: number) => `${Math.round(value).toLocaleString('fr-FR')} €`

export const longDate = (value: string | Date, withYear = false) =>
  new Date(value).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}) })

export const timeOf = (value: string | Date) =>
  new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export function relativeTime(value: string) {
  const delta = Date.now() - new Date(value).getTime()
  const minute = 60_000, hour = 60 * minute, day = 24 * hour
  if (delta < minute) return 'à l’instant'
  if (delta < hour) return `${Math.floor(delta / minute)} min`
  if (delta < day) return `${Math.floor(delta / hour)} h`
  if (delta < 7 * day) return `${Math.floor(delta / day)} j`
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
