'use client'

/**
 * Offres et abonnements : comparatif Gratuit / Pro, abonnement mensuel ou annuel (Stripe),
 * codes promo (Lancement, Fondateur) et formules supplémentaires (carrousel, newsletter…).
 */
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { useFeedback, apiErrorMessage } from '@/components/ui/Feedback'
import LsIcon, { type LsIconName } from '@/components/ui/LsIcon'
import { usePlan, price, euros, type PlanInfo, type PlanLimits } from '@/lib/plan'

type Interval = 'MONTH' | 'YEAR'
type ExtraOption = { id: string; label: string; days: number | null; priceCents: number; scope: 'REGIONAL' | 'NATIONAL' | null }
type ExtraOffer = { id: number; kind: 'CAROUSEL' | 'NEWSLETTER' | 'SOCIAL' | 'OTHER'; title: string; description: string | null; options: ExtraOption[] }
type Availability = { slots: number; used: number; full: boolean; nextFreeDate: string | null }
type Catalog = {
  offers: ExtraOffer[]
  carousel: null | { regionCode: string | null; regionName: string | null; regional: Availability | null; national: Availability }
}
type Order = { id: number; label: string; status: string; amountCents: number; scope: string | null; createdAt: string; startsAt: string | null; endsAt: string | null }

const ROLE_LABEL: Record<string, string> = { ARTIST: 'artistes', PROVIDER: 'prestataires', ORGANIZER: 'organisateurs' }
const KIND_ICON: Record<ExtraOffer['kind'], LsIconName> = { CAROUSEL: 'star', NEWSLETTER: 'mail', SOCIAL: 'share', OTHER: 'bolt' }
const ORDER_STATUS: Record<string, { label: string; tone: string }> = {
  PAID: { label: 'En attente de validation', tone: 'text-gold' },
  ACTIVE: { label: 'En cours', tone: 'text-emerald-300' },
  DONE: { label: 'Réalisée', tone: 'text-white/50' },
  REFUSED: { label: 'Refusée, remboursée', tone: 'text-red-300' },
  CANCELLED: { label: 'Annulée', tone: 'text-white/40' },
}
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '')
const toInputDate = (d: string | Date) => new Date(d).toISOString().slice(0, 10)

type Row = { label: string; free: string; pro: string; highlight?: boolean }

// Comparatif selon le rôle (chiffres du compte gratuit tirés des réglages de l'admin)
function comparisonRows(role: string, limits: PlanLimits, commission: PlanInfo['commission']): Row[] {
  const rows: Row[] = [
    { label: 'Profil, publications et messagerie', free: 'Illimité', pro: 'Illimité' },
    { label: 'Recevoir et accepter des bookings', free: 'Illimité', pro: 'Illimité' },
  ]
  if (role === 'ARTIST' || role === 'PROVIDER') {
    rows.push(
      { label: 'Commission sur un booking payé en ligne', free: `${String(commission.freePct).replace('.', ',')} %`, pro: `${String(commission.proPct).replace('.', ',')} %`, highlight: true },
      { label: 'Candidatures aux offres', free: `${limits.applicationsPerMonth} par mois`, pro: 'Illimitées', highlight: true },
    )
  }
  if (role === 'ORGANIZER' || role === 'PROVIDER') {
    rows.push(
      { label: 'Demandes de booking envoyées', free: `${limits.bookingRequestsPerMonth} par mois`, pro: 'Illimitées', highlight: true },
      { label: 'Offres publiées en même temps', free: String(limits.activeOffers), pro: 'Illimitées' },
    )
  }
  if (role === 'ARTIST') {
    rows.push({ label: 'Demandes de booking envoyées', free: `${limits.bookingRequestsPerMonth} par mois`, pro: 'Illimitées' })
  }
  rows.push(
    { label: 'Événements en même temps dans l’agenda', free: String(limits.activeEvents), pro: 'Illimités' },
    { label: 'Budget, équipe et documents d’événement', free: '—', pro: 'Inclus' },
    { label: 'Module Finances (suivi, devis et factures)', free: '—', pro: 'Inclus', highlight: true },
    { label: 'Albums', free: String(limits.albums), pro: 'Illimités' },
    { label: 'Vidéos dans les publications', free: `${limits.videos}, ${limits.videoMaxSeconds} s max`, pro: 'Illimitées' },
    { label: 'Statistiques du profil', free: 'Vues sur 30 jours', pro: 'Détaillées' },
    { label: 'Badge Pro et coup de pouce dans la recherche', free: '—', pro: 'Inclus' },
  )
  return rows
}

