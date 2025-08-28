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
  seen: boolean
  sender: { id: number }
  createdAt: string
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

/* Helpers */
const toAbs = (u?: string | null) => {
  if (!u) return ''
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('//')) return `https:${u}`
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

const LS_READ_KEY = 'lsb_readConvs'
const getLocalRead = (): Record<number, boolean> => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(LS_READ_KEY)
    return raw ? (JSON.parse(raw) as Record<number, boolean>) : {}
  } catch { return {} }
}
const setLocalRead = (convId: number, val: boolean) => {
  try {
    const cur = getLocalRead(); cur[convId] = val
    localStorage.setItem(LS_READ_KEY, JSON.stringify(cur))
  } catch {}
}

export default function MessagesPage() {
  const { user, token } = useAuth()
  const router = useRouter()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [unreadMap, setUnreadMap] = useState<Record<number, boolean>>({})
  const [localRead, setLocalReadState] = useState<Record<number, boolean>>(() => getLocalRead())
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const authedHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' } : undefined),
    [token]
  )

  const getAvatarSrc = (u?: User | null) =>
    toAbs(u?.image || u?.profile?.avatar || '/default-avatar.png')

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
          } catch { return [c.id, false] as const }
        })
      )
      const map: Record<number, boolean> = {}
      entries.forEach(([id, u]) => (map[id] = u))
      Object.keys(localRead).forEach((k) => { const id = Number(k); if (localRead[id]) map[id] = false })
      setUnreadMap(map)
    } catch {}
  }, [token, authedHeaders, user?.id, localRead])

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
    } catch (err) { console.error('Users load error:', err) }
    finally { setLoadingUsers(false) }
  }, [token, authedHeaders, user?.id])

  useEffect(() => {
    if (!token) return
    fetchConversations().then(() => computeUnread(conversations))
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => { if (user === null) router.push('/login') }, [user, router])
  useEffect(() => { if (conversations.length) computeUnread(conversations) }, [conversations, computeUnread])

  useEffect(() => {
    const onShow = () => { fetchConversations().then(() => computeUnread(conversations)) }
    document.addEventListener('visibilitychange', onShow)
    window.addEventListener('pageshow', onShow as unknown as EventListener)
    return () => {
      document.removeEventListener('visibilitychange', onShow)
      window.removeEventListener('pageshow', onShow as unknown as EventListener)
    }
  }, [fetchConversations, computeUnread, conversations])

  const startConversation = useCallback(
    async (recipientId: number) => {
      if (!token) return
      const existing = conversations.find(conv =>
        conv.participants.some(p => Number(p.id) === Number(recipientId)) &&
        conv.participants.some(p => Number(p.id) === Number(user?.id))
      )
      if (existing) {
        setLocalRead(existing.id, true); setLocalReadState(getLocalRead())
        router.push(`/messages/${existing.id}`)
        return
      }

      try {
        const res = await fetch(`${API_BASE}/api/messages/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(authedHeaders || {}) },
          body: JSON.stringify({ recipientId, content: 'Salut !' }),
        })
        const data = await res.json().catch(() => ({} as unknown))
        const convId =
          (data as { conversationId?: number })?.conversationId ??
          (data as { conversation?: { id?: number } })?.conversation?.id ??
          (data as { id?: number })?.id ?? null
        if (convId) router.push(`/messages/${convId}`)
        else await fetchConversations()
      } catch (err) { console.error('Erreur démarrage conversation :', err) }
    },
    [token, authedHeaders, conversations, router, user?.id, fetchConversations]
  )

  const deleteConversation = useCallback(
    async (convId: number) => {
      if (!token) return
      const ok = confirm('Supprimer cette conversation ?')
      if (!ok) return
      try {
        setDeletingId(convId)

        const attempt = async (method: 'DELETE'|'POST', url: string) =>
          fetch(url, {
            method,
            headers: { ...(authedHeaders || {}), 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
            cache: 'no-store',
            body: method === 'POST' ? '{}' : undefined,
          })

        let res = await attempt('DELETE', `${API_BASE}/api/messages/conversation/${convId}?t=${Date.now()}`)
        if (!res.ok) res = await attempt('DELETE', `${API_BASE}/api/messages/conversations/${convId}?t=${Date.now()}`)
        if (!res.ok) res = await attempt('DELETE', `${API_BASE}/messages/conversation/${convId}?t=${Date.now()}`)
        if (!res.ok) res = await attempt('POST',   `${API_BASE}/api/messages/conversation/${convId}/delete?t=${Date.now()}`)

        if (!res.ok && res.status !== 404) {
          const txt = await res.text().catch(()=>'')
          console.warn('DELETE a échoué', res.status, txt)
          alert("La suppression n'a pas été confirmée par le serveur.")
        }

        setConversations(prev => prev.filter(c => c.id !== convId))
        setLocalRead(convId, false); setLocalReadState(getLocalRead())

        await new Promise(r => setTimeout(r, 150)) // petit anti-cache
        await fetchConversations()
      } catch (err) {
        console.error('Erreur suppression conversation :', err)
        alert('Suppression impossible.')
      } finally { setDeletingId(null) }
    },
    [token, authedHeaders, fetchConversations]
  )

  const getOtherUser = (conv: Conversation) =>
    conv.participants.find(p => String(p.id) !== String(user?.id))

  const filteredUsers = search
    ? allUsers.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()))
    : []

  const openConversation = useCallback(async (convId: number) => {
    setUnreadMap(prev => ({ ...prev, [convId]: false }))
    setLocalRead(convId, true); setLocalReadState(getLocalRead())
    fetch(`${API_BASE}/api/messages/mark-seen/${convId}`, {
      method: 'POST',
      headers: { ...(authedHeaders || {}), 'Content-Type': 'application/json' },
    }).catch(() => {})
    router.push(`/messages/${convId}`)
  }, [router, authedHeaders])

  return (
    <div className="flex flex-col min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Messagerie</h1>
        <p className="text-white/70 mb-8">Retrouvez vos conversations et démarrez de nouveaux échanges.</p>

        <div className="grid gap-6 md:grid-cols-[360px,1fr]">
          {/* Colonne gauche */}
          <section className="relative rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur p-5 overflow-hidden">
            {/* Dégradé qui épouse les angles */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-600/15 via-violet-600/15 to-blue-600/15" />
            <h2 className="text-lg font-semibold mb-1 relative z-[1]">Nouvelle conversation</h2>
            <p className="text-white/60 text-sm mb-4 relative z-[1]">Cherche un artiste, un organisateur ou un prestataire.</p>

            <div className="relative z-[1]">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un utilisateur…"
                className="w-full rounded-xl bg-black/40 border border-white/15 focus:border-white/35 outline-none px-4 py-3"
              />
            </div>

            {loadingUsers && <p className="text-gray-400 text-sm mt-3 relative z-[1]">Chargement des utilisateurs…</p>}

            {search && (
              <ul className="space-y-2 max-h-80 overflow-y-auto pr-1 mt-3 relative z-[1]">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(u => {
                    const src = getAvatarSrc(u)
                    return (
                      <li
                        key={u.id}
                        onClick={() => startConversation(u.id)}
                        className="cursor-pointer rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 p-3 flex items-center gap-3 transition"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-avatar.png' }}
                        />
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
          <section className="relative rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur p-5 overflow-hidden">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/[0.03] to-transparent pointer-events-none" />
            <h2 className="text-lg font-semibold mb-5 relative z-[1]">Vos conversations</h2>

            {conversations.length === 0 && !error ? (
              <p className="text-gray-400 text-sm relative z-[1]">Aucune conversation pour le moment.</p>
            ) : (
              <ul className="space-y-4 relative z-[1]">
                {conversations.map(conv => {
                  const other = getOtherUser(conv)
                  const src = getAvatarSrc(other)
                  const unread = !!unreadMap[conv.id]
                  return (
                    <li
                      key={conv.id}
                      onClick={() => openConversation(conv.id)}
                      className={`group relative rounded-2xl border p-4 transition flex items-start gap-4 cursor-pointer overflow-hidden
                        ${unread
                          ? 'bg-indigo-500/10 border-indigo-500/25'
                          : 'bg-neutral-900/60 border-white/10 hover:bg-neutral-900'}
                      `}
                    >
                      {/* bandeau dégradé qui suit les coins */}
                      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-pink-600 via-violet-600 to-blue-600 opacity-80" />

                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={other?.name ?? 'User'}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-avatar.png' }}
                      />

                      <div className="min-w-0 flex-1">
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

            {error && <p className="text-red-500 text-sm mt-4 relative z-[1]">{error}</p>}
          </section>
        </div>

        <div className="mt-6 text-center text-xs text-white/40">
          <Link href="/messages/new" className="hover:underline">Démarrer une conversation</Link>
        </div>
      </div>
    </div>
  )
}