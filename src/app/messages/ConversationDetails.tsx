'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BellOff, BellRing, BriefcaseBusiness, CalendarDays, ExternalLink, Images, Search, Share2, UserRound, X } from 'lucide-react'
import { Avatar } from './MessageUI'
import { API_BASE, ROLE_LABEL, toAbs } from './_helpers'
import type { Conversation, Message } from './types'

export default function ConversationDetails({ conversation, currentUserId, messages, token, open, onClose }: {
  conversation: Conversation | null
  currentUserId: number | null
  messages: Message[]
  token: string | null
  open: boolean
  onClose: () => void
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [muted, setMuted] = useState(false)
  const participant = conversation?.participants.find((item) => item.id !== currentUserId) ?? conversation?.participants[0]
  const conversationId = conversation?.id
  const conversationMuted = conversation?.muted

  useEffect(() => {
    if (!conversationId) return
    setMuted(Boolean(conversationMuted))
    setSearchOpen(false)
    setQuery('')
  }, [conversationId, conversationMuted])

  const media = useMemo(() => messages.filter((message) => message.attachmentUrl && (message.attachmentType === 'IMAGE' || message.attachmentType === 'VIDEO')), [messages])
  const bookingCount = useMemo(() => new Set(messages.filter((message) => message.bookingRequest).map((message) => message.bookingRequest!.id)).size, [messages])
  const sharedCount = useMemo(() => messages.filter((message) => message.type === 'PROFILE_SHARE' || message.type === 'OFFER_SHARE').length, [messages])
  const matches = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('fr')
    if (!normalized) return []
    return messages.filter((message) => message.content?.toLocaleLowerCase('fr').includes(normalized)).slice(0, 8)
  }, [messages, query])

  if (!participant || !conversation) return null
  const rolePath = participant.role === 'ARTIST' ? 'artist' : participant.role === 'ORGANIZER' ? 'organizer' : 'provider'

  const toggleMute = async () => {
    if (!token) return
    const next = !muted
    setMuted(next)
    try {
      const response = await fetch(`${API_BASE}/api/messages/conversations/${conversation.id}/mute`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ muted: next }),
      })
      if (!response.ok) setMuted(!next)
    } catch {
      setMuted(!next)
    }
  }

  return (
    <aside className={`lsb-conversation-details xl:flex ${open ? 'lsb-details-open' : ''}`}>
      <button type="button" onClick={onClose} className="lsb-details-close xl:hidden" aria-label="Fermer les informations"><X className="w-4 h-4" /></button>
      <div className="lsb-details-profile">
        <Avatar src={participant.profile?.avatar || ''} alt={participant.name} size={68} />
        <h2>{participant.name}</h2>
        <p>{ROLE_LABEL[participant.role]}</p>
        <Link href={`/${rolePath}/${participant.id}`} className="lsb-details-profile-link">Voir le profil <ExternalLink className="w-3.5 h-3.5" /></Link>
      </div>

      <div className="lsb-details-section">
        <span>COLLABORATION</span>
        <div><BriefcaseBusiness className="w-4 h-4" /><strong>{bookingCount}</strong> booking{bookingCount > 1 ? 's' : ''}</div>
        <div><Share2 className="w-4 h-4" /><strong>{sharedCount}</strong> contenu{sharedCount > 1 ? 's' : ''} partagé{sharedCount > 1 ? 's' : ''}</div>
        <div><CalendarDays className="w-4 h-4" /> Mise à jour {new Date(conversation.updatedAt).toLocaleDateString('fr-FR')}</div>
        <div><UserRound className="w-4 h-4" /> {ROLE_LABEL[participant.role]}</div>
      </div>

      <div className="lsb-details-section">
        <span>MÉDIAS PARTAGÉS</span>
        {media.length > 0 ? (
          <div className="lsb-shared-media-grid">
            {media.slice(-6).reverse().map((message) => (
              <a key={message.id} href={toAbs(message.attachmentUrl!)} target="_blank" rel="noreferrer" aria-label={`Ouvrir ${message.attachmentName || 'le média'}`}>
                {message.attachmentType === 'IMAGE'
                  ? <Image src={toAbs(message.attachmentUrl!)} alt={message.attachmentName || 'Média partagé'} fill className="object-cover" unoptimized />
                  : <video src={toAbs(message.attachmentUrl!)} muted preload="metadata" />}
              </a>
            ))}
          </div>
        ) : <p className="lsb-details-empty"><Images className="w-4 h-4" /> Aucun média partagé</p>}
      </div>

      <div className="lsb-details-actions">
        <button type="button" onClick={() => setSearchOpen((value) => !value)} className={searchOpen ? 'is-active' : ''}><Search className="w-4 h-4" /> Rechercher dans la discussion</button>
        <button type="button" onClick={toggleMute} className={muted ? 'is-active' : ''}>
          {muted ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          {muted ? 'Réactiver les notifications' : 'Mettre en sourdine'}
        </button>
      </div>

      {searchOpen && (
        <div className="lsb-conversation-search">
          <div className="lsb-conversation-search-head"><span>RECHERCHE</span><button type="button" onClick={() => { setSearchOpen(false); setQuery('') }} aria-label="Fermer"><X className="w-4 h-4" /></button></div>
          <div className="lsb-conversation-search-field"><Search className="w-4 h-4" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mot ou message…" /></div>
          <div className="lsb-conversation-search-results">
            {query.trim() && matches.length === 0 && <p>Aucun message trouvé</p>}
            {matches.map((message) => (
              <button type="button" key={message.id} onClick={() => document.getElementById(`message-${message.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                <span>{message.sender.id === currentUserId ? 'Vous' : message.sender.name}</span><p>{message.content}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
