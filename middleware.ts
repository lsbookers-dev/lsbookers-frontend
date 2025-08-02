import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const accessGranted = req.cookies.get('access_granted')?.value

  // Autorise certaines routes publiques
  const publicPaths = [
    '/access',
    '/api',
    '/_next',
    '/favicon.ico',
    '/logo.png',
    '/landing-background.jpg',
    '/fonts',
    '/images',
    '/styles',
    '/static',
  ]

  const isPublic = publicPaths.some(path => pathname.startsWith(path))

  // Si le cookie est présent, laisse passer
  if (accessGranted === 'true' || isPublic) {
    return NextResponse.next()
  }

  // Sinon, redirige vers /access
  const url = req.nextUrl.clone()
  url.pathname = '/access'
  return NextResponse.redirect(url)
}