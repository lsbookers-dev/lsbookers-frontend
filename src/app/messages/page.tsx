'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Role = 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | 'ADMIN'

interface ProfileLite { avatar?: string | null }
interface User {
  id: number
  name: string
  role: Role
  image?: string | null
  profile?: ProfileLite | null
}
interface Conversation {
  id: number
  participants: User[]
  lastMessage: string
  updatedAt: string
}
interface MessageLite {
  id: string | number
  seen: boolean | null
  sender: { id: number }
  createdAt: string
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

// mêmes teintes que la recherche
const ACCENT_FROM = 'from-pink-600'
const ACCENT_CENTER = 'via-violet-600'
const ACCENT_TO = 'to-blue-600'

// URL absolue (avatars)
const toAbs = (u?: string | null) => {
  if (!u) return ''
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('//')) return `https:${u}`
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

export default function MessagesPage() {
  const { user, token } = useAuth()
  const router = useRouter()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [unreadMap, setUnreadMap] = useState<Record<number, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const authedHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  )

  const getAvatarSrc = (u?: User | null) =>
    toAbs(u?.profile?.avatar || u?.image || '/default-avatar.png')

  /* Charger conversations */
  const fetchConversations = useCallback(async () => {
    if (!token) return
    try {
      setError(null)
      const res = await fetch(`${API_BASE}/api/messages/conversations?t=${Date.now()}`, {
        headers: authedHeaders,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const raw = await res.json()
      const list: Conversation[] = (raw?.conversations ?? raw ?? []) as Conversation[]
      const sorted = [...(Array.isArray(list) ? list : [])].sort(
        (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
      )
      setConversations(sorted)
    } catch (err) {
      console.error('Conversations load error:', err)
      setError('Impossible de charger les conversations.')
    }
  }, [token, authedHeaders])

  /* Calculer non-lus en front (temporaire) */
  const computeUnread = useCallback(async (convs: Conversation[]) => {
    if (!token || !user?.id) return
    try {
      const entries = await Promise.all(
        convs.map(async (c) => {
          try {
            const r = await fetch(`${API_BASE}/api/messages/messages/${c.id}?t=${Date.now()}`, {
              headers: authedHeaders,
              cache: 'no-store',
            })
            if (!r.ok) throw new Error('HTTP ' + r.status)
            const data = await r.json()
            const arr: MessageLite[] = (Array.isArray(data) ? data : data?.messages) ?? []
            const last = arr[arr.length - 1]
            const unread = !!last && last.sender?.id !== Number(user.id) && !last.seen
            return [c.id, unread] as const
          } catch {
            return [c.id, false] as const
          }
        })
      )
      const map: Record<number, boolean> = {}
      entries.forEach(([id, u]) => (map[id] = u))
      setUnreadMap(map)
    } catch {
      /* silent */
    }
  }, [token, authedHeaders, user?.id])

  /* Chercher des utilisateurs (nouvelle conv) */
  const fetchUsers = useCallback(async () => {
    if (!token) return
    try {
      setLoadingUsers(true)
      const res = await fetch(`${API_BASE}/api/users?t=${Date.now()}`, {
        headers: authedHeaders,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const raw = (await res.json()) as { users?: User[] } | User[]
      const list: User[] = Array.isArray(raw) ? raw : raw?.users ?? []
      const filtered = user?.id ? list.filter(u => Number(u.id) !== Number(user.id)) : list
      setAllUsers(filtered)
    } catch (err) {
      console.error('Users load error:', err)
    } finally {
      setLoadingUsers(false)
    }
  }, [token, authedHeaders, user?.id])

  useEffect(() => {
    if (!token) return
    fetchConversations()
    fetchUsers()
  }, [token, fetchConversations, fetchUsers])

  useEffect(() => {
    if (user === null) router.push('/login')
  }, [user, router])

  useEffect(() => {
    if (conversations.length) computeUnread(conversations)
  }, [conversations, computeUnread])

  // re-sync lors du retour onglet/page
  useEffect(() => {
    const onShow = () => { fetchConversations().then(() => computeUnread(conversations)) }
    window.addEventListener('visibilitychange', onShow)
    window.addEventListener('pageshow', onShow as unknown as EventListener)
    return () => {
      window.removeEventListener('visibilitychange', onShow)
      window.removeEventListener('pageshow', onShow as unknown as EventListener)
    }
  }, [fetchConversations, computeUnread, conversations])

  /* Démarrer (ou rouvrir) une conversation */
  const startConversation = useCallback(
    async (recipientId: number) => {
      if (!token) return
      const existing = conversations.find(conv =>
        conv.participants.some(p => Number(p.id) === Number(recipientId)) &&
        conv.participants.some(p => Number(p.id) === Number(user?.id))
      )
      if (existing) {
        router.push(`/messages/${existing.id}`)
        return
      }
      try {
        const res = await fetch(`${API_BASE}/api/messages/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authedHeaders || {}),
          },
          body: JSON.stringify({ recipientId, content: 'Salut !' }),
        })
        const data = await res.json().catch(() => ({} as unknown))
        const convId =
          (data as { conversationId?: number })?.conversationId ??
          (data as { conversation?: { id?: number } })?.conversation?.id ??
          (data as { id?: number })?.id ??
          null
        if (convId) router.push(`/messages/${convId}`)
        else await fetchConversations()
      } catch (err) {
        console.error('Erreur démarrage conversation :', err)
      }
    },
    [token, authedHeaders, conversations, router, fetchConversations, user?.id]
  )

  /* Supprimer une conversation */
  const deleteConversation = useCallback(
    async (convId: number) => {
      if (!token) return
      const ok = confirm('Supprimer cette conversation ?')
      if (!ok) return
      try {
        setDeletingId(convId)
        const res = await fetch(`${API_BASE}/api/messages/conversations/${convId}`, {
          method: 'DELETE',
          headers: authedHeaders,
        })
        if (!res.ok) {
          console.warn('DELETE non supporté par le backend → conversation masquée localement')
        }
        setConversations(prev => prev.filter(c => c.id !== convId))
        setUnreadMap(prev => {
          const copy = { ...prev }
          delete copy[convId]
          return copy
        })
      } catch (err) {
        console.error('Erreur suppression conversation :', err)
        alert('Suppression impossible.')
      } finally {
        setDeletingId(null)
      }
    },
    [token, authedHeaders]
  )

  /* Marquer comme lu côté backend + ouvrir */
  const markSeenBackend = useCallback(async (convId: number) => {
    if (!token) return
    const headers: HeadersInit = { ...(authedHeaders || {}), 'Content-Type': 'application/json' }
    try {
      const r = await fetch(`${API_BASE}/api/messages/mark-seen/${convId}`, { method: 'POST', headers })
      if (!r.ok) throw new Error('HTTP ' + r.status)
    } catch {
      /* best-effort */
    }
  }, [token, authedHeaders])

  const openConversation = useCallback(async (convId: number) => {
    setUnreadMap(prev => ({ ...prev, [convId]: false })) // optimiste
    await markSeenBackend(convId)
    router.push(`/messages/${convId}`)
  }, [router, markSeenBackend])

  const getOtherUser = (conv: Conversation) =>
    conv.participants.find(p => String(p.id) !== String(user?.id))

  const filteredUsers = search
    ? allUsers.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()))
    : []

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Bandeau titre */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/10 via-violet-600/10 to-blue-600/10 blur-3xl" />
        <div className="relative px-6 pt-10 pb-6 max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold">💬 Messagerie</h1>
          <p className="text-white/70 mt-2">
            Retrouve tes conversations et démarre de nouveaux échanges.
          </p>
        </div>
      </div>

      <div className="px-6 pb-10 max-w-6xl mx-auto w-full">
        <div className="grid gap-6 md:grid-cols-[360px,1fr]">
          {/* Colonne gauche */}
          {/* ... (identique à ton code initial pour la recherche d’utilisateurs) ... */}

          {/* Colonne droite */}
          {/* ... (identique pour la liste de conversations, avec unread flag) ... */}
        </div>
      </div>
    </div>
  )
}