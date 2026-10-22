'use client'

/**
 * « Mon argent sur LS Bookers » (Réglages › Abonnement et paiements, choix d'Antho 23/10/2026) :
 * disponible (à retirer en un clic), à venir (bookings payés, versés 24 h après la prestation),
 * déjà retiré dans l'année.
 */
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { useFeedback, apiErrorMessage } from '@/components/ui/Feedback'
import { euros } from '@/lib/plan'

type Balance = {
  hasAccount: boolean
  ready: boolean
  availableCents: number
  pendingCents: number
  upcomingCents: number
  acquiredCents: number
  withdrawnYearCents: number
  lastWithdrawal: string | null
  upcoming: { bookingId: number; title: string | null; from: string | null; date: string; netCents: number }[]
  withdrawals: { amountCents: number; status: string; createdAt: string; arrivalDate: string | null }[]
}

const day = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '')

export default function MoneyCounter({ onOpenDashboard }: { onOpenDashboard: () => void }) {
  const { notify, confirm } = useFeedback()
  const [b, setB] = useState<Balance | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await apiFetch(apiUrl('payouts/balance'), { cache: 'no-store' }).catch(() => null)
    if (res?.ok) setB(await res.json())
  }, [])
  useEffect(() => { load() }, [load])

  const withdraw = async () => {
    if (!b) return
    const ok = await confirm({ title: `Retirer ${euros(b.availableCents)} ?`, message: 'La somme part vers le compte bancaire enregistré sur Stripe. Elle arrive en général sous 2 à 3 jours ouvrés.', confirmLabel: 'Retirer' })
    if (!ok) return
    setBusy(true)
    try {
      const res = await apiFetch(apiUrl('payouts/withdraw'), { method: 'POST' })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Le retrait n’a pas pu être lancé.'), 'error'); return }
      const d = await res.json()
      notify(`Retrait de ${euros(d.amountCents)} lancé : arrivée prévue vers le ${day(d.arrivalDate)}.`)
      load()
    } finally { setBusy(false) }
  }

  if (!b) return null
  // Rien à montrer tant que la personne n'a jamais été payée en ligne
  if (!b.hasAccount && b.upcomingCents === 0) return null

  const comingTotal = b.upcomingCents + b.pendingCents

  return (
    <section className="mb-4 rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/[0.07] to-transparent p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Paiements en ligne</p>
          <h2 className="mt-0.5 text-sm font-semibold text-white">Mon argent sur LS Bookers</h2>
        </div>
        {b.hasAccount && (
          <button type="button" onClick={onOpenDashboard} className="text-xs text-accent-light hover:text-white">Voir mes virements sur Stripe</button>
        )}
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-[1.2fr_1fr_1fr]">
        <div className="rounded-xl border border-gold/30 bg-black/20 p-3.5">
          <p className="text-[11px] text-white/50">Disponible</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-gold-light">{euros(b.availableCents)}</p>
          <p className="mt-0.5 text-[10.5px] text-white/35">Prêt à être retiré vers votre banque</p>
          <button type="button" onClick={withdraw} disabled={busy || !b.ready || b.availableCents < 100}
            className="mt-3 w-full rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-[#1a1408] transition hover:brightness-110 disabled:opacity-40">
            Retirer
          </button>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
          <p className="text-[11px] text-white/50">À venir</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-white">{euros(comingTotal)}</p>
          <p className="mt-0.5 text-[10.5px] leading-relaxed text-white/35">
            {b.upcoming.length} booking{b.upcoming.length > 1 ? 's' : ''} payé{b.upcoming.length > 1 ? 's' : ''}
            {b.acquiredCents > 0 ? ` · dont ${euros(b.acquiredCents)} déjà acquis` : ''}
            {b.pendingCents > 0 ? ` · ${euros(b.pendingCents)} en cours de disponibilité` : ''}
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
          <p className="text-[11px] text-white/50">Déjà retiré en {new Date().getFullYear()}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-white">{euros(b.withdrawnYearCents)}</p>
          <p className="mt-0.5 text-[10.5px] text-white/35">{b.lastWithdrawal ? `Dernier retrait le ${day(b.lastWithdrawal)}` : 'Aucun retrait pour l’instant'}</p>
        </div>
      </div>

      {b.upcoming.length > 0 && (
        <div className="mt-3 border-t border-white/8">
          {b.upcoming.slice(0, 5).map(u => (
            <div key={u.bookingId} className="flex items-center justify-between gap-3 border-b border-white/[0.05] py-2 text-xs">
              <span className="min-w-0 truncate text-white/70">
                {u.title || 'Booking'}{u.from ? ` · ${u.from}` : ''}
                <span className="ml-1.5 text-white/35">prestation le {day(u.date)}</span>
              </span>
              <span className="shrink-0 font-semibold text-white">{euros(u.netCents)}</span>
            </div>
          ))}
        </div>
      )}
      {!b.ready && b.hasAccount && <p className="mt-3 text-[11px] text-white/40">Terminez l’activation de votre compte de paiement ci-dessous pour pouvoir retirer votre argent.</p>}
    </section>
  )
}