function SubscriptionsContent() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const { notify } = useFeedback()
  const { plan, isPro, loading, refresh } = usePlan()

  const [billing, setBilling] = useState<Interval>('YEAR')
  const [promo, setPromo] = useState('')
  const [promoInfo, setPromoInfo] = useState<{ code: string; kind: string; freeMonths: number | null } | null>(null)
  const [founderOpen, setFounderOpen] = useState(false)
  const [founderCode, setFounderCode] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [startDates, setStartDates] = useState<Record<string, string>>({})

  useEffect(() => { if (!user) router.replace('/login') }, [user, router])

  // Formule choisie à l'inscription : on reprend l'intervalle et le code saisis
  const [signupHandled, setSignupHandled] = useState(false)
  useEffect(() => {
    const choice = plan?.signupPlan
    if (!choice || signupHandled) return
    setSignupHandled(true)
    setBilling(choice.interval)
    if (choice.promoCode) {
      setPromo(choice.promoCode)
      apiFetch(apiUrl('billing/promo/check'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: choice.promoCode }) })
        .then(r => (r.ok ? r.json() : null))
        .then(info => {
          if (!info) return
          if (info.kind === 'FOUNDER') { setFounderCode(info.code); setFounderOpen(true) } else setPromoInfo(info)
        })
        .catch(() => {})
    }
  }, [plan?.signupPlan, signupHandled])

  const dismissSignupPlan = async () => {
    await apiFetch(apiUrl('billing/signup-plan/clear'), { method: 'POST' }).catch(() => null)
    refresh()
  }

  const loadExtras = useCallback(async () => {
    const [c, o] = await Promise.all([
      apiFetch(apiUrl('billing/extras'), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null),
      apiFetch(apiUrl('billing/orders'), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null),
    ])
    if (c) setCatalog(c)
    if (o) setOrders(o.orders || [])
  }, [])

  useEffect(() => { if (user) loadExtras() }, [user, loadExtras])
  // Compteurs du mois toujours à jour en arrivant sur la page
  useEffect(() => { if (user) refresh() }, [user, refresh])

  // Retour de la page de paiement Stripe
  useEffect(() => {
    const sub = params.get('abonnement')
    const extra = params.get('formule')
    if (!sub && !extra) return
    if (sub === 'ok') notify('Bienvenue dans la version Pro ! Votre abonnement est en cours d’activation.')
    if (extra === 'ok') notify('Merci ! Votre formule est payée : elle sera validée très vite par l’équipe LS Bookers.')
    // Stripe prévient le serveur en quelques secondes : on relit le statut un peu après
    const t = setTimeout(() => { refresh(); loadExtras() }, 2500)
    router.replace('/subscriptions')
    return () => clearTimeout(t)
  }, [params, notify, refresh, loadExtras, router])

  const role = String(plan?.role || user?.role || '').toUpperCase()
  const prices = plan?.prices
  const rows = useMemo(() => (plan ? comparisonRows(role, plan.limits, plan.commission) : []), [plan, role])

  const startCheckout = async () => {
    setBusy('checkout')
    try {
      const res = await apiFetch(apiUrl('billing/checkout'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval: billing, promoCode: promoInfo?.kind === 'LAUNCH' ? promoInfo.code : undefined }),
      })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Impossible d’ouvrir le paiement.'), 'error'); return }
      const { url } = await res.json()
      window.location.href = url
    } finally { setBusy(null) }
  }

  const openPortal = async () => {
    setBusy('portal')
    try {
      const res = await apiFetch(apiUrl('billing/portal'), { method: 'POST' })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Impossible d’ouvrir votre espace d’abonnement.'), 'error'); return }
      window.location.href = (await res.json()).url
    } finally { setBusy(null) }
  }

  const checkPromo = async () => {
    if (!promo.trim()) return
    setBusy('promo')
    try {
      const res = await apiFetch(apiUrl('billing/promo/check'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: promo }) })
      if (!res.ok) { setPromoInfo(null); notify(await apiErrorMessage(res, 'Code promo invalide.'), 'error'); return }
      const info = await res.json()
      if (info.kind === 'FOUNDER') { setFounderCode(info.code); setFounderOpen(true); setPromoInfo(null); return }
      setPromoInfo(info)
      notify(`Code accepté : ${info.freeMonths} mois offerts.`)
    } finally { setBusy(null) }
  }

  const useFounder = async () => {
    setBusy('founder')
    try {
      const res = await apiFetch(apiUrl('billing/founder'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: founderCode }) })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Code invalide.'), 'error'); return }
      notify('Merci de faire partie des fondateurs : votre compte Pro vous est offert à vie !')
      setFounderOpen(false); setFounderCode('')
      refresh()
    } finally { setBusy(null) }
  }

  const buyExtra = async (offer: ExtraOffer, option: ExtraOption) => {
    const key = `${offer.id}:${option.id}`
    setBusy(key)
    try {
      const res = await apiFetch(apiUrl('billing/extras/checkout'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: offer.id, optionId: option.id, startDate: startDates[key] || undefined }),
      })
      if (res.status === 409) {
        const body = await res.json().catch(() => null)
        if (body?.nextFreeDate) setStartDates(s => ({ ...s, [key]: toInputDate(body.nextFreeDate) }))
        notify(body?.message || 'Complet pour le moment.', 'error')
        return
      }
      if (!res.ok) { notify(await apiErrorMessage(res, 'Impossible d’ouvrir le paiement.'), 'error'); return }
      window.location.href = (await res.json()).url
    } finally { setBusy(null) }
  }

  if (!user || loading) return <div className="lsb-state-screen">Chargement…</div>
  if (role === 'ADMIN') {
    return <div className="lsb-page text-white"><p className="text-white/60">Les offres et abonnements se règlent dans l’admin.</p></div>
  }

  const sub = plan?.subscription
  const yearSaving = prices ? prices.monthCents * 12 - prices.yearCents : 0
  const trialLabel = promoInfo?.freeMonths
    ? `${promoInfo.freeMonths} mois offerts`
    : plan?.trialAvailable ? `${Math.round((plan.trialDays || 30) / 30)} mois d’essai gratuit` : null

  return (
    <div className="lsb-page min-h-screen text-white">
      <header className="lsb-page-heading">
        <div>
          <span>OFFRES ET ABONNEMENTS</span>
          <h1>Développez votre activité<em>.</em></h1>
          <p>Le compte gratuit pour démarrer, la version Pro pour aller plus loin{ROLE_LABEL[role] ? `, pensée pour les ${ROLE_LABEL[role]}` : ''}.</p>
        </div>
      </header>

      {plan?.signupPlan && !isPro && (
        <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">{plan.signupPlan.plan === 'PRO' ? 'Finalisez votre version Pro' : 'Votre code est prêt'}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-white/60">
              {plan.signupPlan.plan === 'PRO'
                ? 'Vous avez choisi la version Pro à l’inscription. Il ne reste qu’à enregistrer votre carte : aucun prélèvement avant la fin de la période offerte.'
                : 'Le code saisi à l’inscription est appliqué ci-dessous.'}
            </p>
          </div>
          <button type="button" onClick={dismissSignupPlan} className="shrink-0 text-xs text-white/50 hover:text-white">Rester en gratuit</button>
        </section>
      )}

      {/* Statut actuel */}
      {isPro && sub && (
        <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/[0.08] to-transparent p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/30 bg-gold/10"><LsIcon name="star" tone="gold" /></span>
            <div>
              <p className="text-sm font-semibold text-white">Vous êtes Pro</p>
              <p className="mt-0.5 text-xs leading-relaxed text-white/55">
                {sub.source === 'FOUNDER' && 'Offert à vie grâce à votre code Fondateur. Merci de faire partie de l’aventure !'}
                {sub.source === 'ADMIN' && 'Offert par LS Bookers.'}
                {sub.source === 'STRIPE' && sub.status === 'TRIAL' && sub.trialEndsAt && `Période offerte jusqu’au ${fmtDate(sub.trialEndsAt)}, puis ${price(sub.priceCents)} ${sub.interval === 'YEAR' ? 'par an' : 'par mois'}.`}
                {sub.source === 'STRIPE' && sub.status === 'ACTIVE' && !sub.cancelAtPeriodEnd && `${price(sub.priceCents)} ${sub.interval === 'YEAR' ? 'par an' : 'par mois'}, prochain prélèvement le ${fmtDate(sub.currentPeriodEnd)}.`}
                {sub.source === 'STRIPE' && sub.cancelAtPeriodEnd && `Résilié : vous restez Pro jusqu’au ${fmtDate(sub.currentPeriodEnd)}.`}
                {sub.source === 'STRIPE' && sub.status === 'PAST_DUE' && 'Le dernier prélèvement a échoué : mettez à jour votre carte pour rester Pro.'}
              </p>
            </div>
          </div>
          {sub.source === 'STRIPE' && (
            <button type="button" onClick={openPortal} disabled={busy === 'portal'} className="rounded-xl border border-white/15 px-4 py-2 text-xs font-medium text-white/85 transition hover:bg-white/[0.06] disabled:opacity-50">
              Gérer mon abonnement
            </button>
          )}
        </section>
      )}

      {!isPro && plan?.usage && (
        <section className="mb-6 rounded-2xl border border-white/8 bg-surface p-5">
          <p className="text-sm font-semibold text-white">Votre compte gratuit ce mois-ci</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(role === 'ARTIST' || role === 'PROVIDER') && <Usage label="Candidatures" used={plan.usage.applicationsPerMonth} max={plan.limits.applicationsPerMonth} />}
            <Usage label="Demandes de booking" used={plan.usage.bookingRequestsPerMonth} max={plan.limits.bookingRequestsPerMonth} />
            <Usage label="Événements en cours" used={plan.usage.activeEvents} max={plan.limits.activeEvents} />
            <Usage label="Vidéos" used={plan.usage.videos} max={plan.limits.videos} />
          </div>
        </section>
      )}

      {/* Formules Gratuit / Pro */}
      {prices && (
        <>
          <div className="mb-4 flex justify-center">
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1 text-xs" role="tablist" aria-label="Facturation">
              {(['MONTH', 'YEAR'] as Interval[]).map(i => (
                <button key={i} type="button" role="tab" aria-selected={billing === i} onClick={() => setBilling(i)}
                  className={`rounded-full px-4 py-1.5 font-medium transition ${billing === i ? 'bg-accent-strong text-white' : 'text-white/55 hover:text-white'}`}>
                  {i === 'MONTH' ? 'Mensuel' : 'Annuel'}
                  {i === 'YEAR' && yearSaving > 0 && <span className={`ml-1.5 ${billing === i ? 'text-white/80' : 'text-gold'}`}>−{price(yearSaving)}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col rounded-3xl border border-white/8 bg-surface p-6">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/45">Gratuit</p>
              <p className="mt-2 text-3xl font-semibold text-white">0 €</p>
              <p className="mt-1 text-xs text-white/45">Pour toujours, sans carte bancaire.</p>
              <ul className="mt-5 space-y-2 text-sm text-white/70">
                <li className="flex gap-2"><LsIcon name="check" tone="muted" size={16} />Profil complet, publications, messagerie</li>
                <li className="flex gap-2"><LsIcon name="check" tone="muted" size={16} />Bookings reçus et acceptés sans limite</li>
                <li className="flex gap-2"><LsIcon name="check" tone="muted" size={16} />Paiement en ligne des bookings{plan && (role === 'ARTIST' || role === 'PROVIDER') ? ` (commission ${String(plan.commission.freePct).replace('.', ',')} %)` : ''}</li>
              </ul>
              <div className="mt-auto pt-6">
                <p className="rounded-xl border border-white/8 px-4 py-2.5 text-center text-xs text-white/45">{isPro ? 'Inclus dans votre compte' : 'Votre formule actuelle'}</p>
              </div>
            </div>

            <div className="relative flex flex-col overflow-hidden rounded-3xl border border-accent/40 bg-[radial-gradient(circle_at_85%_0%,rgba(139,92,246,.25),transparent_55%)] bg-surface p-6 shadow-[0_24px_70px_rgba(139,92,246,.15)]">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-accent-light">Pro</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {price(billing === 'YEAR' ? prices.yearCents : prices.monthCents)}
                <span className="ml-1 text-sm font-normal text-white/45">{billing === 'YEAR' ? '/ an' : '/ mois'}</span>
              </p>
              <p className="mt-1 text-xs text-white/45">
                {billing === 'YEAR' ? `Soit ${price(Math.round(prices.yearCents / 12))} par mois. ` : ''}TTC, résiliable à tout moment.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-white/80">
                <li className="flex gap-2"><LsIcon name="check" size={16} />Tout illimité : candidatures, demandes, événements, vidéos</li>
                <li className="flex gap-2"><LsIcon name="check" size={16} />Module Finances, devis et factures</li>
                {plan && (role === 'ARTIST' || role === 'PROVIDER') && <li className="flex gap-2"><LsIcon name="check" size={16} />Commission réduite à {String(plan.commission.proPct).replace('.', ',')} %</li>}
                <li className="flex gap-2"><LsIcon name="check" size={16} />Badge Pro et meilleure place dans la recherche</li>
              </ul>
              <div className="mt-auto pt-6">
                {isPro ? (
                  <p className="rounded-xl border border-gold/30 px-4 py-2.5 text-center text-xs text-gold">Votre formule actuelle</p>
                ) : (
                  <>
                    <button type="button" onClick={startCheckout} disabled={busy === 'checkout' || !plan?.paymentsAvailable}
                      className="w-full rounded-xl bg-accent-strong px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-50">
                      {trialLabel ? `Commencer : ${trialLabel}` : 'Passer en Pro'}
                    </button>
                    <p className="mt-2 text-center text-[11px] leading-relaxed text-white/40">
                      {!plan?.paymentsAvailable
                        ? 'Le paiement en ligne ouvre très bientôt.'
                        : trialLabel ? 'Carte demandée maintenant, aucun prélèvement avant la fin de la période offerte.' : 'Paiement sécurisé par Stripe.'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {!isPro && (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/8 bg-surface p-4 sm:flex-row sm:items-center">
              <div className="flex flex-1 gap-2">
                <input value={promo} onChange={e => { setPromo(e.target.value); setPromoInfo(null) }} placeholder="Code promo"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm uppercase text-white outline-none placeholder:normal-case placeholder:text-white/30 focus:border-accent/50" />
                <button type="button" onClick={checkPromo} disabled={!promo.trim() || busy === 'promo'} className="rounded-xl border border-white/12 px-4 text-xs font-medium text-white/80 transition hover:bg-white/[0.06] disabled:opacity-40">Appliquer</button>
              </div>
              {promoInfo && <p className="text-xs text-emerald-300">{promoInfo.freeMonths} mois offerts avant le premier prélèvement.</p>}
              <button type="button" onClick={() => setFounderOpen(true)} className="text-left text-xs text-accent-light hover:text-white sm:text-right">J’ai un code Fondateur</button>
            </div>
          )}
        </>
      )}

      {/* Comparatif détaillé */}
      {plan && rows.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-white">Comparatif détaillé</h2>
          <div className="overflow-hidden rounded-2xl border border-white/8 bg-surface">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b border-white/8 px-4 py-3 text-[10px] font-bold uppercase tracking-[.16em] text-white/40 sm:gap-x-8 sm:px-5">
              <span>Fonctionnalité</span><span className="w-20 text-center sm:w-28">Gratuit</span><span className="w-20 text-center text-accent-light sm:w-28">Pro</span>
            </div>
            {rows.map(row => (
              <div key={row.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 border-b border-white/[0.05] px-4 py-3 text-sm last:border-b-0 sm:gap-x-8 sm:px-5">
                <span className={row.highlight ? 'text-white' : 'text-white/70'}>{row.label}</span>
                <span className="w-20 text-center text-xs text-white/45 sm:w-28">{row.free}</span>
                <span className="w-20 text-center text-xs font-medium text-white sm:w-28">{row.pro}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Formules supplémentaires */}
      {catalog && catalog.offers.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">Formules supplémentaires</h2>
          <p className="mb-4 mt-1 text-sm text-white/45">Ouvertes à tous, compte gratuit ou Pro. Chaque achat est validé par l’équipe LS Bookers.</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {catalog.offers.map(offer => (
              <article key={offer.id} className="flex flex-col rounded-3xl border border-white/8 bg-surface p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.03]"><LsIcon name={KIND_ICON[offer.kind]} /></span>
                  <h3 className="text-sm font-semibold text-white">{offer.title}</h3>
                </div>
                {offer.description && <p className="mt-3 text-xs leading-relaxed text-white/50">{offer.description}</p>}
                {offer.kind === 'CAROUSEL' && catalog.carousel && (
                  <p className="mt-3 text-[11px] text-white/40">
                    Votre région : {catalog.carousel.regionName || 'ville à renseigner dans votre profil'}
                  </p>
                )}
                <div className="mt-4 space-y-2">
                  {offer.options.map(option => {
                    const key = `${offer.id}:${option.id}`
                    const avail = offer.kind === 'CAROUSEL'
                      ? (option.scope === 'REGIONAL' ? catalog.carousel?.regional : catalog.carousel?.national)
                      : null
                    const regionMissing = option.scope === 'REGIONAL' && offer.kind === 'CAROUSEL' && !catalog.carousel?.regionCode
                    return (
                      <div key={option.id} className="rounded-2xl border border-white/8 bg-white/[0.02] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm text-white">{option.label}</p>
                            {avail && (
                              <p className={`mt-0.5 text-[11px] ${avail.full ? 'text-gold' : 'text-white/40'}`}>
                                {avail.full
                                  ? (avail.nextFreeDate ? `Complet jusqu’au ${fmtDate(avail.nextFreeDate)}` : 'Complet pour le moment')
                                  : `${avail.slots - avail.used} place${avail.slots - avail.used > 1 ? 's' : ''} libre${avail.slots - avail.used > 1 ? 's' : ''}`}
                              </p>
                            )}
                          </div>
                          <button type="button" onClick={() => buyExtra(offer, option)} disabled={busy === key || regionMissing || !plan?.paymentsAvailable}
                            className="shrink-0 rounded-xl bg-accent-strong px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-accent disabled:opacity-40">
                            {price(option.priceCents)}
                          </button>
                        </div>
                        {offer.kind === 'CAROUSEL' && (avail?.full || startDates[key]) && (
                          <label className="mt-2 flex items-center gap-2 text-[11px] text-white/50">
                            Affichage à partir du
                            <input type="date" value={startDates[key] || (avail?.nextFreeDate ? toInputDate(avail.nextFreeDate) : '')}
                              min={avail?.nextFreeDate ? toInputDate(avail.nextFreeDate) : toInputDate(new Date())}
                              onChange={e => setStartDates(s => ({ ...s, [key]: e.target.value }))}
                              className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-white [color-scheme:dark]" />
                          </label>
                        )}
                      </div>
                    )
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {orders.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-white">Mes formules</h2>
          <div className="overflow-hidden rounded-2xl border border-white/8 bg-surface">
            {orders.map(o => (
              <div key={o.id} className="flex flex-col gap-1 border-b border-white/[0.05] px-5 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-white">{o.label}</p>
                  <p className="text-[11px] text-white/40">
                    Achetée le {fmtDate(o.createdAt)} · {euros(o.amountCents)}
                    {o.startsAt && o.endsAt ? ` · du ${fmtDate(o.startsAt)} au ${fmtDate(o.endsAt)}` : ''}
                  </p>
                </div>
                <span className={`text-xs ${ORDER_STATUS[o.status]?.tone || 'text-white/50'}`}>{ORDER_STATUS[o.status]?.label || o.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="mt-10 text-center text-[11px] leading-relaxed text-white/35">
        Prix TTC. Paiements sécurisés par Stripe : LS Bookers ne voit jamais votre numéro de carte.
        Vos factures LS Bookers sont disponibles dans « Gérer mon abonnement ».
      </p>

      {founderOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={() => setFounderOpen(false)}>
          <div role="dialog" aria-modal="true" onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-3xl border border-white/10 bg-surface p-6">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-gold">Membre fondateur</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Votre code Fondateur</h2>
            <p className="mt-2 text-sm text-white/55">Il vous offre le compte Pro à vie, sans carte bancaire. Chaque code ne sert qu’une fois.</p>
            <input value={founderCode} onChange={e => setFounderCode(e.target.value)} placeholder="FONDATEUR-XXXXXXXX" autoFocus
              className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm uppercase text-white outline-none placeholder:text-white/30 focus:border-accent/50" />
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setFounderOpen(false)} className="flex-1 rounded-xl border border-white/12 px-4 py-2.5 text-xs text-white/70 hover:bg-white/[0.06]">Annuler</button>
              <button type="button" onClick={useFounder} disabled={!founderCode.trim() || busy === 'founder'} className="flex-1 rounded-xl bg-accent-strong px-4 py-2.5 text-xs font-semibold text-white hover:bg-accent disabled:opacity-50">Activer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Usage({ label, used, max }: { label: string; used?: number; max: number }) {
  const value = used ?? 0
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 100
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <p className="text-[11px] text-white/45">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value} <span className="font-normal text-white/40">/ {max}</span></p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${value >= max ? 'bg-gold' : 'bg-accent'}`} style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<div className="lsb-state-screen">Chargement…</div>}>
      <SubscriptionsContent />
    </Suspense>
  )
}
