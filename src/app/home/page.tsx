'use client'

import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user])

  if (!user) return null

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* 🔁 CARROUSEL DES ABONNÉS */}
      <section className="w-full bg-gray-900 py-4 px-6 overflow-x-auto whitespace-nowrap">
        <h2 className="text-xl font-bold mb-3">🔥 Profils mis en avant</h2>
        <div className="flex gap-4">
          {/* Exemple de contenu média premium */}
          <div className="bg-gray-800 rounded min-w-[250px] p-2">
            <img src="/media/djstar.jpg" alt="DJ Star" className="w-full h-32 object-cover rounded mb-2" />
            <p className="text-center font-semibold">DJ Star 🔥</p>
          </div>
          <div className="bg-gray-800 rounded min-w-[250px] p-2">
            <video src="/media/mcflow.mp4" controls className="w-full h-32 object-cover rounded mb-2" />
            <p className="text-center font-semibold">MC Flow 🌟</p>
          </div>
          <div className="bg-gray-800 rounded min-w-[250px] p-2">
            <img src="/media/hostqueen.jpg" alt="Host Queen" className="w-full h-32 object-cover rounded mb-2" />
            <p className="text-center font-semibold">Host Queen ✨</p>
          </div>
        </div>
      </section>

      {/* 📰 MUR D’ACTUALITÉ */}
      <section className="flex-1 px-6 py-6 bg-black">
        <h2 className="text-2xl font-bold mb-4">📰 Mur d’actualité</h2>
        <div className="space-y-4">
          {/* Publication d’un suivi */}
          <div className="bg-gray-800 p-4 rounded">
            <p className="font-semibold">DJ Star</p>
            <p className="text-sm text-gray-300">Nouvelle vidéo postée ! 🎶</p>
          </div>
          {/* Suggestion de contenu */}
          <div className="bg-gray-800 p-4 rounded border border-yellow-400">
            <p className="font-semibold">Suggestion : MC Flow</p>
            <p className="text-sm text-gray-300">Annonce d’un événement privé à Paris 📍</p>
          </div>
        </div>
      </section>

      {/* 🎉 ÉVÉNEMENTS MIS EN AVANT */}
      <section className="px-6 py-6 bg-gray-900">
        <h2 className="text-2xl font-bold mb-4">🎉 Événements à ne pas manquer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-lg font-bold">Concert Live - Marseille</h3>
            <p className="text-sm text-gray-300">Samedi 10 août - DJ Luna 💎</p>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-lg font-bold">Soirée Rooftop - Paris</h3>
            <p className="text-sm text-gray-300">Vendredi 16 août - MC Flow 🌟</p>
          </div>
        </div>
      </section>
    </div>
  )
}