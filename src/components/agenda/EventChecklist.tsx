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
type RemindMode = 'NONE' | 'J7_J1' | 'J1' | 'J7' | 'CUSTOM'
type Checklist = { id: number; items: Item[]; remindMode?: RemindMode; remindAt?: string | null }

// Rappel choisi par l'utilisateur (16/11/2026)
const REMIND_OPTIONS: { value: RemindMode; label: string }[] = [
  { value: 'J7_J1', label: 'Une semaine avant et la veille' },
  { value: 'J1', label: 'La veille seulement' },
  { value: 'J7', label: 'Une semaine avant seulement' },
  { value: 'CUSTOM', label: 'À une date choisie' },
  { value: 'NONE', label: 'Aucun rappel' },
]
// Valeur d'un champ date-heure local à partir d'une date ISO
const localInput = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso); const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function ReminderPicker({ mode, at, onChange, disabled }: { mode: RemindMode; at: string; onChange: (mode: RemindMode, at: string) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
      <label htmlFor="checklist-reminder" className="flex items-center gap-1.5"><LsIcon name="bell" size={14} tone="muted" />Rappel</label>
      <select id="checklist-reminder" value={mode} disabled={disabled} onChange={e => onChange(e.target.value as RemindMode, at)}
        className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/85 outline-none focus:border-accent/50">
        {REMIND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {mode === 'CUSTOM' && (
        <input type="datetime-local" value={at} disabled={disabled} onChange={e => onChange(mode, e.target.value)} aria-label="Date et heure du rappel"
          className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/85 outline-none focus:border-accent/50" />
      )}
    </div>
  )
}

export default function EventChecklist({ eventId, compact = false }: { eventId: number; compact?: boolean }) {
  const { notify, confirm } = useFeedback()
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  // Rappel choisi avant de créer la checklist
  const [draftMode, setDraftMode] = useState<RemindMode>('J7_J1')
  const [draftAt, setDraftAt] = useState('')

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

  const reminderBody = (mode: RemindMode, at: string) => JSON.stringify({ remindMode: mode, remindAt: mode === 'CUSTOM' && at ? new Date(at).toISOString() : undefined })

  const create = async () => {
    if (draftMode === 'CUSTOM' && !draftAt) { notify('Choisissez la date et l’heure du rappel.', 'error'); return }
    setBusy(true)
    const data = await call('', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: reminderBody(draftMode, draftAt) }, 'Impossible d’ajouter la checklist.')
    if (data) setChecklist(data.checklist)
    setBusy(false)
  }

  // Changer le rappel d'une checklist existante (une date choisie s'enregistre une fois remplie)
  const changeReminder = async (mode: RemindMode, at: string) => {
    if (!checklist) return
    setChecklist({ ...checklist, remindMode: mode, remindAt: mode === 'CUSTOM' && at ? new Date(at).toISOString() : null })
    if (mode === 'CUSTOM' && !at) return
    const data = await call('/reminder', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: reminderBody(mode, at) }, 'Impossible de changer le rappel.')
    if (data) { setChecklist(data.checklist); notify(mode === 'NONE' ? 'Aucun rappel pour cette checklist.' : 'Rappel enregistré.') }
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
          <p className="mt-1 max-w-sm text-xs text-white/45">Ajoutez-en une pour suivre contrat, acompte, transport… Choisissez si vous voulez un rappel tant qu&apos;il reste des choses à faire.</p>
        </div>
        <ReminderPicker mode={draftMode} at={draftAt} onChange={(m, a) => { setDraftMode(m); setDraftAt(a) }} />
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
      {!compact && <ReminderPicker mode={checklist.remindMode || 'J7_J1'} at={localInput(checklist.remindAt)} onChange={changeReminder} />}
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
