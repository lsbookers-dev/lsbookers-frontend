'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

type UserProfile = {
  typeEtablissement?: string
  location?: string
}

type OrganizerUser = {
  name: string
  role: string
  profile?: UserProfile
}

export default function OrganizerProfilePage() {
  const { id } = useParams()
  const { token } = useAuth()
  const [user, setUser] = useState<OrganizerUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !id) return

    fetch(`http://localhost:5001/api/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async res => {
        if (!res.ok) {
          const errText = await res.text()
          throw new Error(errText || 'Erreur de chargement')
        }
        return res.json()
      })
      .then(data => {
        if (!data || !data.user) throw new Error('Aucun utilisateur trouvé')
        setUser(data.user)
      })
      .catch(err => {
        console.error('Erreur de chargement:', err)
        setError(err.message)
      })
  }, [token, id])

  if (error) {
    return <div className="text-red-500 p-4">Erreur : {error}</div>
  }

  if (!user) {
    return <div className="text-white p-4">Chargement du profil...</div>
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-4">{user.name}</h1>
      <p className="text-lg mb-2">Rôle : {user.role}</p>
      <p className="text-md text-gray-400 mb-2">
        Établissement : {user.profile?.typeEtablissement || 'Non renseigné'}
      </p>
      <p className="text-md text-gray-400">
        Localisation : {user.profile?.location || 'Non renseignée'}
      </p>
    </div>
  )
}