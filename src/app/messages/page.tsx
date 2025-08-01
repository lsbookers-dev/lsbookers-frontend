'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: number
  name: string
  role: string
}

interface Conversation {
  id: number
  participants: User[]
  lastMessage: string
  updatedAt: string
}

export default function MessagesPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [allUsers, setAllUsers] = useState<User[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      fetchConversations()
      fetchUsers()
    }
  }, [user])

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error('Erreur lors du chargement')
      const data = await res.json()
      setConversations(data)
    } catch (err) {
      console.error(err)
      setError('Impossible de charger les conversations.')
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data: User[] = await res.json()
      const currentUserId = user?.id

      if (typeof currentUserId === 'number') {
        const filtered = data.filter((u: User) => u.id !== currentUserId)
        setAllUsers(filtered)
      } else {
        setAllUsers(data)
      }
    } catch (err) {
      console.error('Erreur chargement utilisateurs :', err)
    }
  }

  const startConversation = async (recipientId: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId,
          content: 'Salut !',
        }),
      })

      const data = await res.json()

      if (data?.conversationId) {
        router.push(`/messages/${data.conversationId}`)
      } else {
        fetchConversations()
      }
    } catch (err) {
      console.error('Erreur démarrage conversation :', err)
    }
  }

  const getOtherUser = (conv: Conversation) => {
    return conv.participants.find((p) => String(p.id) !== String(user?.id))
  }

  const filteredUsers = allUsers.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-4">💬 Vos conversations</h1>

      {error && <p className="text-red-500">{error}</p>}

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">📨 Démarrer une nouvelle conversation</h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur..."
          className="border border-gray-600 bg-[#1c1c1c] text-white p-3 rounded w-full mb-3"
        />
        <ul className="space-y-2 max-h-40 overflow-y-auto">
          {filteredUsers.map((u) => (
            <li
              key={u.id}
              onClick={() => startConversation(u.id)}
              className="cursor-pointer hover:bg-gray-700 p-3 rounded bg-gray-800"
            >
              {u.name}
            </li>
          ))}
        </ul>
      </div>

      {conversations.length === 0 && !error ? (
        <p className="text-gray-400">Aucune conversation pour le moment.</p>
      ) : (
        <ul className="space-y-3">
          {conversations.map((conv) => {
            const other = getOtherUser(conv)
            return (
              <li
                key={conv.id}
                className="bg-gray-800 rounded p-4 hover:bg-gray-700 transition"
              >
                <Link href={`/messages/${conv.id}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold">{other?.name}</h2>
                      <p className="text-sm text-gray-300 truncate max-w-md">{conv.lastMessage}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(conv.updatedAt).toLocaleString()}
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