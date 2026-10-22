'use client'

/**
 * Fenêtre « Passer en Pro » : s'ouvre toute seule quand le serveur refuse une action
 * à cause d'une limite du compte gratuit (événement envoyé par apiFetch).
 */
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PRO_REQUIRED_EVENT } from '@/utils/auth'
import LsIcon from '@/components/ui/LsIcon'

type Detail = { error: string; message?: string }

export default function UpgradePrompt() {
  const [detail, setDetail] = useState<Detail | null>(null)

  useEffect(() => {
    const onEvent = (e: Event) => setDetail((e as CustomEvent<Detail>).detail)
    window.addEventListener(PRO_REQUIRED_EVENT, onEvent)
    return () => window.removeEventListener(PRO_REQUIRED_EVENT, onEvent)
  }, [])

  useEffect(() => {
    if (!detail) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDetail(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detail])

  if (!detail) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={() => setDetail(null)}>
      <div role="dialog" aria-modal="true" aria-labelledby="lsb-upgrade-title" onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-3xl border border-white/10 bg-surface p-6 text-center shadow-2xl">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-gold/30 bg-gold/10">
          <LsIcon name="star" tone="gold" size={22} />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-gold">Version Pro</p>
        <h2 id="lsb-upgrade-title" className="mt-1 text-lg font-semibold text-white">Limite du compte gratuit</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{detail.message || 'Cette fonctionnalité est disponible avec la version Pro.'}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/subscriptions" onClick={() => setDetail(null)} className="rounded-xl bg-accent-strong px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent">
            Passer en Pro
          </Link>
          <button type="button" onClick={() => setDetail(null)} className="rounded-xl px-4 py-2 text-xs text-white/50 transition hover:text-white">Plus tard</button>
        </div>
      </div>
    </div>
  )
}

/** Petit badge « Pro » affiché à côté du nom d'un membre Pro */
export function ProBadge({ className = '' }: { className?: string }) {
  return (
    <span title="Membre Pro" className={`inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-[.12em] text-gold ${className}`}>
      Pro
    </span>
  )
}
