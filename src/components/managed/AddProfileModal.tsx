'use client'

/**
 * Fenêtre « Ajouter un profil » (maquette C1) : inviter un membre déjà inscrit,
 * ou préparer le profil d'un artiste / d'un lieu qui n'est pas encore sur LS Bookers.
 * welcome = ouverte juste après l'achat de la formule Agence.
 */

import { useEffect, useState } from 'react'
import { Search, UserPlus, UserSearch, X } from 'lucide-react'
import SafeImage from '@/components/SafeImage'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'

const ROLE_LABEL: Record<string, string> = { ARTIST: 'Artiste', ORGANIZER: 'Organisateur', PROVIDER: 'Prestataire' }


type Candidate = { id: number; name: string; avatar: string | null; role: string | null; location: string | null; alreadyManaged: boolean }

export default function AddProfileModal({ onClose, onDone, welcome = false }: { onClose: () => void; onDone: () => void; welcome?: boolean }) {
  const [mode, setMode] = useState<'choose' | 'invite' | 'create'>('choose')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Ajouter un profil" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-white/10 bg-surface-2 p-5 sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {welcome && <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-gold">Formule Agence activée</p>}
            <h2 className="text-lg font-semibold text-white">{mode === 'invite' ? 'Inviter un membre' : mode === 'create' ? 'Créer un profil' : 'Ajoutez vos profils'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg p-1 text-white/50 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        {mode === 'choose' && (
          <div className="grid gap-2.5">
            <button type="button" onClick={() => setMode('invite')} className="flex items-start gap-3 rounded-xl border border-accent/50 p-3.5 text-left transition hover:bg-accent/10">
              <UserSearch className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-light" aria-hidden="true" />
              <span><span className="block text-sm font-semibold text-white">Inviter un profil existant</span><span className="block text-xs text-muted">La personne est déjà sur LS Bookers : elle accepte depuis son compte.</span></span>
            </button>
            <button type="button" onClick={() => setMode('create')} className="flex items-start gap-3 rounded-xl border border-white/12 p-3.5 text-left transition hover:bg-white/[0.04]">
              <UserPlus className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-light" aria-hidden="true" />
              <span><span className="block text-sm font-semibold text-white">Créer un profil</span><span className="block text-xs text-muted">Pour un artiste pas encore inscrit, ou l’un de vos lieux. Il reste invisible tant que la personne ne l’a pas validé par e-mail.</span></span>
            </button>
            <button type="button" onClick={onClose} className="mt-1 text-center text-xs text-muted hover:text-white">Plus tard</button>
          </div>
        )}
        {mode === 'invite' && <InviteForm onBack={() => setMode('choose')} onDone={onDone} />}
        {mode === 'create' && <CreateForm onBack={() => setMode('choose')} onDone={onDone} />}
      </div>
    </div>
  )
}

const inputCls = 'w-full rounded-xl bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-violet-500/60'

function InviteForm({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { notify } = useFeedback()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Candidate[] | null>(null)
  const [sendingId, setSendingId] = useState<number | null>(null)

  useEffect(() => {
    if (q.trim().length < 2) { setResults(null); return }
    const t = window.setTimeout(() => {
      apiFetch(`${apiUrl('managers/candidates')}?q=${encodeURIComponent(q.trim())}`)
        .then(r => (r.ok ? r.json() : { profiles: [] }))
        .then(data => setResults(data.profiles || []))
        .catch(() => setResults([]))
    }, 250)
    return () => window.clearTimeout(t)
  }, [q])

  const invite = async (c: Candidate) => {
    setSendingId(c.id)
    try {
      const res = await apiFetch(apiUrl('managers/invite'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: c.id }) })
      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Invitation impossible pour le moment.'))
      notify(`Invitation envoyée à ${c.name}`)
      onDone()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Invitation impossible pour le moment.', 'error')
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div className="grid gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" aria-hidden="true" />
        <input autoFocus type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Nom du profil" aria-label="Rechercher un membre" className={`${inputCls} pl-9`} />
      </div>
      {results && results.length === 0 && <p className="text-xs text-muted">Aucun membre trouvé. Vous pouvez plutôt créer son profil.</p>}
      {results && results.length > 0 && (
        <ul className="divide-y divide-white/[0.06]">
          {results.map(c => (
            <li key={c.id} className="flex items-center gap-3 py-2">
              <SafeImage type="avatar" src={c.avatar} name={c.name} size={34} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">{c.name}</p>
                <p className="truncate text-xs text-muted">{[c.role && ROLE_LABEL[c.role], c.location].filter(Boolean).join(' · ')}</p>
              </div>
              {c.alreadyManaged
                ? <span className="text-[11px] text-muted">Déjà ajouté</span>
                : <button type="button" disabled={sendingId === c.id} onClick={() => invite(c)} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-strong disabled:opacity-50">Inviter</button>}
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={onBack} className="text-left text-xs text-muted hover:text-white">← Retour</button>
    </div>
  )
}

function CreateForm({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { notify } = useFeedback()
  const [form, setForm] = useState({ pseudo: '', email: '', role: 'ARTIST', city: '' })
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setForm(f => ({ ...f, [key]: e.target.value })); setError(null) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.pseudo.trim().length < 3) { setError('Le nom du profil doit faire au moins 3 caractères.'); return }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) { setError('Indiquez l’adresse e-mail de la personne (ou du lieu).'); return }
    setSending(true)
    try {
      const res = await apiFetch(apiUrl('managers/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pseudo: form.pseudo.trim(), email: form.email.trim(), role: form.role, city: form.city.trim() || undefined }),
      })
      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Création impossible pour le moment.'))
      const data = await res.json().catch(() => ({}))
      notify(data.message || 'Invitation envoyée')
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création impossible pour le moment.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <label className="grid gap-1.5 text-xs text-white/60">Nom du profil
        <input value={form.pseudo} onChange={set('pseudo')} maxLength={30} placeholder="Nina Vega, Le Rex…" className={inputCls} />
      </label>
      <label className="grid gap-1.5 text-xs text-white/60">Type de profil
        <select value={form.role} onChange={set('role')} className={inputCls}>
          <option value="ARTIST">Artiste</option>
          <option value="ORGANIZER">Organisateur (salle, lieu, festival)</option>
          <option value="PROVIDER">Prestataire</option>
        </select>
      </label>
      <label className="grid gap-1.5 text-xs text-white/60">Ville (facultatif)
        <input value={form.city} onChange={set('city')} maxLength={100} placeholder="Marseille" className={inputCls} />
      </label>
      <label className="grid gap-1.5 text-xs text-white/60">Adresse e-mail de la personne ou du lieu
        <input type="email" value={form.email} onChange={set('email')} placeholder="contact@exemple.fr" className={inputCls} />
        <span className="text-[11px] leading-relaxed text-white/40">Elle recevra un lien pour valider le profil et choisir son mot de passe. Le profil reste invisible d’ici là.</span>
      </label>
      {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="text-xs text-muted hover:text-white">← Retour</button>
        <button type="submit" disabled={sending} className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-strong disabled:opacity-50">{sending ? 'Envoi…' : 'Créer et envoyer l’invitation'}</button>
      </div>
    </form>
  )
}
