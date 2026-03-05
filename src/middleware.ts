import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 🚀 Routes accessibles sans authentification
const PUBLIC_PATHS = [
  '/', // landing (exact match)
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/contact',
  '/legal', // ✅ toutes les pages légales (terms/privacy/mentions)
]

function isPublicPath(pathname: string) {
  // Landing seulement sur "/"
  if (pathname === '/') return true

  // Autorise la route exacte ou ses sous-routes (ex: /legal/terms)
  return PUBLIC_PATHS.some(p => p !== '/' && (pathname === p || pathname.startsWith(p + '/')))
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ✅ Laisse passer les routes publiques
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // 🔒 Vérifie cookie token
  const token = req.cookies.get('token')?.value

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}