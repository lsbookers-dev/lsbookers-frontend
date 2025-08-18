'use client'

import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import axios, { AxiosResponse } from 'axios'
import { getAuthToken } from '@/utils/auth'

/* ---------- Types ---------- */
type Sender = {
  id: number
  name: string
  image?: string | null
}

type Message = {
  id: string
  content: string
  createdAt: string
  sender: Sender
  seen: boolean
}

type ApiMessagesResponse = Message[] | { messages: Message[] }
type SendResp = { conversationId?: string | number; message?: Message }

/* ---------- Helpers ---------- */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

function isArrayResp(x: unknown): x is Message[] {
  return Array.isArray(x)
}
function isObjResp(x: unknown): x is { messages: Message[] } {
  return !!x && typeof x === 'object' && Array.isArray((x as { messages: unknown }).messages)
}

// Nettoie et extrait une URL plausible depuis une ligne de texte
function extractUrl(raw: string): string | null {
  if (!raw) return null
  const line = raw.replace(/^Lien\s*:\s*/i, '').trim()
  // capture http(s):// jusqu’à espace/fin/parenthèse
  const m = line.match(/https?:\/\/[^\s)]+/i)
  return (m?.[0] || line).trim()
}

// Transforme en URL absolue si le backend renvoie /uploads/...
function toAbsoluteUrl(u: string): string {
  if (!u) return u
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('/')) return `${API_BASE}${u}`
  return u
}

// Détection robuste des types média (ignore la query string)
function extOf(url: string): string {
  const clean = url.split('?')[0].toLowerCase()
  return clean
}
function isImageUrl(url: string): boolean {
  const u = extOf(url)
  return /\.(jpg|jpeg|png|gif|webp|avif)$/.test(u)
}
function isVideoUrl(url: string): boolean {
  const u = extOf(url)
  // Ajout de mov/m4v + webm/mp4
  return /\.(mp4|webm|mov|m4v)$/.test(u) ||
         u.includes('res.cloudinary.com') && (u.includes('/video/upload') || u.includes('fm_mp4'))
}

/* ---------- Page ---------- */
export default function ConversationPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const conversationId = params?.id ?? ''

  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)

  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const fetchMessages = async (): Promise<void> => {
    if (!conversationId || !API_BASE) return
    const token = getAuthToken()
    const headers = { Authorization: `Bearer ${token}` }

    // on essaie plusieurs endpoints possibles
    const endpoints = [
      `${API_BASE}/api/messages/messages/${conversationId}`,
      `${API_BASE}/api/messages/conversation/${conversationId}`,
      `${API_BASE}/messages/messages/${conversationId}`,
    ]

    for (const url of endpoints) {
      try {
        const res: AxiosResponse<ApiMessagesResponse> = await axios.get(url, { headers })
        const payload = res.data
        const list = isArrayResp(payload) ? payload : isObjResp(payload) ? payload.messages : []
        if (Array.isArray(list)) {
          setMessages(list)
          return
        }
      } catch {
        // on tente l’endpoint suivant
      }
    }
    console.error('Erreur fetch messages : aucun endpoint valide')
  }

  useEffect(() => {
    fetchMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

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
      // Optimistic UI si texte seul
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

      // Utiliser toujours le multipart (même sans fichier)
      const fd = new FormData()
      fd.append('conversationId', conversationId)
      if (content.trim()) fd.append('content', content.trim())
      if (file) fd.append('file', file)

      // Préférence pour l’endpoint /api/messages/send-file
      const endpoints = [
        `${API_BASE}/api/messages/send-file`,
        `${API_BASE}/messages/send-file`,
      ]

      let res: AxiosResponse<SendResp> | null = null
      for (const url of endpoints) {
        try {
          res = await axios.post<SendResp>(url, fd, { headers: { Authorization: `Bearer ${token}` } })
          break
        } catch {
          // on essaye le suivant
        }
      }
      if (!res) throw new Error('Tous les endpoints send-file ont échoué')

      // reset
      setContent('')
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''

      const newConvId = res.data?.conversationId
      if (newConvId && String(newConvId) !== String(conversationId)) {
        router.replace(`/messages/${newConvId}`)
        return
      }

      await fetchMessages()
    } catch (err) {
      console.error('Erreur envoi message :', err)
      alert("Erreur lors de l'envoi. Vérifie la console.")
      // rollback optimistic
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')))
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const renderFile = (rawUrl: string) => {
    const extracted = extractUrl(rawUrl)
    if (!extracted) return null
    const absolute = toAbsoluteUrl(extracted)

    if (isImageUrl(absolute)) {
      return <Image src={absolute} alt="media" width={320} height={320} className="rounded max-w-full h-auto" />
    }
    if (isVideoUrl(absolute)) {
      return (
        <video controls className="w-72 max-w-full rounded" preload="metadata">
          <source src={absolute} />
          Votre navigateur ne supporte pas la vidéo.
        </video>
      )
    }
    return (
      <a href={absolute} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline break-all">
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
          className="flex-1 overflow-y-auto space-y-4 border border-gray-700 p-4 rounded bg-[#1f1f1f] max-h-[60vh] min-h-[300px]"
        >
          {messages.map((msg) => {
            // convention : 1ère ligne = texte, une autre avec http = lien fichier
            const parts = msg.content.split('\n')
            const text = parts[0] ?? ''
            const urlLine = parts.find(line => line.includes('http'))
            const url = urlLine ? extractUrl(urlLine) : null

            return (
              <div key={msg.id} className="flex items-start gap-4 bg-[#2a2a2a] p-3 rounded-lg">
                {msg.sender?.image ? (
                  <Image src={msg.sender.image} alt={msg.sender.name} width={40} height={40} className="rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 grid place-items-center text-white font-bold">
                    {msg.sender?.name?.charAt(0) ?? '?'}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-1">
                    {msg.sender?.name} • {new Date(msg.createdAt).toLocaleString()}
                  </p>
                  {text && <p className="mb-1 text-base leading-relaxed break-words">{text}</p>}
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
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
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
                <Image src={URL.createObjectURL(file)} alt="aperçu" width={50} height={50} className="rounded mr-3" />
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