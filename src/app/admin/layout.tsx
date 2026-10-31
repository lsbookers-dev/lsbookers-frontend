'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import AdminHeader from '@/components/AdminHeader'
import { useAdminIdleLogout } from '@/hooks/useAdminIdleLogout'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, endAdminSession } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // 1 h sans activité : la session admin se ferme (le serveur la refuse aussi)
  useAdminIdleLogout(() => { endAdminSession('idle') }, user?.role === 'ADMIN')

  useEffect(() => {
    // Pas connecté → login
    if (!user) {
      router.replace('/login')
      return
    }

    // Pas admin → home
    if (user.role !== 'ADMIN') {
      router.replace('/home')
      return
    }

    // Admin et on est sur /admin (racine) → rediriger vers dashboard
    if (pathname === '/admin' || pathname === '/admin/') {
      router.replace('/admin/dashboard')
    }
  }, [user, router, pathname])

  // Pendant la redirection, ne rien afficher
  if (!user || user.role !== 'ADMIN') return null

  return (
    <div className="min-h-screen text-white lsb-admin-shell">
      <AdminHeader />
      <main className="pt-16 p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  )
}
