'use client'

/**
 * Prénom et nom figés (7 jours après l'inscription, ou identité vérifiée par Stripe) :
 * affichés en lecture seule, avec une demande de modification envoyée à l'équipe.
 */

import { useState } from 'react'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'

const INPUT = 'w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-violet-500/50'

export default function NameChangeRequest({ firstName, lastName, verified }: { firstName: string; lastName: string; verified: boolean }) {
  const { notify } = useFeedback()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ firstName, lastName, reason: '' })

  const send = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || form.reason.trim().length < 5) {
      notify('Indique le prénom, le nom et la raison du changement.', 'error')
      return
    }
    setSending(true)
    try {
      const res = await apiFetch(apiUrl('profile/me/name-change-request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), reason: form.reason.trim() }),
      })
      if (!res.ok) throw new Error(await apiErrorMessage(res, 'La demande n’a pas pu être envoyée.'))
      setSent(true)
      setOpen(false)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'La demande n’a pas pu être envoyée.', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="mb-1.5 block text-sm text-white/70">Prénom</span>
          <p className={`${INPUT} cursor-not-allowed text-white/60`}>{firstName}</p>
        </div>
        <div>
          <span className="mb-1.5 block text-sm text-white/70">Nom</span>
          <p className={`${INPUT} cursor-not-allowed text-white/60`}>{lastName}</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-white/55">
        {verified
          ? 'Ton identité a été vérifiée pour les paiements : ton prénom et ton nom ne se modifient plus directement.'
          : 'Pour la confiance entre membres et pour tes devis et factures, ton prénom et ton nom ne se modifient plus directement après l’inscription.'}
        {sent
          ? <p className="mt-2 font-semibold text-white/80">Demande envoyée. L’équipe te répond par e-mail (une pièce d’identité peut t’être demandée).</p>
          : !open && (
            <button type="button" onClick={() => setOpen(true)} className="mt-2 block font-semibold text-accent-light hover:text-white">
              Demander une modification
            </button>
          )}
      </div>
      {open && (
        <div className="space-y-3 rounded-xl border border-accent/25 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} maxLength={50} placeholder="Nouveau prénom" aria-label="Nouveau prénom" className={INPUT} />
            <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} maxLength={50} placeholder="Nouveau nom" aria-label="Nouveau nom" className={INPUT} />
          </div>
          <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} maxLength={1000} rows={3} placeholder="Raison du changement (faute de frappe, mariage…)" aria-label="Raison du changement" className={`${INPUT} resize-none`} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2 text-sm text-white/60 hover:text-white">Annuler</button>
            <button type="button" disabled={sending} onClick={send} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-50">
              {sending ? 'Envoi…' : 'Envoyer la demande'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
