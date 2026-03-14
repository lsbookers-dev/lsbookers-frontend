'use client'

import {
  useEffect,
  useRef,
  useState,
  KeyboardEvent,
  useCallback,
  useMemo,
} from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import axios from 'axios'
import { getAuthToken } from '@/utils/auth'
import {
  ArrowLeft,
  Send,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Video,
  MessageCircle,
} from 'lucide-react'

type Sender = {
  id: number
  name: string
  image?: string | null
}

type Message = {
  id: string
  content: string
  attachmentUrl?: string | null
  attachmentType?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | null
  attachmentName?: string | null
  attachmentMimeType?: string | null
  createdAt: string
  sender: Sender
  seen: boolean
  seenAt?: string | null
}

type ApiMessagesResponse = Message[] | { messages: Message[] }

type SendResp = {
  conversationId?: string | number
  message?: Message
}

type ConversationUser = {
  id: number
  name: string
  role?: string
  image?: string | null
  profile?: { avatar?: string | null } | null
}

type Conversation = {
  id: number
  participants: ConversationUser[]
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function isArrayResp(x: unknown): x is Message[] {
  return Array.isArray(x)
}

function isObjResp(x: unknown): x is { messages: Message[] } {
  return !!x && typeof x === 'object' && Array.isArray((x as { messages: unknown }).messages)
}

const toAbs = (u?: string | null) => {
  if (!u) return '/default-avatar.png'
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('//')) return `https:${u}`
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

function formatMessageTime(date: string) {
  return new Date(date).toLocaleString()
}

function fileTypeLabel(type?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | null) {
  if (type === 'IMAGE') return 'Image'
  if (type === 'VIDEO') return 'Vidéo'
  if (type === 'DOCUMENT') return 'Document'
  return 'Fichier'
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
      className="relative shrink-0 overflow-hidden rounded-full ring-1 ring-white/10 bg-white/5"
      style={{ width: size, height: size }}
    >
      <Image src={src} alt={alt} fill className="object-cover" unoptimized />
    </div>
  )
}

