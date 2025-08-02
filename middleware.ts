import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const accessGranted = req.cookies.get('access_granted')?.value

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

  if (accessGranted === 'true' || isPublic) {
    return NextResponse.next()
  }

  const url = req.nextUrl.clone()
  url.pathname = '/access'
  return NextResponse.redirect(url)
}

// ⬇️ INDISPENSABLE ⬇️
export const config = {
  matcher: ['/', '/((?!access|_next|favicon.ico|logo.png|landing-background.jpg|api|fonts|images|styles|static).*)'],
}