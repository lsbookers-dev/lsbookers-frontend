'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  name: string
  role: string
}

interface Conversation {
  id: string
  participants: User[]
  lastMessage: string
  updatedAt: string
}

export default function MessagesPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      fetchConversations()
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

  const getOtherUser = (conversation: Conversation) => {
    return conversation.participants.find((p) => p.id !== user?.id)
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <main className="flex-1 p-6 space-y-4">
        <h1 className="text-3xl font-bold mb-4">💬 Vos conversations</h1>

        {error && <p className="text-red-500">{error}</p>}

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
      </main>
    </div>
  )
}