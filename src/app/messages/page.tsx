'use client'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

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
  seen: boolean
  sender: { id: number }
  createdAt: string
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
// URL absolue (avatars)
const toAbs = (u?: string | null) => {
  if (!u) return '/default-avatar.png'
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

  /* Calculer non-lus en front */
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

  // Re-sync lors du retour onglet/page
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
        if (!res.ok) throw new Error('HTTP ' + res.status)
        const data = await res.json().catch(() => ({}))
        const convId =
          data?.conversationId ??
          data?.conversation?.id ??
          data?.id ??
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
        if (!res.ok) throw new Error('HTTP ' + res.status)
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

  /* Ouvrir une conversation et marquer comme lu */
  const openConversation = useCallback(async (convId: number) => {
    if (!token) {
      setUnreadMap(prev => ({ ...prev, [convId]: false }))
      router.push(`/messages/${convId}`)
      return
    }
    try {
      const res = await fetch(`${API_BASE}/api/messages/mark-seen/${convId}`, {
        method: 'POST',
        headers: authedHeaders,
      })
      if (res.ok) {
        setUnreadMap(prev => ({ ...prev, [convId]: false }))
        router.push(`/messages/${convId}`)
      } else {
        console.error('Erreur marquage lu:', await res.text())
        router.push(`/messages/${convId}`) // Fallback si échec
      }
    } catch (err) {
      console.error('Erreur marquage lu:', err)
      router.push(`/messages/${convId}`) // Fallback si échec
    }
  }, [token, authedHeaders, router])

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
          {/* Colonne gauche : recherche */}
          <section className="relative rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur p-5">
            <h2 className="text-lg font-semibold mb-1">Nouvelle conversation</h2>
            <p className="text-white/60 text-sm mb-4">Cherche un artiste, un organisateur ou un prestataire.</p>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un utilisateur…"
              className="w-full rounded-xl bg-black/40 border border-white/10 focus:border-white/30 outline-none px-4 py-3"
            />
            {loadingUsers && <p className="text-gray-400 text-sm mt-3">Chargement des utilisateurs…</p>}
            {search && (
              <ul className="space-y-2 max-h-80 overflow-y-auto pr-1 mt-3">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(u => {
                    const src = getAvatarSrc(u)
                    return (
                      <li
                        key={u.id}
                        onClick={() => startConversation(u.id)}
                        className="cursor-pointer rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 p-3 flex items-center gap-3 transition"
                      >
                        <img
                          src={src}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{u.name}</span>
                          <span className="text-xs text-white/50">{u.role}</span>
                        </div>
                        <span className="ml-auto text-xs text-white/40">▶</span>
                      </li>
                    )
                  })
                ) : (
                  <li className="text-gray-500 italic text-sm text-center py-2">Aucun utilisateur trouvé.</li>
                )}
              </ul>
            )}
          </section>
          {/* Colonne droite : conversations */}
          <section className="relative rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur p-5">
            <h2 className="text-lg font-semibold mb-5">Vos conversations</h2>
            {conversations.length === 0 && !error ? (
              <p className="text-gray-400 text-sm">Aucune conversation pour le moment.</p>
            ) : (
              <ul className="space-y-3">
                {conversations.map(conv => {
                  const other = getOtherUser(conv)
                  const src = getAvatarSrc(other)
                  const unread = !!unreadMap[conv.id]
                  return (
                    <li
                      key={conv.id}
                      onClick={() => openConversation(conv.id)}
                      className={`group rounded-2xl border p-4 transition flex items-start gap-4 relative cursor-pointer
                        ${unread
                          ? 'bg-indigo-500/10 border-indigo-500/25'
                          : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.07]'
                        }`}
                    >
                      <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${unread ? 'bg-indigo-500' : 'bg-transparent'}`} />
                      <img
                        src={src}
                        alt={other?.name ?? 'User'}
                        className="w-12 h-12 rounded-full object-cover ring-1 ring-white/10"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-base truncate ${unread ? 'font-semibold' : 'font-medium'}`}>
                            {other?.name ?? 'Conversation'}
                          </h3>
                          {unread && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600/30 border border-indigo-400/40 text-indigo-200">
                              Non lu
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/60 truncate max-w-[60ch]">{conv.lastMessage || '…'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[11px] text-white/50 whitespace-nowrap">
                          {conv.updatedAt ? new Date(conv.updatedAt).toLocaleString() : ''}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                          disabled={deletingId === conv.id}
                          title="Supprimer la conversation"
                          className="text-white/80 hover:text-red-400 text-xs border border-white/15 hover:border-red-400/70 rounded-md px-2 py-1"
                        >
                          {deletingId === conv.id ? '…' : 'Supprimer'}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          </section>
        </div>
      </div>
    </div>
  )
}