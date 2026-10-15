'use client'

import Image from 'next/image'
import Link from 'next/link'
import LsIcon from '@/components/ui/LsIcon'
import type { TrendCriterion, TrendItem } from './types'
import { trendCriterion, type TrendRole } from './trends'
import { TrendRowsSkeleton } from './FeedSkeleton'

/** Lignes d'un classement (colonne de droite et fenêtre « Voir plus »). */
export default function TrendsList({ items, loading, criterion, role, rows = 5, onNavigate }: {
  items: TrendItem[]
  loading: boolean
  criterion: TrendCriterion
  role: TrendRole
  rows?: number
  onNavigate?: () => void
}) {
  if (loading) return <TrendRowsSkeleton rows={Math.min(rows, 5)} />

  if (items.length === 0) {
    return (
      <div className="px-5 py-6 text-center">
        <LsIcon name="bolt" size={22} tone="muted" className="mx-auto mb-2" />
        <p className="text-xs text-white/45">Pas encore de classement</p>
        <p className="mt-1 text-[10px] leading-relaxed text-white/30">Il se remplit au fil des visites, recherches, bookings et J&apos;aime.</p>
      </div>
    )
  }

  const { unit } = trendCriterion(criterion)
  const placeholder = role === 'ARTIST' ? 'mic' : 'tools'

  return (
    <ol className="py-2">
      {items.map((it, i) => (
        <li key={it.id}>
          <Link href={it.profileUrl} onClick={onNavigate} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.04]">
            <span className={`w-5 text-center text-xs font-bold ${i < 3 ? 'text-accent-light' : 'text-white/30'}`}>{i + 1}</span>
            <span className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-surface-2">
              {it.avatar
                ? <Image src={it.avatar} alt="" fill sizes="32px" className="object-cover" />
                : <span className="grid h-full w-full place-items-center"><LsIcon name={placeholder} size={15} tone="muted" /></span>}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-white">{it.name}</span>
              <span className="block truncate text-xs text-white/40">{[it.profession, it.location].filter(Boolean).join(' · ')}</span>
            </span>
            <span className="flex-shrink-0 text-right">
              <span className="block text-xs font-semibold text-white/80">{it.count}</span>
              <span className="block text-[9px] text-white/35">{unit(it.count)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
