'use client'

import './globals.css'
import { ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import InstallPrompt from '@/components/InstallPrompt'
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
    ping()
    const interval = setInterval(ping, 60_000)
    return () => clearInterval(interval)
  }, [user])

  // Enregistrement du Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.error('SW registration failed:', err))
    }
  }, [])

  const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password']
  const isPublicPage = publicPaths.includes(pathname) || pathname.startsWith('/legal/')
  const isAdminPage  = pathname.startsWith('/admin')
  const showAppNav   = !isPublicPage && !isAdminPage && !!user

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-white">
        <p>Chargement de l'application...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* Header → desktop uniquement (md+) */}
      {showAppNav && (
        <div className="hidden md:block">
          <Header />
        </div>
      )}

      {/* Contenu principal — padding bottom sur mobile pour la BottomNav */}
      <main
        className="flex-grow"
        style={{
          paddingBottom: showAppNav
            ? 'calc(4rem + env(safe-area-inset-bottom))'
            : undefined,
        }}
      >
        <style>{`@media (min-width: 768px) { main { padding-bottom: 0 !important; } }`}</style>
        {children}
      </main>

      {/* Footer → desktop uniquement */}
      {showAppNav && (
        <div className="hidden md:block">
          <Footer />
        </div>
      )}

      {/* BottomNav → mobile uniquement (< md), toujours affichée si connecté */}
      {showAppNav && <BottomNav />}

      {/* Invite d'installation PWA */}
      <InstallPrompt />
    </div>
  )
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* PWA — Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* PWA — Thème et couleurs */}
        <meta name="theme-color" content="#7C3AED" />
        <meta name="msapplication-TileColor" content="#7C3AED" />

        {/* PWA — iOS / Safari */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LSBookers" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144.png" />

        {/* PWA — Icônes standards */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />

        {/* Viewport avec safe area pour iPhone notch */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  )
}
