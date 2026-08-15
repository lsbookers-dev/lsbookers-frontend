'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  X, MapPin, Calendar, Euro, Users,
  Send, Search, CheckCircle, Briefcase, SlidersHorizontal,
} from 'lucide-react'
import { getAuthToken } from '@/utils/auth'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
export type OfferDetail = {
  id: number
  title: string
  description: string
  type: 'ARTIST' | 'PROVIDER' | 'ALL'
  specialty: string | null
  location: string
  country: string
  date: string
  fee: number | null
  radiusKm: number | null
  applicantCount: number
  status: string
  createdAt: string
  organizer: {
    id: number
    userId: number | null
    avatar: string | null
    name: string
  }
}

type SearchUser = {
  id: number
  pseudo: string | null
  firstName: string | null
  lastName: string | null
  role: string
  profile: { id: number; avatar: string | null; profession: string | null; location: string | null } | null
}

const getUserName = (u: SearchUser) =>
  u.pseudo || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Utilisateur'

const TYPE_STYLE: Record<string, { border: string; dot: string; tag: string }> = {
  ARTIST:   { border: 'border-t-pink-500',   dot: 'bg-pink-400',   tag: 'bg-pink-500/15 text-pink-300 border-pink-500/25' },
  PROVIDER: { border: 'border-t-blue-500',   dot: 'bg-blue-400',   tag: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
  ALL:      { border: 'border-t-purple-500', dot: 'bg-purple-400', tag: 'bg-purple-500/15 text-purple-300 border-purple-500/25' },
}

type Props = {
  offer: OfferDetail
  onClose: () => void
  isLoggedIn: boolean
}

export default function OfferModal({ offer, onClose, isLoggedIn }: Props) {
  const router = useRouter()
  const style  = TYPE_STYLE[offer.type] ?? TYPE_STYLE.ALL

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  /* ── Candidature ───────────────────────────────────────── */
  const defaultMsg = `Bonjour, je souhaite postuler à votre offre "${offer.title}" (${offer.location}). Je me tiens disponible pour en discuter.`
  const [applyStep, setApplyStep] = useState<'idle' | 'confirm' | 'done'>('idle')
  const [applyMsg,  setApplyMsg]  = useState(defaultMsg)
  const [applying,  setApplying]  = useState(false)
  const [applyErr,  setApplyErr]  = useState('')

  const submitApply = async () => {
    if (!isLoggedIn) { router.push('/login'); return }
    const token = getAuthToken(); if (!token) return
    setApplying(true); setApplyErr('')
    try {
      const res = await fetch(`${API_BASE}/api/offers/${offer.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: applyMsg }),
      })
      const data = await res.json()
      if (res.ok) setApplyStep('done')
      else        setApplyErr(data.error || 'Erreur lors de la candidature')
    } catch { setApplyErr('Erreur réseau') }
    finally   { setApplying(false) }
  }

  /* ── Partage ───────────────────────────────────────────── */
  const [shareOpen,    setShareOpen]    = useState(false)
  const [shareQ,       setShareQ]       = useState('')
  const [shareResults, setShareResults] = useState<SearchUser[]>([])
  const [shareLoading, setShareLoading] = useState(false)
  const [shareDone,    setShareDone]    = useState<number | null>(null)

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim()) { setShareResults([]); return }
    setShareLoading(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE}/api/search?name=${encodeURIComponent(q)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setShareResults((data.users || []).slice(0, 6))
      }
    } finally { setShareLoading(false) }
  }, [])

  const handleShare = async (recipient: SearchUser) => {
    const token = getAuthToken(); if (!token) return
    try {
      const res = await fetch(`${API_BASE}/api/messages/share-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipientId: recipient.id, offerId: offer.id }),
      })
      if (res.ok) {
        const data = await res.json()
        setShareDone(data.conversationId ?? null)
        setShareQ(''); setShareResults([])
      }
    } catch { /* silent */ }
  }

  const goSimilar = () => {
    const p = new URLSearchParams()
    if (offer.specialty) p.set('specialty', offer.specialty)
    if (offer.location)  p.set('location',  offer.location)
    router.push(`/offers?${p.toString()}`)
    onClose()
  }

  const dateStr = new Date(offer.date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const avatarUrl = offer.organizer.avatar

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`relative max-w-md w-full bg-neutral-950 border-t-4 ${style.border} border border-white/10 rounded-2xl overflow-hidden shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header : organisateur ──────────────────────── */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <div className="relative w-11 h-11 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={offer.organizer.name} fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/40 font-bold text-base">
                {offer.organizer.name[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm truncate">{offer.organizer.name}</p>
            <p className="text-xs text-white/40">Organisateur</p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/8 hover:bg-white/15 text-white rounded-full p-1.5 transition flex-shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Titre + spécialité ─────────────────────────── */}
        <div className="px-5 pt-4 pb-3">
          <h2 className="font-bold text-white text-lg leading-snug">{offer.title}</h2>
          {offer.specialty && (
            <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full border font-medium ${style.tag}`}>
              {offer.specialty}
            </span>
          )}
        </div>

        {/* ── Body ──────────────────────────────────────── */}
        <div className="px-5 pb-4 space-y-4 max-h-[45vh] overflow-y-auto">

          {/* Méta : 2 colonnes */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <MapPin size={13} className="text-white/30 flex-shrink-0" />
              <span className="truncate">
                {offer.location}{offer.country && offer.country !== offer.location ? `, ${offer.country}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Calendar size={13} className="text-white/30 flex-shrink-0" />
              <span className="truncate capitalize">{dateStr}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Users size={13} className="text-white/30 flex-shrink-0" />
              <span>{offer.applicantCount} candidat{offer.applicantCount !== 1 ? 's' : ''}</span>
            </div>
            {offer.fee != null && (
              <div className="flex items-center gap-2 text-sm">
                <Euro size={13} className="text-white/30 flex-shrink-0" />
                <span className="font-semibold text-green-400">{offer.fee} €</span>
              </div>
            )}
          </div>

          {/* Description */}
          {offer.description && (
            <div>
              <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-1.5">Description</p>
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{offer.description}</p>
            </div>
          )}

          {/* Zone candidature */}
          {applyStep === 'confirm' && (
            <div className="space-y-2.5 border border-white/10 rounded-xl p-3.5 bg-white/3">
              <p className="text-xs text-white/45 font-medium">Votre message de candidature</p>
              <textarea
                value={applyMsg}
                onChange={e => setApplyMsg(e.target.value)}
                rows={3}
                maxLength={1000}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/25 transition resize-none"
              />
              {applyErr && <p className="text-xs text-red-400">{applyErr}</p>}
              <div className="flex gap-2">
                <button onClick={submitApply} disabled={applying || !applyMsg.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition">
                  {applying ? 'Envoi…' : 'Confirmer'}
                </button>
                <button onClick={() => setApplyStep('idle')}
                  className="px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition">
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Zone partage */}
          {shareOpen && (
            <div className="border border-white/10 rounded-xl p-3.5 bg-white/3 space-y-3">
              {shareDone !== null ? (
                <div className="flex flex-col items-center gap-2 py-2 text-center">
                  <CheckCircle className="w-7 h-7 text-green-400" />
                  <p className="text-sm text-white/80 font-medium">Offre partagée !</p>
                  <button onClick={() => router.push(`/messages?c=${shareDone}`)}
                    className="text-xs text-purple-400 hover:text-purple-300 transition underline">
                    Ouvrir la conversation →
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-white/45 font-medium">Envoyer à un utilisateur</p>
                  <div className="relative">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                    <input autoFocus type="text" value={shareQ}
                      onChange={e => { setShareQ(e.target.value); searchUsers(e.target.value) }}
                      placeholder="Rechercher par nom ou pseudo…"
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/25 transition" />
                  </div>
                  {shareLoading && <p className="text-xs text-white/30 text-center py-1">Recherche…</p>}
                  {shareResults.length > 0 && (
                    <ul className="space-y-0.5">
                      {shareResults.map(u => (
                        <li key={u.id}>
                          <button onClick={() => handleShare(u)}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/8 transition text-left">
                            <div className="relative w-7 h-7 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                              {u.profile?.avatar
                                ? <Image src={u.profile.avatar} alt={getUserName(u)} fill className="object-cover" unoptimized />
                                : <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-bold">{getUserName(u)[0]}</div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white truncate">{getUserName(u)}</p>
                              <p className="text-[10px] text-white/40 truncate">
                                {u.profile?.profession || u.role}{u.profile?.location ? ` · ${u.profile.location}` : ''}
                              </p>
                            </div>
                            <Send size={11} className="text-white/25 flex-shrink-0" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {shareQ && !shareLoading && shareResults.length === 0 && (
                    <p className="text-xs text-white/25 text-center py-1">Aucun résultat</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Succès candidature */}
          {applyStep === 'done' && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-3 py-2.5 rounded-xl">
              <CheckCircle size={14} /> Candidature envoyée avec succès !
            </div>
          )}
        </div>

        {/* ── Footer : 3 boutons égaux ───────────────────── */}
        <div className="p-4 border-t border-white/10">
          <div className="grid grid-cols-3 gap-2">

            {/* Postuler */}
            {applyStep === 'idle' && (
              <button
                onClick={() => {
                  if (!isLoggedIn) { router.push('/login'); return }
                  setApplyStep('confirm')
                  setShareOpen(false)
                }}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition"
              >
                <Briefcase size={18} />
                <span className="text-xs font-semibold">Postuler</span>
              </button>
            )}
            {applyStep === 'confirm' && (
              <div className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300">
                <Briefcase size={18} />
                <span className="text-xs font-medium">En cours…</span>
              </div>
            )}
            {applyStep === 'done' && (
              <div className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                <CheckCircle size={18} />
                <span className="text-xs font-medium">Envoyée ✓</span>
              </div>
            )}

            {/* Partager */}
            <button
              onClick={() => {
                if (!isLoggedIn) { router.push('/login'); return }
                setShareOpen(v => !v)
                if (shareDone !== null) setShareDone(null)
                setApplyStep('idle')
              }}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl transition border ${
                shareOpen
                  ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Send size={18} />
              <span className="text-xs font-medium">Partager</span>
            </button>

            {/* Voir offres similaires */}
            <button
              onClick={goSimilar}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
            >
              <SlidersHorizontal size={18} />
              <span className="text-xs font-medium">Similaires</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
