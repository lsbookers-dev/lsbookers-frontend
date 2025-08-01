'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import { getAuthToken } from '@/utils/auth'
import Image from 'next/image'

type Message = {
  id: string
  content: string
  createdAt: string
}

export default function ConversationPage() {
  const { id } = useParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const fetchMessages = async () => {
    try {
      const token = getAuthToken()
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/messages/messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessages(res.data)
    } catch (error) {
      console.error('Erreur récupération messages:', error)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    try {
      const token = getAuthToken()

      if (!content && !file) return

      const formData = new FormData()
      formData.append('conversationId', id as string)
      if (content) formData.append('content', content)
      if (file) formData.append('file', file)

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/messages/send-file`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      setContent('')
      setFile(null)
      fetchMessages()
    } catch (error) {
      console.error('Erreur envoi message:', error)
    }
  }

  const renderFile = (url: string) => {
    const cleanUrl = url.trim()
    const lower = cleanUrl.toLowerCase()

    if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return <Image src={cleanUrl} alt="media" width={200} height={200} className="rounded" />
    } else if (lower.match(/\.(mp4|webm)$/)) {
      return (
        <video controls className="w-64 rounded">
          <source src={cleanUrl} />
          Votre navigateur ne supporte pas la vidéo.
        </video>
      )
    } else {
      return (
        <a href={cleanUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
          Télécharger le fichier
        </a>
      )
    }
  }

  return (
    <main className="flex flex-col min-h-screen font-sans bg-[#121212] text-white">
      <section className="flex-grow max-w-3xl w-full mx-auto py-6 px-4">
        <h2 className="text-2xl font-semibold mb-6">Conversation</h2>

        <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto border border-gray-700 p-4 rounded bg-[#1f1f1f]">
          {messages.map((msg) => {
            const parts = msg.content.split('\n')
            const text = parts[0]
            const urlLine = parts.find(line => line.includes('http'))
            const url = urlLine?.replace('Lien:', '').trim()

            return (
              <div key={msg.id} className="bg-[#2a2a2a] p-3 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
                {text && <p className="mb-2 text-base leading-relaxed">{text}</p>}
                {url && renderFile(url)}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
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
      </section>
    </main>
  )
}