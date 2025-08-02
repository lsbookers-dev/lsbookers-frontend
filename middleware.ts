import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const accessGranted = req.cookies.get('access_granted')?.value

  // Routes publiques à laisser passer
  const publicPaths = [
    '/access',
    '/favicon.ico',
    '/logo.png',
    '/landing-background.jpg',
    '/fonts',
    '/images',
    '/styles',
    '/_next',
    '/api/auth', // utile si tu veux laisser login/register
  ]

  const isPublic = publicPaths.some(path => pathname.startsWith(path))

  if (accessGranted === 'true' || isPublic) {
    return NextResponse.next()
  }

  // Sinon rediriger vers /access
  const url = req.nextUrl.clone()
  url.pathname = '/access'
  return NextResponse.redirect(url)
}

// 👇 Très important : matcher correctement les routes à surveiller
export const config = {
  matcher: [
    '/((?!access|_next|favicon.ico|logo.png|landing-background.jpg|fonts|images|styles|api/auth).*)',
  ],
}