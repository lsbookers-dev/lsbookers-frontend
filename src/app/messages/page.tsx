'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import {
  MessageCircle,
  Search,
  Plus,
  Trash2,
  ChevronRight,
  Inbox,
} from 'lucide-react'
import Image from 'next/image'

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
  lastMessageMeta?: {
    id: number
    senderId: number
    seen: boolean
    createdAt: string
    attachmentType?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | null
  } | null
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

const toAbs = (u?: string | null) => {
  if (!u) return '/default-avatar.png'
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('//')) return `https:${u}`
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

const roleLabel = (role?: Role) => {
  if (role === 'ARTIST') return 'Artiste'
  if (role === 'ORGANIZER') return 'Organisateur'
  if (role === 'PROVIDER') return 'Prestataire'
  return 'Utilisateur'
}

function formatConversationDate(date?: string) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()

  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()

  if (sameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return d.toLocaleDateString()
}

function attachmentHint(type?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | null) {
  if (type === 'IMAGE') return '📷 Image'
  if (type === 'VIDEO') return '🎬 Vidéo'
  if (type === 'DOCUMENT') return '📄 Document'
  return ''
}

function Avatar({
  src,
  alt,
  size = 40,
}: {
  src: string
  alt: string
  size?: number
}) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full ring-1 ring-white/10"
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        unoptimized
      />
    </div>
  )
}

