// messages/MessageThread.tsx — Panneau droit : fil de messages + zone de saisie

'use client'

import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, MessageCircle, Loader2,
  CheckCheck, Check, Paperclip, Send, FileText, X,
} from 'lucide-react'
import { Avatar, AttachmentBubble } from './MessageUI'
import { BookingRequestCard, CancellationRequestCard } from './BookingCards'
import { ROLE_ICON, ROLE_COLOR, ROLE_LABEL, formatMessageTime } from './_helpers'
import type { Conversation, Message, BookingRequestData } from './types'

interface MessageThreadProps {
  activeConv: Conversation | null
  activeConvId: number | null
  messages: Message[]
  currentUserId: number | null
  loadingMsgs: boolean
  token: string | null
  mobileView: 'list' | 'chat'
  content: string
  file: File | null
  filePreviewUrl: string | null
  sending: boolean
  lightbox: { url: string; name?: string | null } | null
  setLightbox: (v: { url: string; name?: string | null } | null) => void
  setMobileView: (v: 'list' | 'chat') => void
  setFile: (v: File | null) => void
  setContent: (v: string) => void
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  handleSend: () => void
  handleMessagesScroll: () => void
  handleTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  messagesContainerRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  fileInputRef: React.RefObject<HTMLInputElement | null>
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

export default function MessageThread({
  activeConv, activeConvId, messages, currentUserId, loadingMsgs,
  token, mobileView, content, file, filePreviewUrl, sending,
  setLightbox, setMobileView, setFile, setMessages,
  handleSend, handleMessagesScroll, handleTextareaChange,
  messagesContainerRef, messagesEndRef, fileInputRef, textareaRef,
}: MessageThreadProps) {
  const router = useRouter()

  const onStatusUpdate = (messageId: string, newStatus: BookingRequestData['status']) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId || !m.bookingRequest) return m
      return { ...m, bookingRequest: { ...m.bookingRequest, status: newStatus } }
    }))
  }

  if (!activeConvId || !activeConv) {
    return (
      <div className={`flex-1 flex-col items-center justify-center gap-4 text-center px-8 ${activeConvId && mobileView === 'chat' ? 'flex' : 'hidden md:flex'}`}>
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
          <MessageCircle className="w-7 h-7 text-white/20" />
        </div>
        <div>
          <p className="font-medium text-white/60">Sélectionne une conversation</p>
          <p className="text-sm text-white/30 mt-1">ou démarre-en une nouvelle avec le bouton +</p>
        </div>
      </div>
    )
  }

  const other = activeConv.participants.find((p) => p.id !== currentUserId) ?? activeConv.participants[0]
  const Icon = other ? ROLE_ICON[other.role] : null

  return (
    <div className={`flex-1 flex flex-col min-w-0 ${activeConvId && mobileView === 'chat' ? 'flex' : 'hidden md:flex'}`}>
      {/* Header chat */}
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

              // Carte booking request
              if (msg.type === 'BOOKING_REQUEST' && msg.bookingRequest) {
                items.push(
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && <div className="w-7 h-7 shrink-0 mb-1"><Avatar src={msg.sender.image || ''} alt={msg.sender.name} size={28} /></div>}
                    <div className={`flex flex-col max-w-[90%] sm:max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                      <BookingRequestCard msg={msg} currentUserId={currentUserId} token={token} onStatusUpdate={onStatusUpdate} />
                      <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[10px] text-white/25">{formatMessageTime(msg.createdAt)}</span>
                      </div>
                    </div>
                    {isMe && <div className="w-7 shrink-0" />}
                  </div>
                )
                return
              }

              // Carte demande d'annulation
              if (msg.type === 'CANCELLATION_REQUEST' && msg.bookingRequest) {
                items.push(
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && <div className="w-7 h-7 shrink-0 mb-1"><Avatar src={msg.sender.image || ''} alt={msg.sender.name} size={28} /></div>}
                    <div className={`flex flex-col max-w-[90%] sm:max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                      <CancellationRequestCard msg={msg} currentUserId={currentUserId} token={token} onStatusUpdate={onStatusUpdate} />
                      <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[10px] text-white/25">{formatMessageTime(msg.createdAt)}</span>
                      </div>
                    </div>
                    {isMe && <div className="w-7 shrink-0" />}
                  </div>
                )
                return
              }

              // Message normal
              items.push(
                <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && <div className="w-7 h-7 shrink-0 mb-1"><Avatar src={msg.sender.image || ''} alt={msg.sender.name} size={28} /></div>}
                  <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2.5 rounded-2xl ${
                      isMe
                        ? 'bg-gradient-to-br from-violet-600 to-pink-600 text-white rounded-br-md'
                        : 'bg-white/8 text-white rounded-bl-md'
                    }`}>
                      {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                      <AttachmentBubble msg={msg} onImageClick={(url, name) => setLightbox({ url, name })} />
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
          {filePreviewUrl && file.type.startsWith('image/') && (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
              <Image src={filePreviewUrl} alt="preview" fill className="object-cover" unoptimized />
            </div>
          )}
          {filePreviewUrl && file.type.startsWith('video/') && (
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-black flex items-center justify-center">
              <video src={filePreviewUrl} className="w-full h-full object-cover" muted />
            </div>
          )}
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
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
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
    </div>
  )
}
