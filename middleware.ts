import { NextRequest, NextResponse } from 'next/server'

// Middleware de protection
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const access = req.cookies.get('authorized')?.value

  // Autoriser les chemins publics
  const publicPaths = [
    '/access',
    '/favicon.ico',
    '/_next',
    '/fonts',
    '/images',
    '/styles',
    '/api',
    '/uploads',
    '/landing-background.jpg',
    '/logo.png',
  ]

  const isPublic = publicPaths.some(path => pathname.startsWith(path))

  if (isPublic || access === 'true') {
    return NextResponse.next()
  }

  const url = req.nextUrl.clone()
  url.pathname = '/access'
  return NextResponse.redirect(url)
}

// Ciblage du middleware sur toutes les pages sauf les fichiers statiques
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|access).*)'],
}