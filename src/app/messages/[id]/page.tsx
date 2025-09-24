'use client'
import { useEffect, useRef, useState, KeyboardEvent, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import axios, { AxiosResponse } from 'axios'
import { getAuthToken } from '@/utils/auth'

type Sender = { id: number; name: string; image?: string | null }
type Message = { id: string; content: string; createdAt: string; sender: Sender; seen: boolean }
type ApiMessagesResponse = Message[] | { messages: Message[] }
type SendResp = { conversationId?: string | number; message?: Message }

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

function isArrayResp(x: unknown): x is Message[] { return Array.isArray(x) }
function isObjResp(x: unknown): x is { messages: Message[] } {
  return !!x && typeof x === 'object' && Array.isArray((x as { messages: unknown }).messages)
}

const toAbs = (u?: string | null) => {
  if (!u) return ''
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('//')) return `https:${u}`
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const conversationId = params?.id ?? ''
  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Récupère ton id (comme l’AuthContext le stocke déjà en localStorage)
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

  /* -------- mark as seen -------- */
  const markSeen = useCallback(async () => {
    if (!conversationId || !API_BASE) return
    const token = getAuthToken()
    if (!token) {
      console.warn('Aucun token disponible pour markSeen')
      return
    }
    const headers: HeadersInit = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    try {
      const res = await fetch(`${API_BASE}/api/messages/mark-seen/${conversationId}`, { method: 'POST', headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
      console.log('Messages marqués comme lus avec succès')
    } catch (err) {
      console.error('Erreur marquage lu:', err)
    }
  }, [conversationId])

  /* -------- fetch messages -------- */
  const fetchMessages = useCallback(async (): Promise<void> => {
    if (!conversationId || !API_BASE) return
    const token = getAuthToken()
    const commonHeaders = { Authorization: `Bearer ${token}` }
    try {
      const url = `${API_BASE}/api/messages/messages/${conversationId}`
      const res: AxiosResponse<ApiMessagesResponse> = await axios.get(url, { headers: commonHeaders })
      const payload = res.data
      const list = isArrayResp(payload) ? payload : isObjResp(payload) ? payload.messages : []
      setMessages(Array.isArray(list) ? list : [])
    } catch {
      try {
        const urlAlt = `${API_BASE}/api/messages/conversation/${conversationId}`
        const resAlt: AxiosResponse<ApiMessagesResponse> = await axios.get(urlAlt, { headers: commonHeaders })
        const payloadAlt = resAlt.data
        const listAlt = isArrayResp(payloadAlt) ? payloadAlt : isObjResp(payloadAlt) ? payloadAlt.messages : []
        setMessages(Array.isArray(listAlt) ? listAlt : [])
      } catch {
        try {
          const urlLegacy = `${API_BASE}/messages/messages/${conversationId}`
          const resLegacy: AxiosResponse<ApiMessagesResponse> = await axios.get(urlLegacy, { headers: commonHeaders })
          const payloadLegacy = resLegacy.data
          const listLegacy = isArrayResp(payloadLegacy) ? payloadLegacy : isObjResp(payloadLegacy) ? payloadLegacy.messages : []
          setMessages(Array.isArray(listLegacy) ? listLegacy : [])
        } catch (err: unknown) {
          console.error('Erreur fetch messages :', err)
        }
      }
    }
  }, [conversationId])

  useEffect(() => {
    (async () => {
      await markSeen()
      await fetchMessages()
    })()
  }, [conversationId, markSeen, fetchMessages])

  // Re-sync quand on revient sur la page/onglet
  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === 'visible') markSeen().then(fetchMessages) }
    const onPageShow = () => { markSeen().then(fetchMessages) }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [markSeen, fetchMessages])

  // Scroll en bas à chaque MAJ
  useEffect(() => {
    const el = messagesContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  /* -------- envoi message -------- */
  const handleSend = async (): Promise<void> => {
    if (!conversationId) return
    if (!content.trim() && !file) return
    const token = getAuthToken()
    try {
      // Optimistic si texte seul
      if (content.trim() && !file) {
        const optimistic: Message = {
          id: `temp-${Date.now()}`,
          content,
          createdAt: new Date().toISOString(),
          sender: { id: currentUserId ?? 0, name: 'Vous' },
          seen: false,
        }
        setMessages(prev => [...prev, optimistic])
      }
      const fd = new FormData()
      fd.append('conversationId', conversationId)
      if (content.trim()) fd.append('content', content.trim())
      if (file) {
        if (file.type.startsWith('image') && !ALLOWED_IMAGE_TYPES.has(file.type)) {
          alert("Format d'image non pris en charge (utilise JPG, PNG, WEBP ou GIF).")
          return
        }
        fd.append('file', file)
        if (file.type.startsWith('image')) {
          fd.append('type', 'image'); fd.append('folder', 'messages')
        } else if (file.type.startsWith('video')) {
          fd.append('type', 'video'); fd.append('folder', 'messages')
        }
      }
      const res = await axios.post<SendResp>(`${API_BASE}/api/messages/send-file`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setContent(''); setFile(null); if (inputRef.current) inputRef.current.value = ''
      const newConvId = res.data?.conversationId
      if (newConvId && String(newConvId) !== String(conversationId)) {
        router.replace(`/messages/${newConvId}`); return
      }
      await fetchMessages()
      await markSeen()
    } catch (err: unknown) {
      console.error('Erreur envoi message :', err)
      alert("Erreur lors de l'envoi. Vérifie la console.")
      setMessages(prev => prev.filter(m => typeof m.id === 'string' && m.id.startsWith('temp-')))
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') { e.preventDefault(); handleSend() }
  }

  /* -------- rendu fichiers -------- */
  const renderFile = (url: string) => {
    const cleanUrl = toAbs(url.trim())
    const lower = cleanUrl.toLowerCase()
    if (/\.(jpg|jpeg|png|gif|webp)$/.test(lower)) {
      return <Image src={cleanUrl} alt="media" width={240} height={240} className="rounded-xl" unoptimized />
    }
    if (/\.(mp4|webm)$/.test(lower)) {
      return (
        <video controls className="w-64 rounded-xl">
          <source src={cleanUrl} />
          Votre navigateur ne supporte pas la vidéo.
        </video>
      )
    }
    return (
      <a href={cleanUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
        Télécharger le fichier
      </a>
    )
  }

  /* ======================== UI ======================== */
  return (
    <main className="flex min-h-screen bg-black text-white">
      <div className="flex-1 mx-auto w-full max-w-4xl">
        {/* Header */}
        <header className="relative overflow-hidden rounded-b-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600/15 via-violet-600/15 to-blue-600/15 blur-3xl" />
          <div className="relative px-4 sm:px-6 pt-6 pb-5 flex items-center justify-between">
            <button
              onClick={() => router.push('/messages')}
              className="text-sm px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
              aria-label="Retour"
            >
              ← Retour
            </button>
            <h1 className="text-xl sm:text-2xl font-semibold">Conversation</h1>
            <div className="w-[76px]" aria-hidden />
          </div>
          <div className="h-[2px] w-full bg-gradient-to-r from-pink-600 via-violet-600 to-blue-600 opacity-80" />
        </header>
        {/* Carte + fenêtre scrollable fixe */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur p-4 sm:p-5 flex flex-col">
          <div
            ref={messagesContainerRef}
            className="h-[60vh] overflow-y-auto pr-1 space-y-3"
          >
            {messages.map((msg) => {
              const avatar = toAbs(msg.sender?.image) || '/default-avatar.png'
              const isMe = currentUserId !== null && Number(msg.sender?.id) === currentUserId
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && (
                    <div className="flex items-end gap-2 max-w-[80%]">
                      <Image
                        src={avatar}
                        alt={msg.sender?.name || 'avatar'}
                        width={36}
                        height={36}
                        className="rounded-full object-cover ring-1 ring-white/10"
                        unoptimized
                      />
                      <div>
                        <div className="inline-block rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.05] px-3 py-2">
                          {msg.content && (
                            <>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              {msg.content.includes('http') && (
                                <div className="mt-2">{renderFile(msg.content)}</div>
                              )}
                            </>
                          )}
                        </div>
                        <div className="mt-1 ml-1 text-[11px] text-white/50">
                          {msg.sender?.name ?? '—'} • {new Date(msg.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                  {isMe && (
                    <div className="flex items-end gap-2 max-w-[80%]">
                      <div>
                        <div className="inline-block rounded-2xl rounded-tr-md border border-white/10 bg-gradient-to-br from-pink-600/30 to-violet-600/30 px-3 py-2">
                          {msg.content && (
                            <>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              {msg.content.includes('http') && (
                                <div className="mt-2">{renderFile(msg.content)}</div>
                              )}
                            </>
                          )}
                        </div>
                        <div className="mt-1 text-right text-[11px] text-white/50">
                          {new Date(msg.createdAt).toLocaleString()} • {msg.seen ? '✓ Vu' : 'Non lu'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {/* Barre d’envoi */}
          <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3">
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écris ton message…"
                className="flex-grow rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm placeholder-white/40 focus:outline-none focus:border-white/30"
              />
              <input
                id="fileInput"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <label
                htmlFor="fileInput"
                className="cursor-pointer whitespace-nowrap rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
              >
                Fichier
              </label>
              <button
                onClick={handleSend}
                disabled={!content.trim() && !file}
                className="whitespace-nowrap rounded-lg bg-gradient-to-r from-pink-600 to-violet-600 px-4 py-2 text-sm font-semibold disabled:opacity-60 hover:opacity-90"
              >
                Envoyer
              </button>
            </div>
            {file && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                {file.type.startsWith('image') ? (
                  <Image src={URL.createObjectURL(file)} alt="aperçu" width={48} height={48} className="rounded mr-3" unoptimized />
                ) : file.type.startsWith('video') ? (
                  <video src={URL.createObjectURL(file)} className="w-20 h-12 rounded mr-3" controls />
                ) : (
                  <p className="text-sm text-white truncate mr-3">{file.name}</p>
                )}
                <button
                  onClick={() => setFile(null)}
                  className="text-red-400 hover:text-red-300 text-sm font-semibold"
                  title="Supprimer le fichier"
                >
                  ✖
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}