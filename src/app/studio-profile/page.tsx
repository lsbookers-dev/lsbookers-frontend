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
    // On garde ?edit=… (ouverture directe de l'éditeur depuis Mon espace)
    const query = window.location.search
    if (user.role === 'ARTIST') return router.replace(`/profile/artist${query}`)
    if (user.role === 'ORGANIZER') return router.replace(`/profile/organizer${query}`)
    if (user.role === 'PROVIDER') return router.replace(`/profile/provider${query}`)
    router.replace('/admin/dashboard')
  }, [loading, router, user])

  return <div className="lsb-state-screen">Ouverture du Studio profil…</div>
}
