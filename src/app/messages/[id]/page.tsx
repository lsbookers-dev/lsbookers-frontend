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

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg','image/png','image/webp','image/gif'])

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const conversationId = params?.id ?? ''

  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)

  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const markSeen = useCallback(async () => {
    if (!conversationId || !API_BASE) return
    const token = getAuthToken()
    if (!token) return
    const headers: HeadersInit = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    try {
      await fetch(`${API_BASE}/api/messages/mark-seen/${conversationId}`, { method: 'POST', headers })
    } catch {
      /* noop */
    }
  }, [conversationId])

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
      return
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

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        markSeen().then(fetchMessages)
      }
    }
    const onPageShow = () => {
      markSeen().then(fetchMessages)
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onPageShow)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [markSeen, fetchMessages])

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (): Promise<void> => {
    if (!conversationId) return
    if (!content.trim() && !file) return

    const token = getAuthToken()

    try {
      if (content.trim() && !file) {
        const optimistic: Message = {
          id: `temp-${Date.now()}`,
          content,
          createdAt: new Date().toISOString(),
          sender: { id: 0, name: 'Vous' },
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
          fd.append('type', 'image')
          fd.append('folder', 'messages')
        } else if (file.type.startsWith('video')) {
          fd.append('type', 'video')
          fd.append('folder', 'messages')
        }
      }

      const res = await axios.post<SendResp>(`${API_BASE}/api/messages/send-file`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setContent('')
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''

      const newConvId = res.data?.conversationId
      if (newConvId && String(newConvId) !== String(conversationId)) {
        router.replace(`/messages/${newConvId}`)
        return
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
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const renderFile = (url: string) => {
    const cleanUrl = toAbs(url.trim())
    const lower = cleanUrl.toLowerCase()
    if (/\.(jpg|jpeg|png|gif|webp)$/.test(lower)) {
      return <Image src={cleanUrl} alt="media" width={200} height={200} className="rounded" unoptimized />
    }
    if (/\.(mp4|webm)$/.test(lower)) {
      return (
        <video controls className="w-64 rounded">
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

  return (
    <main className="flex flex-col h-screen bg-[#121212] text-white font-sans">
      <div className="max-w-3xl w-full mx-auto flex flex-col flex-grow px-4 py-6">
        <h2 className="text-2xl font-semibold mb-4">Conversation</h2>

        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto space-y-4 border border-gray-700 p-4 rounded bg-[#1f1f1f] min-h-[300px] max-h-[60vh]"
        >
          {messages.map((msg) => {
            const parts = msg.content.split('\n')
            const text = parts[0] ?? ''
            const urlLine = parts.find((line: string) => line.includes('http'))
            const url = urlLine ? urlLine.replace(/^Lien\s*:\s*/i, '').trim() : ''
            const avatar = toAbs(msg.sender?.image) || '/default-avatar.png'

            return (
              <div key={msg.id} className="flex items-start gap-4 bg-[#2a2a2a] p-3 rounded-lg">
                <Image
                  src={avatar}
                  alt={msg.sender?.name || 'avatar'}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                  unoptimized
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-1">
                    {msg.sender?.name} • {new Date(msg.createdAt).toLocaleString()}
                  </p>
                  {text && <p className="mb-1 text-base leading-relaxed">{text}</p>}
                  {url && renderFile(url)}
                  <p className="text-xs text-right text-gray-500 mt-1">{msg.seen ? '✓ Vu' : 'Non lu'}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écris ton message..."
              className="border border-gray-600 bg-[#1c1c1c] text-white p-3 rounded flex-grow placeholder-gray-400"
            />

            <input
              id="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <label htmlFor="fileInput" className="cursor-pointer bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm">
              Fichier
            </label>

            <button
              onClick={handleSend}
              disabled={!content.trim() && !file}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-6 py-2 rounded text-white font-semibold"
            >
              Envoyer
            </button>
          </div>

          {file && (
            <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
              {file.type.startsWith('image') ? (
                <Image src={URL.createObjectURL(file)} alt="aperçu" width={50} height={50} className="rounded mr-3" unoptimized />
              ) : file.type.startsWith('video') ? (
                <video src={URL.createObjectURL(file)} className="w-20 h-12 rounded mr-3" controls />
              ) : (
                <p className="text-sm text-white truncate mr-3">{file.name}</p>
              )}
              <button
                onClick={() => setFile(null)}
                className="text-red-500 hover:text-red-700 text-sm font-bold"
                title="Supprimer le fichier"
              >
                ✖
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}