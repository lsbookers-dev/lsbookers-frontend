'use client'

/**
 * Lien de booking partagé (bio Instagram, signature e-mail…) : visible sans compte.
 * Montre l'essentiel du profil, et un formulaire de demande de date pour un membre connecté.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import SafeImage from '@/components/SafeImage'
import PublicBrand from '@/components/PublicBrand'
import LsIcon, { LsBullet } from '@/components/ui/LsIcon'
import { Stars } from '@/components/ReviewsPanel'
import { profileActivity, profileName, publicProfileHref } from '@/components/profile/utils'
import type { ProfileData } from '@/components/profile/types'
import { radiusLabel } from '@/utils/radius'

export default function BookingLinkPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading')
  // Formulaire de demande de booking (membre connecté, sur le profil d'un autre)
  const [date, setDate] = useState('')
  const [fee, setFee] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [sentConversationId, setSentConversationId] = useState<number | null | undefined>(undefined)

  useEffect(() => {
    apiFetch(apiUrl(`profile/user/${id}`), { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => { setProfile(d.profile); setStatus('ready') })
      .catch(() => setStatus('missing'))
  }, [id])

  const profileHref = profile ? publicProfileHref(profile.user?.role, profile.userId) : null
  const isOwner = !!user && !!profile && Number(user.id) === Number(profile.userId)
  const today = new Date().toISOString().slice(0, 10)

  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !date) { setFormError('Choisissez une date.'); return }
    setSending(true); setFormError(null)
    try {
      const res = await apiFetch(apiUrl('events/booking-request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetProfileId: profile.id,
          date: `${date}T00:00:00.000Z`,
          fee: fee ? parseFloat(fee) : undefined,
          message: message.trim() || undefined,
        }),
      })
      const d = await res.json().catch(() => null)
      if (!res.ok) { setFormError(d?.message || d?.error || 'Impossible d’envoyer la demande pour le moment.'); return }
      setSentConversationId(d?.conversationId ?? null)
    } catch {
      setFormError('Impossible de joindre le serveur.')
    } finally { setSending(false) }
  }
  const name = profileName(profile)
  const place = [profile?.location, profile?.country].filter(Boolean).join(', ')

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-white">
      <div className="mx-auto grid max-w-md gap-6">
        <div className="flex justify-center"><PublicBrand /></div>

        {status === 'loading' && <div className="h-96 animate-pulse rounded-3xl bg-white/[0.04]" />}

        {status === 'missing' && (
          <div className="grid justify-items-center gap-3 rounded-3xl border border-line bg-surface p-8 text-center">
            <LsIcon name="user" size={30} tone="muted" />
            <h1 className="text-lg font-semibold">Ce lien n’est plus valable</h1>
            <p className="text-sm text-muted">Le profil n’existe pas ou n’est plus disponible.</p>
            <Link href="/" className="mt-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Découvrir LS Bookers</Link>
          </div>
        )}

        {status === 'ready' && profile && (
          <article className="overflow-hidden rounded-3xl border border-line bg-surface">
            <div className="relative h-36">
              <SafeImage type="banner" src={profile.banner} alt="" className="opacity-75" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface" />
            </div>
            <div className="relative z-10 -mt-12 grid justify-items-center gap-3 px-6 pb-7 text-center">
              <SafeImage type="avatar" src={profile.avatar} name={name} size={96} className="rounded-2xl ring-2 ring-gold/40" />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
                <p className="mt-1 text-sm text-muted">{[profileActivity(profile), place, radiusLabel(profile.radiusKm)].filter(Boolean).join(' · ')}</p>
              </div>
              {(profile.reviewsCount ?? 0) > 0 && profile.reviewsAvg != null && (
                <div className="flex items-center gap-2 text-sm">
                  <Stars value={profile.reviewsAvg} size={14} />
                  <span className="font-semibold text-gold">{profile.reviewsAvg.toFixed(1)}</span>
                  <span className="text-muted">· {profile.reviewsCount} avis</span>
                </div>
              )}
              {(profile.specialties?.length ?? 0) > 0 && (
                <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-xs text-white/75">
                  {profile.specialties!.slice(0, 5).map(s => <li key={s} className="inline-flex items-center gap-1.5"><LsBullet size={11} />{s}</li>)}
                </ul>
              )}
              {profile.bio && <p className="line-clamp-4 text-sm leading-relaxed text-white/70">{profile.bio}</p>}

              <div className="mt-2 grid w-full gap-2">
                {isOwner ? (
                  <p className="rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                    C&apos;est votre lien de booking : partagez-le (bio Instagram, signature e-mail…) pour recevoir des demandes de date.
                  </p>
                ) : user && sentConversationId !== undefined ? (
                  <div className="grid gap-2 rounded-xl border border-gold/30 bg-gold/[0.08] px-4 py-4 text-sm">
                    <p className="font-semibold text-gold-light">Demande envoyée à {name}.</p>
                    <p className="text-white/65">Vous serez prévenu de sa réponse. Vous pouvez aussi échanger dans la conversation.</p>
                    <Link href={sentConversationId ? `/messages?c=${sentConversationId}` : '/messages'} className="mt-1 rounded-xl bg-accent px-4 py-2.5 font-semibold text-white transition hover:bg-accent-strong">
                      Voir la conversation
                    </Link>
                  </div>
                ) : user ? (
                  <form onSubmit={sendRequest} className="grid gap-3 text-left">
                    <p className="text-sm font-semibold text-white">Demander une date</p>
                    <label className="grid gap-1 text-xs text-white/55">
                      Date souhaitée
                      <input type="date" required min={today} value={date} onChange={e => setDate(e.target.value)}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none focus:border-accent/50" />
                    </label>
                    <label className="grid gap-1 text-xs text-white/55">
                      Cachet proposé (facultatif, en €)
                      <input type="number" min={0} step="1" inputMode="numeric" value={fee} onChange={e => setFee(e.target.value)} placeholder="Ex. 400"
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent/50" />
                    </label>
                    <label className="grid gap-1 text-xs text-white/55">
                      Message (facultatif)
                      <textarea rows={3} maxLength={1000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Type d’événement, lieu, horaires…"
                        className="resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent/50" />
                    </label>
                    {formError && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{formError}</p>}
                    <button type="submit" disabled={sending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-50">
                      <LsIcon name="booking" size={18} tone="inherit" />{sending ? 'Envoi…' : 'Envoyer la demande'}
                    </button>
                    {profileHref && (
                      <Link href={profileHref} className="text-center text-xs text-white/50 underline underline-offset-4 hover:text-white">Voir son profil complet et ses disponibilités</Link>
                    )}
                  </form>
                ) : (
                  <>
                    <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong">
                      <LsIcon name="booking" size={18} tone="inherit" />Créer un compte gratuit pour demander une date
                    </Link>
                    <Link href="/login" className="rounded-xl border border-line px-4 py-3 text-sm text-white/80 transition hover:text-white">
                      J’ai déjà un compte
                    </Link>
                  </>
                )}
              </div>
            </div>
          </article>
        )}
        <p className="text-center text-xs text-white/35">LS Bookers met en relation artistes, organisateurs et prestataires de l’événementiel.</p>
      </div>
    </main>
  )
}
