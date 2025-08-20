'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Role = 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | 'ADMIN'

interface ProfileLite {
  avatar?: string | null
}

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

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

/* ------- helpers ------- */
function toAbsoluteUrl(u?: string | null) {
  if (!u) return ''
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('//')) return `https:${u}`
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

function getUserAvatar(u?: User) {
  const raw = u?.image || u?.profile?.avatar || ''
  return toAbsoluteUrl(raw)
}

export default function MessagesPage() {
  const { user, token } = useAuth()
  const router = useRouter()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(false)

  const authedHeaders = useMemo(
    () =>
      token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    [token]
  )

  const fetchConversations = useCallback(async () => {
    if (!token) return
    try {
      setError(null)
      setLoadingConvs(true)
      const res = await fetch(`${API_BASE}/api/messages/conversations`, {
        headers: authedHeaders,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const raw = await res.json()
      const list: Conversation[] = raw?.conversations ?? raw ?? []
      setConversations(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Conversations load error:', err)
      setError('Impossible de charger les conversations.')
    } finally {
      setLoadingConvs(false)
    }
  }, [token, authedHeaders])

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

  const startConversation = useCallback(
    async (recipientId: number) => {
      if (!token) return
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

        if (convId) {
          router.push(`/messages/${convId}`)
        } else {
          await fetchConversations()
        }
      } catch (err) {
        console.error('Erreur démarrage conversation :', err)
      }
    },
    [token, authedHeaders, router, fetchConversations]
  )

  const getOtherUser = (conv: Conversation) =>
    conv.participants.find(p => String(p.id) !== String(user?.id))

  const filteredUsers = search
    ? allUsers.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()))
    : []

  return (
    <div className="min-h-screen bg-black text-white font-poppins">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-[40px] font-extrabold tracking-tight mb-2">Messagerie</h1>
        <p className="text-white/70 mb-8">
          Retrouvez vos conversations et démarrez de nouveaux échanges.
        </p>

        {/* Layout 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne gauche : nouvelle conversation */}
          <section className="rounded-2xl border border-white/10 bg-[#0e0e0e]">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-lg font-semibold">Nouvelle conversation</h2>
              <p className="text-sm text-white/60">
                Cherche un artiste, un organisateur ou un prestataire.
              </p>
            </div>

            <div className="p-6 pt-5">
              {/* Champ de recherche */}
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tape un nom…"
                className="w-full rounded-xl bg-[#151515] border border-white/10 px-4 py-3 outline-none focus:border-white/30"
              />

              {/* Liste scrollable avec hauteur contrôlée */}
              <div className="mt-4 max-h-[420px] overflow-y-auto pr-1">
                {loadingUsers && (
                  <p className="text-center text-sm text-white/60">Chargement des utilisateurs…</p>
                )}

                {search && (
                  <ul className="space-y-2">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(u => {
                        const avatar = getUserAvatar(u)
                        return (
                          <li
                            key={u.id}
                            onClick={() => startConversation(u.id)}
                            className="cursor-pointer rounded-xl bg-[#141414] hover:bg-[#191919] border border-white/10 px-4 py-3 flex items-center gap-3 transition"
                          >
                            {avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gray-700 grid place-items-center font-bold">
                                {u.name?.charAt(0)?.toUpperCase() ?? '?'}
                              </div>
                            )}
                            <div className="leading-tight">
                              <p className="font-medium">{u.name}</p>
                              <p className="text-xs text-white/50">{u.role}</p>
                            </div>
                          </li>
                        )
                      })
                    ) : search ? (
                      <li className="text-center text-sm text-white/50 italic">
                        Aucun utilisateur trouvé.
                      </li>
                    ) : null}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* Colonne droite : conversations */}
          <section className="rounded-2xl border border-white/10 bg-[#0e0e0e] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Vos conversations</h2>
              <button
                onClick={fetchConversations}
                className="text-sm rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5"
              >
                Rafraîchir
              </button>
            </div>

            <div className="p-3 sm:p-4 overflow-x-hidden">
              {loadingConvs && (
                <p className="text-center text-sm text-white/60 py-4">Chargement…</p>
              )}

              {conversations.length === 0 && !error ? (
                <p className="text-center text-white/60 py-4">
                  Aucune conversation pour le moment.
                </p>
              ) : (
                <ul className="space-y-3">
                  {conversations.map(conv => {
                    const other = getOtherUser(conv)
                    const avatar = getUserAvatar(other || undefined)
                    return (
                      <li key={conv.id} className="w-full">
                        <Link
                          href={`/messages/${conv.id}`}
                          className="block w-full rounded-2xl bg-[#141414] hover:bg-[#191919] border border-white/10 px-4 py-4 transition"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={avatar} alt={other?.name ?? 'User'} className="w-11 h-11 rounded-full object-cover flex-none" />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-gray-700 grid place-items-center font-bold flex-none">
                                {other?.name?.charAt(0)?.toUpperCase() ?? '?'}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-3">
                                <h3 className="font-semibold truncate">
                                  {other?.name ?? 'Conversation'}
                                </h3>
                                <span className="text-[11px] text-white/50 flex-none">
                                  {conv.updatedAt ? new Date(conv.updatedAt).toLocaleString() : ''}
                                </span>
                              </div>
                              <p className="text-sm text-white/70 truncate">
                                {conv.lastMessage || '…'}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}