'use client'

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import { getAuthToken } from '@/utils/auth'
import Image from 'next/image'

interface Sender {
  id: number
  name: string
  image?: string
}
interface Message {
  id: string | number
  content: string
  createdAt: string
  sender: Sender
  seen: boolean
}

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

export default function ConversationPage() {
  const { id } = useParams() as { id?: string }
  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  const pickMessagesArray = (data: any): Message[] => {
    if (Array.isArray(data)) return data as Message[]
    if (Array.isArray(data?.messages)) return data.messages as Message[]
    if (Array.isArray(data?.data)) return data.data as Message[]
    if (Array.isArray(data?.items)) return data.items as Message[]
    return []
  }

  const fetchMessages = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const token = getAuthToken()

    // Essaye plusieurs routes possibles (compat anciennes/nouvelles API)
    const candidates = [
      `${API}/messages/messages/${id}`,
      `${API}/messages/${id}`,
      `${API}/messages/conversation/${id}`,
      `${API}/messages/conversations/${id}/messages`,
    ]

    for (const url of candidates) {
      try {
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const arr = pickMessagesArray(res.data)
        if (arr.length || res.status === 200) {
          // trie par date ASC
          arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          setMessages(arr)
          setLoading(false)
          return
        }
      } catch {
        // on tente la suivante
      }
    }

    setMessages([])
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    const token = getAuthToken()
    if (!id || (!content && !file)) return

    const formData = new FormData()
    formData.append('conversationId', id)
    if (content) formData.append('content', content)
    if (file) formData.append('file', file)

    // Optimistic UI (ajoute un message local en attendant la réponse)
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      sender: { id: 0, name: 'Vous' },
      seen: false,
    }
    setMessages(prev => [...prev, optimistic])
    setContent('')
    setFile(null)
    scrollToBottom()

    try {
      // utilise la route utilisée pour envoyer un fichier/texte
      await axios.post(`${API}/messages/send-file`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      })
      // refetch pour obtenir l’ID réel et l’état vu/non-vu
      fetchMessages()
    } catch (error) {
      console.error('Erreur envoi message:', error)
      // rollback en cas d’erreur
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend()
  }

  const renderFile = (url: string) => {
    const cleanUrl = url.trim()
    const lower = cleanUrl.toLowerCase()
    if (/\.(jpg|jpeg|png|gif|webp)$/.test(lower)) {
      return <Image src={cleanUrl} alt="media" width={200} height={200} className="rounded" />
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
          className="flex-1 overflow-y-auto space-y-4 border border-gray-700 p-4 rounded bg-[#1f1f1f] max-h-[60vh] min-h-[300px]"
        >
          {loading && <p className="text-white/60">Chargement…</p>}

          {!loading && messages.map((msg) => {
            // Compat : content peut contenir une ligne "Lien: <url>" ou juste du texte
            const parts = (msg.content || '').split('\n')
            const text = parts[0]?.trim()
            const linkLine = parts.find(l => l.includes('http'))
            const url = linkLine?.replace(/^Lien:\s*/i, '').trim()

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
                  {text && <p className="mb-1 text-base leading-relaxed">{text}</p>}
                  {url && renderFile(url)}
                  <p className="text-xs text-right text-gray-500 mt-1">{msg.seen ? '✓ Vu' : 'Non lu'}</p>
                </div>
              </div>
            )
          })}

          {!loading && messages.length === 0 && (
            <p className="text-white/60">Aucun message pour le moment.</p>
          )}
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
            <input id="fileInput" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
            <label htmlFor="fileInput" className="cursor-pointer bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm">
              Fichier
            </label>
            <button onClick={handleSend} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded text-white font-semibold">
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
              <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700 text-sm font-bold" title="Supprimer le fichier">
                ✖
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}