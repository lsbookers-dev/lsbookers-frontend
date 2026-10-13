'use client'

/**
 * Checklist facultative d'un événement (organisateur ou personne bookée).
 * Chacun a la sienne ; rappels automatiques à J-7 et J-1 s'il reste des éléments.
 */

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import LsIcon from '@/components/ui/LsIcon'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'

type Item = { id: number; label: string; done: boolean }
type Checklist = { id: number; items: Item[] }

export default function EventChecklist({ eventId, compact = false }: { eventId: number; compact?: boolean }) {
  const { notify, confirm } = useFeedback()
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [newLabel, setNewLabel] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(apiUrl(`events/${eventId}/checklist`), { cache: 'no-store' })
      if (res.ok) setChecklist((await res.json()).checklist)
    } catch { /* l'onglet reste vide */ }
    finally { setLoading(false) }
  }, [eventId])

  useEffect(() => { load() }, [load])

  const call = async (path: string, init: RequestInit, fallback: string) => {
    const res = await apiFetch(apiUrl(`events/${eventId}/checklist${path}`), init)
    if (!res.ok) { notify(await apiErrorMessage(res, fallback), 'error'); return null }
    return res.json()
  }

  const create = async () => {
    setBusy(true)
    const data = await call('', { method: 'POST' }, 'Impossible d’ajouter la checklist.')
    if (data) setChecklist(data.checklist)
    setBusy(false)
  }

  const remove = async () => {
    if (!(await confirm({ title: 'Retirer la checklist ?', message: 'Les éléments cochés et vos rappels seront supprimés.', danger: true, confirmLabel: 'Retirer' }))) return
    if (await call('', { method: 'DELETE' }, 'Impossible de retirer la checklist.')) setChecklist(null)
  }

  const toggle = async (item: Item) => {
    setChecklist(c => c && { ...c, items: c.items.map(i => i.id === item.id ? { ...i, done: !i.done } : i) })
    const ok = await call(`/items/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ done: !item.done }) }, 'Impossible d’enregistrer.')
    if (!ok) setChecklist(c => c && { ...c, items: c.items.map(i => i.id === item.id ? { ...i, done: item.done } : i) })
  }

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    const label = newLabel.trim()
    if (!label) return
    const data = await call('/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label }) }, 'Impossible d’ajouter cet élément.')
    if (data) { setChecklist(c => c && { ...c, items: [...c.items, data.item] }); setNewLabel('') }
  }

  const removeItem = async (item: Item) => {
    if (await call(`/items/${item.id}`, { method: 'DELETE' }, 'Impossible de supprimer cet élément.')) {
      setChecklist(c => c && { ...c, items: c.items.filter(i => i.id !== item.id) })
    }
  }

  if (loading) return <p className="py-6 text-center text-xs text-white/40">Chargement…</p>

  if (!checklist) {
    if (compact) return null
    return (
      <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center">
        <LsIcon name="booking" size={28} />
        <div>
          <p className="text-sm font-medium text-white/80">Pas de checklist pour cet événement</p>
          <p className="mt-1 max-w-sm text-xs text-white/45">Ajoutez-en une pour suivre contrat, acompte, transport… Vous recevrez un rappel à J-7 et J-1 s&apos;il reste des choses à faire.</p>
        </div>
        <button type="button" onClick={create} disabled={busy} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-50">
          {busy ? 'Ajout…' : 'Ajouter une checklist'}
        </button>
      </div>
    )
  }

  const done = checklist.items.filter(i => i.done).length
  const total = checklist.items.length

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-white/80">{done}/{total} terminé{done > 1 ? 's' : ''}</span>
        {!compact && <button type="button" onClick={remove} className="text-xs text-white/40 transition hover:text-red-300">Retirer la checklist</button>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-accent to-gold transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>
      <ul className="grid gap-1">
        {checklist.items.map(item => (
          <li key={item.id} className="group flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-white/[0.03]">
            <button type="button" onClick={() => toggle(item)} aria-pressed={item.done} aria-label={item.done ? `Décocher ${item.label}` : `Cocher ${item.label}`} className="shrink-0">
              {item.done
                ? <LsIcon name="check" size={18} tone="ok" />
                : <span className="block h-[18px] w-[18px] rounded-full border-[1.7px] border-gold/70" />}
            </button>
            <span className={`flex-1 text-sm ${item.done ? 'text-white/40 line-through' : 'text-white/80'}`}>{item.label}</span>
            {!compact && (
              <button type="button" onClick={() => removeItem(item)} aria-label={`Supprimer ${item.label}`} className="opacity-0 transition group-hover:opacity-100 focus:opacity-100">
                <LsIcon name="close" size={15} tone="muted" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {!compact && (
        <form onSubmit={add} className="flex gap-2">
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)} maxLength={120} placeholder="Ajouter un élément…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent/50 focus:outline-none" />
          <button type="submit" disabled={!newLabel.trim()} className="rounded-xl border border-white/10 px-3 text-sm text-white/70 transition hover:text-white disabled:opacity-40">Ajouter</button>
        </form>
      )}
    </div>
  )
}
