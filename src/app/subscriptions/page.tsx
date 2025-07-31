'use client'

import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SubscriptionsPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.replace('/login')
    }
  }, [user])

  if (!user) {
    return <div className="text-white p-8">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Abonnements</h1>

      {user.role === 'ARTIST' && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Formules pour les artistes 🎤</h2>
          <ul className="space-y-4">
            <li className="bg-gray-800 p-4 rounded">🔹 Mise en avant sur la page d'accueil</li>
            <li className="bg-gray-800 p-4 rounded">🔹 Accès à l’espace premium</li>
            <li className="bg-gray-800 p-4 rounded">🔹 Boost du profil dans les résultats de recherche</li>
          </ul>
        </div>
      )}

      {user.role === 'ORGANIZER' && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Formules pour les établissements 🏢</h2>
          <ul className="space-y-4">
            <li className="bg-gray-800 p-4 rounded">🔸 Promotion d’événements sur la page d'accueil</li>
            <li className="bg-gray-800 p-4 rounded">🔸 Encarts publicitaires sponsorisés</li>
            <li className="bg-gray-800 p-4 rounded">🔸 Mise en avant de vos soirées auprès des artistes</li>
          </ul>
        </div>
      )}
    </div>
  )
}