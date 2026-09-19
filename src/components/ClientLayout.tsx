'use client'

import { type ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import InstallPrompt from '@/components/InstallPrompt'
import AppSidebar from '@/components/AppSidebar'
import { getAuthToken } from '@/utils/auth'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()

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

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.error('SW registration failed:', err))
    }
  }, [])

  const publicPaths = [
    '/', '/login', '/register', '/forgot-password', '/reset-password',
    '/verify-email', '/device-verified', '/contact',
  ]
  const isPublicPage = publicPaths.includes(pathname) || pathname.startsWith('/legal/')
  const isAdminPage = pathname.startsWith('/admin')
  const showAppNav = !isPublicPage && !isAdminPage && !!user

  if (!isPublicPage && (loading || !user)) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <p>Chargement de l&apos;application...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {showAppNav && (
        <div className="hidden md:block">
          <Header />
          <AppSidebar />
        </div>
      )}
      <main
        className={`flex-grow ${showAppNav ? 'lsb-app-main' : ''}`}
        style={{
          paddingBottom: showAppNav
            ? 'calc(4rem + env(safe-area-inset-bottom))'
            : undefined,
        }}
      >
        <style>{`@media (min-width: 768px) { main { padding-bottom: 0 !important; } }`}</style>
        {children}
      </main>
      {showAppNav && <BottomNav />}
      <InstallPrompt />
    </div>
  )
}
