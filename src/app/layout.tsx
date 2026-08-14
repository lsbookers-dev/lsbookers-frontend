'use client'

import './globals.css'
import { ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getAuthToken } from '@/utils/auth'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

function LayoutContent({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  // Heartbeat — ping toutes les 60s pour maintenir le statut "en ligne"
  useEffect(() => {
    if (!user) return
    const ping = () => {
      const token = getAuthToken()
      if (!token) return
      fetch(`${API_BASE}/api/auth/heartbeat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    ping() // ping immédiat à la connexion
    const interval = setInterval(ping, 60_000)
    return () => clearInterval(interval)
  }, [user])

  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ]

  const isPublicPage =
    publicPaths.includes(pathname) || pathname.startsWith('/legal/')
  const isAdminPage = pathname.startsWith('/admin')

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-white">
        <p>Chargement de l’application...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {!isPublicPage && !isAdminPage && user && <Header />}
      <main className="flex-grow pb-safe-nav md:pb-0">{children}</main>
      {!isPublicPage && !isAdminPage && user && <Footer />}
    </div>
  )
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  )
}