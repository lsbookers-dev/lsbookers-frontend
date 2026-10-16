/**
 * Nombre de messages non lus (pastille de « Messages » dans le bandeau gauche).
 * Mis à jour en temps réel (socket), quand un message est lu dans cet onglet (lsb:unread-changed),
 * au retour sur l'onglet, et toutes les 30 s en secours.
 */
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch, getAuthToken } from '@/utils/auth'
import { getSocket } from '@/lib/socket'

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

export function useUnreadMessages() {
  const { user } = useAuth() as { user: { id?: number | string } | null }
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!user?.id || !getAuthToken()) return
    try {
      const res = await apiFetch(`${API}/api/messages/unread-count?t=${Date.now()}`, { headers: { 'Cache-Control': 'no-store' } })
      if (res.ok) setCount(Number((await res.json()).count ?? 0))
    } catch { /* silencieux */ }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) { setCount(0); return }
    refresh()
    const interval = setInterval(refresh, 30_000)
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('lsb:unread-changed', refresh)
    const token = getAuthToken()
    const socket = token ? getSocket(token) : null
    socket?.on('new_message', refresh)
    socket?.on('conversation_updated', refresh)
    socket?.on('unread_changed', refresh)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('lsb:unread-changed', refresh)
      socket?.off('new_message', refresh)
      socket?.off('conversation_updated', refresh)
      socket?.off('unread_changed', refresh)
    }
  }, [user?.id, refresh])

  return count
}
