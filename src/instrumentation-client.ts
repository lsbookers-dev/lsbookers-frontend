// Surveillance des erreurs dans le navigateur (Sentry).
// Inactive tant que NEXT_PUBLIC_SENTRY_DSN n'est pas renseigné sur Vercel.
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
    tracesSampleRate: 0,   // uniquement les erreurs, pas de mesure de performance
    // Erreurs sans intérêt (extensions de navigateur, coupures réseau)
    ignoreErrors: ['ResizeObserver loop', 'Failed to fetch', 'Load failed', 'NetworkError', 'AbortError'],
    beforeSend(event) {
      if (event.request?.url) event.request.url = event.request.url.split('?')[0]
      return event
    },
  })
}
