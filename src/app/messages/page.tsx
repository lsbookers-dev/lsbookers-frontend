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
  image?: string | null // Ajouté pour supporter les photos de profil
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
    if (!token) return
    try {
      setError(null)
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
    <div className="flex flex-col min-h-screen bg-black text-white font-poppins p-6">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-8 text-center">💬 Vos conversations</h1>

        {error && <p className="text-red-500 mb-6 text-center">{error}</p>}

        <div className="mb-12 bg-[#121212] rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">📨 Démarrer une nouvelle conversation</h2>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="border border-[#333333] bg-[#1a1a1a] text-white text-base p-3 rounded-lg w-full mb-4 focus:outline-none focus:border-[#4a90e2] transition"
          />

          {loadingUsers && <p className="text-gray-400 text-base text-center">Chargement des utilisateurs...</p>}

          {search && (
            <ul className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-[#4a90e2] scrollbar-track-[#1a1a1a]">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(u => (
                  <li
                    key={u.id}
                    onClick={() => startConversation(u.id)}
                    className="cursor-pointer hover:bg-[#222222] p-3 rounded-lg bg-[#1a1a1a] text-base flex items-center gap-3 transition"
                  >
                    {u.image ? (
                      <img src={u.image} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                        {u.name.charAt(0)}
                      </div>
                    )}
                    {u.name}
                  </li>
                ))
              ) : (
                <li className="text-gray-500 italic text-base text-center">Aucun utilisateur trouvé.</li>
              )}
            </ul>
          )}
        </div>

        {conversations.length === 0 && !error ? (
          <p className="text-gray-400 text-base text-center">Aucune conversation pour le moment.</p>
        ) : (
          <ul className="space-y-4">
            {conversations.map(conv => {
              const other = getOtherUser(conv)
              return (
                <li
                  key={conv.id}
                  className="bg-[#121212] rounded-lg p-4 hover:bg-[#1a1a1a] transition shadow-md"
                >
                  <Link href={`/messages/${conv.id}`} className="block">
                    <div className="flex items-center gap-4">
                      {other?.image ? (
                        <img src={other.image} alt={other.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                          {other?.name?.charAt(0) ?? '?'}
                        </div>
                      )}
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold">{other?.name ?? 'Conversation'}</h2>
                        <p className="text-sm text-gray-300 truncate max-w-md">
                          {conv.lastMessage || '…'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
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
    </div>
  )
}