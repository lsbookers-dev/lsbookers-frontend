import './globals.css'
import type { ReactNode } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { PublicSettingsProvider } from '@/context/PublicSettingsContext'
import ClientLayout from '@/components/ClientLayout'
import { getPublicSettings } from '@/lib/publicSettings'

export default async function RootLayout({ children }: { children: ReactNode }) {
  const publicSettings = await getPublicSettings()

  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7C3AED" />
        <meta name="msapplication-TileColor" content="#7C3AED" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LSBookers" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        <PublicSettingsProvider settings={publicSettings}>
          <AuthProvider>
            <ClientLayout>{children}</ClientLayout>
          </AuthProvider>
        </PublicSettingsProvider>
      </body>
    </html>
  )
}
