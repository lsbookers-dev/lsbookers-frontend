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

  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/contact',
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
      <main className="flex-grow">{children}</main>
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