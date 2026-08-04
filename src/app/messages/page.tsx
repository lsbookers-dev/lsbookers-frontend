'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Lightbox } from './MessageUI'
import ConversationList from './ConversationList'
import MessageThread from './MessageThread'
import { API_BASE, getHeaders } from './_helpers'
import type { Conversation, Message, SearchUser } from './types'

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
  const isOrganizer = user?.role === 'ORGANIZER'

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
      setMessages(Array.isArray(data) ? data : [])
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
    fetchMessages(activeConvId)
    markSeen(activeConvId)
    const iv = setInterval(async () => {
      await fetchMessages(activeConvId, true)
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

  /* ── Smart scroll ── */
  useEffect(() => {
    const newCount = messages.length
    const prevCount = prevMsgCountRef.current
    if (newCount > prevCount) {
      const lastMsg = messages[newCount - 1]
      const isFromMe = lastMsg?.sender.id === currentUserId
      if (prevCount === 0 || isFromMe || isNearBottomRef.current) {
        const el = messagesContainerRef.current
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: prevCount === 0 ? 'auto' : 'smooth' })
      }
    }
    prevMsgCountRef.current = newCount
  }, [messages, currentUserId])

  /* ── Tracking scroll position ── */
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
      if (data.conversationId && data.conversation) {
        const newConv: Conversation = {
          id: data.conversation.id,
          participants: data.conversation.participants,
          lastMessage: '',
          lastMessageMeta: null,
          updatedAt: data.conversation.updatedAt || new Date().toISOString(),
        }
        setActiveConv(newConv)
        router.push(`/messages?c=${data.conversationId}`)
        setMobileView('chat')
        setShowNewConv(false)
        setNewConvSearch('')
      }
    } catch (err) { console.error('startConversation:', err) }
  }, [token, conversations, selectConv, router])

  /* ── Envoyer un message (optimistic) ── */
  const handleSend = useCallback(async () => {
    if (!activeConvId || !token || sending) return
    if (!content.trim() && !file) return
    setSending(true)

    // Optimistic : afficher le message immédiatement
    const optimisticText = content.trim()
    const tempId = `temp-${Date.now()}`
    if (optimisticText && !file && currentUserId) {
      const tempMsg: Message = {
        id: tempId,
        content: optimisticText,
        type: 'TEXT',
        createdAt: new Date().toISOString(),
        seen: false,
        sender: { id: currentUserId, name: user?.name || 'Moi' },
      }
      setMessages(prev => [...prev, tempMsg])
    }

    // Vider l'input immédiatement
    setContent('')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      const fd = new FormData()
      fd.append('conversationId', String(activeConvId))
      if (optimisticText) fd.append('content', optimisticText)
      if (file) fd.append('file', file)
      const res = await fetch(`${API_BASE}/api/messages/send-file`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!res.ok) {
        // Rollback si erreur
        if (tempId) setMessages(prev => prev.filter(m => m.id !== tempId))
        return
      }
      await fetchMessages(activeConvId)
      await fetchConversations()
    } catch (err) {
      console.error('handleSend:', err)
      if (tempId) setMessages(prev => prev.filter(m => m.id !== tempId))
    }
    finally { setSending(false) }
  }, [activeConvId, token, content, file, sending, currentUserId, user, fetchMessages, fetchConversations])

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

  /* ══ RENDU ══════════════════════════════════════════════ */
  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#0a0a0f] text-white overflow-hidden">
      {lightbox && (
        <Lightbox url={lightbox.url} name={lightbox.name} onClose={() => setLightbox(null)} />
      )}

      <ConversationList
        conversations={conversations}
        currentUserId={currentUserId}
        convSearch={convSearch}
        setConvSearch={setConvSearch}
        showNewConv={showNewConv}
        setShowNewConv={setShowNewConv}
        newConvSearch={newConvSearch}
        setNewConvSearch={setNewConvSearch}
        searchResults={searchResults}
        searchLoading={searchLoading}
        activeConvId={activeConvId}
        mobileView={mobileView}
        deletingId={deletingId}
        selectConv={selectConv}
        startConversation={startConversation}
        deleteConversation={deleteConversation}
      />

      <MessageThread
        activeConv={activeConv}
        activeConvId={activeConvId}
        messages={messages}
        currentUserId={currentUserId}
        isOrganizer={isOrganizer}
        loadingMsgs={loadingMsgs}
        token={token}
        mobileView={mobileView}
        content={content}
        file={file}
        filePreviewUrl={filePreviewUrl}
        sending={sending}
        lightbox={lightbox}
        setLightbox={setLightbox}
        setMobileView={setMobileView}
        setFile={setFile}
        setContent={setContent}
        setMessages={setMessages}
        handleSend={handleSend}
        handleMessagesScroll={handleMessagesScroll}
        handleTextareaChange={handleTextareaChange}
        messagesContainerRef={messagesContainerRef}
        messagesEndRef={messagesEndRef}
        fileInputRef={fileInputRef}
        textareaRef={textareaRef}
        fetchMessages={fetchMessages}
      />
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
