'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import {
  Search, Send, Paperclip, ArrowLeft, MessageCircle,
  Plus, X, FileText, Trash2, CheckCheck, Check,
  Music2, Building2, Wrench, Loader2,
  Download, ZoomIn,
} from 'lucide-react'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

/* ── Types ──────────────────────────────────────────────── */
type Role = 'ARTIST' | 'ORGANIZER' | 'PROVIDER'

interface Participant {
  id: number
  name: string
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  role: Role
  profile?: { avatar?: string | null } | null
}

interface Conversation {
  id: number
  participants: Participant[]
  lastMessage: string
  lastMessageMeta?: {
    id: number
    senderId: number
    seen: boolean
    createdAt: string
    attachmentType?: string | null
  } | null
  updatedAt: string
}

interface Message {
  id: string
  content: string
  attachmentUrl?: string | null
  attachmentType?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | null
  attachmentName?: string | null
  createdAt: string
  seen: boolean
  sender: { id: number; name: string; image?: string | null }
}

interface SearchUser {
  id: number
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  role: Role
  profile?: { avatar?: string | null } | null
}

/* ── Helpers ─────────────────────────────────────────────── */
const toAbs = (u?: string | null) => {
  if (!u) return '/default-avatar.png'
  if (u.startsWith('http') || u.startsWith('//')) return u
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

const ROLE_LABEL: Record<Role, string> = {
  ARTIST: 'Artiste', ORGANIZER: 'Organisateur', PROVIDER: 'Prestataire',
}
const ROLE_COLOR: Record<Role, string> = {
  ARTIST: 'text-pink-400', ORGANIZER: 'text-blue-400', PROVIDER: 'text-violet-400',
}
const ROLE_ICON: Record<Role, React.ElementType> = {
  ARTIST: Music2, ORGANIZER: Building2, PROVIDER: Wrench,
}

function formatTime(date: string) {
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function formatMessageTime(date: string) {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function getHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

/* ── Avatar ──────────────────────────────────────────────── */
function Avatar({ src, alt, size = 40 }: { src: string; alt: string; size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="w-full h-full rounded-full overflow-hidden ring-1 ring-white/10">
        <Image src={toAbs(src)} alt={alt} fill className="object-cover" unoptimized />
      </div>
    </div>
  )
}

/* ── Lightbox ────────────────────────────────────────────── */
function Lightbox({ url, name, onClose }: { url: string; name?: string | null; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        <Image
          src={url}
          alt={name || 'image'}
          width={1200}
          height={900}
          className="max-w-full max-h-[80vh] rounded-xl object-contain"
          style={{ maxHeight: '80vh', width: 'auto' }}
          unoptimized
        />
      </div>
      <div className="flex items-center gap-3 mt-4">
        <a
          href={url}
          download={name || 'image'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Télécharger
        </a>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/15 transition text-sm text-white/60"
        >
          Fermer
        </button>
      </div>
    </div>
  )
}

/* ── Pièce jointe dans bulle ────────────────────────────── */
function AttachmentBubble({ msg, onImageClick }: { msg: Message; onImageClick: (url: string, name?: string | null) => void }) {
  if (!msg.attachmentUrl) return null
  const url = toAbs(msg.attachmentUrl)

  if (msg.attachmentType === 'IMAGE') {
    return (
      <button
        onClick={() => onImageClick(url, msg.attachmentName)}
        className="block mt-1 relative group rounded-xl overflow-hidden"
      >
        <div className="relative w-52 h-40">
          <Image src={url} alt={msg.attachmentName || 'image'} fill className="object-cover" unoptimized />
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition" />
        </div>
      </button>
    )
  }
  if (msg.attachmentType === 'VIDEO') {
    return (
      <video controls className="mt-1 w-52 rounded-xl bg-black max-w-full">
        <source src={url} />
      </video>
    )
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 hover:bg-white/10 transition max-w-xs">
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-white/60" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate text-white">{msg.attachmentName || 'Document'}</p>
        <p className="text-xs text-white/40">Télécharger</p>
      </div>
    </a>
  )
}

/* ══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL (nécessite Suspense pour useSearchParams)
══════════════════════════════════════════════════════════ */
function MessagesContent() {
  const { token, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeConvId = searchParams.get('c') ? Number(searchParams.get('c')) : null

  /* ── State ── */
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const [newConvSearch, setNewConvSearch] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showNewConv, setShowNewConv] = useState(false)
  const [convSearch, setConvSearch] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [lightbox, setLightbox] = useState<{ url: string; name?: string | null } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prevMsgCountRef = useRef(0)
  const isNearBottomRef = useRef(true)

  const currentUserId = user?.id ? Number(user.id) : null

  /* ── Preview fichier sélectionné ── */
  useEffect(() => {
    if (!file) { setFilePreviewUrl(null); return }
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file)
      setFilePreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setFilePreviewUrl(null)
  }, [file])

  /* ── Fetch conversations ── */
  const fetchConversations = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/api/messages/conversations?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (!res.ok) return
      const data = await res.json()
      const list: Conversation[] = Array.isArray(data?.conversations) ? data.conversations : []
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      setConversations(list)
      if (activeConvId) {
        const found = list.find((c) => c.id === activeConvId)
        if (found) setActiveConv(found)
      }
    } catch (err) {
      console.error('fetchConversations:', err)
    }
  }, [token, activeConvId])

  /* ── Fetch messages ── */
  const fetchMessages = useCallback(async (convId: number, silent = false) => {
    if (!token || !convId) return
    if (!silent) setLoadingMsgs(true)
    try {
      const res = await fetch(`${API_BASE}/api/messages/messages/${convId}?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (!res.ok) return
      const data = await res.json()
      const list: Message[] = Array.isArray(data) ? data : []
      setMessages(list)
    } catch (err) {
      console.error('fetchMessages:', err)
    } finally {
      setLoadingMsgs(false)
    }
  }, [token])

  /* ── Mark seen ── */
  const markSeen = useCallback(async (convId: number) => {
    if (!token || !convId) return
    await fetch(`${API_BASE}/api/messages/mark-seen/${convId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
    // Mise à jour optimiste locale
    setConversations(prev => prev.map(c => {
      if (c.id !== convId || !c.lastMessageMeta) return c
      return { ...c, lastMessageMeta: { ...c.lastMessageMeta, seen: true } }
    }))
  }, [token])

  /* ── Polling conversations ── */
  useEffect(() => {
    if (!token) return
    fetchConversations()
    const iv = setInterval(fetchConversations, 5000)
    return () => clearInterval(iv)
  }, [token, fetchConversations])

  /* ── Polling messages + mark seen automatique ── */
  useEffect(() => {
    if (!activeConvId || !token) return

    // Chargement initial
    fetchMessages(activeConvId)
    markSeen(activeConvId)

    // Polling toutes les 3s
    const iv = setInterval(async () => {
      await fetchMessages(activeConvId, true)
      // Mark seen à chaque poll si la conv est ouverte
      markSeen(activeConvId)
    }, 3000)

    return () => clearInterval(iv)
  }, [activeConvId, token, fetchMessages, markSeen])

  /* ── Sync activeConv ── */
  useEffect(() => {
    if (activeConvId && conversations.length) {
      const found = conversations.find((c) => c.id === activeConvId)
      if (found) setActiveConv(found)
    } else if (!activeConvId) {
      setActiveConv(null)
      setMessages([])
    }
  }, [activeConvId, conversations])

  /* ── Smart scroll : seulement si nouveau message ou déjà en bas ── */
  useEffect(() => {
    const newCount = messages.length
    const prevCount = prevMsgCountRef.current

    if (newCount > prevCount) {
      const lastMsg = messages[newCount - 1]
      const isFromMe = lastMsg?.sender.id === currentUserId
      // Scroll si : premier chargement, message envoyé par moi, ou utilisateur déjà en bas
      if (prevCount === 0 || isFromMe || isNearBottomRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: prevCount === 0 ? 'auto' : 'smooth' })
      }
    }
    prevMsgCountRef.current = newCount
  }, [messages, currentUserId])

  /* ── Tracking position scroll ── */
  const handleMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 120
  }, [])

  /* ── Recherche nouvelle conv ── */
  useEffect(() => {
    if (!newConvSearch.trim() || !token) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(
          `${API_BASE}/api/search?name=${encodeURIComponent(newConvSearch.trim())}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (!res.ok) return
        const data = await res.json()
        setSearchResults(Array.isArray(data?.users) ? data.users : [])
      } catch { setSearchResults([]) }
      finally { setSearchLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [newConvSearch, token])

  /* ── Sélectionner une conversation ── */
  const selectConv = useCallback((convId: number) => {
    router.push(`/messages?c=${convId}`)
    setMobileView('chat')
    // Pastille disparaît immédiatement (optimiste)
    setConversations(prev => prev.map(c => {
      if (c.id !== convId || !c.lastMessageMeta) return c
      return { ...c, lastMessageMeta: { ...c.lastMessageMeta, seen: true } }
    }))
  }, [router])

  /* ── Démarrer une conversation ── */
  const startConversation = useCallback(async (recipientId: number) => {
    if (!token) return
    const existing = conversations.find((c) => c.participants.some((p) => p.id === recipientId))
    if (existing) { selectConv(existing.id); setShowNewConv(false); setNewConvSearch(''); return }

    try {
      const res = await fetch(`${API_BASE}/api/messages/start`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({ recipientId }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.conversationId) {
        await fetchConversations()
        selectConv(data.conversationId)
        setShowNewConv(false)
        setNewConvSearch('')
      }
    } catch (err) { console.error('startConversation:', err) }
  }, [token, conversations, selectConv, fetchConversations])

  /* ── Envoyer un message ── */
  const handleSend = useCallback(async () => {
    if (!activeConvId || !token || sending) return
    if (!content.trim() && !file) return

    setSending(true)
    try {
      const fd = new FormData()
      fd.append('conversationId', String(activeConvId))
      if (content.trim()) fd.append('content', content.trim())
      if (file) fd.append('file', file)

      const res = await fetch(`${API_BASE}/api/messages/send-file`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!res.ok) return

      setContent('')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (textareaRef.current) textareaRef.current.style.height = 'auto'

      await fetchMessages(activeConvId)
      await fetchConversations()
    } catch (err) { console.error('handleSend:', err) }
    finally { setSending(false) }
  }, [activeConvId, token, content, file, sending, fetchMessages, fetchConversations])

  /* ── Supprimer une conversation ── */
  const deleteConversation = useCallback(async (convId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Supprimer cette conversation ?')) return
    setDeletingId(convId)
    try {
      await fetch(`${API_BASE}/api/messages/conversations/${convId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token || ''}` },
      })
      setConversations((prev) => prev.filter((c) => c.id !== convId))
      if (activeConvId === convId) router.push('/messages')
    } catch (err) { console.error('deleteConversation:', err) }
    finally { setDeletingId(null) }
  }, [token, activeConvId, router])

  /* ── Resize textarea ── */
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  /* ── Helpers ── */
  const getOtherParticipant = (conv: Conversation) =>
    conv.participants.find((p) => p.id !== currentUserId) ?? conv.participants[0]

  const getDisplayName = (u: SearchUser) =>
    u.pseudo || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Utilisateur'

  const filteredConvs = conversations.filter((c) => {
    if (!convSearch.trim()) return true
    const other = getOtherParticipant(c)
    return other?.name?.toLowerCase().includes(convSearch.toLowerCase())
  })

  /* ══ RENDU ══════════════════════════════════════════════ */
  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#0a0a0f] text-white overflow-hidden">

      {/* ── Lightbox ── */}
      {lightbox && (
        <Lightbox url={lightbox.url} name={lightbox.name} onClose={() => setLightbox(null)} />
      )}

      {/* ── Panneau gauche : liste des conversations ── */}
      <div className={`
        flex flex-col border-r border-white/8 bg-[#0d0d14]
        w-full md:w-80 lg:w-96 shrink-0
        ${activeConvId && mobileView === 'chat' ? 'hidden md:flex' : 'flex'}
      `}>

        {/* Header gauche */}
        <div className="px-4 pt-5 pb-3 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold">Messages</h1>
            <button
              onClick={() => setShowNewConv((v) => !v)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition ${showNewConv ? 'bg-violet-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
            >
              {showNewConv ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          {/* Recherche nouvelle conversation */}
          {showNewConv && (
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  type="text"
                  value={newConvSearch}
                  onChange={(e) => setNewConvSearch(e.target.value)}
                  placeholder="Chercher un utilisateur…"
                  autoFocus
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition"
                />
              </div>
              {newConvSearch.trim() && (
                <div className="mt-1 rounded-xl border border-white/8 bg-[#111118] overflow-hidden max-h-56 overflow-y-auto">
                  {searchLoading ? (
                    <div className="flex items-center gap-2 p-3 text-sm text-white/40">
                      <Loader2 className="w-4 h-4 animate-spin" /> Recherche…
                    </div>
                  ) : searchResults.length === 0 ? (
                    <p className="p-3 text-sm text-white/30">Aucun résultat</p>
                  ) : (
                    searchResults.map((u) => {
                      const Icon = ROLE_ICON[u.role]
                      return (
                        <button
                          key={u.id}
                          onClick={() => startConversation(u.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition text-left"
                        >
                          <Avatar src={u.profile?.avatar || ''} alt={getDisplayName(u)} size={36} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{getDisplayName(u)}</p>
                            <div className={`flex items-center gap-1 text-xs ${ROLE_COLOR[u.role]}`}>
                              <Icon className="w-3 h-3" />
                              <span>{ROLE_LABEL[u.role]}</span>
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* Filtre conversations existantes */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
            <input
              type="text"
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
              placeholder="Filtrer…"
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] text-sm text-white placeholder-white/20 focus:outline-none border border-transparent focus:border-white/10 transition"
            />
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 py-12">
              <MessageCircle className="w-10 h-10 text-white/10" />
              <p className="text-sm text-white/30">
                {conversations.length === 0 ? 'Aucune conversation' : 'Aucun résultat'}
              </p>
              {conversations.length === 0 && (
                <button
                  onClick={() => setShowNewConv(true)}
                  className="text-xs text-violet-400 hover:text-violet-300 transition"
                >
                  Démarrer une conversation
                </button>
              )}
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const other = getOtherParticipant(conv)
              const isActive = conv.id === activeConvId
              const isUnread =
                !!conv.lastMessageMeta &&
                conv.lastMessageMeta.senderId !== currentUserId &&
                !conv.lastMessageMeta.seen

              return (
                <div
                  key={conv.id}
                  onClick={() => selectConv(conv.id)}
                  className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition relative ${
                    isActive
                      ? 'bg-white/8 border-r-2 border-violet-500'
                      : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <Avatar src={other?.profile?.avatar || ''} alt={other?.name || '?'} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${isUnread ? 'font-semibold text-white' : 'font-medium text-white/80'}`}>
                        {other?.name}
                      </p>
                      <span className="text-[10px] text-white/30 shrink-0">
                        {conv.updatedAt ? formatTime(conv.updatedAt) : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-xs truncate ${isUnread ? 'text-white/70' : 'text-white/35'}`}>
                        {conv.lastMessage || 'Nouvelle conversation'}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                        )}
                        <button
                          onClick={(e) => deleteConversation(conv.id, e)}
                          disabled={deletingId === conv.id}
                          className="opacity-0 group-hover:opacity-100 transition p-1 rounded-md hover:bg-red-500/10 text-white/30 hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Panneau droit : chat ── */}
      <div className={`
        flex-1 flex flex-col min-w-0
        ${activeConvId && mobileView === 'chat' ? 'flex' : 'hidden md:flex'}
      `}>
        {!activeConvId || !activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-white/20" />
            </div>
            <div>
              <p className="font-medium text-white/60">Sélectionne une conversation</p>
              <p className="text-sm text-white/30 mt-1">ou démarre-en une nouvelle avec le bouton +</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header chat */}
            {(() => {
              const other = getOtherParticipant(activeConv)
              const Icon = other ? ROLE_ICON[other.role] : null
              return (
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-[#0d0d14] shrink-0">
                  <button
                    onClick={() => { router.push('/messages'); setMobileView('list') }}
                    className="md:hidden p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  {other && (
                    <>
                      <Avatar src={other.profile?.avatar || ''} alt={other.name} size={38} />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{other.name}</p>
                        {Icon && (
                          <div className={`flex items-center gap-1 text-xs ${ROLE_COLOR[other.role]}`}>
                            <Icon className="w-3 h-3" />
                            <span>{ROLE_LABEL[other.role]}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })()}

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
            >
              {loadingMsgs && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                  <MessageCircle className="w-10 h-10 text-white/10" />
                  <p className="text-sm text-white/30">Aucun message — dis bonjour !</p>
                </div>
              ) : (
                (() => {
                  const items: React.ReactNode[] = []
                  let lastDate = ''

                  messages.forEach((msg, i) => {
                    const isMe = msg.sender.id === currentUserId
                    const msgDate = new Date(msg.createdAt).toDateString()

                    // Séparateur de date
                    if (msgDate !== lastDate) {
                      lastDate = msgDate
                      items.push(
                        <div key={`date-${i}`} className="flex items-center gap-3 my-3">
                          <div className="flex-1 h-px bg-white/5" />
                          <span className="text-[10px] text-white/25 shrink-0">
                            {new Date(msg.createdAt).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
                          </span>
                          <div className="flex-1 h-px bg-white/5" />
                        </div>
                      )
                    }

                    items.push(
                      <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          <div className="w-7 h-7 shrink-0 mb-1">
                            <Avatar src={msg.sender.image || ''} alt={msg.sender.name} size={28} />
                          </div>
                        )}

                        <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl ${
                            isMe
                              ? 'bg-gradient-to-br from-violet-600 to-pink-600 text-white rounded-br-md'
                              : 'bg-white/8 text-white rounded-bl-md'
                          }`}>
                            {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                            <AttachmentBubble
                              msg={msg}
                              onImageClick={(url, name) => setLightbox({ url, name })}
                            />
                          </div>
                          <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[10px] text-white/25">{formatMessageTime(msg.createdAt)}</span>
                            {isMe && (
                              msg.seen
                                ? <CheckCheck className="w-3 h-3 text-violet-400" />
                                : <Check className="w-3 h-3 text-white/25" />
                            )}
                          </div>
                        </div>

                        {isMe && <div className="w-7 shrink-0" />}
                      </div>
                    )
                  })

                  return items
                })()
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Aperçu fichier sélectionné */}
            {file && (
              <div className="mx-4 mb-2 flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                {/* Miniature image */}
                {filePreviewUrl && file.type.startsWith('image/') && (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    <Image src={filePreviewUrl} alt="preview" fill className="object-cover" unoptimized />
                  </div>
                )}
                {/* Miniature vidéo */}
                {filePreviewUrl && file.type.startsWith('video/') && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-black flex items-center justify-center">
                    <video src={filePreviewUrl} className="w-full h-full object-cover" muted />
                  </div>
                )}
                {/* Icône document */}
                {!filePreviewUrl && (
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-violet-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white/70 truncate">{file.name}</p>
                  <p className="text-xs text-white/30">{(file.size / 1024).toFixed(0)} Ko</p>
                </div>
                <button
                  onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="text-white/30 hover:text-white/70 transition p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Zone de saisie */}
            <div className="px-4 pb-4 shrink-0">
              <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleTextareaChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                  }}
                  placeholder="Écrire un message…"
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none resize-none py-1 max-h-28"
                />
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/5 transition shrink-0 self-end"
                  type="button"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || (!content.trim() && !file)}
                  className="p-2 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 text-white hover:opacity-90 disabled:opacity-30 transition shrink-0 self-end"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-white/15 mt-1 text-center">Entrée pour envoyer · Shift+Entrée pour nouvelle ligne</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Export avec Suspense (requis pour useSearchParams) ── */
export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}
