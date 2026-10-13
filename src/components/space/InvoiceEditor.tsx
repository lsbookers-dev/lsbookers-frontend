'use client'

/** Création / modification d'un devis ou d'une facture (brouillon). */

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { apiErrorMessage } from '@/components/ui/Feedback'
import { euro } from './ui'

export type InvoiceKind = 'QUOTE' | 'INVOICE'
export type InvoiceLine = { label: string; quantity: number; unitPrice: number }
export type Invoice = {
  id: number
  kind: InvoiceKind
  number: string
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'PAID' | 'CANCELLED'
  clientProfileId: number | null
  clientName: string
  clientAddress: string | null
  bookingId: number | null
  title: string | null
  serviceDate: string | null
  issueDate: string
  dueDate: string | null
  items: InvoiceLine[]
  vatRate: number
  notes: string | null
  totals: { ht: number; vat: number; ttc: number }
  issuer: { name: string; legalName: string | null; establishmentName: string | null; siret: string | null; address: string | null } | null
  client: { profileId: number; userId: number | null; name: string } | null
}

/** Prestation proposée pour pré-remplir le document. */
export type BookingSource = { bookingId: number | null; date: string; title: string; amount: number; counterpart: { profileId: number; name: string } | null }

const INPUT = 'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-accent/50 focus:outline-none'
const day = (value?: string | null) => (value ? String(value).slice(0, 10) : '')
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)

