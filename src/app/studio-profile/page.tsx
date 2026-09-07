'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function StudioProfileRedirect() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) return router.replace('/login')
    if (user.role === 'ARTIST') return router.replace('/profile/artist')
    if (user.role === 'ORGANIZER') return router.replace('/profile/organizer')
    if (user.role === 'PROVIDER') return router.replace('/profile/provider')
    router.replace('/admin/dashboard')
  }, [loading, router, user])

  return <div className="lsb-state-screen">Ouverture du Studio profil…</div>
}
