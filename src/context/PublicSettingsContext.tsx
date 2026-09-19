'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { FALLBACK_PUBLIC_SETTINGS, type PublicSettings } from '@/lib/publicSettings.shared'

const PublicSettingsContext = createContext<PublicSettings>(FALLBACK_PUBLIC_SETTINGS)

export function PublicSettingsProvider({
  children,
  settings,
}: {
  children: ReactNode
  settings: PublicSettings
}) {
  return (
    <PublicSettingsContext.Provider value={settings}>
      {children}
    </PublicSettingsContext.Provider>
  )
}

export function usePublicSettings() {
  return useContext(PublicSettingsContext)
}
