'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Role = 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | 'ADMIN'

interface User {
  id: number
  name: string
  role: Role
  image?: string | null
}

interface Conversation {
  id: number
  participants: User[]
  lastMessage: string
  updatedAt: string
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

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

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Bandeau / Hero compact */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-pink-500/10 to-transparent blur-3xl -z-10" />
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Messagerie
          </h1>
          <p className="text-white/70 mt-1">
            Retrouvez vos conversations et démarrez de nouveaux échanges.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* Colonne gauche : Nouvelle conversation */}
        <aside className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-5">
          <h2 className="text-lg font-semibold">Nouvelle conversation</h2>
          <p className="text-sm text-white/60 mt-1">
            Cherche un artiste, un organisateur ou un prestataire.
          </p>

          <div className="mt-4">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un utilisateur…"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:border-white/30"
            />
          </div>

          {loadingUsers && (
            <p className="text-sm text-white/60 mt-3">Chargement des utilisateurs…</p>
          )}

          {search && (
            <ul className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(u => (
                  <li key={u.id}>
                    <button
                      onClick={() => startConversation(u.id)}
                      className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-3 py-2.5 text-left"
                    >
                      {u.image ? (
                        <img
                          src={u.image}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-neutral-700 grid place-items-center text-white font-bold">
                          {u.name?.charAt(0) ?? '?'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-white/60">{u.role}</p>
                      </div>
                    </button>
                  </li>
                ))
              ) : (
                <li className="text-sm text-white/50 italic">Aucun utilisateur trouvé.</li>
              )}
            </ul>
          )}
        </aside>

        {/* Colonne droite : Conversations */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Vos conversations</h2>
            <div className="flex items-center gap-2 text-xs text-white/60">
              {loadingConvs && <span>Actualisation…</span>}
              <button
                onClick={fetchConversations}
                className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/10 transition"
                title="Rafraîchir"
              >
                Rafraîchir
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
              {error}
            </p>
          )}

          {conversations.length === 0 && !error ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-6 text-center">
              <p className="text-white/70">Aucune conversation pour le moment.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {conversations.map(conv => {
                const other = getOtherUser(conv)
                return (
                  <li key={conv.id}>
                    <Link
                      href={`/messages/${conv.id}`}
                      className="block rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-4 py-3"
                    >
                      <div className="flex items-center gap-4">
                        {other?.image ? (
                          <img
                            src={other.image}
                            alt={other.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-neutral-700 grid place-items-center text-white font-bold">
                            {other?.name?.charAt(0) ?? '?'}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-base font-semibold truncate">
                              {other?.name ?? 'Conversation'}
                            </h3>
                            <span className="text-[11px] text-white/50 whitespace-nowrap">
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
        </section>
      </div>
    </div>
  )
}