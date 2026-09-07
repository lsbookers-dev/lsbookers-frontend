'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getAuthToken } from '@/utils/auth'
import {
  ArrowRight, CalendarDays, CheckCircle2, Eye, ImagePlus,
  MapPin, MessageCircle, Sparkles, Star, Users,
} from 'lucide-react'

type Profile = {
  id: number
  avatar?: string | null
  banner?: string | null
  bio?: string | null
  profession?: string | null
  location?: string | null
  specialties?: string[]
  followersCount?: number
  followingCount?: number
  reviewsAvg?: number | null
  reviewsCount?: number
  availableForBooking?: boolean
  user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null }
}

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

export default function SpacePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const token = getAuthToken()
    fetch(`${API}/api/profile/me`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(response => response.ok ? response.json() : null)
      .then(data => setProfile(data?.profile || null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const name = profile?.user?.pseudo || [profile?.user?.firstName, profile?.user?.lastName].filter(Boolean).join(' ') || user?.name || 'Votre espace'
  const completion = useMemo(() => {
    const checks = [profile?.avatar, profile?.banner, profile?.bio, profile?.profession, profile?.location, profile?.specialties?.length]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [profile])

  if (loading) return <div className="lsb-state-screen">Préparation de votre espace…</div>

  return (
    <div className="lsb-page lsb-space-page">
      <header className="lsb-page-heading">
        <div><span>MON ESPACE</span><h1>Bonsoir, {name}<em>.</em></h1><p>Votre activité, vos prochaines dates et votre image en un coup d’œil.</p></div>
        <Link href="/studio-profile" className="lsb-primary-button"><Sparkles /> Compléter mon profil</Link>
      </header>

      <section className="lsb-dashboard-hero">
        <div className="lsb-dashboard-cover">
          {profile?.banner && <Image src={profile.banner} alt="" fill className="object-cover" unoptimized />}
          <div className="lsb-dashboard-cover-shade" />
          <div className="lsb-dashboard-identity">
            <div className="lsb-dashboard-avatar">
              {profile?.avatar ? <Image src={profile.avatar} alt={name} fill className="object-cover" unoptimized /> : name.slice(0, 2).toUpperCase()}
            </div>
            <div><span>{profile?.profession || user?.role}</span><h2>{name}</h2><p><MapPin /> {profile?.location || 'Localisation à compléter'}</p></div>
          </div>
          <Link href="/studio-profile" className="lsb-glass-button"><Eye /> Voir et modifier le profil public</Link>
        </div>
        <div className="lsb-dashboard-metrics">
          <div><Users /><strong>{profile?.followersCount ?? 0}</strong><span>Abonnés</span></div>
          <div><Star /><strong>{profile?.reviewsAvg?.toFixed(1) || '—'}</strong><span>{profile?.reviewsCount ?? 0} avis</span></div>
          <div><CheckCircle2 /><strong>{profile?.availableForBooking ? 'Oui' : 'Non'}</strong><span>Disponible</span></div>
          <div><Sparkles /><strong>{completion}%</strong><span>Profil complété</span></div>
        </div>
      </section>

      <div className="lsb-dashboard-grid">
        <section className="lsb-panel lsb-next-date">
          <div className="lsb-panel-title"><div><span>PROCHAINE ÉTAPE</span><h2>Votre agenda professionnel</h2></div><CalendarDays /></div>
          <div className="lsb-date-card"><div><strong>—</strong><span>À VENIR</span></div><div><h3>Organisez vos prochaines dates</h3><p>Centralisez vos disponibilités, événements et demandes de booking.</p></div></div>
          <Link href="/agenda">Ouvrir l’agenda <ArrowRight /></Link>
        </section>

        <section className="lsb-panel">
          <div className="lsb-panel-title"><div><span>VOTRE IMAGE</span><h2>Profil public</h2></div><ImagePlus /></div>
          <p className="lsb-panel-copy">Choisissez ce que les visiteurs voient et contrôlez l’ordre de vos contenus.</p>
          <div className="lsb-progress-row"><div><i style={{ width: `${completion}%` }} /></div><strong>{completion}%</strong></div>
          <Link href="/studio-profile">Accéder au Studio profil <ArrowRight /></Link>
        </section>

        <section className="lsb-panel">
          <div className="lsb-panel-title"><div><span>RELATIONS</span><h2>Votre réseau</h2></div><Users /></div>
          <p className="lsb-panel-copy">{profile?.followingCount ?? 0} comptes suivis. Découvrez de nouveaux talents et partenaires.</p>
          <Link href="/discover">Explorer les profils <ArrowRight /></Link>
        </section>

        <section className="lsb-panel">
          <div className="lsb-panel-title"><div><span>ÉCHANGES</span><h2>Messagerie</h2></div><MessageCircle /></div>
          <p className="lsb-panel-copy">Retrouvez vos conversations, propositions et demandes de booking.</p>
          <Link href="/messages">Voir les messages <ArrowRight /></Link>
        </section>
      </div>
    </div>
  )
}
