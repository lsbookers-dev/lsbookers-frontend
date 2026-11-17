'use client'

/** Fenêtre « Partager le profil » (ouverte depuis le menu ···) : copier le lien, ou l'envoyer dans une de ses conversations. */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { useFeedback } from '@/components/ui/Feedback'
import type { Conversation } from '@/app/messages/types'

type Props = { profileUserId: number; profileName: string; myUserId?: string | number; onClose: () => void }

export default function ShareProfileDialog({ profileUserId, profileName, myUserId, onClose }: Props) {
  const { notify } = useFeedback()
  const [conversations, setConversations] = useState<Conversation[] | null>(null)
  const [query, setQuery] = useState('')
  const [sending, setSending] = useState<number | null>(null)

  useEffect(() => {
    if (conversations) return
    apiFetch(apiUrl('messages/conversations'))
      .then(r => (r.ok ? r.json() : null))
      .then(d => setConversations(Array.isArray(d?.conversations) ? d.conversations : []))
      .catch(() => setConversations([]))
  }, [conversations])

  const otherName = (c: Conversation) =>
    c.participants.filter(p => String(p.id) !== String(myUserId)).map(p => p.name).join(', ') || 'Conversation'

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      notify('Lien du profil copié.')
    } catch {
      notify('Impossible de copier le lien.', 'error')
    }
  }

  const send = async (c: Conversation) => {
    setSending(c.id)
    try {
      const res = await apiFetch(apiUrl('messages/share-profile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: c.id, profileUserId }),
      })
      if (!res.ok) { notify('Envoi impossible pour le moment.', 'error'); return }
      notify(`Profil envoyé à ${otherName(c)}.`)
      onClose()
    } finally { setSending(null) }
  }

  const list = (conversations || []).filter(c => !query.trim() || otherName(c).toLowerCase().includes(query.trim().toLowerCase()))

  // Affichée au niveau de la page : l'en-tête du profil (flou) enfermerait la fenêtre
  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md space-y-4 rounded-3xl border border-white/12 bg-surface p-5">
        <button type="button" onClick={onClose} aria-label="Fermer" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/[0.07] text-white/60 hover:text-white">
          <X size={16} />
        </button>
        <h2 id="share-title" className="pr-10 text-lg font-bold text-white">Partager le profil de {profileName}</h2>

        <button type="button" onClick={copyLink} className="w-full rounded-xl border border-white/12 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/[0.05]">
          Copier le lien du profil
        </button>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[.1em] text-accent-light">Envoyer dans une conversation</p>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher une conversation…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-accent/50" />
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {conversations === null ? (
              <p className="py-3 text-center text-xs text-white/40">Chargement…</p>
            ) : list.length === 0 ? (
              <p className="py-3 text-center text-xs text-white/40">Aucune conversation pour l&apos;instant.</p>
            ) : list.map(c => (
              <button key={c.id} type="button" disabled={sending === c.id} onClick={() => send(c)}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/85 transition hover:bg-white/[0.05] disabled:opacity-50">
                <span className="truncate">{otherName(c)}</span>
                <span className="text-xs text-accent-light">{sending === c.id ? 'Envoi…' : 'Envoyer'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