function areMessagesEqual(a: Message[], b: Message[]) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    const ma = a[i]
    const mb = b[i]
    if (
      ma.id !== mb.id ||
      ma.content !== mb.content ||
      ma.seen !== mb.seen ||
      ma.attachmentUrl !== mb.attachmentUrl ||
      ma.attachmentType !== mb.attachmentType ||
      ma.attachmentName !== mb.attachmentName ||
      ma.createdAt !== mb.createdAt
    ) {
      return false
    }
  }
  return true
}

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const conversationId = params?.id ?? ''

  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [conversation, setConversation] = useState<Conversation | null>(null)

  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previousLastMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user')
      if (raw) {
        const u = JSON.parse(raw)
        setCurrentUserId(Number(u?.id) || null)
      }
    } catch {
      setCurrentUserId(null)
    }
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = messagesContainerRef.current
    if (!el) return
    el.scrollTo({
      top: el.scrollHeight,
      behavior,
    })
  }, [])

  const isNearBottom = useCallback(() => {
    const el = messagesContainerRef.current
    if (!el) return true
    const threshold = 120
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold
  }, [])

  const fetchConversationMeta = useCallback(async () => {
    try {
      const token = getAuthToken()

      const res = await fetch(`${API_BASE}/api/messages/conversations?t=${Date.now()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store',
      })

      if (!res.ok) return

      const data = await res.json()
      const list: Conversation[] = Array.isArray(data?.conversations) ? data.conversations : []
      const found = list.find((c) => String(c.id) === String(conversationId)) || null
      setConversation(found)
    } catch (err) {
      console.error('Erreur chargement conversation meta:', err)
    }
  }, [conversationId])

  const markSeen = useCallback(async () => {
    if (!conversationId) return

    const token = getAuthToken()
    if (!token) return

    try {
      await fetch(`${API_BASE}/api/messages/mark-seen/${conversationId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
    } catch (err) {
      console.error('Erreur marquage lu:', err)
    }
  }, [conversationId])

  const fetchMessages = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!conversationId) return

      const token = getAuthToken()
      if (!token) return

      try {
        if (!options?.silent) setLoading(true)

        const url = `${API_BASE}/api/messages/messages/${conversationId}`
        const res = await axios.get<ApiMessagesResponse>(url, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const payload = res.data
        const list = isArrayResp(payload) ? payload : isObjResp(payload) ? payload.messages : []
        const nextMessages = Array.isArray(list) ? list : []

        setMessages((prev) => {
          if (areMessagesEqual(prev, nextMessages)) return prev
          return nextMessages
        })
      } catch (err) {
        console.error('Erreur fetch messages :', err)
        if (!options?.silent) {
          setMessages([])
        }
      } finally {
        if (!options?.silent) setLoading(false)
      }
    },
    [conversationId]
  )

  useEffect(() => {
    ;(async () => {
      await Promise.all([fetchConversationMeta(), markSeen(), fetchMessages()])
      setTimeout(() => scrollToBottom('auto'), 100)
    })()
  }, [conversationId, fetchConversationMeta, markSeen, fetchMessages, scrollToBottom])

  useEffect(() => {
    if (!conversationId) return

    const interval = setInterval(async () => {
      await fetchMessages({ silent: true })
      await fetchConversationMeta()
      if (document.visibilityState === 'visible') {
        await markSeen()
      }
    }, 3000)

    const onVisibility = async () => {
      if (document.visibilityState === 'visible') {
        await fetchMessages({ silent: true })
        await fetchConversationMeta()
        await markSeen()
      }
    }

    const onFocus = async () => {
      await fetchMessages({ silent: true })
      await fetchConversationMeta()
      await markSeen()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
    }
  }, [conversationId, fetchConversationMeta, fetchMessages, markSeen])

  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    const previousLastId = previousLastMessageIdRef.current
    const nextLastId = lastMessage?.id || null

    if (!previousLastId && nextLastId) {
      scrollToBottom('auto')
    } else if (nextLastId && previousLastId !== nextLastId) {
      if (isNearBottom() || lastMessage?.sender.id === currentUserId) {
        scrollToBottom('smooth')
      }
    }

    previousLastMessageIdRef.current = nextLastId
  }, [messages, currentUserId, isNearBottom, scrollToBottom])

  const otherParticipant = useMemo(() => {
    if (!conversation || currentUserId == null) return null

    return (
      conversation.participants?.find((p) => Number(p.id) !== Number(currentUserId)) || null
    )
  }, [conversation, currentUserId])

  const renderAttachment = (msg: Message) => {
    if (!msg.attachmentUrl) return null

    const url = toAbs(msg.attachmentUrl)

    if (msg.attachmentType === 'IMAGE') {
      return (
        <div className="mt-2">
          <Image
            src={url}
            alt={msg.attachmentName || 'image'}
            width={320}
            height={320}
            className="rounded-2xl object-cover max-w-full"
            unoptimized
          />
        </div>
      )
    }

    if (msg.attachmentType === 'VIDEO') {
      return (
        <div className="mt-2">
          <video
            src={url}
            controls
            preload="metadata"
            playsInline
            className="w-[320px] max-w-full rounded-2xl bg-black"
          >
            Votre navigateur ne supporte pas la vidéo.
          </video>
        </div>
      )
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3 hover:bg-black/30 transition"
      >
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <FileText size={18} className="text-white/80" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {msg.attachmentName || 'Document'}
          </p>
          <p className="text-xs text-white/50">
            {fileTypeLabel(msg.attachmentType)}
          </p>
        </div>
      </a>
    )
  }

  const handleSend = async () => {
    if (!conversationId || sending) return
    if (!content.trim() && !file) return

    const token = getAuthToken()
    if (!token) return

    try {
      setSending(true)

      const fd = new FormData()
      fd.append('conversationId', conversationId)

      if (content.trim()) {
        fd.append('content', content.trim())
      }

      if (file) {
        if (file.type.startsWith('image') && !ALLOWED_IMAGE_TYPES.has(file.type)) {
          alert("Format d'image non supporté")
          return
        }
        fd.append('file', file)
      }

      await axios.post<SendResp>(`${API_BASE}/api/messages/send-file`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setContent('')
      setFile(null)

      if (fileInputRef.current) fileInputRef.current.value = ''

      await fetchMessages({ silent: true })
      await markSeen()
      setTimeout(() => scrollToBottom('smooth'), 50)
    } catch (err) {
      console.error('Erreur envoi message', err)
      alert("Erreur lors de l'envoi")
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="relative border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/10 via-violet-600/10 to-blue-600/10 blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push('/messages')}
            className="flex items-center gap-2 text-sm bg-white/5 px-3 py-2 rounded-xl hover:bg-white/10 transition border border-white/10"
          >
            <ArrowLeft size={16} />
            Retour
          </button>

          <div className="flex items-center gap-3 min-w-0">
            {otherParticipant && (
              <>
                <Avatar
                  src={toAbs(otherParticipant.profile?.avatar || otherParticipant.image)}
                  alt={otherParticipant.name}
                  size={44}
                />
                <div className="min-w-0">
                  <div className="font-semibold truncate">{otherParticipant.name}</div>
                  <div className="text-xs text-white/50 truncate">{otherParticipant.role}</div>
                </div>
              </>
            )}
          </div>

          <div className="w-[76px]" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="border border-white/10 rounded-3xl overflow-hidden bg-neutral-900/70 backdrop-blur shadow-2xl">
          <div
            ref={messagesContainerRef}
            className="h-[62vh] overflow-y-auto p-4 sm:p-6 space-y-4 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.03),_transparent_30%)]"
          >
            {loading ? (
              <div className="text-white/50 text-center py-10">Chargement des messages…</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-white/50 flex flex-col items-center gap-3 py-16">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                  <MessageCircle size={28} />
                </div>
                <p>Aucun message</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe =
                  currentUserId !== null && Number(msg.sender.id) === Number(currentUserId)

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[82%] sm:max-w-[70%] ${isMe ? 'text-right' : ''}`}>
                      {!isMe && (
                        <div className="text-xs text-white/45 mb-1 ml-1">
                          {msg.sender.name}
                        </div>
                      )}

                      <div
                        className={`rounded-2xl px-4 py-3 shadow-sm ${
                          isMe
                            ? 'bg-gradient-to-r from-pink-600/30 to-violet-600/30 border border-pink-400/10'
                            : 'bg-white/10 border border-white/10'
                        }`}
                      >
                        {msg.content && (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        )}
                        {renderAttachment(msg)}
                      </div>

                      <div className="text-xs text-white/40 mt-1 px-1">
                        {formatMessageTime(msg.createdAt)}
                        {isMe ? ` • ${msg.seen ? 'Vu' : 'Non lu'}` : ''}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="border-t border-white/10 bg-black/20 p-4">
            <div className="flex gap-3 items-center">
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écris ton message..."
                className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/30"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition border border-white/10"
                type="button"
                title="Joindre un fichier"
              >
                <Paperclip size={18} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />

              <button
                onClick={handleSend}
                disabled={sending}
                className="bg-gradient-to-r from-pink-600 to-violet-600 px-4 py-3 rounded-2xl flex gap-2 items-center disabled:opacity-60 hover:opacity-90 transition"
              >
                {file &&
                  (file.type.startsWith('image') ? (
                    <ImageIcon size={16} />
                  ) : file.type.startsWith('video') ? (
                    <Video size={16} />
                  ) : (
                    <FileText size={16} />
                  ))}
                <Send size={16} />
                <span className="hidden sm:inline">{sending ? 'Envoi…' : 'Envoyer'}</span>
              </button>
            </div>

            {file && (
              <div className="mt-3">
                <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm truncate">{file.name}</p>
                    <p className="text-xs text-white/50 mt-0.5">
                      {file.type.startsWith('image')
                        ? 'Image'
                        : file.type.startsWith('video')
                        ? 'Vidéo'
                        : 'Document'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="text-red-400 hover:text-red-300 text-sm shrink-0"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}