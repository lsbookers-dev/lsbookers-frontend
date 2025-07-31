'use client'

import './globals.css'
import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

function LayoutContent({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register'
  const isAdminPage = pathname.startsWith('/admin')

  // ⏳ Attente du chargement du contexte
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <p>Chargement de l’application...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* ✅ Afficher le Header uniquement si ce n’est pas une page publique ou admin */}
      {!isPublicPage && !isAdminPage && user && <Header />}

      <main className="flex-grow">{children}</main>

      {/* ✅ Footer classique uniquement si ce n’est pas une page publique ou admin */}
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