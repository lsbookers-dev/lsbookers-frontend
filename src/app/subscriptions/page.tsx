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
  }, [user, router]) // ✅ Ajout de router pour corriger le warning ESLint

  if (!user) {
    return <div className="text-white p-8">Chargement...</div>
  }

  return (
    <div className="lsb-page min-h-screen text-white lsb-subscriptions-page">
      <header className="lsb-page-heading"><div><span>ABONNEMENTS</span><h1>Développez votre activité<em>.</em></h1><p>Choisissez les outils adaptés à votre rôle sur LSBookers.</p></div></header>

      {user.role === 'ARTIST' && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Formules pour les artistes</h2>
          <ul className="lsb-plan-grid">
            <li><strong>Visibilité</strong><span>Mise en avant sur la page d’accueil</span></li>
            <li><strong>Outils premium</strong><span>Accès à l’espace professionnel</span></li>
            <li><strong>Découverte</strong><span>Boost du profil dans les résultats</span></li>
          </ul>
        </div>
      )}

      {user.role === 'ORGANIZER' && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Formules pour les organisateurs</h2>
          <ul className="lsb-plan-grid">
            <li><strong>Événements</strong><span>Promotion de vos dates sur l’accueil</span></li>
            <li><strong>Campagnes</strong><span>Encarts sponsorisés ciblés</span></li>
            <li><strong>Recrutement</strong><span>Mise en avant auprès des artistes</span></li>
          </ul>
        </div>
      )}
    </div>
  )
}
