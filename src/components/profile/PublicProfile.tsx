'use client'

/** Profil public d'un artiste, organisateur ou prestataire (vu par les autres). */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { useProfilePublications } from '@/hooks/useProfilePublications'
import FollowButton from '@/components/FollowButton'
import type { Offer } from '@/components/offers/OfferCard'
import ProfileHeader from './ProfileHeader'
import ProfileBody from './ProfileBody'
import { ProfileSkeleton, ProfileUnavailable } from './ProfileStates'
import type { ProfileData, ProfilePublication } from './types'
import { isProfileRole, publicProfileHref } from './utils'

export default function PublicProfile({ userId }: { userId: string }) {
  const router = useRouter()
  const { user: viewer } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [followers, setFollowers] = useState(0)
  const [offers, setOffers] = useState<Offer[]>([])
  const pubs = useProfilePublications<ProfilePublication>(profile?.id)

  const isOwner = viewer ? Number(viewer.id) === Number(userId) : false
  const rawRole = profile?.user?.role
  const role = isProfileRole(rawRole) ? rawRole : null

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    apiFetch(apiUrl(`profile/user/${userId}`), { cache: 'no-store' })
      .then(async res => {
        if (cancelled) return
        if (res.status === 404 || res.status === 400) { setStatus('missing'); return }
        if (!res.ok) { setStatus('error'); return }
        const { profile: p } = await res.json()
        setProfile(p)
        setFollowers(p?.followersCount ?? 0)
        setStatus('ready')
      })
      .catch(() => { if (!cancelled) setStatus('error') })
    return () => { cancelled = true }
  }, [userId])

  // Un lien /artist/7 vers un organisateur : on redirige vers la bonne adresse
  useEffect(() => {
    if (!role) return
    const expected = publicProfileHref(role, userId)
    if (expected && !window.location.pathname.startsWith(expected)) router.replace(expected)
  }, [role, router, userId])

  // Lien de booking / équipe habituelle : /artist/7#agenda ouvre directement les disponibilités
  useEffect(() => {
    if (status !== 'ready' || window.location.hash !== '#agenda') return
    const timer = setTimeout(() => document.getElementById('agenda')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    return () => clearTimeout(timer)
  }, [status])

  useEffect(() => {
    if (!profile?.id || role === 'ARTIST') return
    apiFetch(apiUrl(`offers?organizerId=${profile.id}`), { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : []))
      .then(data => setOffers(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [profile?.id, role])

  if (status === 'loading') return <ProfileSkeleton />
  if (status !== 'ready' || !profile || !role) {
    return (
      <ProfileUnavailable
        title={status === 'error' ? 'Ce profil n’a pas pu être chargé' : 'Profil introuvable'}
        message={status === 'error' ? 'Réessaie dans quelques instants.' : 'Ce profil n’existe pas ou n’est plus disponible.'}
        action={{ href: '/search', label: 'Rechercher un profil' }}
      />
    )
  }

  return (
    <div className="relative min-h-screen text-white lsb-profile-page lsb-public-profile">
      <ProfileHeader
        profile={profile}
        mode="public"
        followersCount={followers}
        publicationsCount={pubs.total}
        actions={isOwner ? (
          <Link href="/studio-profile" className="flex items-center gap-2 whitespace-nowrap rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong">
            <Sparkles size={15} /> Modifier mon profil
          </Link>
        ) : (
          <>
            <FollowButton targetUserId={profile.userId} onFollowChange={following => setFollowers(c => following ? c + 1 : Math.max(0, c - 1))} />
            <Link href={`/messages?to=${profile.userId}`} className="whitespace-nowrap rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong">
              Contacter
            </Link>
          </>
        )}
      />
      <ProfileBody
        profile={profile}
        role={role}
        mode="public"
        pubs={pubs}
        offers={offers}
        isOwner={isOwner}
        viewer={{ role: viewer?.role ?? null, profileId: viewer?.profile?.id ?? null }}
      />
    </div>
  )
}