function MultiUserSearchDropdown({
  users,
  loading,
  search,
  onSearchChange,
  onSelect,
  getAvatarSrc,
}: {
  users: User[]
  loading: boolean
  search: string
  onSearchChange: (value: string) => void
  onSelect: (userId: number) => void
  getAvatarSrc: (u?: User | null) => string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (search.trim()) setOpen(true)
  }, [search])

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher un utilisateur…"
          className="w-full rounded-xl bg-black/40 border border-white/10 focus:border-white/30 outline-none pl-10 pr-4 py-3 text-sm text-white placeholder-white/40"
        />
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950/95 backdrop-blur shadow-2xl max-h-80 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-4 text-sm text-white/50">Chargement des utilisateurs…</div>
          ) : users.length > 0 ? (
            <ul className="p-2 space-y-1">
              {users.map((u) => (
                <li
                  key={u.id}
                  onClick={() => {
                    onSelect(u.id)
                    setOpen(false)
                  }}
                  className="cursor-pointer rounded-xl px-3 py-3 flex items-center gap-3 hover:bg-white/5 transition"
                >
                  <Avatar src={getAvatarSrc(u)} alt={u.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{u.name}</p>
                    <p className="text-xs text-white/50">{roleLabel(u.role)}</p>
                  </div>
                  <ChevronRight size={16} className="text-white/30" />
                </li>
              ))}
            </ul>
          ) : search.trim() ? (
            <div className="px-4 py-4 text-sm text-white/50">Aucun utilisateur trouvé.</div>
          ) : (
            <div className="px-4 py-4 text-sm text-white/50">
              Commence à taper un nom pour créer une conversation.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MessagesPage() {
  const { user, token } = useAuth()
  const router = useRouter()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [conversationSearch, setConversationSearch] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const authedHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  )

  const getAvatarSrc = (u?: User | null) =>
    toAbs(u?.profile?.avatar || u?.image || '/default-avatar.png')

  const getOtherUser = useCallback(
    (conv: Conversation) =>
      conv.participants.find((p) => String(p.id) !== String(user?.id)),
    [user?.id]
  )

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
      const list: Conversation[] = Array.isArray(raw?.conversations) ? raw.conversations : []

      const sorted = [...list].sort(
        (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
      )

      setConversations(sorted)
    } catch (err) {
      console.error('Conversations load error:', err)
      setError('Impossible de charger les conversations.')
      setConversations([])
    }
  }, [token, authedHeaders])

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

      const filtered = user?.id
        ? list.filter((u) => Number(u.id) !== Number(user.id))
        : list

      setAllUsers(filtered)
    } catch (err) {
      console.error('Users load error:', err)
      setAllUsers([])
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

      const existing = conversations.find(
        (conv) =>
          conv.participants.some((p) => Number(p.id) === Number(recipientId)) &&
          conv.participants.some((p) => Number(p.id) === Number(user?.id))
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
          body: JSON.stringify({
            recipientId,
            content: 'Bonjour !',
          }),
        })

        if (!res.ok) throw new Error('HTTP ' + res.status)

        const data = await res.json().catch(() => ({}))
        const convId = data?.conversationId ?? null

        if (convId) {
          router.push(`/messages/${convId}`)
        } else {
          await fetchConversations()
        }

        setSearch('')
      } catch (err) {
        console.error('Erreur démarrage conversation :', err)
        alert('Impossible de démarrer la conversation.')
      }
    },
    [token, conversations, user?.id, authedHeaders, router, fetchConversations]
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

        if (!res.ok) throw new Error('HTTP ' + res.status)

        setConversations((prev) => prev.filter((c) => c.id !== convId))
      } catch (err) {
        console.error('Erreur suppression conversation :', err)
        alert('Suppression impossible.')
      } finally {
        setDeletingId(null)
      }
    },
    [token, authedHeaders]
  )

  const openConversation = useCallback(
    (convId: number) => {
      router.push(`/messages/${convId}`)
    },
    [router]
  )

  const filteredUsers = search.trim()
    ? allUsers.filter((u) =>
        u.name?.toLowerCase().includes(search.trim().toLowerCase())
      )
    : []

  const filteredConversations = conversations.filter((conv) => {
    const other = getOtherUser(conv)
    const query = conversationSearch.trim().toLowerCase()

    if (!query) return true

    return (
      other?.name?.toLowerCase().includes(query) ||
      conv.lastMessage?.toLowerCase().includes(query)
    )
  })

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/10 via-violet-600/10 to-blue-600/10 blur-3xl" />
        <div className="relative px-6 pt-10 pb-8 max-w-7xl mx-auto">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                <MessageCircle className="text-violet-400" />
                Messagerie
              </h1>
              <p className="text-white/70 mt-2 max-w-2xl">
                Retrouve tes conversations, contacte rapidement un artiste, un organisateur
                ou un prestataire, et centralise tes échanges professionnels.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 min-w-[220px]">
              <p className="text-xs text-white/50">Conversations</p>
              <p className="text-2xl font-semibold mt-1">{conversations.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
          <section className="rounded-3xl border border-white/10 bg-neutral-900/70 backdrop-blur p-5 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <Plus size={18} className="text-violet-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Nouvelle conversation</h2>
                <p className="text-sm text-white/50">Trouve un utilisateur et écris-lui.</p>
              </div>
            </div>

            <MultiUserSearchDropdown
              users={filteredUsers}
              loading={loadingUsers}
              search={search}
              onSearchChange={setSearch}
              onSelect={startConversation}
              getAvatarSrc={getAvatarSrc}
            />

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm font-medium text-white mb-1">Conseil</p>
              <p className="text-sm text-white/55 leading-relaxed">
                Utilise la messagerie pour préparer les bookings, envoyer des visuels,
                partager des documents et centraliser les échanges importants.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-neutral-900/70 backdrop-blur p-5 shadow-2xl min-h-[540px]">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
              <div>
                <h2 className="text-lg font-semibold">Vos conversations</h2>
                <p className="text-sm text-white/50">
                  Ouvre une discussion existante ou reprends un échange non lu.
                </p>
              </div>

              <div className="relative w-full sm:w-[280px]">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  type="text"
                  value={conversationSearch}
                  onChange={(e) => setConversationSearch(e.target.value)}
                  placeholder="Filtrer les conversations…"
                  className="w-full rounded-xl bg-black/40 border border-white/10 focus:border-white/30 outline-none pl-10 pr-4 py-3 text-sm text-white placeholder-white/40"
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300 text-sm">
                {error}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="h-[420px] rounded-2xl border border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Inbox className="text-white/40" />
                </div>
                <h3 className="text-lg font-medium mb-2">Aucune conversation</h3>
                <p className="text-white/50 text-sm max-w-md">
                  Démarre une nouvelle conversation depuis le panneau de gauche pour
                  commencer à échanger.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {filteredConversations.map((conv) => {
                  const other = getOtherUser(conv)
                  const src = getAvatarSrc(other)
                  const isUnread =
                    !!conv.lastMessageMeta &&
                    Number(conv.lastMessageMeta.senderId) !== Number(user?.id) &&
                    !conv.lastMessageMeta.seen

                  return (
                    <li
                      key={conv.id}
                      onClick={() => openConversation(conv.id)}
                      className={`group rounded-2xl border p-4 transition flex items-start gap-4 relative cursor-pointer ${
                        isUnread
                          ? 'bg-violet-500/10 border-violet-500/25'
                          : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.07]'
                      }`}
                    >
                      {isUnread && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-violet-500" />
                      )}

                      <Avatar src={src} alt={other?.name ?? 'User'} size={56} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`text-base truncate ${
                              isUnread ? 'font-semibold text-white' : 'font-medium text-white'
                            }`}
                          >
                            {other?.name ?? 'Conversation'}
                          </h3>

                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
                            {roleLabel(other?.role)}
                          </span>

                          {isUnread && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-600/20 border border-violet-400/30 text-violet-200">
                              Non lu
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-white/70 mt-1 truncate">
                          {conv.lastMessage ||
                            attachmentHint(conv.lastMessageMeta?.attachmentType) ||
                            'Conversation'}
                        </p>

                        {conv.lastMessageMeta?.attachmentType && !conv.lastMessage && (
                          <p className="text-xs text-white/40 mt-1">
                            {attachmentHint(conv.lastMessageMeta.attachmentType)}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <span className="text-[11px] text-white/45 whitespace-nowrap">
                          {formatConversationDate(conv.updatedAt)}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteConversation(conv.id)
                          }}
                          disabled={deletingId === conv.id}
                          title="Supprimer la conversation"
                          className="inline-flex items-center gap-1 text-xs border border-white/10 hover:border-red-400/60 text-white/70 hover:text-red-300 rounded-lg px-2.5 py-1.5 transition"
                        >
                          <Trash2 size={12} />
                          {deletingId === conv.id ? '...' : 'Supprimer'}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}