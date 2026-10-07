import type { MetadataRoute } from 'next'

// Pages ouvertes à Google : accueil, inscription, connexion, contact, pages légales.
// Le reste demande un compte : inutile (et indésirable) de le faire explorer.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/register', '/contact', '/legal/'],
      disallow: [
        '/admin', '/agenda', '/discover', '/home', '/messages', '/notifications',
        '/offers', '/profile', '/search', '/settings', '/space', '/subscriptions',
        '/forgot-password', '/reset-password', '/verify-email', '/device-verified',
        '/studio-profile',
      ],
    },
    sitemap: 'https://lsbookers.com/sitemap.xml',
    host: 'https://lsbookers.com',
  }
}
