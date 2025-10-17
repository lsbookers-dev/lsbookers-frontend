import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Chemins accessibles sans être connecté
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/',
  '/contact',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Si c’est une route publique, on laisse passer
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Sinon, on vérifie s’il y a un token dans le localStorage (pas dispo côté serveur)
  // donc on check via cookies JWT s’il y en a un (optionnel)
  const token = req.cookies.get('token')?.value
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Appliquer sur toutes les routes
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}