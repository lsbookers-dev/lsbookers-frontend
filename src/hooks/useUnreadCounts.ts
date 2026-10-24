/**
 * Pastilles du site : messages non lus (enveloppe) et notifications non lues (cloche).
 *
 * Un seul compteur partagé par tout le site (bandeau, menu de gauche, barre mobile) :
 * un seul appel au serveur pour les deux pastilles, quel que soit le nombre d'endroits qui les affichent.
 * Mis à jour en temps réel (socket), quand quelque chose est lu dans cet onglet (lsb:unread-changed),
 * au retour sur l'onglet, et toutes les 3 min en secours — jamais quand l'onglet est caché.
 */
import { useEffect, useSyncExternalStore } from 'react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch, getAuthToken } from '@/utils/auth'
import { getSocket } from '@/lib/socket'
import { API_BASE } from '@/utils/api'

export type UnreadCounts = { messages: number; notifications: number }

const EMPTY: UnreadCounts = { messages: 0, notifications: 0 }
const FALLBACK_EVERY_MS = 3 * 60 * 1000
const MIN_GAP_ON_RETURN_MS = 15 * 1000 // retour sur l'onglet : pas de nouvel appel si le dernier a moins de 15 s
const SOCKET_EVENTS = ['conversation_updated', 'unread_changed', 'notifications_changed']

let counts: UnreadCounts = EMPTY
const listeners = new Set<() => void>()
let users = 0
let stopCurrent: (() => void) | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let lastFetchAt = 0

function setCounts(next: UnreadCounts) {
  if (next.messages === counts.messages && next.notifications === counts.notifications) return
  counts = next
  listeners.forEach(l => l())
}

async function fetchCounts() {
  if (!getAuthToken()) return
  lastFetchAt = Date.now()
  try {
    const res = await apiFetch(`${API_BASE}/api/notifications/counts?t=${Date.now()}`, { headers: { 'Cache-Control': 'no-store' } })
    if (!res.ok) return
    const data = await res.json()
    setCounts({ messages: Number(data?.messages ?? 0), notifications: Number(data?.notifications ?? 0) })
  } catch { /* silencieux */ }
}

/** Demande une mise à jour des pastilles (plusieurs demandes rapprochées = un seul appel) */
export function refreshUnreadCounts() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { debounceTimer = null; fetchCounts() }, 250)
}

/** Remise à zéro immédiate de la cloche (ouverture de la liste des notifications) */
export function clearUnreadNotifications() {
  setCounts({ ...counts, notifications: 0 })
}

function start() {
  fetchCounts()
  const isVisible = () => document.visibilityState === 'visible'
  const interval = setInterval(() => { if (isVisible()) fetchCounts() }, FALLBACK_EVERY_MS)
  const onReturn = () => {
    if (isVisible() && Date.now() - lastFetchAt > MIN_GAP_ON_RETURN_MS) refreshUnreadCounts()
  }
  document.addEventListener('visibilitychange', onReturn)
  window.addEventListener('focus', onReturn)
  window.addEventListener('lsb:unread-changed', refreshUnreadCounts)
  const token = getAuthToken()
  const socket = token ? getSocket(token) : null
  SOCKET_EVENTS.forEach(e => socket?.on(e, refreshUnreadCounts))

  return () => {
    clearInterval(interval)
    document.removeEventListener('visibilitychange', onReturn)
    window.removeEventListener('focus', onReturn)
    window.removeEventListener('lsb:unread-changed', refreshUnreadCounts)
    SOCKET_EVENTS.forEach(e => socket?.off(e, refreshUnreadCounts))
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function useUnreadCounts(): UnreadCounts {
  const { user } = useAuth() as { user: { id?: number | string } | null }
  const userId = user?.id ?? null

  useEffect(() => {
    if (!userId) return
    users += 1
    if (users === 1) stopCurrent = start()
    return () => {
      users -= 1
      if (users === 0) {
        stopCurrent?.()
        stopCurrent = null
        setCounts(EMPTY)
      }
    }
  }, [userId])

  const value = useSyncExternalStore(subscribe, () => counts, () => EMPTY)
  return userId ? value : EMPTY
}
