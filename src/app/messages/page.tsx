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
  // unread?: boolean // côté backend, si dispo
}
interface MessageLite {
  id: string | number
  seen: boolean
  sender: { id: number }
  createdAt: string
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
const ACCENT_FROM = 'from-indigo-500/40'
const ACCENT_TO = 'to-fuchsia-500/40'

/* Helpers */
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

  const getAvatar = (u?: User | null) => toAbs(u?.image || u?.profile?.avatar || '')

  /* Charge les conversations + tri plus récents en haut */
  const fetchConversations = useCallback(async () => {
    if (!token) return
    try {
      setError(null)
      const res = await fetch(`${API_BASE}/api/messages/conversations`, {
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

  /* Calcule “non lu” côté front (provisoire) */
  const computeUnread = useCallback(async (convs: Conversation[]) => {
    if (!token || !user?.id) return
    try {
      const entries = await Promise.all(
        convs.map(async (c) => {
          try {
            // On récupère la conversation et prend le dernier message
            const r = await fetch(`${API_BASE}/api/messages/messages/${c.id}`, {
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
      // silencieux
    }
  }, [token, authedHeaders, user?.id])

  const fetchUsers = useCallback(async () => {
    if (!token) return
    try {
      setLoadingUsers(true)
      const res = await fetch(`${API_BASE}/api/users`, {
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

  /* Recalcule les non-lus à chaque changement de liste */
  useEffect(() => {
    if (conversations.length) computeUnread(conversations)
  }, [conversations, computeUnread])

  /* Pas de doublon : ouvrir si conv existe déjà avec l’utilisateur */
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
          await fetch(`${API_BASE}/api/messages/conversation/${convId}`, {
            method: 'DELETE',
            headers: authedHeaders,
          })
        }
        setConversations(prev => prev.filter(c => c.id !== convId))
      } catch (err) {
        console.error('Erreur suppression conversation :', err)
        alert('Suppression impossible.')
      } finally {
        setDeletingId(null)
      }
    },
    [token, authedHeaders]
  )

  const getOtherUser = (conv: Conversation) =>
    conv.participants.find(p => String(p.id) !== String(user?.id))

  const filteredUsers = search
    ? allUsers.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()))
    : []

  return (
    <div className="flex flex-col min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Messagerie</h1>
        <p className="text-white/70 mb-8">Retrouvez vos conversations et démarrez de nouveaux échanges.</p>

        <div className="grid gap-6 md:grid-cols-[360px,1fr]">
          {/* Colonne gauche */}
          <section className="relative rounded-2xl border border-white/10 bg-[#0d0d0d] p-5">
            <div className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r ${ACCENT_FROM} ${ACCENT_TO} opacity-10`} />
            <h2 className="text-lg font-semibold mb-1">Nouvelle conversation</h2>
            <p className="text-white/60 text-sm mb-4">Cherche un artiste, un organisateur ou un prestataire.</p>

            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un utilisateur…"
                className="w-full rounded-xl bg-black/50 border border-white/15 focus:border-white/35 outline-none px-4 py-3"
              />
              <div className={`pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-r ${ACCENT_FROM} ${ACCENT_TO} opacity-10`} />
            </div>

            {loadingUsers && <p className="text-gray-400 text-sm mt-3">Chargement des utilisateurs…</p>}

            {search && (
              <ul className="space-y-2 max-h-80 overflow-y-auto pr-1 mt-3">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(u => {
                    const avatar = getAvatar(u)
                    return (
                      <li
                        key={u.id}
                        onClick={() => startConversation(u.id)}
                        className="cursor-pointer rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 p-3 flex items-center gap-3 transition"
                      >
                        {avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 grid place-items-center font-semibold">
                            {u.name?.charAt(0) ?? '?'}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{u.name}</span>
                          <span className="text-xs text-white/50">{u.role}</span>
                        </div>
                      </li>
                    )
                  })
                ) : (
                  <li className="text-gray-500 italic text-sm text-center py-2">Aucun utilisateur trouvé.</li>
                )}
              </ul>
            )}
          </section>

          {/* Colonne droite */}
          <section className="relative rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 overflow-hidden">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-transparent via-white/[0.03] to-transparent pointer-events-none" />
            <h2 className="text-lg font-semibold mb-5">Vos conversations</h2>

            {conversations.length === 0 && !error ? (
              <p className="text-gray-400 text-sm">Aucune conversation pour le moment.</p>
            ) : (
              <ul className="space-y-3">
                {conversations.map(conv => {
                  const other = getOtherUser(conv)
                  const avatar = getAvatar(other)
                  const unread = !!unreadMap[conv.id] // calcul front provisoire
                  return (
                    <li
                      key={conv.id}
                      className={`rounded-xl border p-4 transition flex items-start gap-4 relative
                        ${unread
                          ? 'bg-indigo-500/10 border-indigo-500/25'
                          : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.07]'}
                      `}
                    >
                      <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${unread ? 'bg-indigo-500' : 'bg-transparent'}`} />
                      <Link href={`/messages/${conv.id}`} className="flex-1 min-w-0 flex items-start gap-4">
                        {avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatar} alt={other?.name ?? 'User'} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-white/10 grid place-items-center font-semibold">
                            {other?.name?.charAt(0) ?? '?'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`text-base ${unread ? 'font-semibold' : 'font-medium'}`}>
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
                      </Link>

                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[11px] text-white/50 whitespace-nowrap">
                          {conv.updatedAt ? new Date(conv.updatedAt).toLocaleString() : ''}
                        </span>
                        <button
                          onClick={() => deleteConversation(conv.id)}
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