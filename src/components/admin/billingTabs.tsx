'use client'

/* eslint-disable @next/next/no-img-element */
/**
 * Contenu de Admin › Ventes (À valider, Abonnés, Codes promo) et Admin › Réglages
 * (Tarifs et règles, Services payants). Anciennement la page « Offres » (refonte du 31/10/2026).
 */
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'
import { ADMIN_BADGES_EVENT } from './AdminSidebar'
import { BTN, BTN2, CARD, INPUT, ROLE_LABEL, Empty, Kpi, Spinner, money, fmtDate as fmt } from './ui'

const toInput = (d: string | Date | null | undefined) => {
  if (!d) return ''
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

async function getJson<T>(path: string): Promise<T | null> {
  const res = await apiFetch(apiUrl(path), { cache: 'no-store' }).catch(() => null)
  return res?.ok ? res.json() : null
}
async function send(path: string, method: string, body?: unknown) {
  return apiFetch(apiUrl(path), { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
}

/* ── Formules payées à valider ─────────────────────────── */

type Order = {
  id: number; kind: string; label: string; status: string; amountCents: number; days: number | null
  scope: string | null; regionName: string | null; desiredStart: string | null; paidAt: string | null; handledAt: string | null
  adminNote: string | null; createdAt: string; refundedCents: number
  featured: { startsAt: string | null; endsAt: string | null } | null
  user: { id: number; name: string; email: string; role: string; avatar: string | null; location: string | null }
}
const ORDER_STATUS: Record<string, string> = { PAID: 'À valider', ACTIVE: 'En cours', DONE: 'Réalisée', REFUSED: 'Refusée (remboursée)', CANCELLED: 'Annulée' }

function OrderRow({ order, onDone }: { order: Order; onDone: () => void }) {
  const { notify, confirm } = useFeedback()
  const start = order.desiredStart && new Date(order.desiredStart) > new Date() ? new Date(order.desiredStart) : new Date()
  const [startsAt, setStartsAt] = useState(toInput(start))
  const [endsAt, setEndsAt] = useState(toInput(new Date(start.getTime() + (order.days || 7) * 86400000)))
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = order.status === 'PAID'

  const validate = async () => {
    setBusy(true)
    try {
      const res = await send(`admin/billing/orders/${order.id}/validate`, 'POST', order.kind === 'CAROUSEL'
        ? { startsAt: new Date(`${startsAt}T00:00:00`).toISOString(), endsAt: new Date(`${endsAt}T23:59:59`).toISOString(), note: note || undefined }
        : { note: note || undefined })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Validation impossible.'), 'error'); return }
      notify(order.kind === 'CAROUSEL' ? 'Validé : le profil apparaîtra dans le carrousel.' : 'Formule marquée comme réalisée.')
      window.dispatchEvent(new CustomEvent(ADMIN_BADGES_EVENT))
      onDone()
    } finally { setBusy(false) }
  }
  const refuse = async () => {
    if (!(await confirm({ title: 'Refuser et rembourser ?', message: `${order.user.name} sera intégralement remboursé (${money(order.amountCents)}).`, confirmLabel: 'Refuser et rembourser', danger: true }))) return
    setBusy(true)
    try {
      const res = await send(`admin/billing/orders/${order.id}/refuse`, 'POST', { note: note || undefined })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Remboursement impossible.'), 'error'); return }
      notify('Commande refusée, membre remboursé.')
      window.dispatchEvent(new CustomEvent(ADMIN_BADGES_EVENT))
      onDone()
    } finally { setBusy(false) }
  }

  return (
    <li className={`${CARD} ${pending ? 'border-gold/30' : ''}`}>
      <div className="flex flex-wrap items-start gap-3">
        {order.user.avatar
          ? <img src={order.user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
          : <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xs">{order.user.name[0]?.toUpperCase()}</span>}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{order.label}</p>
          <p className="text-xs text-muted">
            {order.user.name} · {ROLE_LABEL[order.user.role] || order.user.role}{order.user.location ? ` · ${order.user.location}` : ''}
          </p>
          <p className="mt-1 text-xs text-muted">
            {money(order.amountCents)} · payé le {fmt(order.paidAt)}
            {order.scope === 'REGIONAL' ? ` · région : ${order.regionName || '?'}` : order.scope === 'NATIONAL' ? ' · national' : ''}
            {order.featured ? ` · affiché du ${fmt(order.featured.startsAt)} au ${fmt(order.featured.endsAt)}` : ''}
          </p>
          {order.adminNote && <p className="mt-1 text-xs text-muted">Note : {order.adminNote}</p>}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${pending ? 'bg-gold/15 text-gold' : 'bg-white/10 text-white/60'}`}>{ORDER_STATUS[order.status] || order.status}</span>
      </div>
      {pending && (
        <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
          {order.kind === 'CAROUSEL' && (
            <>
              <label className="text-xs text-muted">Début<input type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)} className={`${INPUT} mt-1`} /></label>
              <label className="text-xs text-muted">Fin ({order.days} j achetés)<input type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} className={`${INPUT} mt-1`} /></label>
            </>
          )}
          <label className={`text-xs text-muted ${order.kind === 'CAROUSEL' ? '' : 'sm:col-span-3'}`}>Note (facultatif)<input value={note} onChange={e => setNote(e.target.value)} placeholder="Visible par vous seul, et par le membre en cas de refus" className={`${INPUT} mt-1`} /></label>
          <div className="flex gap-2">
            <button type="button" onClick={refuse} disabled={busy} className={BTN2}>Refuser</button>
            <button type="button" onClick={validate} disabled={busy} className={BTN}>{order.kind === 'CAROUSEL' ? 'Valider' : 'Réalisée'}</button>
          </div>
        </div>
      )}
    </li>
  )
}

export function OrdersTab() {
  const [filter, setFilter] = useState<'PENDING' | ''>('PENDING')
  const [data, setData] = useState<{ pending: number; orders: Order[] } | null>(null)
  const load = useCallback(async () => { setData(await getJson(`admin/billing/orders${filter ? `?status=${filter}` : ''}`)) }, [filter])
  useEffect(() => { load() }, [load])
  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button type="button" onClick={() => setFilter('PENDING')} className={filter === 'PENDING' ? BTN : BTN2}>À valider{data && data.pending ? ` (${data.pending})` : ''}</button>
        <button type="button" onClick={() => setFilter('')} className={filter === '' ? BTN : BTN2}>Toutes</button>
      </div>
      {!data ? <Spinner /> : data.orders.length === 0
        ? <Empty text={filter ? 'Aucune formule à valider.' : 'Aucune formule achetée pour l’instant.'} />
        : <ul className="space-y-3">{data.orders.map(o => <OrderRow key={o.id} order={o} onDone={load} />)}</ul>}
    </div>
  )
}

/* ── Abonnés Pro et Business ───────────────────────────── */

type Sub = {
  id: string; plan: 'PRO' | 'BUSINESS'; status: string; interval: string; source: string; priceCents: number; promoCode: string | null
  trialEndsAt: string | null; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; startDate: string; extraProfiles: number
  pausedByAgency: boolean; isPro: boolean; user: { id: number; name: string; email: string; role: string }
}
type SubTotals = { pro: number; business: number; trial: number; paying: number; payingPro: number; payingBusiness: number; gifted: number; mrrCents: number }
const SOURCE: Record<string, string> = { STRIPE: 'Payant', FOUNDER: 'Fondateur', ADMIN: 'Offert' }
const SUB_STATUS: Record<string, string> = { TRIAL: 'Essai', ACTIVE: 'Actif', PAST_DUE: 'Paiement en retard', CANCELLED: 'Résilié', EXPIRED: 'Terminé' }

export function SubscribersTab() {
  const [data, setData] = useState<{ subscriptions: Sub[]; totals: SubTotals } | null>(null)
  const [plan, setPlan] = useState<'' | 'PRO' | 'BUSINESS'>('')
  const [showEnded, setShowEnded] = useState(false)
  useEffect(() => { getJson<{ subscriptions: Sub[]; totals: SubTotals }>('admin/billing/subscriptions').then(setData) }, [])

  if (!data) return <Spinner />
  const list = data.subscriptions.filter(s => (!plan || s.plan === plan) && (showEnded || s.isPro))
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Abonnés payants" value={String(data.totals.paying)} sub={`${data.totals.payingPro} Pro · ${data.totals.payingBusiness} Business`} />
        <Kpi label="Comptes Pro" value={String(data.totals.pro)} sub={data.totals.trial ? `dont ${data.totals.trial} en essai` : undefined} />
        <Kpi label="Comptes Business" value={String(data.totals.business)} />
        <Kpi label="Abonnements par mois" value={money(data.totals.mrrCents)} gold sub={data.totals.gifted ? `${data.totals.gifted} offerts ou Fondateurs (0 €)` : undefined} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {([['', 'Tous'], ['PRO', 'Pro'], ['BUSINESS', 'Business']] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setPlan(k)} className={plan === k ? BTN : BTN2}>{l}</button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={showEnded} onChange={e => setShowEnded(e.target.checked)} /> Afficher les abonnements terminés
        </label>
      </div>
      <p className="text-xs text-muted">Pour offrir ou retirer le Pro ou le Business, ouvrez la fiche du membre dans l&apos;onglet Membres.</p>
      {list.length === 0 ? <Empty text="Aucun abonné pour l’instant." /> : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted">
              <tr className="border-b border-line"><th className="px-4 py-3">Membre</th><th className="px-4 py-3">Formule</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Prix</th><th className="px-4 py-3">Échéance</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map(s => (
                <tr key={s.id} className={s.isPro ? '' : 'opacity-50'}>
                  <td className="px-4 py-3"><p>{s.user.name}</p><p className="text-xs text-muted">{ROLE_LABEL[s.user.role]} · {s.user.email}</p></td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-gold/15 px-2 py-0.5 text-[11px] text-gold-light">{s.plan === 'PRO' ? 'Pro' : 'Business'}</span>
                    <p className="mt-1 text-xs text-muted">{SOURCE[s.source] || s.source}{s.promoCode ? ` · ${s.promoCode}` : ''}{s.pausedByAgency ? ' · payé par son agence' : ''}</p>
                  </td>
                  <td className="px-4 py-3">{SUB_STATUS[s.status] || s.status}{s.cancelAtPeriodEnd ? <p className="text-xs text-gold">Résiliation prévue</p> : null}</td>
                  <td className="px-4 py-3">{s.source === 'STRIPE' ? `${money(s.priceCents)} / ${s.interval === 'YEAR' ? 'an' : 'mois'}` : 'Gratuit'}{s.extraProfiles ? <p className="text-xs text-muted">+ {s.extraProfiles} profil{s.extraProfiles > 1 ? 's' : ''} en plus</p> : null}</td>
                  <td className="px-4 py-3 text-muted">{s.status === 'TRIAL' ? `Essai → ${fmt(s.trialEndsAt)}` : fmt(s.currentPeriodEnd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Codes promo ───────────────────────────────────────── */

type Code = { id: number; code: string; kind: 'FOUNDER' | 'LAUNCH'; freeMonths: number | null; maxUses: number | null; usedCount: number; active: boolean; expiresAt: string | null; note: string | null; createdAt: string; usedBy: { id: number; name: string; at: string }[]; reservedFor: { id: number; name: string; email: string; role: string } | null }
type Member = { id: number; pseudo: string | null; firstName: string | null; lastName: string | null; email: string; role: string; profile?: { avatar: string | null } | null }
const memberName = (u: Member) => u.pseudo || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email

export function CodesTab() {
  const { notify } = useFeedback()
  const [codes, setCodes] = useState<Code[] | null>(null)
  // Membres choisis pour recevoir un code Fondateur (recherche avec suggestions)
  const [picked, setPicked] = useState<Member[]>([])
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState<Member[]>([])
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setSuggestions([]); return }
    const t = setTimeout(async () => {
      const d = await getJson<{ users: Member[] }>(`admin/users?q=${encodeURIComponent(term)}&limit=8`)
      setSuggestions((d?.users || []).filter(u => u.role !== 'ADMIN'))
    }, 250)
    return () => clearTimeout(t)
  }, [q])
  const pick = (u: Member) => { setPicked(list => (list.some(x => x.id === u.id) ? list : [...list, u])); setQ(''); setSuggestions([]) }
  const [launch, setLaunch] = useState({ code: 'LANCEMENT', freeMonths: '2', maxUses: '', expiresAt: '' })
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => { const d = await getJson<{ codes: Code[] }>('admin/billing/promo-codes'); setCodes(d?.codes || []) }, [])
  useEffect(() => { load() }, [load])

  const createFounders = async () => {
    if (!picked.length) return
    setBusy(true)
    try {
      const res = await send('admin/billing/promo-codes', 'POST', { kind: 'FOUNDER', userIds: picked.map(u => u.id) })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Création impossible.'), 'error'); return }
      const d = await res.json()
      const n = d.codes?.length || 0
      notify(`${n} code${n > 1 ? 's' : ''} Fondateur créé${n > 1 ? 's' : ''} : chaque membre l’a reçu dans ses notifications.${d.skipped?.length ? ` Déjà un code en attente : ${d.skipped.join(', ')}.` : ''}`)
      setPicked([]); load()
    } finally { setBusy(false) }
  }
  const createLaunch = async () => {
    setBusy(true)
    try {
      const res = await send('admin/billing/promo-codes', 'POST', {
        kind: 'LAUNCH', code: launch.code, freeMonths: Number(launch.freeMonths),
        maxUses: launch.maxUses ? Number(launch.maxUses) : undefined,
        expiresAt: launch.expiresAt ? new Date(`${launch.expiresAt}T23:59:59`).toISOString() : undefined,
      })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Création impossible.'), 'error'); return }
      notify('Code de lancement créé.'); load()
    } finally { setBusy(false) }
  }
  const toggle = async (c: Code) => {
    const res = await send(`admin/billing/promo-codes/${c.id}`, 'PATCH', { active: !c.active })
    if (res.ok) load()
  }
  const copy = (text: string) => { navigator.clipboard?.writeText(text).then(() => notify('Copié.')).catch(() => {}) }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className={CARD}>
          <p className="text-sm font-semibold">Codes Fondateur</p>
          <p className="mt-1 text-xs text-muted">Pro offert à vie, sans carte. Un code par membre, réservé à lui et utilisable une seule fois. Il le reçoit dans ses notifications.</p>
          <div className="relative mt-3">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Pseudo, nom ou e-mail du membre…" className={INPUT} />
            {suggestions.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-[#14121c] shadow-2xl">
                {suggestions.map(u => {
                  const already = picked.some(x => x.id === u.id)
                  return (
                    <li key={u.id}>
                      <button type="button" disabled={already} onClick={() => pick(u)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-white/[0.05] disabled:opacity-40">
                        {u.profile?.avatar
                          ? <img src={u.profile.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                          : <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-xs">{memberName(u)[0]?.toUpperCase()}</span>}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{memberName(u)}</span>
                          <span className="block truncate text-xs text-muted">{ROLE_LABEL[u.role] || u.role} · {u.email}</span>
                        </span>
                        <span className="text-xs text-accent-light">{already ? 'Ajouté' : 'Ajouter'}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          {picked.length > 0 ? (
            <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
              {picked.map(u => (
                <li key={u.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{memberName(u)} <span className="text-xs text-muted">· {ROLE_LABEL[u.role] || u.role}</span></span>
                  <button type="button" onClick={() => setPicked(list => list.filter(x => x.id !== u.id))} className="text-xs text-red-300 hover:text-red-200">Retirer</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-white/35">Aucun membre choisi pour l’instant.</p>
          )}
          <button type="button" onClick={createFounders} disabled={busy || !picked.length} className={`${BTN} mt-3`}>
            {picked.length ? `Créer ${picked.length} code${picked.length > 1 ? 's' : ''}` : 'Créer les codes'}
          </button>
        </section>
        <section className={CARD}>
          <p className="text-sm font-semibold">Code de lancement</p>
          <p className="mt-1 text-xs text-muted">Un code partagé : des mois offerts avant le premier prélèvement. La carte est demandée tout de suite, le prélèvement commence ensuite.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="col-span-2 text-xs text-muted">Code<input value={launch.code} onChange={e => setLaunch(l => ({ ...l, code: e.target.value.toUpperCase() }))} className={`${INPUT} mt-1 uppercase`} /></label>
            <label className="text-xs text-muted">Mois offerts<input type="number" min={1} max={24} value={launch.freeMonths} onChange={e => setLaunch(l => ({ ...l, freeMonths: e.target.value }))} className={`${INPUT} mt-1`} /></label>
            <label className="text-xs text-muted">Utilisations max<input type="number" min={1} value={launch.maxUses} onChange={e => setLaunch(l => ({ ...l, maxUses: e.target.value }))} placeholder="Illimité" className={`${INPUT} mt-1`} /></label>
            <label className="col-span-2 text-xs text-muted">Valable jusqu’au (facultatif)<input type="date" value={launch.expiresAt} onChange={e => setLaunch(l => ({ ...l, expiresAt: e.target.value }))} className={`${INPUT} mt-1`} /></label>
          </div>
          <button type="button" onClick={createLaunch} disabled={busy || !launch.code || !launch.freeMonths} className={`${BTN} mt-3`}>Créer le code</button>
        </section>
      </div>
      {!codes ? <Spinner /> : codes.length === 0 ? <Empty text="Aucun code pour l’instant." /> : (
        <ul className="space-y-2">
          {codes.map(c => (
            <li key={c.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 ${c.active ? '' : 'opacity-50'}`}>
              <button type="button" onClick={() => copy(c.code)} title="Copier" className="font-mono text-sm text-white hover:text-accent-light">{c.code}</button>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.kind === 'FOUNDER' ? 'bg-gold/15 text-gold' : 'bg-accent/15 text-accent-light'}`}>{c.kind === 'FOUNDER' ? 'Fondateur' : `${c.freeMonths} mois offerts`}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-muted">
                {c.reservedFor ? `Réservé à ${c.reservedFor.name} · ` : c.note ? `${c.note} · ` : ''}{c.kind === 'FOUNDER' ? (c.usedCount ? 'utilisé' : 'pas encore utilisé') : `${c.usedCount}${c.maxUses ? ` / ${c.maxUses}` : ''} utilisation${c.usedCount > 1 ? 's' : ''}`}
                {c.usedBy.length > 0 ? ` (${c.usedBy.map(u => u.name).join(', ')})` : ''}
                {c.expiresAt ? ` · jusqu’au ${fmt(c.expiresAt)}` : ''}
              </span>
              <button type="button" onClick={() => toggle(c)} className={`text-xs ${c.active ? 'text-red-300 hover:text-red-200' : 'text-muted hover:text-white'}`}>{c.active ? 'Annuler le code' : 'Réactiver'}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ── Formules supplémentaires ──────────────────────────── */

type ExtraOption = { id: string; label: string; days: number | null; priceCents: number; scope: 'REGIONAL' | 'NATIONAL' | null }
type ExtraOffer = { id: number; kind: 'CAROUSEL' | 'NEWSLETTER' | 'SOCIAL' | 'OTHER'; title: string; description: string | null; options: ExtraOption[]; active: boolean; position: number }
const KIND_LABEL: Record<ExtraOffer['kind'], string> = { CAROUSEL: 'Carrousel', NEWSLETTER: 'Newsletter', SOCIAL: 'Réseaux sociaux', OTHER: 'Autre' }

function OfferEditor({ offer, onSaved }: { offer: ExtraOffer | null; onSaved: () => void }) {
  const { notify } = useFeedback()
  const [draft, setDraft] = useState<ExtraOffer>(offer || { id: 0, kind: 'OTHER', title: '', description: '', options: [{ id: '', label: '', days: null, priceCents: 1000, scope: null }], active: false, position: 10 })
  const [busy, setBusy] = useState(false)
  const setOpt = (i: number, patch: Partial<ExtraOption>) => setDraft(d => ({ ...d, options: d.options.map((o, j) => (j === i ? { ...o, ...patch } : o)) }))

  const save = async () => {
    setBusy(true)
    try {
      const body = { kind: draft.kind, title: draft.title, description: draft.description, active: draft.active, position: draft.position, options: draft.options }
      const res = offer ? await send(`admin/billing/extras/${offer.id}`, 'PUT', body) : await send('admin/billing/extras', 'POST', body)
      if (!res.ok) { notify(await apiErrorMessage(res, 'Enregistrement impossible.'), 'error'); return }
      notify('Formule enregistrée.')
      onSaved()
    } finally { setBusy(false) }
  }

  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-center gap-3">
        <select value={draft.kind} disabled={!!offer} onChange={e => setDraft(d => ({ ...d, kind: e.target.value as ExtraOffer['kind'] }))} className={`${INPUT} w-auto`}>
          {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Titre de la formule" className={`${INPUT} min-w-0 flex-1`} />
        <label className="flex items-center gap-2 text-xs text-white/70">
          <input type="checkbox" checked={draft.active} onChange={e => setDraft(d => ({ ...d, active: e.target.checked }))} /> Proposée aux membres
        </label>
      </div>
      <textarea value={draft.description || ''} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} rows={2} placeholder="Description affichée aux membres" className={`${INPUT} mt-3`} />
      <p className="mb-2 mt-4 text-xs font-semibold text-white/60">Options et prix (TTC)</p>
      <div className="space-y-2">
        {draft.options.map((o, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
            <input value={o.label} onChange={e => setOpt(i, { label: e.target.value })} placeholder="Nom (ex. Régional · 7 jours)" className={`${INPUT} col-span-2 sm:col-span-1`} />
            <select value={o.scope || ''} onChange={e => setOpt(i, { scope: (e.target.value || null) as ExtraOption['scope'] })} className={INPUT}>
              <option value="">Sans zone</option><option value="REGIONAL">Régional</option><option value="NATIONAL">National</option>
            </select>
            <input type="number" min={1} value={o.days ?? ''} onChange={e => setOpt(i, { days: e.target.value ? Number(e.target.value) : null })} placeholder="Jours" className={INPUT} />
            <input type="number" min={1} step="0.01" value={o.priceCents / 100} onChange={e => setOpt(i, { priceCents: Math.round(Number(e.target.value) * 100) })} placeholder="Prix €" className={INPUT} />
            <button type="button" onClick={() => setDraft(d => ({ ...d, options: d.options.filter((_, j) => j !== i) }))} className="text-xs text-red-300 hover:text-red-200">Retirer</button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setDraft(d => ({ ...d, options: [...d.options, { id: '', label: '', days: d.kind === 'CAROUSEL' ? 7 : null, priceCents: 1000, scope: d.kind === 'CAROUSEL' ? 'REGIONAL' : null }] }))} className={BTN2}>Ajouter une option</button>
        <button type="button" onClick={save} disabled={busy || !draft.title.trim()} className={BTN}>Enregistrer</button>
      </div>
    </section>
  )
}

export function ExtrasTab() {
  const [offers, setOffers] = useState<ExtraOffer[] | null>(null)
  const [creating, setCreating] = useState(false)
  const load = useCallback(async () => { const d = await getJson<{ offers: ExtraOffer[] }>('admin/billing/extras'); setOffers(d?.offers || []); setCreating(false) }, [])
  useEffect(() => { load() }, [load])
  if (!offers) return <Spinner />
  return (
    <div className="space-y-4">
      <p className="text-sm text-white/55">Les formules proposées sur la page « Offres et abonnements », à tous les membres (gratuits ou Pro). Fixez les prix puis cochez « Proposée aux membres » pour les ouvrir. Le carrousel a besoin d’options régionales ou nationales avec une durée.</p>
      {offers.map(o => <OfferEditor key={o.id} offer={o} onSaved={load} />)}
      {creating ? <OfferEditor offer={null} onSaved={load} /> : <button type="button" onClick={() => setCreating(true)} className={BTN2}>Nouvelle formule</button>}
    </div>
  )
}

/* ── Réglages ──────────────────────────────────────────── */

type Settings = {
  commission: { freePct: number; proPct: number }
  bookingPayment: { depositPct: number; chargeDaysBefore: number; releaseHoursAfter: number; lateCancelDays: number }
  limits: { applicationsPerMonth: number; bookingRequestsPerMonth: number; activeEvents: number; activeOffers: number; albums: number; videos: number; videoMaxSeconds: number }
  prices: Record<'ARTIST' | 'PROVIDER' | 'ORGANIZER', { monthCents: number; yearCents: number }>
  agency: { monthCents: number; yearCents: number; includedProfiles: number; extraMonthCents: number; extraYearCents: number }
  trialDays: number
  carousel: { regionalSlots: number; nationalSlots: number }
  lateCancellations: { warnAt: number; alertAt: number; windowDays: number }
}

function NumberField({ label, value, onChange, suffix, step = 1 }: { label: string; value: number; onChange: (n: number) => void; suffix?: string; step?: number }) {
  return (
    <label className="block text-xs text-white/55">
      {label}
      <span className="mt-1 flex items-center gap-2">
        <input type="number" min={0} step={step} value={Number.isFinite(value) ? value : ''} onChange={e => onChange(Number(e.target.value))} className={INPUT} />
        {suffix && <span className="shrink-0 text-muted">{suffix}</span>}
      </span>
    </label>
  )
}

export function RulesTab() {
  const { notify } = useFeedback()
  const [s, setS] = useState<Settings | null>(null)
  const [meta, setMeta] = useState<{ stripeConfigured: boolean; webhookConfigured: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    getJson<{ settings: Settings; stripeConfigured: boolean; webhookConfigured: boolean }>('admin/billing/settings').then(d => {
      if (d) { setS(d.settings); setMeta({ stripeConfigured: d.stripeConfigured, webhookConfigured: d.webhookConfigured }) }
    })
  }, [])
  if (!s) return <Spinner />
  const up = <K extends keyof Settings>(key: K, patch: Partial<Settings[K]>) => setS(prev => (prev ? { ...prev, [key]: { ...(prev[key] as object), ...patch } } : prev))
  const upPrice = (role: keyof Settings['prices'], field: 'monthCents' | 'yearCents', euros: number) =>
    setS(prev => (prev ? { ...prev, prices: { ...prev.prices, [role]: { ...prev.prices[role], [field]: Math.round(euros * 100) } } } : prev))

  const save = async () => {
    setBusy(true)
    try {
      const res = await send('admin/billing/settings', 'PUT', { settings: s })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Enregistrement impossible.'), 'error'); return }
      setS((await res.json()).settings)
      notify('Réglages enregistrés (appliqués sur le site sous une minute).')
    } finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      {meta && (!meta.stripeConfigured || !meta.webhookConfigured) && (
        <p className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-xs leading-relaxed text-white/70">
          {!meta.stripeConfigured ? 'Stripe n’est pas encore branché (clé STRIPE_SECRET_KEY absente sur Railway) : les boutons de paiement sont désactivés.' : 'Clé Stripe présente, mais le secret des messages Stripe (STRIPE_WEBHOOK_SECRET) manque sur Railway : les paiements ne seraient pas confirmés.'}
        </p>
      )}
      <section className={CARD}>
        <p className="mb-3 text-sm font-semibold">Commission sur les bookings payés en ligne</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label="Compte gratuit" value={s.commission.freePct} onChange={n => up('commission', { freePct: n })} suffix="%" step={0.5} />
          <NumberField label="Compte Pro" value={s.commission.proPct} onChange={n => up('commission', { proPct: n })} suffix="%" step={0.5} />
        </div>
        <p className="mt-2 text-[11px] text-muted">Retirée de ce que touche l’artiste ou le prestataire, au taux de son compte au moment du paiement.</p>
      </section>
      <section className={CARD}>
        <p className="mb-3 text-sm font-semibold">Paiement des bookings</p>
        <div className="grid gap-3 sm:grid-cols-4">
          <NumberField label="Part acquise dès le paiement" value={s.bookingPayment.depositPct} onChange={n => up('bookingPayment', { depositPct: n })} suffix="%" />
          <NumberField label="Débit avant la date" value={s.bookingPayment.chargeDaysBefore} onChange={n => up('bookingPayment', { chargeDaysBefore: n })} suffix="jours" />
          <NumberField label="Versement après la prestation" value={s.bookingPayment.releaseHoursAfter} onChange={n => up('bookingPayment', { releaseHoursAfter: n })} suffix="h" />
          <NumberField label="Annulation tardive à moins de" value={s.bookingPayment.lateCancelDays} onChange={n => up('bookingPayment', { lateCancelDays: n })} suffix="jours" />
        </div>
      </section>
      <section className={CARD}>
        <p className="mb-3 text-sm font-semibold">Limites du compte gratuit</p>
        <div className="grid gap-3 sm:grid-cols-4">
          <NumberField label="Candidatures par mois" value={s.limits.applicationsPerMonth} onChange={n => up('limits', { applicationsPerMonth: n })} />
          <NumberField label="Demandes de booking par mois" value={s.limits.bookingRequestsPerMonth} onChange={n => up('limits', { bookingRequestsPerMonth: n })} />
          <NumberField label="Événements en même temps" value={s.limits.activeEvents} onChange={n => up('limits', { activeEvents: n })} />
          <NumberField label="Offres publiées en même temps" value={s.limits.activeOffers} onChange={n => up('limits', { activeOffers: n })} />
          <NumberField label="Albums" value={s.limits.albums} onChange={n => up('limits', { albums: n })} />
          <NumberField label="Vidéos" value={s.limits.videos} onChange={n => up('limits', { videos: n })} />
          <NumberField label="Durée max d’une vidéo" value={s.limits.videoMaxSeconds} onChange={n => up('limits', { videoMaxSeconds: n })} suffix="s" />
        </div>
      </section>
      <section className={CARD}>
        <p className="mb-3 text-sm font-semibold">Prix de la version Pro (TTC)</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {(['ARTIST', 'PROVIDER', 'ORGANIZER'] as const).map(role => (
            <div key={role} className="space-y-2">
              <p className="text-xs text-white/70">{ROLE_LABEL[role]}</p>
              <NumberField label="Par mois" value={s.prices[role].monthCents / 100} onChange={n => upPrice(role, 'monthCents', n)} suffix="€" step={0.01} />
              <NumberField label="Par an" value={s.prices[role].yearCents / 100} onChange={n => upPrice(role, 'yearCents', n)} suffix="€" step={0.01} />
            </div>
          ))}
        </div>
        <div className="mt-3 max-w-xs"><NumberField label="Essai offert à tous (0 = aucun)" value={s.trialDays} onChange={n => setS(p => (p ? { ...p, trialDays: n } : p))} suffix="jours" /></div>
        <p className="mt-2 text-[11px] text-muted">Un nouveau prix s’applique aux nouveaux abonnements ; les abonnés en cours gardent le leur.</p>
      </section>
      <section className={CARD}>
        <p className="mb-3 text-sm font-semibold">Formule Business (TTC)</p>
        <div className="grid gap-3 sm:grid-cols-5">
          <NumberField label="Par mois" value={s.agency.monthCents / 100} onChange={n => up('agency', { monthCents: Math.round(n * 100) })} suffix="€" step={0.01} />
          <NumberField label="Par an" value={s.agency.yearCents / 100} onChange={n => up('agency', { yearCents: Math.round(n * 100) })} suffix="€" step={0.01} />
          <NumberField label="Profils gérés inclus" value={s.agency.includedProfiles} onChange={n => up('agency', { includedProfiles: n })} />
          <NumberField label="Profil en plus, par mois" value={s.agency.extraMonthCents / 100} onChange={n => up('agency', { extraMonthCents: Math.round(n * 100) })} suffix="€" step={0.01} />
          <NumberField label="Profil en plus, par an" value={s.agency.extraYearCents / 100} onChange={n => up('agency', { extraYearCents: Math.round(n * 100) })} suffix="€" step={0.01} />
        </div>
        <p className="mt-2 text-[11px] text-muted">La formule Business comprend le Pro pour le compte qui l’achète et pour chaque profil géré. Un profil en plus est facturé au prorata et retiré dès qu’une place se libère.</p>
      </section>
      <section className={CARD}>
        <p className="mb-3 text-sm font-semibold">Carrousel et annulations</p>
        <div className="grid gap-3 sm:grid-cols-5">
          <NumberField label="Places par région" value={s.carousel.regionalSlots} onChange={n => up('carousel', { regionalSlots: n })} />
          <NumberField label="Places nationales" value={s.carousel.nationalSlots} onChange={n => up('carousel', { nationalSlots: n })} />
          <NumberField label="Avertissement à" value={s.lateCancellations.warnAt} onChange={n => up('lateCancellations', { warnAt: n })} suffix="annul." />
          <NumberField label="Alerte admin à" value={s.lateCancellations.alertAt} onChange={n => up('lateCancellations', { alertAt: n })} suffix="annul." />
          <NumberField label="Sur une période de" value={s.lateCancellations.windowDays} onChange={n => up('lateCancellations', { windowDays: n })} suffix="jours" />
        </div>
      </section>
      <button type="button" onClick={save} disabled={busy} className={BTN}>Enregistrer les réglages</button>
    </div>
  )
}

