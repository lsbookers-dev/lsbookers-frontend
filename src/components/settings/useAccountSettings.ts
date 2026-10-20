/** Réglages du compte (GET / PATCH /api/account/settings) */
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'

export type NotifChannelPrefs = { bell: boolean; email: boolean }
export type AccountSettings = {
  email: string
  pendingEmail: string | null
  createdAt: string
  passwordChangedAt: string | null
  notifPrefs: Record<string, NotifChannelPrefs>
  weeklyRecap: boolean
  newsletterOptIn: boolean
  loginAlerts: boolean
  messagePolicy: 'EVERYONE' | 'FOLLOWED'
  hiddenFromSearch: boolean
  pausedAt: string | null
  role: string
}

export function useAccountSettings() {
  const { notify } = useFeedback()
  const [settings, setSettings] = useState<AccountSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const res = await apiFetch(apiUrl('account/settings'), { cache: 'no-store' })
      if (res.ok) setSettings((await res.json()).settings)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void reload() }, [reload])

  /** Enregistre un changement ; l'écran est mis à jour tout de suite, puis corrigé si le serveur refuse */
  const update = useCallback(async (patch: Partial<Omit<AccountSettings, 'notifPrefs'>> & { notifPrefs?: Record<string, Partial<NotifChannelPrefs>> }, message = 'Réglage enregistré') => {
    const previous = settings
    if (settings) {
      const rest = { ...patch }
      delete rest.notifPrefs
      const optimistic: AccountSettings = { ...settings, ...(rest as Partial<AccountSettings>) }
      if (patch.notifPrefs) {
        optimistic.notifPrefs = { ...settings.notifPrefs }
        for (const [key, value] of Object.entries(patch.notifPrefs)) optimistic.notifPrefs[key] = { ...settings.notifPrefs[key], ...value }
      }
      setSettings(optimistic)
    }
    try {
      const res = await apiFetch(apiUrl('account/settings'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Impossible d’enregistrer ce réglage.'))
      setSettings((await res.json()).settings)
      notify(message)
      return true
    } catch (err) {
      setSettings(previous)
      notify(err instanceof Error ? err.message : 'Impossible d’enregistrer ce réglage.', 'error')
      return false
    }
  }, [settings, notify])

  return { settings, setSettings, loading, reload, update }
}
