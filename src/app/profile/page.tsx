'use client'

import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfileRedirectPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else if (['ARTIST', 'ORGANIZER', 'PROVIDER'].includes(user.role)) {
      router.push('/space')
    } else {
      router.push('/home')
    }
  }, [user, router]) // ✅ Ajouté router ici

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <p>Redirection vers votre profil...</p>
    </div>
  )
}
