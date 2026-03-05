'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

/**
 * Routes accessibles sans authentification
 * - attention: ne mets PAS "/" comme préfixe (sinon tout matcherait)
 */
const PUBLIC_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/contact',
]
const isPublic = (pathname: string) =>
  pathname === '/' || PUBLIC_PREFIXES.some(p => pathname.startsWith(p))

export default function AuthGate() {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const { user } = useAuth()

  useEffect(() => {
    // Laisse passer toutes les pages publiques
    if (isPublic(pathname)) return

    // Si non connecté sur une page protégée → redirection vers /login
    if (!user) {
      const redirect = encodeURIComponent(pathname)
      router.replace(`/login?redirect=${redirect}`)
    }
  }, [pathname, user, router])

  return null
}