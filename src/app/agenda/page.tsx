'use client'

import { useEffect, useState } from 'react'
import AgendaCalendar from '@/components/AgendaCalendar'
import { useAuth } from '@/context/AuthContext'
import { getAuthToken } from '@/utils/auth'

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

export default function AgendaPage() {
  const { user } = useAuth()
  const [profileId, setProfileId] = useState<number | null>(null)
  const [country, setCountry] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const token = getAuthToken()
    fetch(`${API}/api/profile/me`, { credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(response => response.ok ? response.json() : null)
      .then(data => { setProfileId(data?.profile?.id || null); setCountry(data?.profile?.country || null) })
      .catch(() => {})
  }, [user])

  return (
    <div className="lsb-page lsb-agenda-page">
      {profileId ? (
        <div className="lsb-agenda-shell"><AgendaCalendar profileId={profileId} isOwner showAvailability defaultCountry={country} /></div>
      ) : (
        <div className="lsb-panel lsb-empty-panel">Votre profil doit être complété pour utiliser l’agenda.</div>
      )}
    </div>
  )
}
