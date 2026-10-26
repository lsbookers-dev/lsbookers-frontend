'use client'

/**
 * « Envoyer un devis » sur une offre (choix d'Antho, 23/10/2026). Compte comme une candidature.
 * - Joindre un PDF : ouvert à tous
 * - Proposition en ligne (Pro) : détail de la prestation et des tarifs, envoyé en PDF.
 *   Ce n'est pas un devis légal : un vrai devis se demande ensuite directement à la personne.
 * Dans les deux cas, le document part dans la conversation avec l'auteur de l'offre.
 */
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { apiFetch } from '@/utils/auth'
import { fileRequest } from '@/utils/directUpload'
import { apiUrl } from '@/utils/api'
import { useAuth } from '@/context/AuthContext'
import { useFeedback, apiErrorMessage } from '@/components/ui/Feedback'
import LsIcon from '@/components/ui/LsIcon'
import { usePlan, euros } from '@/lib/plan'
import type { Offer } from './OfferCard'

type Mode = 'choose' | 'pdf' | 'online'
type Line = { label: string; amount: string }

const INPUT = 'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-accent/50'
const FIELD = INPUT.replace('w-full ', '') // champs côte à côte (largeur fixée par la ligne)
const MAX_PDF = 10 * 1024 * 1024

export default function QuoteModal({ offer, onClose }: { offer: Offer; onClose: () => void }) {
  const router = useRouter()
  const { user } = useAuth()
  const { notify } = useFeedback()
  const { isPro } = usePlan()
  const [mode, setMode] = useState<Mode>('choose')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [details, setDetails] = useState('')
  const [conditions, setConditions] = useState('')
  const [lines, setLines] = useState<Line[]>([{ label: offer.specialty ? `Prestation ${offer.specialty}` : 'Prestation', amount: offer.fee != null ? String(offer.fee) : '' }])

  const total = lines.reduce((s, l) => s + (Number(l.amount.replace(',', '.')) || 0), 0)
  const myName = user?.name || 'Membre LS Bookers'

  // Candidature + envoi du document dans la conversation créée avec l'auteur de l'offre
  const send = async (doc: File, intro: string) => {
    setBusy(true)
    try {
      const apply = await apiFetch(apiUrl(`offers/${offer.id}/apply`), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: intro }),
      })
      if (!apply.ok) {
        // Limite du compte gratuit : la fenêtre « Passer en Pro » s'ouvre d'elle-même
        if (apply.status !== 403) notify(await apiErrorMessage(apply, 'Envoi impossible pour le moment.'), 'error')
        return
      }
      const { conversationId } = await apply.json()
      const init = await fileRequest(doc, 'message', { conversationId, content: message.trim() || undefined })
      const sent = init instanceof Response ? init : await apiFetch(apiUrl('messages/send-file'), init)
      if (!sent.ok) { notify(await apiErrorMessage(sent, 'Le document n’a pas pu être envoyé.'), 'error'); return }
      notify('Votre devis est envoyé à l’organisateur.')
      onClose()
      router.push(`/messages?c=${conversationId}`)
    } finally {
      setBusy(false)
    }
  }

  const sendPdf = () => {
    if (!file) return
    send(file, `Bonjour, je vous propose mes services pour votre offre « ${offer.title} ». Vous trouverez mon devis ci-joint.`)
  }

  const sendOnline = async () => {
    const clean = lines
      .map(l => ({ label: l.label.trim(), amount: Number(l.amount.replace(',', '.')) || 0 }))
      .filter(l => l.label)
    if (!clean.length) { notify('Ajoutez au moins une ligne de tarif.', 'error'); return }
    const { proposalPdfFile } = await import('@/lib/pdf')
    const doc = await proposalPdfFile({
      offerTitle: offer.title, offerDate: offer.date, offerLocation: [offer.location, offer.country].filter(Boolean).join(', '),
      from: myName, to: offer.organizer.name, details, lines: clean, conditions,
    })
    send(doc, `Bonjour, je vous propose mes services pour votre offre « ${offer.title} » : ma proposition tarifaire (${euros(Math.round(total * 100))}) est jointe.`)
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="lsb-quote-title" onClick={e => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-surface p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-accent">Envoyer un devis</p>
            <h2 id="lsb-quote-title" className="mt-1 truncate text-lg font-semibold text-white">{offer.title}</h2>
            <p className="text-xs text-white/45">à {offer.organizer.name} · compte comme une candidature</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white"><X size={18} /></button>
        </div>

        {mode === 'choose' && (
          <div className="grid gap-3">
            <button type="button" onClick={() => setMode('pdf')} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-accent/40 hover:bg-accent/10">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10"><LsIcon name="attach" /></span>
              <span>
                <span className="block text-sm font-semibold text-white">Joindre mon devis en PDF</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-white/50">Votre propre devis, envoyé dans la conversation avec l’organisateur.</span>
              </span>
            </button>
            {isPro ? (
              <button type="button" onClick={() => setMode('online')} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-accent/40 hover:bg-accent/10">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10"><LsIcon name="document" /></span>
                <span>
                  <span className="block text-sm font-semibold text-white">Faire une proposition en ligne</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-white/50">Détaillez votre prestation et vos tarifs en quelques lignes : on la met en forme et on l’envoie.</span>
                </span>
              </button>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-white/8 p-4 opacity-60">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10"><LsIcon name="lock" tone="gold" /></span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">Faire une proposition en ligne</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-white/50">Disponible avec la version Pro.</span>
                  <Link href="/subscriptions" onClick={onClose} className="mt-1 inline-block text-xs font-medium text-gold hover:text-gold-light">Passer en Pro</Link>
                </span>
              </div>
            )}
          </div>
        )}

        {mode === 'pdf' && (
          <div className="space-y-3">
            <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={e => {
              const f = e.target.files?.[0] || null
              if (f && f.type !== 'application/pdf') { notify('Seuls les fichiers PDF sont acceptés.', 'error'); return }
              if (f && f.size > MAX_PDF) { notify('Fichier trop lourd (10 Mo maximum).', 'error'); return }
              setFile(f)
            }} />
            <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-white/15 p-4 text-left transition hover:border-accent/40">
              <LsIcon name="attach" />
              <span className="min-w-0 flex-1 truncate text-sm text-white/80">{file ? file.name : 'Choisir mon devis (PDF, 10 Mo max)'}</span>
              {file && <span className="text-xs text-accent-light">Changer</span>}
            </button>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Un petit mot pour accompagner votre devis (facultatif)" className={INPUT} />
            <Actions onBack={() => setMode('choose')} onSend={sendPdf} disabled={!file || busy} busy={busy} />
          </div>
        )}

        {mode === 'online' && (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-white/60">Détail de la prestation
              <textarea value={details} onChange={e => setDetails(e.target.value)} rows={4} placeholder="Ce qui est compris : durée, matériel, déplacement, nombre de personnes…" className={`${INPUT} mt-1.5`} />
            </label>
            <div>
              <p className="mb-1.5 text-xs font-medium text-white/60">Tarifs proposés</p>
              <div className="space-y-2">
                {lines.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={l.label} onChange={e => setLines(ls => ls.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Ex. Set de 3 h" className={`${FIELD} min-w-0 flex-1`} />
                    <input value={l.amount} inputMode="decimal" onChange={e => setLines(ls => ls.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} placeholder="€" className={`${FIELD} w-24 shrink-0 text-right`} />
                    {lines.length > 1 && (
                      <button type="button" onClick={() => setLines(ls => ls.filter((_, j) => j !== i))} aria-label="Retirer la ligne" className="rounded-lg px-2 text-white/35 hover:text-red-300"><X size={16} /></button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <button type="button" onClick={() => setLines(ls => [...ls, { label: '', amount: '' }])} className="text-xs text-accent-light hover:text-white">Ajouter une ligne</button>
                <p className="text-sm text-white/70">Total : <b className="text-gold">{euros(Math.round(total * 100))}</b></p>
              </div>
            </div>
            <label className="block text-xs font-medium text-white/60">Conditions (facultatif)
              <input value={conditions} onChange={e => setConditions(e.target.value)} placeholder="Ex. acompte de 30 %, frais de déplacement inclus jusqu’à 50 km" className={`${INPUT} mt-1.5`} />
            </label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="Un petit mot pour l’organisateur (facultatif)" className={INPUT} />
            <p className="text-[11px] leading-relaxed text-white/35">Une proposition indicative, pas un devis officiel : si l’organisateur a besoin d’un vrai devis, il vous le demandera.</p>
            <Actions onBack={() => setMode('choose')} onSend={sendOnline} disabled={busy || total <= 0} busy={busy} />
          </div>
        )}
      </div>
    </div>
  )
}

function Actions({ onBack, onSend, disabled, busy }: { onBack: () => void; onSend: () => void; disabled: boolean; busy: boolean }) {
  return (
    <div className="flex gap-2 pt-1">
      <button type="button" onClick={onBack} className="rounded-xl border border-white/12 px-4 py-2.5 text-xs text-white/70 hover:bg-white/[0.06]">Retour</button>
      <button type="button" onClick={onSend} disabled={disabled} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent-strong px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-40">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}Envoyer à l’organisateur
      </button>
    </div>
  )
}
