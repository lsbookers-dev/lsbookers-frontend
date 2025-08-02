import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const accessGranted = req.cookies.get('authorized')?.value

  // Liste des chemins publics
  const publicPaths = [
    '/access',
    '/_next',
    '/favicon.ico',
    '/logo.png',
    '/landing-background.jpg',
    '/fonts',
    '/images',
    '/styles',
    '/static',
  ]

  const isPublic = publicPaths.some((path) => pathname.startsWith(path))

  if (accessGranted === 'true' || isPublic) {
    return NextResponse.next()
  }

  const url = req.nextUrl.clone()
  url.pathname = '/access'
  return NextResponse.redirect(url)
}

// Appliquer le middleware à toutes les routes sauf les fichiers statiques
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}