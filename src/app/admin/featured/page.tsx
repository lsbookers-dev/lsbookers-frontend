'use client'

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Loader2, Plus, Search, Trash2 } from 'lucide-react'
import { apiFetch } from '@/utils/auth'
import Link from 'next/link'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

type Featured = {
  id: number
  position: number
  endsAt: string | null
  note: string | null
  createdAt: string
  active: boolean
  startsAt: string | null
  scope: 'ADMIN' | 'REGIONAL' | 'NATIONAL'
  regionName: string | null
  orderId: number | null
  user: { id: number; name: string; email: string; role: string; avatar: string | null }
}

type FoundUser = {
  id: number
  pseudo: string | null
  firstName: string | null
  lastName: string | null
  email: string
  role: string
  profile: { avatar: string | null } | null
}

const ROLE_LABEL: Record<string, string> = { ARTIST: 'Artiste', ORGANIZER: 'Organisateur', PROVIDER: 'Prestataire' }
const userName = (u: FoundUser) => u.pseudo || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email
// Date du champ « Fin » en heure locale (AAAA-MM-JJ), comme celle affichée dans la liste
const toInputDate = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const fromInputDate = (value: string) => (value ? new Date(`${value}T23:59:59`).toISOString() : null)

export default function AdminFeaturedPage() {
  const { notify, confirm } = useFeedback()
  const [items, setItems]       = useState<Featured[]>([])
  const [loading, setLoading]   = useState(true)
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<FoundUser[]>([])
  const [searching, setSearching] = useState(false)
  const [endsAt, setEndsAt]     = useState('')
  const [note, setNote]         = useState('')
  const [busy, setBusy]         = useState(false)
  const [pendingOrders, setPendingOrders] = useState(0)

  // Mises en avant payées en attente de validation (notification de la partie Carrousel)
  useEffect(() => {
    apiFetch(`${API_BASE}/api/admin/billing/orders/pending-count`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null)).then(d => setPendingOrders(d?.carousel || 0)).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/featured`, { cache: 'no-store' })
      if (!res.ok) throw new Error()
      setItems((await res.json()).featured || [])
    } catch {
      notify('Impossible de charger le carrousel.', 'error')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => { void load() }, [load])

  // Recherche d'un membre à ajouter (pseudo, nom ou e-mail)
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await apiFetch(`${API_BASE}/api/admin/users?q=${encodeURIComponent(q)}&limit=8`)
        const data = res.ok ? await res.json() : null
        setResults((data?.users || []).filter((u: FoundUser) => ROLE_LABEL[u.role]))
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const add = async (u: FoundUser) => {
    setBusy(true)
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/featured`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: u.id, endsAt: fromInputDate(endsAt), note: note.trim() || null }),
      })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Ajout impossible.'), 'error'); return }
      const { featured } = await res.json()
      setItems(prev => [...prev, featured])
      setQuery(''); setResults([]); setEndsAt(''); setNote('')
      notify(`${userName(u)} ajouté au carrousel.`)
    } finally {
      setBusy(false)
    }
  }

  const update = async (item: Featured, patch: { endsAt?: string | null; note?: string | null }) => {
    const res = await apiFetch(`${API_BASE}/api/admin/featured/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) { notify('Modification impossible.', 'error'); return }
    const { featured } = await res.json()
    setItems(prev => prev.map(i => (i.id === item.id ? featured : i)))
    notify('Modification enregistrée.')
  }

  const remove = async (item: Featured) => {
    if (!(await confirm({ title: `Retirer ${item.user.name} du carrousel ?`, confirmLabel: 'Retirer', danger: true }))) return
    const res = await apiFetch(`${API_BASE}/api/admin/featured/${item.id}`, { method: 'DELETE' })
    if (!res.ok) { notify('Suppression impossible.', 'error'); return }
    setItems(prev => prev.filter(i => i.id !== item.id))
  }

  const move = async (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
    const res = await apiFetch(`${API_BASE}/api/admin/featured/order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: next.map(i => i.id) }),
    })
    if (!res.ok) { notify('Nouvel ordre non enregistré.', 'error'); void load() }
  }

  const activeCount = items.filter(i => i.active).length

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-white">
      <h2 className="mb-2 text-2xl font-bold">Carrousel de l&apos;accueil</h2>
      <p className="mb-8 text-sm text-white/50">
        Les profils offerts ajoutés ici défilent en haut de l&apos;accueil pour tous les membres, en plus des places payantes
        (12 par région, 10 au national). Les mises en avant payées apparaissent aussi dans cette liste une fois validées.
        À la date de fin, elles disparaissent toutes seules. Tant que la liste est vide, l&apos;accueil montre les profils les plus suivis.
      </p>

      {pendingOrders > 0 && (
        <Link href="/admin/subscriptions?tab=orders" className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-gold/10 px-5 py-4 transition hover:bg-gold/15">
          <span>
            <span className="block text-sm font-semibold text-white">{pendingOrders} mise{pendingOrders > 1 ? 's' : ''} en avant payée{pendingOrders > 1 ? 's' : ''} à valider</span>
            <span className="block text-xs text-white/55">Vérifiez le profil, ajustez la durée et validez : il apparaît alors dans le carrousel de sa région ou partout en France.</span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-gold">Valider →</span>
        </Link>
      )}

      {/* ── Ajouter un profil ─────────────────────────────── */}
      <section className="mb-8 space-y-4 rounded-2xl border border-white/10 bg-white/3 p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold"><Plus className="h-5 w-5 text-accent-light" /> Ajouter un profil</h3>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Pseudo, nom ou e-mail du membre…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/25 focus:border-accent/40 focus:outline-none"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Fin de la mise en avant (facultatif)</span>
            <input type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white [color-scheme:dark] focus:border-accent/40 focus:outline-none" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Note interne (facultatif)</span>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ex. payé le 16/10, 7 jours" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-accent/40 focus:outline-none" />
          </label>
        </div>

        {searching && <p className="flex items-center gap-2 text-xs text-white/40"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Recherche…</p>}
        {results.length > 0 && (
          <ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10">
            {results.map(u => {
              const already = items.some(i => i.user.id === u.id && i.scope === 'ADMIN')
              return (
                <li key={u.id} className="flex items-center gap-3 px-3 py-2.5">
                  {u.profile?.avatar
                    ? <img src={u.profile.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                    : <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-xs text-white/40">{userName(u)[0]?.toUpperCase()}</span>}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{userName(u)}</span>
                    <span className="block truncate text-xs text-white/40">{ROLE_LABEL[u.role]} · {u.email}</span>
                  </span>
                  <button
                    type="button"
                    disabled={already || busy}
                    onClick={() => add(u)}
                    className="rounded-lg bg-accent-strong/80 px-3 py-1.5 text-xs text-white transition hover:bg-accent disabled:bg-white/5 disabled:text-white/30"
                  >
                    {already ? 'Déjà ajouté' : 'Ajouter'}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ── Liste ─────────────────────────────────────────── */}
      <h3 className="mb-3 text-sm font-semibold text-white/70">
        Dans le carrousel ({activeCount} visible{activeCount > 1 ? 's' : ''})
      </h3>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-white/35">Aucun profil choisi pour l&apos;instant.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={item.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border p-3 ${item.active ? 'border-white/10 bg-white/3' : 'border-white/5 bg-white/[0.015] opacity-60'}`}>
              <div className="flex flex-col">
                <button type="button" aria-label="Monter" disabled={index === 0} onClick={() => move(index, -1)} className="rounded p-0.5 text-white/40 hover:text-white disabled:opacity-20"><ArrowUp size={14} /></button>
                <button type="button" aria-label="Descendre" disabled={index === items.length - 1} onClick={() => move(index, 1)} className="rounded p-0.5 text-white/40 hover:text-white disabled:opacity-20"><ArrowDown size={14} /></button>
              </div>
              {item.user.avatar
                ? <img src={item.user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                : <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-xs text-white/40">{item.user.name[0]?.toUpperCase()}</span>}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {item.user.name} <span className="font-normal text-white/40">· {ROLE_LABEL[item.user.role] ?? item.user.role}</span>
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.scope === 'ADMIN' ? 'bg-white/10 text-white/60' : 'bg-gold/15 text-gold'}`}>
                    {item.scope === 'ADMIN' ? 'Offert · partout' : item.scope === 'NATIONAL' ? 'Payé · national' : `Payé · ${item.regionName || 'régional'}`}
                  </span>
                </p>
                <p className="truncate text-xs text-white/40">
                  {item.startsAt && new Date(item.startsAt) > new Date()
                    ? `À partir du ${new Date(item.startsAt).toLocaleDateString('fr-FR')}${item.endsAt ? ` jusqu'au ${new Date(item.endsAt).toLocaleDateString('fr-FR')}` : ''}`
                    : item.active ? (item.endsAt ? `Jusqu'au ${new Date(item.endsAt).toLocaleDateString('fr-FR')}` : 'Sans date de fin') : 'Mise en avant terminée'}
                  {item.note ? ` · ${item.note}` : ''}
                </p>
              </div>
              <input
                type="date"
                aria-label="Date de fin"
                defaultValue={toInputDate(item.endsAt)}
                onBlur={e => { if (e.target.value !== toInputDate(item.endsAt)) void update(item, { endsAt: fromInputDate(e.target.value) }) }}
                className="w-36 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white [color-scheme:dark] focus:border-accent/40 focus:outline-none"
              />
              <button type="button" aria-label="Retirer du carrousel" onClick={() => remove(item)} className="rounded-lg p-2 text-white/35 transition hover:bg-red-500/10 hover:text-red-300"><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
