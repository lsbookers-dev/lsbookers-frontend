'use client'

/**
 * Offres et abonnements (choix A2 d'Antho, 22/10/2026) — une page en deux parties :
 * 1. Les formules : Gratuit, Pro au milieu, Agence (choix D1, 27/10/2026), code promo ou Fondateur, + comparatif
 * 2. Nos autres services : formules ajoutées dans l'admin (carrousel, réseaux sociaux, newsletter…)
 */
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { useFeedback, apiErrorMessage } from '@/components/ui/Feedback'
import LsIcon, { type LsIconName } from '@/components/ui/LsIcon'
import { usePlan, price, euros, type PlanInfo, type PlanLimits } from '@/lib/plan'
import AddProfileModal from '@/components/managed/AddProfileModal'
import Link from 'next/link'

type Interval = 'MONTH' | 'YEAR'
type ExtraOption = { id: string; label: string; days: number | null; priceCents: number; scope: 'REGIONAL' | 'NATIONAL' | null }
type ExtraOffer = { id: number; kind: 'CAROUSEL' | 'NEWSLETTER' | 'SOCIAL' | 'OTHER'; title: string; description: string | null; options: ExtraOption[] }
type Availability = { slots: number; used: number; full: boolean; nextFreeDate: string | null }
type Catalog = {
  offers: ExtraOffer[]
  carousel: null | { regionCode: string | null; regionName: string | null; regional: Availability | null; national: Availability }
}
type Order = { id: number; label: string; status: string; amountCents: number; scope: string | null; createdAt: string; startsAt: string | null; endsAt: string | null }
type Row = { label: string; free: string; pro: string; agency?: string; highlight?: boolean; check?: boolean }

