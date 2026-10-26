/** @type {import('next').NextConfig} */

// ── En-têtes de sécurité (CSP, anti-clickjacking...) ─────────────────────────
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'https://lsbookers-backend-production.up.railway.app')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '')
const API_WS = API_ORIGIN.replace(/^http/, 'ws')
const isDev = process.env.NODE_ENV !== 'production'

// En local, http://localhost:9000 = faux stockage R2 pour les essais d'envoi
// media.lsbookers.com = adresse à nous du stockage R2 (#324) ; *.r2.dev = ancienne adresse, gardée pour les anciens médias
const MEDIA_HOSTS = `https://media.lsbookers.com https://*.r2.dev https://*.public.blob.vercel-storage.com${isDev ? ' http://localhost:9000' : ''}`
// Envoi direct des fichiers du navigateur vers le stockage R2 (adresses signées, #275)
const UPLOAD_HOSTS = `https://*.r2.cloudflarestorage.com${isDev ? ' http://localhost:9000' : ''}`

const csp = [
  "default-src 'self'",
  // Next.js injecte des scripts inline au démarrage ; 'unsafe-eval' seulement en local (rechargement à chaud)
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${MEDIA_HOSTS} ${API_ORIGIN} https://*.tile.openstreetmap.org`,
  `media-src 'self' blob: ${MEDIA_HOSTS} ${API_ORIGIN}`,
  "font-src 'self' data:",
  `connect-src 'self' ${API_ORIGIN} ${API_WS} https://api.lsbookers.com wss://api.lsbookers.com https://geo.api.gouv.fr ${MEDIA_HOSTS} ${UPLOAD_HOSTS} https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.ingest.us.sentry.io`,
  'frame-src https://www.youtube.com https://www.youtube-nocookie.com https://w.soundcloud.com https://www.openstreetmap.org',
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
  `report-uri ${API_ORIGIN}/api/csp-report`,
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
]

const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      // ✅ Cloudflare R2, adresse à nous (#324)
      {
        protocol: 'https',
        hostname: 'media.lsbookers.com',
        pathname: '/**',
      },
      // ✅ Cloudflare R2, ancienne adresse (médias enregistrés avant media.lsbookers.com)
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        pathname: '/**',
      },
      // ✅ Vercel Blob (anciens médias uploadés avant migration R2)
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
  },
  // ✅ Next 15 attend un objet vide ici, pas un booléen
  experimental: {
    serverActions: {},
  },
}

export default nextConfig
