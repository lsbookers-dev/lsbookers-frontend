'use client'

/**
 * Réglages › Abonnement et paiements : formule actuelle, et comment être payé en ligne
 * pour ses bookings (compte de paiement Stripe, ou paiement en direct pour les intermittents).
 */
import Link from 'next/link'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SettingRow, SettingsButton, SettingsCard, SettingsTitle } from '@/components/settings/ui'
import { useFeedback, apiErrorMessage } from '@/components/ui/Feedback'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { usePlan, price } from '@/lib/plan'
import { useAuth } from '@/context/AuthContext'
import MoneyCounter from '@/components/settings/MoneyCounter'

type PayoutStatus = {
  available: boolean
  payoutMode: 'INVOICE' | 'INTERMITTENT' | null
  intermittent: boolean
  hasAccount: boolean
  ready: boolean
  detailsSubmitted: boolean
  pendingRequirements: number
}

const fmtDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '')

function SubscriptionSettingsContent() {
  const { user } = useAuth()
  const { plan, isPro } = usePlan()
  const { notify } = useFeedback()
  const params = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<PayoutStatus | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await apiFetch(apiUrl('payouts/status'), { cache: 'no-store' }).catch(() => null)
    if (res?.ok) setStatus(await res.json())
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const back = params.get('stripe')
    if (!back) return
    if (back === 'ok') notify('Merci ! Stripe vérifie vos informations, cela peut prendre quelques minutes.')
    router.replace('/settings/subscription')
    load()
  }, [params, notify, router, load])

  const setMode = async (mode: 'INVOICE' | 'INTERMITTENT') => {
    setBusy(true)
    try {
      const res = await apiFetch(apiUrl('payouts/mode'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode }) })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Impossible d’enregistrer.'), 'error'); return }
      await load()
    } finally { setBusy(false) }
  }

  const openStripe = async (path: 'onboard' | 'dashboard') => {
    setBusy(true)
    try {
      const res = await apiFetch(apiUrl(`payouts/${path}`), { method: 'POST' })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Impossible d’ouvrir Stripe pour le moment.'), 'error'); return }
      window.location.href = (await res.json()).url
    } finally { setBusy(false) }
  }

  const sub = plan?.subscription
  const intermittent = status?.payoutMode === 'INTERMITTENT' || status?.intermittent

  return (
    <>
      <SettingsTitle title="Abonnement et paiements" description="Votre formule LS Bookers et la façon dont vous êtes payé pour vos bookings." />

      {(user?.role === 'ARTIST' || user?.role === 'PROVIDER') && <MoneyCounter onOpenDashboard={() => openStripe('dashboard')} />}

      <SettingsCard>
        <SettingRow
          label="Votre formule"
          description={isPro
            ? (sub?.source === 'FOUNDER' ? 'Pro, offert à vie (membre fondateur).'
              : sub?.source === 'ADMIN' ? 'Pro, offert par LS Bookers.'
              : sub?.status === 'TRIAL' ? `Pro, période offerte jusqu’au ${fmtDate(sub.trialEndsAt)}.`
              : sub?.cancelAtPeriodEnd ? `Pro jusqu’au ${fmtDate(sub.currentPeriodEnd)} (résilié).`
              : sub ? `Pro, ${price(sub.priceCents)} ${sub.interval === 'YEAR' ? 'par an' : 'par mois'}.` : 'Pro.')
            : 'Compte gratuit.'}
        >
          <Link href="/subscriptions" className="text-xs text-accent-light hover:text-white">{isPro ? 'Gérer' : 'Passer en Pro'}</Link>
        </SettingRow>
      </SettingsCard>

      {(user?.role === 'ARTIST' || user?.role === 'PROVIDER') && (
        <SettingsCard
          title="Être payé en ligne pour vos bookings"
          description="Quand un organisateur choisit de vous payer via LS Bookers, il paie en ligne et la somme vous est versée 24 h après la prestation, commission déduite. Vous pouvez toujours être payé en direct si vous préférez."
        >
          {!status ? (
            <p className="text-xs text-white/35">Chargement…</p>
          ) : (
            <>
              <p className="mb-2 text-xs font-medium text-white/70">Comment êtes-vous payé ?</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" disabled={busy} onClick={() => setMode('INVOICE')}
                  className={`rounded-xl border p-3 text-left transition ${!intermittent ? 'border-accent/50 bg-accent/10' : 'border-white/10 hover:bg-white/[0.04]'}`}>
                  <p className="text-sm text-white">Je facture</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-white/45">Auto-entrepreneur, société, association ou structure qui facture pour moi.</p>
                </button>
                <button type="button" disabled={busy} onClick={() => setMode('INTERMITTENT')}
                  className={`rounded-xl border p-3 text-left transition ${intermittent ? 'border-accent/50 bg-accent/10' : 'border-white/10 hover:bg-white/[0.04]'}`}>
                  <p className="text-sm text-white">Je suis payé en cachet</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-white/45">Intermittent du spectacle, déclaré par l’organisateur (GUSO).</p>
                </button>
              </div>

              {intermittent ? (
                <div className="mt-4 rounded-xl border border-gold/25 bg-gold/[0.06] p-4">
                  <p className="text-sm font-medium text-white">Paiement en direct pour vous</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">
                    En France, un artiste qui se produit sur scène est considéré comme salarié de celui qui l’engage
                    (présomption de salariat, article L7121-3 du Code du travail). L’organisateur doit donc vous déclarer
                    et vous payer en cachet, avec une fiche de paie, par exemple via le GUSO s’il n’est pas lui-même une
                    structure de spectacle. Un simple paiement en ligne ne remplace pas cette déclaration : c’est pourquoi
                    vos bookings se règlent en direct avec l’organisateur. Vos droits d’intermittent restent ainsi protégés.
                  </p>
                  <a href="https://www.guso.fr" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-accent-light hover:text-white">En savoir plus sur le GUSO</a>
                </div>
              ) : (
                <div className="mt-4">
                  {!status.available ? (
                    <p className="text-xs text-white/40">Le paiement en ligne ouvre très bientôt : vous pourrez activer votre compte de paiement ici.</p>
                  ) : status.ready ? (
                    <SettingRow label="Compte de paiement actif" description="Vous pouvez être payé en ligne. Vos virements et votre compte bancaire se gèrent sur Stripe.">
                      <SettingsButton onClick={() => openStripe('dashboard')} disabled={busy}>Voir mes virements</SettingsButton>
                    </SettingRow>
                  ) : (
                    <SettingRow
                      label={status.hasAccount ? 'Compte de paiement à compléter' : 'Activer le paiement en ligne'}
                      description={status.hasAccount
                        ? 'Stripe attend encore quelques informations (identité, compte bancaire) avant de pouvoir vous verser de l’argent.'
                        : 'Stripe, notre partenaire de paiement, vérifie votre identité et enregistre le compte bancaire qui recevra vos cachets. Cela prend environ 5 minutes.'}
                    >
                      <SettingsButton variant="primary" onClick={() => openStripe('onboard')} disabled={busy}>{status.hasAccount ? 'Compléter' : 'Activer'}</SettingsButton>
                    </SettingRow>
                  )}
                </div>
              )}
            </>
          )}
        </SettingsCard>
      )}

      <SettingsCard title="Factures LS Bookers" description="Les factures de votre abonnement Pro et de vos formules sont envoyées par e-mail et disponibles dans « Gérer mon abonnement » sur la page Offres et abonnements. Pour vos bookings, LS Bookers vous remet une attestation de paiement : la facture de la prestation se fait directement entre vous et l’organisateur.">
        <Link href="/subscriptions" className="text-xs text-accent-light hover:text-white">Offres et abonnements</Link>
      </SettingsCard>
    </>
  )
}

export default function SubscriptionSettingsPage() {
  return (
    <Suspense fallback={null}>
      <SubscriptionSettingsContent />
    </Suspense>
  )
}