const KIND_ICON: Record<ExtraOffer['kind'], { icon: LsIconName; tone: 'gold' | 'accent' }> = {
  CAROUSEL: { icon: 'star', tone: 'gold' },
  NEWSLETTER: { icon: 'mail', tone: 'accent' },
  SOCIAL: { icon: 'share', tone: 'accent' },
  OTHER: { icon: 'bolt', tone: 'accent' },
}
const ORDER_STATUS: Record<string, { label: string; tone: string }> = {
  PAID: { label: 'En attente de validation', tone: 'text-gold' },
  ACTIVE: { label: 'En cours', tone: 'text-emerald-300' },
  DONE: { label: 'Réalisée', tone: 'text-white/50' },
  REFUSED: { label: 'Refusée, remboursée', tone: 'text-red-300' },
  CANCELLED: { label: 'Annulée', tone: 'text-white/40' },
}
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '')
const toInputDate = (d: string | Date) => new Date(d).toISOString().slice(0, 10)
const pct = (n: number) => `${String(n).replace('.', ',')} %`
// 60 → « 1 min », 90 → « 1 min 30 », 45 → « 45 s »
const duration = (s: number) => (s < 60 ? `${s} s` : `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60}` : ''}`)

// Comparatif unique, selon le rôle (chiffres du compte gratuit tirés des réglages de l'admin)
function comparisonRows(role: string, limits: PlanLimits, commission: PlanInfo['commission']): Row[] {
  const payee = role === 'ARTIST' || role === 'PROVIDER'
  return [
    { label: 'Profil, publications et messagerie', free: 'Illimité', pro: 'Illimité' },
    { label: 'Recevoir et accepter des bookings', free: 'Illimité', pro: 'Illimité' },
    ...(payee ? [
      { label: 'Commission sur un booking payé en ligne', free: pct(commission.freePct), pro: pct(commission.proPct), highlight: true },
      { label: 'Candidatures aux offres', free: `${limits.applicationsPerMonth} par mois`, pro: 'Illimitées', highlight: true },
    ] : []),
    { label: 'Demandes de booking envoyées', free: `${limits.bookingRequestsPerMonth} par mois`, pro: 'Illimitées', highlight: role === 'ORGANIZER' },
    ...(role !== 'ARTIST' ? [{ label: 'Offres publiées en même temps', free: String(limits.activeOffers), pro: 'Illimitées' }] : []),
    { label: 'Événements en même temps dans l’agenda', free: String(limits.activeEvents), pro: 'Illimités' },
    { label: 'Module Finances : suivi, devis, factures et export PDF pour la compta', free: '—', pro: 'Inclus', highlight: true, check: true },
    { label: 'Budget, équipe et documents d’événement', free: '—', pro: 'Inclus', check: true },
    { label: 'Albums', free: String(limits.albums), pro: 'Illimités' },
    { label: 'Vidéos dans les publications', free: `${limits.videos} de ${duration(limits.videoMaxSeconds)} max`, pro: 'Illimitées' },
    { label: 'Statistiques du profil', free: 'Vues sur 30 jours', pro: 'Détaillées' },
    { label: 'Badge Pro et coup de pouce dans la recherche', free: '—', pro: 'Inclus', check: true },
  ]
}

function SubscriptionsContent() {
  const { user, acting } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const { notify } = useFeedback()
  const { plan, isPro, loading, refresh } = usePlan()

  const [billing, setBilling] = useState<Interval>('MONTH')
  const [promo, setPromo] = useState('')
  const [promoInfo, setPromoInfo] = useState<{ code: string; kind: string; freeMonths: number | null } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [startDates, setStartDates] = useState<Record<string, string>>({})
  const [welcome, setWelcome] = useState(false) // fenêtre « Ajoutez vos profils » après l'achat de la formule Business

  useEffect(() => { if (!user) router.replace('/login') }, [user, router])

  const loadExtras = useCallback(async () => {
    const [c, o] = await Promise.all([
      apiFetch(apiUrl('billing/extras'), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null),
      apiFetch(apiUrl('billing/orders'), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null),
    ])
    if (c) setCatalog(c)
    if (o) setOrders(o.orders || [])
  }, [])

  useEffect(() => { if (user) loadExtras() }, [user, loadExtras])
  useEffect(() => { if (user) refresh() }, [user, refresh])

  // Formule et code choisis à l'inscription : on les reprend
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
        .then(info => { if (info?.kind === 'LAUNCH') setPromoInfo(info) })
        .catch(() => {})
    }
  }, [plan?.signupPlan, signupHandled])

  const dismissSignupPlan = async () => {
    await apiFetch(apiUrl('billing/signup-plan/clear'), { method: 'POST' }).catch(() => null)
    refresh()
  }

  // Retour de la page de paiement Stripe
  useEffect(() => {
    const sub = params.get('abonnement')
    const extra = params.get('formule')
    const business = params.get('business')
    if (!sub && !extra && !business) return
    if (sub === 'ok') notify('Bienvenue dans la version Pro ! Votre abonnement est en cours d’activation.')
    if (business === 'ok') { notify('Bienvenue dans la formule Business ! Elle est en cours d’activation.'); setWelcome(true) }
    if (extra === 'ok') notify('Merci ! Votre service est payé : il sera validé très vite par l’équipe LS Bookers.')
    const t = setTimeout(() => { refresh(); loadExtras() }, 2500)
    router.replace('/subscriptions')
    return () => clearTimeout(t)
  }, [params, notify, refresh, loadExtras, router])

  const role = String(plan?.role || user?.role || '').toUpperCase()
  const prices = plan?.prices
  const rows = useMemo(() => (plan ? comparisonRows(role, plan.limits, plan.commission) : []), [plan, role])

  const startCheckout = async (formula: 'PRO' | 'AGENCY' = 'PRO') => {
    setBusy(formula === 'AGENCY' ? 'checkout-agency' : 'checkout')
    try {
      const res = await apiFetch(apiUrl('billing/checkout'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval: billing, plan: formula, promoCode: promoInfo?.kind === 'LAUNCH' ? promoInfo.code : undefined }),
      })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Impossible d’ouvrir le paiement.'), 'error'); return }
      window.location.href = (await res.json()).url
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

  // Un seul champ pour tous les codes : un code Fondateur active le Pro offert tout de suite,
  // un code de lancement s'applique au paiement
  const applyCode = async () => {
    if (!promo.trim()) return
    setBusy('promo')
    try {
      const res = await apiFetch(apiUrl('billing/promo/check'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: promo }) })
      if (!res.ok) { setPromoInfo(null); notify(await apiErrorMessage(res, 'Code promo invalide.'), 'error'); return }
      const info = await res.json()
      if (info.kind === 'FOUNDER') {
        const r = await apiFetch(apiUrl('billing/founder'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: info.code }) })
        if (!r.ok) { notify(await apiErrorMessage(r, 'Code invalide.'), 'error'); return }
        notify('Merci de faire partie des fondateurs : votre compte Pro vous est offert à vie !')
        setPromo('')
        refresh()
        return
      }
      setPromoInfo(info)
      notify(`Code accepté : ${info.freeMonths} mois offerts.`)
    } finally { setBusy(null) }
  }

  // Code Fondateur réservé au membre : activation en un clic, sans rien saisir
  const activateFounder = async () => {
    if (!plan?.founderCode) return
    setBusy('founder')
    try {
      const r = await apiFetch(apiUrl('billing/founder'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: plan.founderCode }) })
      if (!r.ok) { notify(await apiErrorMessage(r, 'Activation impossible.'), 'error'); return }
      notify('Merci de faire partie des fondateurs : votre compte Pro vous est offert à vie !')
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
  if (acting) {
    return <div className="lsb-page text-white"><p className="text-white/60">L’abonnement de {user.name || 'ce profil'} est réservé à son titulaire. Revenez à votre profil pour voir vos formules.</p></div>
  }
  if (role === 'ADMIN') {
    return <div className="lsb-page text-white"><p className="text-white/60">Les offres et abonnements se règlent dans l’admin.</p></div>
  }

  const sub = plan?.subscription
  const agency = plan?.agency
  const agencyActive = !!agency?.active
  const agencyPrices = plan?.agencyPrices
  // Annuel : « 10 mois payés, 12 mois d'accès » (119,99 € ≈ 10 × 11,99 €)
  const paidMonths = prices && prices.monthCents > 0 ? Math.round(prices.yearCents / prices.monthCents) : 12
  // Mois offerts : uniquement avec un code de lancement (ou un essai si l'admin en remet un)
  const freeMonths = promoInfo?.freeMonths || (plan?.trialAvailable && plan.trialDays > 0 ? Math.max(1, Math.round(plan.trialDays / 30)) : 0)
  const firstCharge = (() => { const d = new Date(); d.setMonth(d.getMonth() + freeMonths); return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) })()
  const benefits = [
    'Tout illimité',
    ...(role === 'ARTIST' || role === 'PROVIDER' ? [`Commission ${pct(plan?.commission.proPct ?? 5)}`] : []),
    'Finances + export compta',
    'Badge Pro',
  ]

  return (
    <div className="lsb-page min-h-screen text-white">
      <header className="lsb-page-heading">
        <div>
          <span>OFFRES ET ABONNEMENTS</span>
          <h1>Développez votre activité<em>.</em></h1>
        </div>
      </header>

      {plan?.founderCode && !isPro && (
        <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-gold/35 bg-gradient-to-br from-gold/[0.12] to-transparent p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/30 bg-gold/10"><LsIcon name="star" tone="gold" /></span>
            <div>
              <p className="text-sm font-semibold text-white">Un code Fondateur vous attend</p>
              <p className="mt-0.5 text-xs leading-relaxed text-white/60">Merci de faire partie de l’aventure : LS Bookers vous offre la version Pro à vie, sans carte bancaire.</p>
            </div>
          </div>
          <button type="button" onClick={activateFounder} disabled={busy === 'founder'}
            className="shrink-0 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-[#1a1408] transition hover:brightness-110 disabled:opacity-50">
            Activer mon Pro offert
          </button>
        </section>
      )}

      {plan?.signupPlan && !isPro && (
        <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">{plan.signupPlan.plan === 'AGENCY' ? 'Finalisez votre formule Business' : plan.signupPlan.plan === 'PRO' ? 'Finalisez votre version Pro' : 'Votre code est prêt'}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-white/60">
              {plan.signupPlan.plan === 'AGENCY'
                ? 'Vous avez choisi la formule Business à l’inscription. Choisissez mensuel ou annuel, puis « Choisir Business » pour enregistrer votre carte.'
                : plan.signupPlan.plan === 'PRO'
                ? 'Vous avez choisi la version Pro à l’inscription. Il ne reste qu’à choisir mensuel ou annuel et à enregistrer votre carte.'
                : 'Le code saisi à l’inscription est prêt ci-dessous : cliquez sur « Appliquer ».'}
            </p>
          </div>
          <button type="button" onClick={dismissSignupPlan} className="shrink-0 text-xs text-white/50 hover:text-white">Rester en gratuit</button>
        </section>
      )}

      {/* ── 1. Les formules : Gratuit, Pro au milieu, Agence (D1) ─── */}
      <PartTitle num={1} title="Nos formules" />

      {prices && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1 text-xs" role="tablist" aria-label="Facturation">
              {(['MONTH', 'YEAR'] as Interval[]).map(i => (
                <button key={i} type="button" role="tab" aria-selected={billing === i} onClick={() => setBilling(i)}
                  className={`rounded-full px-4 py-1.5 font-medium transition ${billing === i ? 'bg-accent-strong text-white' : 'text-white/55 hover:text-white'}`}>
                  {i === 'MONTH' ? 'Mensuel' : 'Annuel'}
                </button>
              ))}
            </div>
            {paidMonths < 12 && <p className="text-xs font-medium text-gold">{billing === 'YEAR' ? '' : 'En annuel : '}{paidMonths} mois payés, 12 mois d’accès</p>}
          </div>

          <div className="grid items-stretch gap-3 md:grid-cols-3 md:pt-2">
            {/* Gratuit */}
            <PlanCard title="Gratuit" priceLabel="0 €" sub="Pour démarrer, sans carte bancaire"
              items={[
                'Profil, publications et messagerie',
                'Bookings reçus et acceptés sans limite',
                ...(role === 'ARTIST' || role === 'PROVIDER' ? [`Commission ${pct(plan?.commission.freePct ?? 10)}`] : []),
              ]}>
              <p className="rounded-xl border border-white/10 px-4 py-2.5 text-center text-xs text-white/45">{!isPro ? 'Votre formule actuelle' : 'Toujours accessible'}</p>
            </PlanCard>

            {/* Pro (mis en avant) */}
            <PlanCard featured title="Pro" badge="Le plus choisi"
              priceLabel={price(billing === 'YEAR' ? prices.yearCents : prices.monthCents)} per={billing === 'YEAR' ? 'an' : 'mois'}
              sub={billing === 'YEAR' ? `Soit ${price(Math.round(prices.yearCents / 12))} par mois. Résiliable à tout moment.` : 'Résiliable à tout moment.'}
              items={benefits}>
              {plan?.managedPro ? (
                <StatusBox title="Vous êtes Pro grâce à votre gestionnaire"
                  text={plan.proPausedByAgency ? 'Les prélèvements de votre abonnement Pro sont suspendus tant que vous travaillez ensemble. Ils reprendront automatiquement à la fin de la collaboration.' : 'Votre profil reste Pro tant qu’il est géré par un compte qui a la formule Business.'} />
              ) : agencyActive ? (
                <StatusBox title="Inclus dans votre formule Business" text="Votre profil et tous les profils que vous gérez sont Pro." />
              ) : isPro && sub ? (
                <>
                  <StatusBox title="Vous êtes Pro" text={[
                    sub.source === 'FOUNDER' ? 'Offert à vie grâce à votre code Fondateur. Merci de faire partie de l’aventure !' : '',
                    sub.source === 'ADMIN' ? 'Offert par LS Bookers.' : '',
                    sub.source === 'STRIPE' && sub.status === 'TRIAL' && sub.trialEndsAt ? `Période offerte jusqu’au ${fmtDate(sub.trialEndsAt)}, puis ${price(sub.priceCents)} ${sub.interval === 'YEAR' ? 'par an' : 'par mois'}.` : '',
                    sub.source === 'STRIPE' && sub.status === 'ACTIVE' && !sub.cancelAtPeriodEnd ? `${price(sub.priceCents)} ${sub.interval === 'YEAR' ? 'par an' : 'par mois'}, prochain prélèvement le ${fmtDate(sub.currentPeriodEnd)}.` : '',
                    sub.source === 'STRIPE' && sub.cancelAtPeriodEnd ? `Résilié : vous restez Pro jusqu’au ${fmtDate(sub.currentPeriodEnd)}.` : '',
                    sub.source === 'STRIPE' && sub.status === 'PAST_DUE' ? 'Le dernier prélèvement a échoué : mettez à jour votre carte pour rester Pro.' : '',
                  ].join('')} />
                  {sub.source === 'STRIPE' && (
                    <button type="button" onClick={openPortal} disabled={busy === 'portal'} className="w-full rounded-xl border border-white/15 px-4 py-2.5 text-xs font-medium text-white/85 transition hover:bg-white/[0.06] disabled:opacity-50">
                      Gérer mon abonnement et mes factures
                    </button>
                  )}
                </>
              ) : (
                <button type="button" onClick={() => startCheckout('PRO')} disabled={busy === 'checkout' || !plan?.paymentsAvailable}
                  className="w-full rounded-xl bg-accent-strong px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-50">
                  Passer en Pro
                </button>
              )}
            </PlanCard>

            {/* Agence */}
            {agencyPrices && (
              <PlanCard title="Business" priceLabel={price(billing === 'YEAR' ? agencyPrices.yearCents : agencyPrices.monthCents)} per={billing === 'YEAR' ? 'an' : 'mois'}
                sub="Gérez plusieurs profils depuis un seul compte"
                items={[
                  `${agencyPrices.includedProfiles} profils gérés inclus, tous Pro`,
                  'Passez d’un profil à l’autre en un clic',
                  'Votre propre profil est Pro aussi',
                  `${price(billing === 'YEAR' ? agencyPrices.extraYearCents : agencyPrices.extraMonthCents)} / ${billing === 'YEAR' ? 'an' : 'mois'} par profil en plus`,
                ]}>
                {agencyActive ? (
                  <>
                    <StatusBox title="Vous avez la formule Business" text={agency?.offered ? 'Offerte par LS Bookers.' : [
                      agency?.status === 'TRIAL' && agency.trialEndsAt ? `Période offerte jusqu’au ${fmtDate(agency.trialEndsAt)}.` : '',
                      agency?.status === 'ACTIVE' && !agency.cancelAtPeriodEnd && agency.priceCents != null ? `${price(agency.priceCents)} ${agency.interval === 'YEAR' ? 'par an' : 'par mois'}${agency.extraProfiles ? ` + ${agency.extraProfiles} profil${agency.extraProfiles > 1 ? 's' : ''} en plus` : ''}, prochain prélèvement le ${fmtDate(agency.currentPeriodEnd)}.` : '',
                      agency?.cancelAtPeriodEnd ? `Résiliée : elle reste active jusqu’au ${fmtDate(agency.currentPeriodEnd)}.` : '',
                      agency?.status === 'PAST_DUE' ? 'Le dernier prélèvement a échoué : mettez à jour votre carte.' : '',
                    ].join('')} />
                    <Link href="/gestion" className="w-full rounded-xl bg-accent-strong px-4 py-2.5 text-center text-xs font-semibold text-white hover:bg-accent">Gérer mes profils</Link>
                    {!agency?.offered && (
                      <button type="button" onClick={openPortal} disabled={busy === 'portal'} className="w-full rounded-xl border border-white/15 px-4 py-2.5 text-xs font-medium text-white/85 transition hover:bg-white/[0.06] disabled:opacity-50">
                        Gérer mon abonnement et mes factures
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => startCheckout('AGENCY')} disabled={busy === 'checkout-agency' || !plan?.paymentsAvailable}
                      className="w-full rounded-xl border border-accent/60 px-4 py-3 text-sm font-semibold text-accent-light transition hover:bg-accent/15 disabled:opacity-50">
                      Choisir Business
                    </button>
                    {sub?.source === 'STRIPE' && isPro && sub.status !== 'CANCELLED' && (
                      <p className="text-center text-[11px] leading-relaxed text-white/45">Votre abonnement Pro s’arrêtera : la partie non utilisée sera déduite de votre prochaine facture.</p>
                    )}
                    {(sub?.source === 'FOUNDER' || sub?.source === 'ADMIN') && isPro && (
                      <p className="text-center text-[11px] leading-relaxed text-white/45">Votre Pro offert est conservé : vous le retrouvez si vous arrêtez la formule Business.</p>
                    )}
                  </>
                )}
              </PlanCard>
            )}
          </div>

          {/* Code promo / Fondateur et mois offerts : pour Pro et Agence */}
          {!plan?.managedPro && !(isPro && sub) && !agencyActive && (
            <div className="mx-auto mt-4 max-w-md">
              <div className="flex gap-2">
                <input value={promo} onChange={e => { setPromo(e.target.value); setPromoInfo(null) }} onKeyDown={e => { if (e.key === 'Enter') applyCode() }}
                  placeholder="Code promo ou code Fondateur" aria-label="Code promo"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm uppercase text-white outline-none placeholder:normal-case placeholder:text-white/30 focus:border-accent/50" />
                <button type="button" onClick={applyCode} disabled={!promo.trim() || busy === 'promo'} className="rounded-xl border border-white/12 px-4 text-xs font-medium text-white/80 transition hover:bg-white/[0.06] disabled:opacity-40">Appliquer</button>
              </div>
              {freeMonths > 0 && <p className="mt-2 text-center text-xs text-emerald-300">{freeMonths} mois offert{freeMonths > 1 ? 's' : ''}, premier prélèvement le {firstCharge}.</p>}
              <p className="mt-2 text-center text-[11px] text-white/40">{!plan?.paymentsAvailable ? 'Le paiement en ligne ouvre très bientôt.' : 'Paiement sécurisé par Stripe.'}</p>
            </div>
          )}
        </>
      )}

      {plan && rows.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-[18px] border border-white/8 bg-surface">
          <div className="grid grid-cols-[1fr_4.2rem_4.2rem_4.2rem] gap-x-2 bg-white/[0.02] px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-white/35 sm:grid-cols-[1fr_7rem_7rem_7rem] sm:px-5">
            <span>Comparatif</span><span className="text-center">Gratuit</span><span className="text-center text-accent-light">Pro</span><span className="text-center">Business</span>
          </div>
          {[...rows, ...(agencyPrices ? [{ label: 'Profils gérés depuis votre compte', free: '—', pro: '—', agency: `${agencyPrices.includedProfiles} inclus`, highlight: true }] : [])].map(row => (
            <div key={row.label} className="grid grid-cols-[1fr_4.2rem_4.2rem_4.2rem] items-center gap-x-2 border-t border-white/[0.05] px-4 py-3 text-[13px] sm:grid-cols-[1fr_7rem_7rem_7rem] sm:px-5">
              <span className={row.highlight ? 'font-medium text-white' : 'text-white/70'}>{row.label}</span>
              <span className="text-center text-xs text-white/45">{row.free}</span>
              <span className="flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-white">
                {row.check && <LsIcon name="check" size={14} />}{row.pro}
              </span>
              <span className="flex items-center justify-center gap-1.5 text-center text-xs text-white/80">
                {row.check && !row.agency && <LsIcon name="check" size={14} />}{row.agency ?? row.pro}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── 2. Nos autres services ────────────────────────── */}
      {catalog && catalog.offers.length > 0 && (
        <>
          <PartTitle num={2} title="Nos autres services" hint="Ouverts à tous, compte gratuit ou Pro" />
          <div className="overflow-hidden rounded-[18px] border border-white/8 bg-surface">
            {catalog.offers.map(offer => {
              const icon = KIND_ICON[offer.kind]
              return (
                <div key={offer.id} className="grid gap-4 border-t border-white/[0.05] p-4 first:border-t-0 sm:p-5 md:grid-cols-[2.75rem_1fr_auto] md:items-center">
                  <span className="hidden h-11 w-11 place-items-center rounded-full border border-white/10 md:grid"><LsIcon name={icon.icon} tone={icon.tone} /></span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white">{offer.title}</h3>
                    {offer.description && <p className="mt-1 text-xs leading-relaxed text-white/50">{offer.description}</p>}
                    {offer.kind === 'CAROUSEL' && catalog.carousel && (
                      <p className="mt-1 text-[11px] text-white/40">Votre région : {catalog.carousel.regionName || 'renseignez votre ville dans votre profil'}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 md:max-w-md md:justify-end">
                    {offer.options.map(option => {
                      const key = `${offer.id}:${option.id}`
                      const avail = offer.kind === 'CAROUSEL'
                        ? (option.scope === 'REGIONAL' ? catalog.carousel?.regional : catalog.carousel?.national)
                        : null
                      const regionMissing = offer.kind === 'CAROUSEL' && option.scope === 'REGIONAL' && !catalog.carousel?.regionCode
                      return (
                        <div key={option.id} className="flex flex-col items-stretch gap-1">
                          <button type="button" onClick={() => buyExtra(offer, option)} disabled={busy === key || regionMissing || !plan?.paymentsAvailable}
                            className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/80 transition hover:border-accent/50 hover:bg-accent/10 disabled:opacity-40">
                            <span>{option.label}</span><b className="font-semibold text-white">{price(option.priceCents)}</b>
                          </button>
                          {avail?.full && (
                            <span className="text-center text-[10px] text-gold">{avail.nextFreeDate ? `Complet jusqu’au ${fmtDate(avail.nextFreeDate)}` : 'Complet'}</span>
                          )}
                          {offer.kind === 'CAROUSEL' && (avail?.full || startDates[key]) && (
                            <input type="date" aria-label="Affichage à partir du" value={startDates[key] || (avail?.nextFreeDate ? toInputDate(avail.nextFreeDate) : '')}
                              min={avail?.nextFreeDate ? toInputDate(avail.nextFreeDate) : toInputDate(new Date())}
                              onChange={e => setStartDates(s => ({ ...s, [key]: e.target.value }))}
                              className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white [color-scheme:dark]" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] text-white/35">Chaque achat est validé par l’équipe LS Bookers. Paiement sécurisé par Stripe.</p>
        </>
      )}

      {welcome && <AddProfileModal welcome onClose={() => setWelcome(false)} onDone={() => { setWelcome(false); router.push('/gestion') }} />}

      {orders.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-white/80">Mes services achetés</h2>
          <div className="overflow-hidden rounded-2xl border border-white/8 bg-surface">
            {orders.map(o => (
              <div key={o.id} className="flex flex-col gap-1 border-b border-white/[0.05] px-5 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-white">{o.label}</p>
                  <p className="text-[11px] text-white/40">
                    Acheté le {fmtDate(o.createdAt)} · {euros(o.amountCents)}
                    {o.startsAt && o.endsAt ? ` · du ${fmtDate(o.startsAt)} au ${fmtDate(o.endsAt)}` : ''}
                  </p>
                </div>
                <span className={`text-xs ${ORDER_STATUS[o.status]?.tone || 'text-white/50'}`}>{ORDER_STATUS[o.status]?.label || o.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

/** Carte d'une formule (D1) : le Pro, au milieu, est mis en avant */
function PlanCard({ title, badge, priceLabel, per, sub, items, featured, children }: {
  title: string; badge?: string; priceLabel: string; per?: string; sub: string; items: string[]; featured?: boolean; children: React.ReactNode
}) {
  return (
    <section className={`flex flex-col gap-3 rounded-[20px] border p-5 ${featured ? '-order-1 md:order-none border-2 border-accent bg-[radial-gradient(circle_at_0%_0%,rgba(139,92,246,.24),transparent_55%)] bg-surface md:-translate-y-2' : 'border-white/10 bg-surface'}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {badge && <span className="rounded-md bg-gold px-2 py-0.5 text-[10px] font-semibold text-[#1a1408]">{badge}</span>}
      </div>
      <p className="text-[32px] font-semibold leading-none tracking-tight text-white">
        {priceLabel}{per && <span className="ml-1.5 text-sm font-normal text-white/45">/ {per} TTC</span>}
      </p>
      <p className="text-xs text-white/50">{sub}</p>
      <ul className="grid gap-1.5">
        {items.map(item => (
          <li key={item} className="flex items-start gap-2 text-xs text-white/75"><LsIcon name="check" size={14} tone={featured ? 'accent' : 'muted'} />{item}</li>
        ))}
      </ul>
      <div className="mt-auto grid gap-2 pt-2">{children}</div>
    </section>
  )
}

function StatusBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-gold/25 bg-gold/[0.07] p-3">
      <LsIcon name="star" tone="gold" size={18} />
      <div>
        <p className="text-xs font-semibold text-white">{title}</p>
        {text && <p className="mt-0.5 text-[11px] leading-relaxed text-white/55">{text}</p>}
      </div>
    </div>
  )
}

function PartTitle({ num, title, hint }: { num: number; title: string; hint?: string }) {
  return (
    <div className="mb-3.5 mt-8 flex flex-wrap items-center gap-2.5 first:mt-0">
      <span className="grid h-7 w-7 place-items-center rounded-full border border-accent/45 text-xs font-semibold text-accent-light">{num}</span>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {hint && <p className="text-xs text-white/45 sm:ml-auto">{hint}</p>}
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
