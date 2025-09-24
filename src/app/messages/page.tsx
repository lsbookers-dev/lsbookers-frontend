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

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

export default function MessagesPage() {
  const { user, token } = useAuth()
  const router = useRouter()

  const [conversations, setConversations] = useState<Conversation[]>([])

  const authedHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  )

  /* Charger conversations */
  const fetchConversations = useCallback(async () => {
    if (!token) return
    try {
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
    }
  }, [token, authedHeaders])

  useEffect(() => {
    if (!token) return
    fetchConversations()
  }, [token, fetchConversations])

  useEffect(() => {
    if (user === null) router.push('/login')
  }, [user, router])

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
        <section className="relative rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur p-5 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pink-600 via-violet-600 to-blue-600 opacity-80" />
          <h2 className="text-lg font-semibold mb-5">Vos conversations</h2>

          {conversations.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune conversation pour le moment.</p>
          ) : (
            <ul className="space-y-3">
              {conversations.map(conv => (
                <li
                  key={conv.id}
                  onClick={() => router.push(`/messages/${conv.id}`)}
                  className="group rounded-2xl border p-4 transition flex items-start gap-4 relative cursor-pointer bg-white/[0.04] border-white/10 hover:bg-white/[0.07]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base truncate font-medium">
                        {conv.participants
                          .filter(p => String(p.id) !== String(user?.id))
                          .map(p => p.name)
                          .join(', ') || 'Conversation'}
                      </h3>
                    </div>
                    <p className="text-xs text-white/60 truncate max-w-[60ch]">
                      {conv.lastMessage || '…'}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[11px] text-white/50 whitespace-nowrap">
                      {conv.updatedAt ? new Date(conv.updatedAt).toLocaleString() : ''}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}