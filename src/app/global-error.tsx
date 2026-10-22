'use client'

// Dernier filet : une erreur qui fait planter toute la page est signalée à Sentry,
// et le visiteur voit un message simple avec un bouton pour recharger.
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error) }, [error])

  return (
    <html lang="fr">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0d0a14', color: '#f4f0fa', fontFamily: 'Sora, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Un problème est survenu</h1>
          <p style={{ opacity: 0.7, marginBottom: 20 }}>L&apos;équipe LS Bookers a été prévenue. Vous pouvez réessayer.</p>
          <button onClick={() => reset()} style={{ background: '#7c3aed', color: '#fff', border: 0, borderRadius: 999, padding: '10px 22px', fontWeight: 600, cursor: 'pointer' }}>Réessayer</button>
        </div>
      </body>
    </html>
  )
}
