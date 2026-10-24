'use client'

import { type ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import InstallPrompt from '@/components/InstallPrompt'
import { MobileAnnouncement } from '@/components/HeaderAnnouncement'
import PausedAccountBanner from '@/components/settings/PausedAccountBanner'
import AppSidebar from '@/components/AppSidebar'
import UpgradePrompt from '@/components/plan/UpgradePrompt'
import SignupPlanRedirect from '@/components/plan/SignupPlanRedirect'

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  // Statut « en ligne » : plus d'appel toutes les minutes, le serveur le déduit de la
  // connexion temps réel ouverte par les pastilles (useUnreadCounts).

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    // En local (npm run dev), les fichiers du site ne changent pas de nom : le cache
    // du service worker servirait d'anciennes versions. On ne l'active qu'en production.
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {})
      return
    }
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.error('SW registration failed:', err))
  }, [])

  const publicPaths = [
    '/', '/login', '/register', '/forgot-password', '/reset-password',
    '/verify-email', '/device-verified', '/contact', '/confirm-email-change',
  ]
  const isPublicPage = publicPaths.includes(pathname) || pathname.startsWith('/legal/') || pathname.startsWith('/b/')
  const isAdminPage = pathname.startsWith('/admin')
  // Contact et pages légales sont publics, mais un membre connecté y garde le menu du site pour pouvoir revenir
  const keepsNavWhenLoggedIn = pathname === '/contact' || pathname.startsWith('/legal/')
  const showAppNav = (!isPublicPage || keepsNavWhenLoggedIn) && !isAdminPage && !!user

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
        {showAppNav && <PausedAccountBanner />}
        {showAppNav && <MobileAnnouncement />}
        {children}
      </main>
      {showAppNav && <BottomNav />}
      {/* Appli installée sur iPhone : la barre d'état (heure, encoche) est transparente */}
      <div className="lsb-status-shield md:hidden" aria-hidden="true" />
      <InstallPrompt />
      {!!user && <UpgradePrompt />}
      {!!user && user.role !== 'ADMIN' && <SignupPlanRedirect />}
    </div>
  )
}
