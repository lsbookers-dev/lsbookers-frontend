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
    if (!API_BASE || !token) return
    try {
      setError(null)
      const res = await fetch(`${API_BASE}/api/messages/conversations`, {
        headers: authedHeaders,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      // Le backend peut renvoyer soit {conversations: [...]}, soit directement [...]
      const raw = await res.json()
      const list: Conversation[] = raw?.conversations ?? raw ?? []
      setConversations(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Conversations load error:', err)
      setError('Impossible de charger les conversations.')
    }
  }, [API_BASE, token, authedHeaders])

  const fetchUsers = useCallback(async () => {
    if (!API_BASE || !token) return
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
      // pas d’error UI bloquante ici
    } finally {
      setLoadingUsers(false)
    }
  }, [API_BASE, token, authedHeaders, user?.id])

  useEffect(() => {
    if (!token) return
    fetchConversations()
    fetchUsers()
  }, [token, fetchConversations, fetchUsers])

  useEffect(() => {
    // redirige si non connecté
    if (user === null) router.push('/login')
  }, [user, router])

  const startConversation = useCallback(
    async (recipientId: number) => {
      if (!API_BASE || !token) return
      try {
        const res = await fetch(`${API_BASE}/api/messages/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authedHeaders || {}),
          },
          body: JSON.stringify({ recipientId, content: 'Salut !' }),
        })

        const data = await res.json().catch(() => ({}))
        // on accepte plusieurs formes possibles de réponse
        const convId =
          data?.conversationId ??
          data?.conversation?.id ??
          data?.id ??
          null

        if (convId) {
          router.push(`/messages/${convId}`)
        } else {
          // si pas d’id renvoyé, on recharge la liste
          await fetchConversations()
        }
      } catch (err) {
        console.error('Erreur démarrage conversation :', err)
      }
    },
    [API_BASE, token, authedHeaders, router, fetchConversations]
  )

  const getOtherUser = (conv: Conversation) =>
    conv.participants.find(p => String(p.id) !== String(user?.id))

  const filteredUsers = search
    ? allUsers.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()))
    : []

  return (
    <div className="flex flex-col min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-4">💬 Vos conversations</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-2">📨 Démarrer une nouvelle conversation</h2>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur..."
          className="border border-gray-600 bg-[#1c1c1c] text-white p-3 rounded w-full mb-3"
        />

        {loadingUsers && <p className="text-gray-400">Chargement des utilisateurs...</p>}

        {search && (
          <ul className="space-y-2 max-h-40 overflow-y-auto">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(u => (
                <li
                  key={u.id}
                  onClick={() => startConversation(u.id)}
                  className="cursor-pointer hover:bg-gray-700 p-3 rounded bg-gray-800"
                >
                  {u.name}
                </li>
              ))
            ) : (
              <li className="text-gray-500 italic">Aucun utilisateur trouvé.</li>
            )}
          </ul>
        )}
      </div>

      {conversations.length === 0 && !error ? (
        <p className="text-gray-400">Aucune conversation pour le moment.</p>
      ) : (
        <ul className="space-y-3">
          {conversations.map(conv => {
            const other = getOtherUser(conv)
            return (
              <li
                key={conv.id}
                className="bg-gray-800 rounded p-4 hover:bg-gray-700 transition"
              >
                <Link href={`/messages/${conv.id}`} className="block">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold">{other?.name ?? 'Conversation'}</h2>
                      <p className="text-sm text-gray-300 truncate max-w-md">
                        {conv.lastMessage || '…'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {conv.updatedAt ? new Date(conv.updatedAt).toLocaleString() : ''}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}