import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 🚀 Routes accessibles sans authentification
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/contact',
  '/', // landing
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ✅ Si la route est publique → on laisse passer
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 🔒 Sinon, on vérifie la présence d’un cookie `token`
  const token = req.cookies.get('token')?.value

  if (!token) {
    // pas de token → redirection vers /login
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ✅ token présent → on laisse passer
  return NextResponse.next()
}

// Middleware appliqué à toutes les routes
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}