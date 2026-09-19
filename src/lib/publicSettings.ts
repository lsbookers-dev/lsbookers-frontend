import 'server-only'

import {
  FALLBACK_PUBLIC_SETTINGS,
  type PublicSettings,
} from '@/lib/publicSettings.shared'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.lsbookers.com').replace(/\/$/, '')

function valueOrFallback(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback
}

export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    const response = await fetch(`${API_BASE}/api/admin/settings`, {
      next: { revalidate: 60 },
    })

    if (!response.ok) return FALLBACK_PUBLIC_SETTINGS

    const settings = await response.json()
    return {
      landingBgUrl: valueOrFallback(settings?.landingBgUrl, FALLBACK_PUBLIC_SETTINGS.landingBgUrl),
      loginBgUrl: valueOrFallback(settings?.loginBgUrl, FALLBACK_PUBLIC_SETTINGS.loginBgUrl),
      registerBgUrl: valueOrFallback(settings?.registerBgUrl, FALLBACK_PUBLIC_SETTINGS.registerBgUrl),
      landingLogoUrl: valueOrFallback(settings?.landingLogoUrl, FALLBACK_PUBLIC_SETTINGS.landingLogoUrl),
      headerLogoUrl: valueOrFallback(settings?.headerLogoUrl, FALLBACK_PUBLIC_SETTINGS.headerLogoUrl),
    }
  } catch {
    return FALLBACK_PUBLIC_SETTINGS
  }
}
