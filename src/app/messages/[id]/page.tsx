'use client'

import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import { useParams } from 'next/navigation'
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
  // champs potentiels renvoyés par l’API pour les pièces jointes
  fileUrl?: string | null
  attachmentUrl?: string | null
  mediaUrl?: string | null
  mimeType?: string | null
}

type ApiMessagesResponse = Message[] | { messages: Message[] }
type SendFileResponse =
  | { message: Message }
  | { id: string } // si l’API ne renvoie pas l’objet complet
  | Record<string, unknown>

/* ---------- Helpers ---------- */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

function isArrayResp(x: unknown): x is Message[] {
  return Array.isArray(x)
}
function isObjResp(x: unknown): x is { messages: Message[] } {
  return !!x && typeof x === 'object' && Array.isArray((x as { messages: unknown }).messages)
}
function pickAttachmentUrl(m: Message): string | undefined {
  return m.fileUrl || m.attachmentUrl || m.mediaUrl || undefined
}

/* ---------- Page ---------- */
export default function ConversationPage() {
  const params = useParams<{ id: string }>()
  const conversationId = params?.id
  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)

  const fetchMessages = async (): Promise<void> => {
    if (!conversationId || !API_BASE) return
    try {
      const token = getAuthToken()
      const res: AxiosResponse<ApiMessagesResponse> = await axios.get(
        `${API_BASE}/messages/messages/${conversationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const payload = res.data
      const list = isArrayResp(payload) ? payload : isObjResp(payload) ? payload.messages : []
      setMessages(list)
    } catch {
      // fallback si route différente
      try {
        const token = getAuthToken()
        const res2: AxiosResponse<ApiMessagesResponse> = await axios.get(
          `${API_BASE}/messages/conversation/${conversationId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const payload2 = res2.data
        const list2 = isArrayResp(payload2) ? payload2 : isObjResp(payload2) ? payload2.messages : []
        setMessages(list2)
      } catch (e) {
        console.error('Erreur récupération messages :', e)
      }
    }
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
    if (!conversationId || (!content && !file)) return
    try {
      const token = getAuthToken()
      const formData = new FormData()
      formData.append('conversationId', conversationId)
      if (content) formData.append('content', content)
      if (file) formData.append('file', file)

      // Optimistic UI si message texte seul
      if (content && !file) {
        const optimistic: Message = {
          id: `temp-${Date.now()}`,
          content,
          createdAt: new Date().toISOString(),
          sender: { id: 0, name: 'Vous' },
          seen: false,
        }
        setMessages(prev => [...prev, optimistic])
      }

      const res: AxiosResponse<SendFileResponse> = await axios.post(
        `${API_BASE}/messages/send-file`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      )

      // Si l’API renvoie le message créé, on l’ajoute directement
      const data = res.data as SendFileResponse
      if (data && typeof data === 'object' && 'message' in data && data.message) {
        setMessages(prev => [...prev, (data as { message: Message }).message])
      } else {
        // sinon on recharge la conversation
        await fetchMessages()
      }

      setContent('')
      setFile(null)
    } catch (error) {
      console.error('Erreur envoi message :', error)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') handleSend()
  }

  const renderFile = (rawUrl: string) => {
    const cleanUrl = rawUrl.trim()
    const lower = cleanUrl.toLowerCase()
    if (/\.(jpg|jpeg|png|gif|webp|avif)$/.test(lower)) {
      return (
        <Image
          src={cleanUrl}
          alt="media"
          width={220}
          height={220}
          className="rounded"
          unoptimized
        />
      )
    }
    if (/\.(mp4|webm|mov|m4v)$/.test(lower)) {
      return (
        <video controls className="max-w-xs rounded">
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
          className="flex-1 overflow-y-auto space-y-4 border border-gray-700 p-4 rounded bg-[#1f1f1f] max-h-[60vh] min-h-[300px]"
        >
          {messages.map((msg) => {
            // 1) URL jointe via champ dédié
            const attachment = pickAttachmentUrl(msg)

            // 2) Ou URL incluse dans le contenu (ex: "Lien: https://...")
            let parsedUrl = ''
            if (!attachment && msg.content) {
              const lines = msg.content.split('\n')
              const urlLine = lines.find(line => line.includes('http'))
              parsedUrl = urlLine ? urlLine.replace(/^Lien\s*:\s*/i, '').trim() : ''
            }

            // 3) Texte (première ligne si on a une convention, sinon tout)
            const lines = msg.content ? msg.content.split('\n') : []
            const text = lines[0] || msg.content || ''

            const mediaUrl = attachment || parsedUrl || ''

            return (
              <div key={msg.id} className="flex items-start gap-4 bg-[#2a2a2a] p-3 rounded-lg">
                {msg.sender?.image ? (
                  <Image
                    src={msg.sender.image}
                    alt={msg.sender.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                    unoptimized
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 grid place-items-center text-white font-bold">
                    {msg.sender?.name?.charAt(0) ?? '?'}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-1">
                    {msg.sender?.name} • {new Date(msg.createdAt).toLocaleString()}
                  </p>
                  {text && <p className="mb-1 text-base leading-relaxed">{text}</p>}
                  {mediaUrl && renderFile(mediaUrl)}
                  <p className="text-xs text-right text-gray-500 mt-1">{msg.seen ? '✓ Vu' : 'Non lu'}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <input
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
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <label htmlFor="fileInput" className="cursor-pointer bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm">
              Fichier
            </label>

            <button
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded text-white font-semibold"
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