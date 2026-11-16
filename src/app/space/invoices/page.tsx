'use client'

/**
 * Mon espace › Devis (16/11/2026, décision d'Antho) :
 * - organisateur : les devis reçus (envoyés depuis ses offres) + ceux qu'il dépose lui-même
 * - artiste / prestataire : les devis envoyés depuis les offres + ceux qu'il dépose lui-même
 * LS Bookers n'édite plus de devis ni de factures à son logo : on garde seulement les documents.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { uploadToStorage } from '@/utils/directUpload'
import LsIcon from '@/components/ui/LsIcon'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'
import { euro } from '@/components/space/ui'

type Direction = 'SENT' | 'RECEIVED' | 'UPLOADED'
type Quote = {
  id: number; direction: Direction; title: string; fileUrl: string; fileName: string | null; amount: number | null; offerId: number | null; createdAt: string
  counterpart: { name: string; userId?: number; avatar?: string | null; role?: string } | null
}

const LABEL: Record<Direction, string> = { SENT: 'Envoyé', RECEIVED: 'Reçu', UPLOADED: 'Ajouté par vous' }
const MAX_PDF = 10 * 1024 * 1024

export default function QuotesPage() {
  const { user } = useAuth()
  const { notify, confirm } = useFeedback()
  const organizer = user?.role === 'ORGANIZER'
  // Organisateur : devis reçus ; artiste / prestataire : devis envoyés
  const mainDirection: Direction = organizer ? 'RECEIVED' : 'SENT'
  const [quotes, setQuotes] = useState<Quote[] | null>(null)
  const [filter, setFilter] = useState<'all' | Direction>('all')
  const [showUpload, setShowUpload] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [counterpart, setCounterpart] = useState('')
  const [amount, setAmount] = useState('')
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const res = await apiFetch(apiUrl('quotes'), { cache: 'no-store' }).catch(() => null)
    setQuotes(res?.ok ? ((await res.json()).quotes ?? []) : [])
  }, [])
  useEffect(() => { load() }, [load])

  const upload = async () => {
    if (!file) { notify('Choisissez un PDF.', 'error'); return }
    setSending(true)
    try {
      const up = await uploadToStorage(file, { folder: 'documents' })
      if (!up.ok) { notify(await apiErrorMessage(up, 'Le PDF n’a pas pu être envoyé.'), 'error'); return }
      const { url } = await up.json()
      const res = await apiFetch(apiUrl('quotes/upload'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: url, fileName: file.name, title: title.trim() || file.name.replace(/\.pdf$/i, ''), counterpartName: counterpart.trim() || undefined, amount: amount ? Number(amount.replace(',', '.')) : undefined }),
      })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Le devis n’a pas pu être ajouté.'), 'error'); return }
      notify('Devis ajouté.')
      setFile(null); setTitle(''); setCounterpart(''); setAmount(''); setShowUpload(false)
      load()
    } finally { setSending(false) }
  }

  const remove = async (q: Quote) => {
    if (!(await confirm({ title: 'Retirer ce devis ?', message: q.title, danger: true, confirmLabel: 'Retirer' }))) return
    const res = await apiFetch(apiUrl(`quotes/${q.id}`), { method: 'DELETE' }).catch(() => null)
    if (!res?.ok) { notify('Impossible de retirer ce devis.', 'error'); return }
    setQuotes(list => (list || []).filter(x => x.id !== q.id))
  }

  const FILTERS: { key: 'all' | Direction; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: mainDirection, label: organizer ? 'Reçus' : 'Envoyés' },
    { key: 'UPLOADED', label: 'Ajoutés par vous' },
  ]
  const shown = (quotes || []).filter(q => filter === 'all' || q.direction === filter)

  return (
    <div className="lsb-page grid max-w-4xl gap-4">
      <Link href="/space" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white"><ArrowLeft size={15} /> Mon espace</Link>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[.2em] text-violet-400">Finances</span>
          <h1 className="mt-1 text-[clamp(1.7rem,3.6vw,2.3rem)] font-semibold">Devis</h1>
          <p className="mt-1 text-sm text-muted">
            {organizer ? 'Les devis reçus pour vos offres, et ceux que vous ajoutez vous-même.' : 'Les devis envoyés depuis les offres, et ceux que vous ajoutez vous-même.'}
          </p>
        </div>
        <button type="button" onClick={() => setShowUpload(v => !v)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong">
          <LsIcon name="plus" size={16} tone="inherit" />Ajouter un devis
        </button>
      </header>

      {showUpload && (
        <section className="grid gap-3 rounded-2xl border border-line bg-surface p-4">
          <p className="text-sm font-semibold text-white">Ajouter un devis en PDF</p>
          <button type="button" onClick={() => fileRef.current?.click()} className="rounded-xl border border-dashed border-white/15 px-4 py-5 text-sm text-white/70 transition hover:border-accent/50">
            {file ? file.name : 'Choisir un PDF (10 Mo maximum)'}
          </button>
          <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={e => {
            const f = e.target.files?.[0] || null
            if (f && f.type !== 'application/pdf') { notify('Seuls les fichiers PDF sont acceptés.', 'error'); return }
            if (f && f.size > MAX_PDF) { notify('Ce PDF dépasse 10 Mo.', 'error'); return }
            setFile(f)
          }} />
          <div className="grid gap-2 sm:grid-cols-3">
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={150} placeholder="Titre (ex. Soirée du 12 déc.)" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-accent/50" />
            <input value={counterpart} onChange={e => setCounterpart(e.target.value)} maxLength={120} placeholder={organizer ? 'De la part de…' : 'Pour…'} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-accent/50" />
            <input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" placeholder="Montant en € (facultatif)" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-accent/50" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowUpload(false)} className="rounded-xl border border-line px-4 py-2 text-sm text-white/60 transition hover:text-white">Annuler</button>
            <button type="button" onClick={upload} disabled={!file || sending} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-40">{sending ? 'Envoi…' : 'Ajouter'}</button>
          </div>
        </section>
      )}

      <div className="inline-flex justify-self-start rounded-[10px] border border-line bg-surface-2 p-[3px]" role="tablist">
        {FILTERS.map(f => (
          <button key={f.key} type="button" role="tab" aria-selected={filter === f.key} onClick={() => setFilter(f.key)}
            className={`rounded-[8px] px-3.5 py-1.5 text-xs font-semibold transition ${filter === f.key ? 'bg-accent text-white' : 'text-white/55 hover:text-white'}`}>
            {f.label} <span className="tabular-nums opacity-70">({(quotes || []).filter(q => f.key === 'all' || q.direction === f.key).length})</span>
          </button>
        ))}
      </div>

      {quotes === null ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-5 py-10 text-center text-sm text-muted">
          {organizer ? 'Aucun devis pour l’instant. Ceux que les artistes et prestataires envoient sur vos offres apparaîtront ici.' : 'Aucun devis pour l’instant. Ceux que vous envoyez depuis une offre (« Envoyer un devis ») apparaîtront ici.'}
        </p>
      ) : (
        <ul className="grid gap-2">
          {shown.map(q => (
            <li key={q.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
              <LsIcon name="document" size={20} tone="muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{q.title}</p>
                <p className="text-xs text-muted">
                  {LABEL[q.direction]}{q.counterpart?.name ? ` · ${q.direction === 'SENT' ? 'à' : q.direction === 'RECEIVED' ? 'de' : 'avec'} ${q.counterpart.name}` : ''} · {new Date(q.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {q.amount != null && <b className="tabular-nums text-gold-light">{euro(q.amount)}</b>}
              <a href={q.fileUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-accent/40 px-3 py-1.5 text-xs font-semibold text-accent-light transition hover:bg-accent/10">Voir le PDF</a>
              {q.direction === 'UPLOADED' && (
                <button type="button" onClick={() => remove(q)} className="text-xs text-white/40 transition hover:text-red-300">Retirer</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
