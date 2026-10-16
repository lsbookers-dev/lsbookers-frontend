'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/utils/auth'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'
import HeaderAnnouncement from '@/components/HeaderAnnouncement'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
const MAX = 140

// Date du champ en heure locale (AAAA-MM-JJ) ; la fin vaut 23 h 59 ce jour-là
const toInputDate = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const fromInputDate = (value: string) => (value ? new Date(`${value}T23:59:59`).toISOString() : null)

/** Admin › Paramètres : annonce affichée au centre de l'en-tête pour tous les membres (choix B6). */
export default function AnnouncementSettings() {
  const { notify } = useFeedback()
  const [text, setText]     = useState('')
  const [url, setUrl]       = useState('')
  const [active, setActive] = useState(false)
  const [endsAt, setEndsAt] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch(`${API_BASE}/api/admin/settings`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d) return
        setText(d.announcementText || '')
        setUrl(d.announcementUrl || '')
        setActive(!!d.announcementActive)
        setEndsAt(toInputDate(d.announcementEndsAt))
      })
      .catch(() => {})
  }, [])

  const urlError = url && !/^\/(?!\/)/.test(url) && !/^https:\/\//i.test(url)
    ? 'Le lien doit commencer par / (page du site) ou https://'
    : ''

  const expired = !!endsAt && new Date(`${endsAt}T23:59:59`) <= new Date()

  const save = async () => {
    if (urlError) return
    if (active && !text.trim()) { notify('Écrivez un texte avant d’afficher l’annonce.', 'error'); return }
    setSaving(true)
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementText: text.trim(), announcementUrl: url.trim(), announcementActive: active, announcementEndsAt: fromInputDate(endsAt) }),
      })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Enregistrement impossible.'), 'error'); return }
      notify(!active ? 'Annonce enregistrée, masquée.' : expired ? 'Enregistrée, mais la date de fin est passée : l’annonce reste masquée.' : 'Annonce en ligne (visible d’ici une minute).')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mb-8 rounded-2xl border border-white/10 bg-black/30 p-4">
      <h2 className="mb-1 text-lg font-semibold">Annonce de l&apos;en-tête</h2>
      <p className="mb-4 text-sm text-white/50">
        Une ligne d&apos;information au centre de l&apos;en-tête, pour tous les membres (sur téléphone : en bandeau en haut des pages).
        Chacun peut la fermer ; si vous changez le texte ou le lien, elle réapparaît.
      </p>

      <label className="block">
        <span className="mb-1.5 flex justify-between text-xs uppercase tracking-wider text-white/50">
          Texte <span className="normal-case tracking-normal">{text.length}/{MAX}</span>
        </span>
        <input
          value={text}
          maxLength={MAX}
          onChange={e => setText(e.target.value)}
          placeholder="Nouveau : les devis et factures sont dans Mon espace"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-accent/40 focus:outline-none"
        />
      </label>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Lien du bouton « Voir » (facultatif)</span>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="/space ou https://…"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-accent/40 focus:outline-none"
        />
        {urlError && <span className="mt-1 block text-xs text-red-300">{urlError}</span>}
      </label>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Date de fin (facultatif)</span>
        <input
          type="date"
          value={endsAt}
          onChange={e => setEndsAt(e.target.value)}
          className="w-48 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white [color-scheme:dark] focus:border-accent/40 focus:outline-none"
        />
        <span className={`mt-1 block text-xs ${expired ? 'text-red-300' : 'text-white/40'}`}>
          {!endsAt
            ? 'Sans date de fin : l’annonce reste affichée tant que la case est cochée.'
            : expired
              ? 'Cette date est passée : l’annonce n’est plus affichée.'
              : `L’annonce disparaît toute seule après le ${new Date(`${endsAt}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
        </span>
      </label>

      <label className="mt-4 flex items-center gap-3 text-sm">
        <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="h-4 w-4 accent-[var(--lsb-accent)]" />
        Afficher l&apos;annonce aux membres
      </label>

      {text.trim() && (
        <div className="mt-4">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Aperçu</span>
          <div className="flex rounded-xl border border-white/8 bg-[#0b0a10] px-3 py-3">
            <HeaderAnnouncement key={`${text}|${url}`} announcement={{ text: text.trim(), url: url.trim() }} preview />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving || !!urlError}
        className="mt-4 rounded-xl bg-accent-strong px-4 py-2 text-sm text-white transition hover:bg-accent disabled:opacity-50"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </section>
  )
}