export default function InvoiceEditor({ kind, invoice, sources, onClose, onSaved }: {
  kind: InvoiceKind
  invoice?: Invoice | null
  sources: BookingSource[]
  onClose: () => void
  onSaved: (invoice: Invoice) => void
}) {
  const [clientProfileId, setClientProfileId] = useState<number | null>(invoice?.clientProfileId ?? null)
  const [bookingId, setBookingId] = useState<number | null>(invoice?.bookingId ?? null)
  const [clientName, setClientName] = useState(invoice?.clientName ?? '')
  const [clientAddress, setClientAddress] = useState(invoice?.clientAddress ?? '')
  const [title, setTitle] = useState(invoice?.title ?? '')
  const [serviceDate, setServiceDate] = useState(day(invoice?.serviceDate))
  const [dueDate, setDueDate] = useState(day(invoice?.dueDate) || (kind === 'INVOICE' ? inDays(30) : ''))
  const [items, setItems] = useState<InvoiceLine[]>(invoice?.items?.length ? invoice.items : [{ label: '', quantity: 1, unitPrice: 0 }])
  const [vatRate, setVatRate] = useState(invoice?.vatRate ?? 0)
  const [notes, setNotes] = useState(invoice?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const ht = useMemo(() => items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0), [items])
  const ttc = ht + (ht * vatRate) / 100

  const fromBooking = (key: string) => {
    const source = sources.find(s => `${s.bookingId ?? ''}|${s.date}` === key)
    if (!source) return
    setBookingId(source.bookingId)
    setClientProfileId(source.counterpart?.profileId ?? null)
    setClientName(source.counterpart?.name ?? '')
    setTitle(source.title)
    setServiceDate(day(source.date))
    setItems([{ label: `Prestation — ${source.title}`, quantity: 1, unitPrice: source.amount || 0 }])
  }

  const setItem = (index: number, patch: Partial<InvoiceLine>) =>
    setItems(list => list.map((item, i) => (i === index ? { ...item, ...patch } : item)))

  const save = async () => {
    setError(null)
    if (!clientName.trim()) return setError('Indiquez le nom du client.')
    const lines = items.filter(i => i.label.trim())
    if (!lines.length) return setError('Ajoutez au moins une ligne.')
    setSaving(true)
    try {
      const res = await apiFetch(apiUrl(invoice ? `invoices/${invoice.id}` : 'invoices'), {
        method: invoice ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          clientProfileId,
          clientName: clientName.trim(),
          clientAddress: clientAddress.trim() || null,
          bookingId,
          title: title.trim() || null,
          serviceDate: serviceDate || null,
          dueDate: kind === 'INVOICE' ? dueDate || null : null,
          items: lines.map(l => ({ label: l.label.trim(), quantity: Number(l.quantity) || 0, unitPrice: Number(l.unitPrice) || 0 })),
          vatRate,
          notes: notes.trim() || null,
        }),
      })
      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Impossible d’enregistrer le document.'))
      onSaved((await res.json()).invoice)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’enregistrer le document.')
    } finally {
      setSaving(false)
    }
  }

  const label = kind === 'QUOTE' ? 'devis' : 'facture'

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-label={invoice ? `Modifier ${invoice.number}` : `Nouveau ${label}`} className="flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden border-white/10 bg-[#0d0c12] text-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-2xl sm:border">
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[.18em] text-violet-300/80">{kind === 'QUOTE' ? 'Devis' : 'Facture'}</span>
            <h2 className="text-lg font-semibold">{invoice ? `Modifier ${invoice.number}` : kind === 'QUOTE' ? 'Nouveau devis' : 'Nouvelle facture'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="grid h-10 w-10 place-items-center rounded-xl text-white/50 hover:bg-white/5 hover:text-white"><X size={18} /></button>
        </header>

        <div className="grid gap-4 overflow-y-auto p-5">
          {!invoice && sources.length > 0 && (
            <label className="grid gap-1.5">
              <span className="text-sm text-white/70">Partir d’un booking <span className="text-white/35">(facultatif)</span></span>
              <select defaultValue="" onChange={e => fromBooking(e.target.value)} className={`${INPUT} [color-scheme:dark]`}>
                <option value="">Choisir une prestation…</option>
                {sources.map(s => (
                  <option key={`${s.bookingId ?? ''}|${s.date}`} value={`${s.bookingId ?? ''}|${s.date}`}>
                    {new Date(s.date).toLocaleDateString('fr-FR')} · {s.counterpart?.name || 'Client'} · {s.title}{s.amount ? ` · ${euro(s.amount)}` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5"><span className="text-sm text-white/70">Client</span>
              <input value={clientName} onChange={e => { setClientName(e.target.value); setClientProfileId(null) }} maxLength={200} placeholder="Nom ou établissement" className={INPUT} />
            </label>
            <label className="grid gap-1.5"><span className="text-sm text-white/70">Adresse du client <span className="text-white/35">(facultatif)</span></span>
              <input value={clientAddress} onChange={e => setClientAddress(e.target.value)} maxLength={300} placeholder="Rue, code postal, ville" className={INPUT} />
            </label>
            <label className="grid gap-1.5 sm:col-span-2"><span className="text-sm text-white/70">Objet</span>
              <input value={title} onChange={e => setTitle(e.target.value)} maxLength={200} placeholder="Ex : DJ set — Soirée de Noël" className={INPUT} />
            </label>
            <label className="grid gap-1.5"><span className="text-sm text-white/70">Date de la prestation</span>
              <input type="date" value={serviceDate} onChange={e => setServiceDate(e.target.value)} className={`${INPUT} [color-scheme:dark]`} />
            </label>
            {kind === 'INVOICE' && (
              <label className="grid gap-1.5"><span className="text-sm text-white/70">Échéance de paiement</span>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={`${INPUT} [color-scheme:dark]`} />
              </label>
            )}
          </div>

          <div className="grid gap-2">
            <span className="text-sm text-white/70">Lignes</span>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-[minmax(0,1fr)_4.5rem_6.5rem_auto] items-center gap-2">
                <input value={item.label} onChange={e => setItem(index, { label: e.target.value })} maxLength={200} placeholder="Désignation" aria-label="Désignation" className={INPUT} />
                <input type="number" min="0" step="1" value={item.quantity} onChange={e => setItem(index, { quantity: Number(e.target.value) })} aria-label="Quantité" className={INPUT} />
                <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => setItem(index, { unitPrice: Number(e.target.value) })} aria-label="Prix unitaire HT" className={INPUT} />
                <button type="button" onClick={() => setItems(list => (list.length > 1 ? list.filter((_, i) => i !== index) : list))} aria-label="Retirer la ligne" className="px-1 text-white/35 hover:text-red-300"><X size={16} /></button>
              </div>
            ))}
            <button type="button" onClick={() => setItems(list => [...list, { label: '', quantity: 1, unitPrice: 0 }])} className="justify-self-start text-xs font-semibold text-accent-light hover:underline">+ Ajouter une ligne</button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5"><span className="text-sm text-white/70">TVA</span>
              <select value={vatRate} onChange={e => setVatRate(Number(e.target.value))} className={`${INPUT} [color-scheme:dark]`}>
                <option value={0}>Non applicable (micro-entreprise, art. 293 B du CGI)</option>
                <option value={20}>20 %</option>
                <option value={10}>10 %</option>
                <option value={5.5}>5,5 %</option>
              </select>
            </label>
            <div className="grid content-end gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
              <div className="flex justify-between text-white/60"><span>Total HT</span><span className="tabular-nums">{euro(ht)}</span></div>
              {vatRate > 0 && <div className="flex justify-between text-white/60"><span>TVA {vatRate} %</span><span className="tabular-nums">{euro((ht * vatRate) / 100)}</span></div>}
              <div className="flex justify-between font-semibold text-gold-light"><span>{kind === 'QUOTE' ? 'Total TTC' : 'Net à payer'}</span><span className="tabular-nums">{euro(ttc)}</span></div>
            </div>
          </div>

          <label className="grid gap-1.5"><span className="text-sm text-white/70">Notes <span className="text-white/35">(conditions, RIB, acompte…)</span></span>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={2000} rows={3} className={`${INPUT} resize-none`} />
          </label>
        </div>

        <footer className="border-t border-white/[0.08] px-5 py-3">
          {error && <p className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm text-white/55 hover:text-white">Annuler</button>
            <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-50">
              {saving ? 'Enregistrement…' : 'Enregistrer le brouillon'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}
