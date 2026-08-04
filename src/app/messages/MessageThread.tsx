// messages/MessageThread.tsx — Panneau droit : fil de messages + zone de saisie

'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, MessageCircle, Loader2,
  CheckCheck, Check, Paperclip, Send, FileText, X, ExternalLink, CalendarPlus,
} from 'lucide-react'
import { Avatar, AttachmentBubble } from './MessageUI'
import { BookingRequestCard, CancellationRequestCard } from './BookingCards'
import { API_BASE, ROLE_ICON, ROLE_COLOR, ROLE_LABEL, formatMessageTime } from './_helpers'
import type { Conversation, Message, BookingRequestData } from './types'

interface MessageThreadProps {
  activeConv: Conversation | null
  activeConvId: number | null
  messages: Message[]
  currentUserId: number | null
  isOrganizer: boolean
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
  fetchMessages: (convId: number, silent?: boolean) => Promise<void>
}

export default function MessageThread({
  activeConv, activeConvId, messages, currentUserId, isOrganizer, loadingMsgs,
  token, mobileView, content, file, filePreviewUrl, sending,
  setLightbox, setMobileView, setFile, setMessages,
  handleSend, handleMessagesScroll, handleTextareaChange,
  messagesContainerRef, messagesEndRef, fileInputRef, textareaRef,
  fetchMessages,
}: MessageThreadProps) {
  const router = useRouter()

  // ── Formulaire de proposition de booking ──────────────────
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingDate, setBookingDate]   = useState('')
  const [bookingFee, setBookingFee]     = useState('')
  const [bookingMsg, setBookingMsg]     = useState('')
  const [bookingSending, setBookingSending] = useState(false)
  const [bookingError, setBookingError] = useState('')

  const submitBooking = async () => {
    if (!token || !activeConvId || !bookingDate || bookingSending) return
    const other = activeConv?.participants.find(p => p.id !== currentUserId)
    if (!other?.profileId) {
      setBookingError('Profil de l\'interlocuteur introuvable.')
      return
    }
    setBookingSending(true)
    setBookingError('')
    try {
      const res = await fetch(`${API_BASE}/api/events/booking-request`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetProfileId: other.profileId,
          conversationId: activeConvId,
          date: bookingDate,
          fee: bookingFee ? parseFloat(bookingFee) : undefined,
          message: bookingMsg.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setBookingError(err?.error || 'Erreur lors de l\'envoi.')
        return
      }
      // Reset et fermer le formulaire
      setBookingDate('')
      setBookingFee('')
      setBookingMsg('')
      setShowBookingForm(false)
      // Rafraîchir les messages pour afficher la carte booking
      await fetchMessages(activeConvId)
    } catch {
      setBookingError('Erreur réseau.')
    } finally {
      setBookingSending(false)
    }
  }

  // Lien vers le profil de l'interlocuteur
  const getProfileLink = (role: string, id: number) => {
    const r = role?.toLowerCase()
    if (r === 'artist')    return `/artist/${id}`
    if (r === 'organizer') return `/organizer/${id}`
    if (r === 'provider')  return `/provider/${id}`
    return null
  }

  // Groupes de messages consécutifs par expéditeur
  const messageGroups = useMemo(() => {
    return messages.map((msg, i) => {
      const prev = messages[i - 1]
      const next = messages[i + 1]
      const sameAsPrev = prev && prev.sender.id === msg.sender.id && prev.type === msg.type
      const sameAsNext = next && next.sender.id === msg.sender.id && next.type === msg.type
      return {
        msg,
        isFirst: !sameAsPrev,
        isLast: !sameAsNext,
        isMid: !!sameAsPrev && !!sameAsNext,
      }
    })
  }, [messages])

  const onStatusUpdate = (messageId: string, newStatus: BookingRequestData['status']) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId || !m.bookingRequest) return m
      return { ...m, bookingRequest: { ...m.bookingRequest, status: newStatus } }
    }))
  }

  if (!activeConvId || !activeConv) {
    return (
      <div className={`flex-1 flex-col items-center justify-center gap-5 text-center px-8 bg-gradient-to-b from-[#09090f] to-[#07070d] ${activeConvId && mobileView === 'chat' ? 'flex' : 'hidden md:flex'}`}>
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-900/30 to-purple-900/20 border border-violet-500/10 flex items-center justify-center shadow-2xl shadow-violet-900/20">
            <MessageCircle className="w-9 h-9 text-violet-400/40" />
          </div>
          <div className="absolute -inset-3 rounded-full border border-violet-500/5 animate-pulse" />
        </div>
        <div>
          <p className="font-semibold text-white/50 text-sm">Sélectionne une conversation</p>
          <p className="text-xs text-white/20 mt-1">ou démarre-en une nouvelle avec le bouton +</p>
        </div>
      </div>
    )
  }

  const other = activeConv.participants.find((p) => p.id !== currentUserId) ?? activeConv.participants[0]
  const Icon = other ? ROLE_ICON[other.role] : null

  return (
    <div className={`flex-1 flex flex-col min-w-0 bg-gradient-to-b from-[#09090f] to-[#07070d] ${activeConvId && mobileView === 'chat' ? 'flex' : 'hidden md:flex'}`}>
      {/* Header chat */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.05] bg-gradient-to-b from-[#0d0d18]/90 to-[#0d0d18]/70 backdrop-blur-sm shrink-0">
        <button
          onClick={() => { router.push('/messages'); setMobileView('list') }}
          className="md:hidden p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {other && (() => {
          const profileLink = getProfileLink(other.role, other.id)
          const inner = (
            <div className="flex items-center gap-3 min-w-0 flex-1 group">
              <Avatar src={other.profile?.avatar || ''} alt={other.name} size={38} />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate group-hover:text-violet-300 transition">{other.name}</p>
                {Icon && (
                  <div className={`flex items-center gap-1 text-xs ${ROLE_COLOR[other.role]}`}>
                    <Icon className="w-3 h-3" />
                    <span>{ROLE_LABEL[other.role]}</span>
                  </div>
                )}
              </div>
              {profileLink && <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-violet-400 transition ml-1 shrink-0" />}
            </div>
          )
          return profileLink
            ? <Link href={profileLink} className="flex-1 min-w-0">{inner}</Link>
            : <div className="flex-1 min-w-0">{inner}</div>
        })()}

        {/* Bouton proposer un booking — organisateurs seulement */}
        {isOrganizer && other && (
          <button
            onClick={() => { setShowBookingForm(v => !v); setBookingError('') }}
            title="Proposer un booking"
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              showBookingForm
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-900/40'
                : 'bg-white/[0.05] border border-white/[0.08] text-white/50 hover:bg-violet-500/20 hover:text-violet-300 hover:border-violet-500/30'
            }`}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Booking</span>
          </button>
        )}
      </div>

      {/* Formulaire de proposition de booking (slide-down) */}
      {isOrganizer && showBookingForm && (
        <div className="border-b border-white/[0.05] bg-gradient-to-b from-[#0f0f1e] to-[#0d0d1a] px-4 py-4 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <CalendarPlus className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <p className="text-sm font-semibold text-white/80">Proposer un booking</p>
            </div>
            <button onClick={() => { setShowBookingForm(false); setBookingError('') }}
              className="p-1 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[11px] text-white/35 mb-1 block">Date *</label>
              <input
                type="date"
                value={bookingDate}
                onChange={e => setBookingDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[11px] text-white/35 mb-1 block">Cachet proposé (€)</label>
              <input
                type="number"
                value={bookingFee}
                onChange={e => setBookingFee(e.target.value)}
                placeholder="Ex : 500"
                min="0"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="text-[11px] text-white/35 mb-1 block">Message (optionnel)</label>
            <textarea
              value={bookingMsg}
              onChange={e => setBookingMsg(e.target.value)}
              placeholder="Décris la prestation, le lieu, les horaires…"
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all resize-none"
            />
          </div>

          {bookingError && (
            <p className="text-xs text-red-400/80 mb-2">{bookingError}</p>
          )}

          <button
            onClick={submitBooking}
            disabled={!bookingDate || bookingSending}
            className="w-full py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 text-white text-sm font-semibold hover:from-violet-400 hover:to-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm shadow-violet-900/40"
          >
            {bookingSending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Envoi…
              </span>
            ) : (
              '📅 Envoyer la proposition'
            )}
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 overflow-y-auto px-4 py-5 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/5"
      >
        {loadingMsgs && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 text-violet-500/40 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white/10" />
            </div>
            <p className="text-sm text-white/25">Aucun message — dis bonjour !</p>
          </div>
        ) : (
          (() => {
            const items: React.ReactNode[] = []
            let lastDate = ''

            messageGroups.forEach(({ msg, isFirst, isLast }, i) => {
              const isMe = msg.sender.id === currentUserId
              const msgDate = new Date(msg.createdAt).toDateString()

              // Séparateur de date
              if (msgDate !== lastDate) {
                lastDate = msgDate
                items.push(
                  <div key={`date-${i}`} className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                    <span className="text-[10px] text-white/20 shrink-0 font-medium tracking-wide uppercase">
                      {new Date(msg.createdAt).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                  </div>
                )
              }

              // Carte booking request
              if (msg.type === 'BOOKING_REQUEST' && msg.bookingRequest) {
                items.push(
                  <div key={msg.id} className={`flex items-end gap-2 mt-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
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
                  <div key={msg.id} className={`flex items-end gap-2 mt-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
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

              // Arrondi des bulles selon position dans le groupe
              const bubbleRadius = isMe
                ? isFirst && isLast ? 'rounded-[18px] rounded-br-[5px]'
                  : isFirst ? 'rounded-[18px] rounded-br-[5px]'
                  : isLast  ? 'rounded-[18px] rounded-tr-[5px] rounded-br-[5px]'
                  : 'rounded-[18px] rounded-r-[5px]'
                : isFirst && isLast ? 'rounded-[18px] rounded-bl-[5px]'
                  : isFirst ? 'rounded-[18px] rounded-bl-[5px]'
                  : isLast  ? 'rounded-[18px] rounded-tl-[5px] rounded-bl-[5px]'
                  : 'rounded-[18px] rounded-l-[5px]'

              // Message normal — espace réduit si même expéditeur
              items.push(
                <div key={msg.id} className={`flex items-end gap-2 ${isFirst ? 'mt-3' : 'mt-0.5'} ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {/* Avatar : affiché seulement sur le dernier message du groupe */}
                  {!isMe && (
                    <div className="w-7 h-7 shrink-0 mb-1">
                      {isLast ? <Avatar src={msg.sender.image || ''} alt={msg.sender.name} size={28} /> : null}
                    </div>
                  )}
                  <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2.5 ${bubbleRadius} shadow-sm ${
                      isMe
                        ? 'bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-violet-900/30'
                        : 'bg-[#1c1c2e] border border-white/[0.06] text-white/90'
                    }`}>
                      {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                      <AttachmentBubble msg={msg} onImageClick={(url, name) => setLightbox({ url, name })} />
                    </div>
                    {/* Heure + lu — seulement sur le dernier du groupe */}
                    {isLast && (
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[10px] text-white/20">{formatMessageTime(msg.createdAt)}</span>
                        {isMe && (
                          msg.seen
                            ? <CheckCheck className="w-3 h-3 text-violet-400" />
                            : <Check className="w-3 h-3 text-white/20" />
                        )}
                      </div>
                    )}
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
        <div className="mx-4 mb-2 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#141420]/80 border border-white/[0.08] backdrop-blur-sm">
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
      <div className="px-4 pb-4 pt-2 shrink-0 bg-gradient-to-t from-[#09090f] to-transparent">
        <div className="flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-[#141420]/80 backdrop-blur-sm px-3 py-2.5 shadow-lg shadow-black/20 focus-within:border-violet-500/30 transition-colors">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
            placeholder="Écrire un message…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-white/90 placeholder-white/20 focus:outline-none resize-none py-1 max-h-28 leading-relaxed"
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition shrink-0 self-end"
            type="button"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            onClick={handleSend}
            disabled={sending || (!content.trim() && !file)}
            className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 text-white hover:from-violet-400 hover:to-purple-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm shadow-violet-900/40 shrink-0 self-end"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-white/10 mt-1.5 text-center tracking-wide">Entrée pour envoyer · Shift+Entrée pour nouvelle ligne</p>
      </div>
    </div>
  )
}
