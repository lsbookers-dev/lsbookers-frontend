'use client'

/**
 * Paiement d'un booking : en direct (suivi à la main) ou en ligne via LS Bookers (Stripe).
 * - Organisateur : choisit le mode, paie en ligne (carte enregistrée, débit 60 jours avant).
 * - Personne bookée : voit le montant, la commission, ce qu'elle touchera et quand.
 * LS Bookers met en relation et n'intervient pas dans la prestation.
 */
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { useFeedback, apiErrorMessage } from '@/components/ui/Feedback'
import LsIcon from '@/components/ui/LsIcon'
import { euros } from '@/lib/plan'

type Summary = {
  mode: 'DIRECT' | 'ONLINE'
  online: { available: boolean; payeeEligible: boolean; reason: string | null; reasonCode: string | null }
  amountCents: number | null
  commissionPct: number
  commissionCents?: number | null
  payeeNetCents?: number | null
  depositCents: number | null
  rules: { chargeDaysBefore: number; releaseHoursAfter: number; lateCancelDays: number; depositPct: number }
  payment: null | {
    status: 'AWAITING_CARD' | 'SCHEDULED' | 'PAID' | 'RELEASED' | 'REFUNDED' | 'PARTIAL_REFUND' | 'FAILED' | 'DISPUTED'
    chargeAt: string | null
    paidAt: string | null
    releaseAt: string | null
    releasedAt: string | null
    refundedCents: number
    refundedAt: string | null
    transferredCents?: number
    stripeFeeCents?: number | null
    failureReason?: string | null
  }
  role: 'PAYER' | 'PAYEE' | null
}

const fmt = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '')
const pct = (n: number) => `${String(n).replace('.', ',')} %`

