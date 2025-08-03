'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import Image from 'next/image'

export default function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const goTo = (path: string) => router.push(path)

  const goToProfile = () => {
    if (!user) return
    switch (user.role) {
      case 'ARTIST':
        goTo('/profile/artist')
        break
      case 'ORGANIZER':
        goTo('/profile/organizer')
        break
      case 'PROVIDER':
        goTo('/profile/provider')
        break
      case 'ADMIN':
        goTo('/admin/dashboard')
        break
      default:
        goTo('/profile')
    }
  }

  return (
    <header className="bg-gray-900 text-white px-6 py-4 shadow-md flex items-center justify-between sticky top-0 z-50">
      {/* Logo */}
      <div className="cursor-pointer" onClick={() => goTo('/home')}>
        <Image src="/logo-lsbookers.png" alt="Logo LSBookers" width={40} height={40} />
      </div>

      {/* Menu de navigation */}
      <nav className="hidden md:flex gap-8 text-sm font-medium">
        <button onClick={() => goTo('/search')} className="hover:text-blue-400 transition-colors">Recherche</button>
        <button onClick={() => goTo('/messages')} className="hover:text-blue-400 transition-colors">Messagerie</button>
        <button onClick={() => goTo('/events')} className="hover:text-blue-400 transition-colors">Événements</button>
        <button onClick={() => goTo('/subscriptions')} className="hover:text-blue-400 transition-colors">Abonnements</button>
      </nav>

      {/* Notifications + Photo de profil */}
      <div className="flex items-center gap-6 relative">
        {/* Notifications */}
        <div
          className="relative cursor-pointer hover:text-blue-400 transition-colors"
          onClick={() => alert('Notifications à venir')}
        >
          🔔
          <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            3
          </span>
        </div>

        {/* Photo de profil */}
        <div className="relative">
          <Image
            src={user?.avatarUrl || '/default-avatar.png'}
            alt="Profil"
            width={36}
            height={36}
            className="rounded-full cursor-pointer border-2 border-white hover:border-blue-400 transition"
            onClick={() => setMenuOpen(!menuOpen)}
            unoptimized
          />
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded shadow-md z-50">
              <button
                onClick={() => {
                  setMenuOpen(false)
                  goToProfile()
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-700"
              >
                Voir le profil
              </button>
              <button
                onClick={() => {
                  logout()
                  setMenuOpen(false)
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-red-400"
              >
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}