'use client'

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import { getAuthToken } from '@/utils/auth'
import Image from 'next/image'

type Message = {
  id: string | number
  content: string
  createdAt: string
  sender: {
    id: number
    name: string
    image?: string
  }
  seen: boolean
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

export default function ConversationPage() {
  const params = useParams()
  const id = String(params?.id ?? '')
  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)

  /** Charge les messages d'une conversation */
  const fetchMessages = useCallback(async () => {
    if (!id || !API_BASE) return
    try {
      const token = getAuthToken()
      const common = { headers: { Authorization: `Bearer ${token}` } }

      // endpoint principal (nouvelle convention)
      let res = await axios.get(`${API_BASE}/api/messages/${id}`, common)
      // certains anciens back renvoient /api/messages/messages/:id
      if (res.status === 204 || (Array.isArray(res.data) && res.data.length === 0)) {
        try {
          const fallback = await axios.get(`${API_BASE}/api/messages/messages/${id}`, common)
          res = fallback
        } catch {
          /* ignore si inexistant */
        }
      }

      const data = res.data?.messages ?? res.data ?? []
      setMessages(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erreur récupération messages:', error)
    }
  }, [id])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!id || !API_BASE) return
    try {
      const token = getAuthToken()
      if (!content && !file) return

      if (file) {
        // Envoi multipart si fichier
        const formData = new FormData()
        formData.append('conversationId', id)
        if (content) formData.append('content', content)
        formData.append('file', file)

        await axios.post(`${API_BASE}/api/messages/send-file`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        })
      } else {
        // Envoi JSON si pas de fichier
        await axios.post(
          `${API_BASE}/api/messages/send`,
          { conversationId: id, content },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }

      setContent('')
      setFile(null)
      fetchMessages()
    } catch (error) {
      console.error('Erreur envoi message:', error)
    }
  }, [id, content, file, fetchMessages])

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
      <a href={cleanUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
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
            // si le backend concatène texte + lien sur plusieurs lignes
            const parts = (msg.content || '').split('\n')
            const text = parts[0] || ''
            const urlLine = parts.find((line) => line.includes('http'))
            const url = urlLine?.replace(/^Lien:\s*/i, '').trim()

            return (
              <div key={String(msg.id)} className="flex items-start gap-4 bg-[#2a2a2a] p-3 rounded-lg">
                {msg.sender?.image ? (
                  <Image src={msg.sender.image} alt={msg.sender.name} width={40} height={40} className="rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                    {msg.sender?.name?.charAt(0) ?? '?'}
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    {msg.sender?.name} • {new Date(msg.createdAt).toLocaleString()}
                  </p>
                  {text && <p className="mb-1 text-base leading-relaxed whitespace-pre-wrap">{text}</p>}
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
              onChange={(e) => setFile(e.target.files?.[0] || null)}
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
                <Image
                  src={URL.createObjectURL(file)}
                  alt="aperçu"
                  width={50}
                  height={50}
                  className="rounded mr-3"
                />
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