const STATUS: Record<NonNullable<Summary['payment']>['status'], { label: string; tone: string }> = {
  AWAITING_CARD: { label: 'Paiement à finaliser', tone: 'border-amber-400/25 bg-amber-400/10 text-amber-200' },
  SCHEDULED: { label: 'Carte enregistrée', tone: 'border-accent/30 bg-accent/10 text-accent-light' },
  PAID: { label: 'Payé en ligne', tone: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' },
  RELEASED: { label: 'Versé', tone: 'border-gold/30 bg-gold/10 text-gold' },
  REFUNDED: { label: 'Remboursé', tone: 'border-white/15 bg-white/5 text-white/60' },
  PARTIAL_REFUND: { label: 'Annulé, remboursé en partie', tone: 'border-white/15 bg-white/5 text-white/60' },
  FAILED: { label: 'Paiement refusé', tone: 'border-red-400/25 bg-red-500/10 text-red-200' },
  DISPUTED: { label: 'Contestation bancaire', tone: 'border-red-400/25 bg-red-500/10 text-red-200' },
}

// Statut suivi à la main pour un paiement en direct
const DIRECT_STATUS: Record<string, { label: string; tone: string }> = {
  UNPAID: { label: 'Non payé', tone: 'border-amber-400/25 bg-amber-400/10 text-amber-200' },
  DEPOSIT: { label: 'Acompte versé', tone: 'border-accent/30 bg-accent/10 text-accent-light' },
  PAID: { label: 'Payé', tone: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' },
  DIRECT: { label: 'Payé en direct', tone: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' },
}

export default function BookingPaymentPanel({ bookingId, bookingStatus, otherName, directStatus }: { bookingId: number; bookingStatus?: string; otherName: string; directStatus?: string | null }) {
  const { notify, confirm } = useFeedback()
  const [data, setData] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(apiUrl(`booking-payments/${bookingId}`), { cache: 'no-store' })
      if (res.ok) setData(await res.json())
    } finally { setLoading(false) }
  }, [bookingId])

  useEffect(() => { load() }, [load])

  const payOnline = async () => {
    if (!data) return
    const ok = await confirm({
      title: 'Payer ce booking en ligne ?',
      message: `Vous allez enregistrer votre carte sur la page sécurisée de Stripe. Le montant est débité ${data.rules.chargeDaysBefore} jours avant la date (ou tout de suite si elle est plus proche). ${otherName} reçoit son dû ${data.rules.releaseHoursAfter} h après la prestation. LS Bookers met en relation les deux parties et n’intervient pas dans la prestation. En cas d’annulation, les frais bancaires sont retenus sur le remboursement.`,
      confirmLabel: 'Continuer vers le paiement',
    })
    if (!ok) return
    setBusy(true)
    try {
      const res = await apiFetch(apiUrl(`booking-payments/${bookingId}/online`), { method: 'POST' })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Impossible d’ouvrir le paiement.'), 'error'); return }
      window.location.href = (await res.json()).url
    } finally { setBusy(false) }
  }

  const backToDirect = async () => {
    setBusy(true)
    try {
      const res = await apiFetch(apiUrl(`booking-payments/${bookingId}/direct`), { method: 'POST' })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Impossible de changer le mode de paiement.'), 'error'); return }
      notify('Paiement en direct choisi.')
      load()
    } finally { setBusy(false) }
  }

  const downloadAttestation = async () => {
    const res = await apiFetch(apiUrl(`booking-payments/${bookingId}/attestation`), { cache: 'no-store' })
    if (!res.ok) { notify('Attestation indisponible pour le moment.', 'error'); return }
    const { attestation } = await res.json()
    const { downloadPaymentAttestation } = await import('@/lib/pdf')
    await downloadPaymentAttestation(attestation)
  }

  if (loading) return <div className="flex h-20 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
  if (!data) return null

  const p = data.payment
  const isPayer = data.role === 'PAYER'
  const isPayee = data.role === 'PAYEE'
  const accepted = bookingStatus ? bookingStatus === 'ACCEPTED' : true
  const canStartOnline = isPayer && accepted && data.amountCents && (!p || p.status === 'AWAITING_CARD' || p.status === 'FAILED')

  return (
    <div className="space-y-3">
      {/* Montant et répartition */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/55">Montant du booking</span>
          <span className="text-base font-semibold text-white">{data.amountCents ? euros(data.amountCents) : 'À définir'}</span>
        </div>
        {isPayee && data.amountCents && (
          <>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-white/45">Commission LS Bookers ({pct(data.commissionPct)}) si payé en ligne</span>
              <span className="text-white/60">− {euros(data.commissionCents || 0)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-white/8 pt-2 text-sm">
              <span className="text-white/70">Vous recevez</span>
              <span className="font-semibold text-gold">{euros(data.payeeNetCents || 0)}</span>
            </div>
          </>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-7 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs text-white/70">
            {data.mode === 'ONLINE' ? 'Paiement en ligne via LS Bookers' : 'Paiement en direct'}
          </span>
          {p && <span className={`inline-flex min-h-7 items-center rounded-full border px-3 text-xs font-medium ${STATUS[p.status].tone}`}>{STATUS[p.status].label}</span>}
          {data.mode === 'DIRECT' && directStatus && DIRECT_STATUS[directStatus] && (
            <span className={`inline-flex min-h-7 items-center rounded-full border px-3 text-xs font-medium ${DIRECT_STATUS[directStatus].tone}`}>{DIRECT_STATUS[directStatus].label}</span>
          )}
        </div>
      </div>

      {/* Suivi du paiement en ligne */}
      {data.mode === 'ONLINE' && p && (
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs leading-relaxed text-white/60">
          {p.status === 'SCHEDULED' && <p className="flex gap-2"><LsIcon name="clock" size={16} />Carte enregistrée : débit automatique le {fmt(p.chargeAt)}.</p>}
          {p.status === 'PAID' && (
            <>
              <p className="flex gap-2"><LsIcon name="check" tone="ok" size={16} />Payé le {fmt(p.paidAt)}.</p>
              {isPayee && data.depositCents != null && (
                <p className="flex gap-2"><LsIcon name="lock" tone="gold" size={16} />{euros(data.depositCents)} ({data.rules.depositPct} %) vous sont déjà acquis, bloqués jusqu’à la prestation.</p>
              )}
              <p className="flex gap-2"><LsIcon name="payment" size={16} />{isPayee ? 'Versement' : `Versement à ${otherName}`} prévu le {fmt(p.releaseAt)}, {data.rules.releaseHoursAfter} h après la prestation.</p>
            </>
          )}
          {p.status === 'RELEASED' && <p className="flex gap-2"><LsIcon name="check" tone="gold" size={16} />{isPayee ? `${euros(p.transferredCents || 0)} versés sur votre compte de paiement le ${fmt(p.releasedAt)}.` : `Versé à ${otherName} le ${fmt(p.releasedAt)}.`}</p>}
          {(p.status === 'REFUNDED' || p.status === 'PARTIAL_REFUND') && p.refundedCents > 0 && (
            <p className="flex gap-2"><LsIcon name="cancel" tone="muted" size={16} />{isPayer ? `${euros(p.refundedCents)} vous ont été remboursés le ${fmt(p.refundedAt)}` : `${euros(p.refundedCents)} remboursés à l’organisateur`}{isPayer && p.stripeFeeCents ? ` (frais bancaires de ${euros(p.stripeFeeCents)} retenus)` : ''}.</p>
          )}
          {p.status === 'PARTIAL_REFUND' && isPayee && (p.transferredCents || 0) > 0 && (
            <p className="flex gap-2"><LsIcon name="payment" tone="gold" size={16} />Annulation tardive : {euros(p.transferredCents || 0)} vous ont été versés.</p>
          )}
          {p.status === 'FAILED' && <p className="flex gap-2 text-red-200"><LsIcon name="warning" tone="bad" size={16} />{isPayer ? (p.failureReason || 'Le paiement a été refusé.') + ' Réessayez avec une autre carte.' : 'Le paiement a échoué : l’organisateur a été prévenu.'}</p>}
          {p.status === 'AWAITING_CARD' && isPayer && <p>Le paiement n’a pas été finalisé. Vous pouvez le reprendre ci-dessous.</p>}
        </div>
      )}

      {/* Choix du mode (organisateur) */}
      {isPayer && accepted && data.amountCents != null && (
        <div className="space-y-2">
          {canStartOnline && (
            data.online.available && data.online.payeeEligible ? (
              <button type="button" onClick={payOnline} disabled={busy}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent-strong px-4 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-50">
                <LsIcon name="payment" tone="inherit" size={18} />
                {p?.status === 'FAILED' ? 'Payer avec une autre carte' : 'Payer en ligne via LS Bookers'}
              </button>
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-[11px] leading-relaxed text-white/45">
                {!data.online.available ? 'Le paiement en ligne ouvre très bientôt. En attendant, réglez ce booking en direct.' : data.online.reason}
              </p>
            )
          )}
          {data.mode === 'ONLINE' && (!p || ['AWAITING_CARD', 'SCHEDULED', 'FAILED'].includes(p.status)) && (
            <button type="button" onClick={backToDirect} disabled={busy} className="w-full text-center text-[11px] text-white/45 hover:text-white">
              Finalement, payer en direct
            </button>
          )}
          {data.mode === 'DIRECT' && (
            <p className="text-[11px] leading-relaxed text-white/40">
              En direct, vous réglez {otherName} de la main à la main et mettez à jour le statut vous-même.
              En ligne, vous êtes rassuré sur la réalisation du booking et {otherName} a la garantie d’être payé.
            </p>
          )}
        </div>
      )}

      {/* Personne bookée */}
      {isPayee && data.mode === 'DIRECT' && (
        <p className="text-[11px] leading-relaxed text-white/40">
          {data.online.reasonCode === 'PAYEE_INTERMITTENT'
            ? 'Payé en cachet : ce booking se règle en direct avec l’organisateur, qui vous déclare (GUSO).'
            : data.online.reasonCode === 'PAYEE_NOT_READY'
              ? <>Pour pouvoir être payé en ligne, activez votre compte de paiement dans <Link href="/settings/subscription" className="text-accent-light hover:text-white">Réglages › Abonnement et paiements</Link>.</>
              : `${otherName} règle ce booking en direct.`}
        </p>
      )}

      {/* Règles (rappel) */}
      {data.mode === 'ONLINE' && (
        <details className="rounded-xl border border-white/8 px-3 py-2 text-[11px] leading-relaxed text-white/45">
          <summary className="cursor-pointer text-white/60">Règles d’annulation</summary>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Annulation par l’organisateur à plus de {data.rules.lateCancelDays} jours : remboursement, frais bancaires retenus.</li>
            <li>À moins de {data.rules.lateCancelDays} jours : l’organisateur perd {data.rules.depositPct} % du montant (versés à la personne bookée) et la commission LS Bookers.</li>
            <li>Annulation par la personne bookée : l’organisateur est remboursé, frais bancaires retenus.</li>
            <li>LS Bookers met en relation les deux parties et n’intervient pas dans la prestation.</li>
          </ul>
        </details>
      )}

      {p && p.paidAt && ['PAID', 'RELEASED', 'PARTIAL_REFUND', 'REFUNDED'].includes(p.status) && (
        <button type="button" onClick={downloadAttestation} className="flex items-center gap-2 text-xs text-accent-light hover:text-white">
          <LsIcon name="document" tone="inherit" size={16} /> Télécharger l’attestation de paiement
        </button>
      )}
    </div>
  )
}
