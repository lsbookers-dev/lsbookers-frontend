'use client'

import './globals.css'
import { ReactNode, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

function LayoutContent({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // ✅ Ajout : toutes les pages accessibles sans connexion
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/contact',
  ]

  const isPublicPage = publicPaths.includes(pathname)
  const isAdminPage = pathname.startsWith('/admin')

  // 🚫 Si non connecté et page privée → redirection login
  useEffect(() => {
    if (!loading && !user && !isPublicPage && !isAdminPage) {
      router.replace('/login')
    }
  }, [loading, user, isPublicPage, isAdminPage, router])

  // ⏳ Attente du chargement du contexte d’auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <p>Chargement de l’application...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* ✅ Afficher Header sauf sur pages publiques ou admin */}
      {!isPublicPage && !isAdminPage && user && <Header />}

      <main className="flex-grow">{children}</main>

      {/* ✅ Footer sauf sur pages publiques ou admin */}
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