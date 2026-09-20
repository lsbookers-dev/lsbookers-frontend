'use client'

import { useState } from 'react'
import { Search, MessageCircle, Loader2, Trash2, SquarePen } from 'lucide-react'
import { Avatar } from './MessageUI'
import { ROLE_ICON, ROLE_COLOR, ROLE_LABEL, formatTime } from './_helpers'
import type { Conversation, SearchUser } from './types'

interface ConversationListProps {
  conversations: Conversation[]
  convLoaded: boolean
  currentUserId: number | null
  search: string
  setSearch: (v: string) => void
  contacts: SearchUser[]
  searchResults: SearchUser[]
  searchLoading: boolean
  activeConvId: number | null
  mobileView: 'list' | 'chat'
  deletingId: number | null
  selectConv: (id: number) => void
  startConversation: (id: number) => void
  deleteConversation: (id: number, e: React.MouseEvent) => void
}

function getDisplayName(u: SearchUser) {
  return u.pseudo || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Utilisateur'
}

function cleanPreview(value: string) {
  return value.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '').trim()
}

export default function ConversationList({
  conversations, convLoaded, currentUserId, search, setSearch, contacts,
  searchResults, searchLoading, activeConvId, mobileView,
  deletingId, selectConv, startConversation, deleteConversation,
}: ConversationListProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'bookings'>('all')

  const isSearching = search.trim().length > 0

  // Quand on cherche : fusionner contacts (en tête) + searchResults (les autres)
  const contactIds = new Set(contacts.map(c => c.id))
  const otherResults = searchResults.filter(u => !contactIds.has(u.id))

  const matchingContacts = isSearching
    ? contacts.filter(c => getDisplayName(c).toLowerCase().includes(search.toLowerCase()))
    : []

  // Filtrer conversations si pas en mode recherche
  const filteredConvs = !isSearching
    ? conversations.filter((conv) => {
        if (filter === 'unread') {
          return !!conv.lastMessageMeta && conv.lastMessageMeta.senderId !== currentUserId && !conv.lastMessageMeta.seen
        }
        if (filter === 'bookings') {
          return /booking|proposition|réservation/i.test(conv.lastMessage || '')
        }
        return true
      })
    : []

  const isUnreadConversation = (conv: Conversation) => (
    !!conv.lastMessageMeta && conv.lastMessageMeta.senderId !== currentUserId && !conv.lastMessageMeta.seen
  )
  const isBookingConversation = (conv: Conversation) => /booking|proposition|réservation/i.test(conv.lastMessage || '')
  const unreadCount = conversations.filter(isUnreadConversation).length
  const bookingCount = conversations.filter(isBookingConversation).length
  const priorityConversations = filter === 'all'
    ? filteredConvs.filter((conv) => isUnreadConversation(conv) || isBookingConversation(conv))
    : filteredConvs
  const otherConversations = filter === 'all'
    ? filteredConvs.filter((conv) => !isUnreadConversation(conv) && !isBookingConversation(conv))
    : []

  const renderConversation = (conv: Conversation) => {
    const other = conv.participants.find((p) => p.id !== currentUserId) ?? conv.participants[0]
    const isActive = conv.id === activeConvId
    const isUnread = isUnreadConversation(conv)
    const isBooking = isBookingConversation(conv)

    return (
      <div key={conv.id} onClick={() => selectConv(conv.id)}
        className={`lsb-conversation-row group relative cursor-pointer transition-all duration-150 ${
          isActive ? 'bg-gradient-to-r from-violet-600/[0.18] via-violet-500/[0.08] to-transparent' : 'hover:bg-white/[0.03]'
        }`}
      >
        {isActive && <div className="lsb-conversation-active-line" />}
        <div className="lsb-conversation-main">
          <div className="relative shrink-0">
            <Avatar src={other?.profile?.avatar || ''} alt={other?.name || '?'} size={42} />
            {isUnread && <span className="lsb-conversation-unread-dot" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className={`text-sm truncate ${isUnread ? 'font-semibold text-white' : isActive ? 'font-medium text-white/90' : 'font-medium text-white/65'}`}>
                {other?.name}
              </p>
              <span className={`text-[10px] shrink-0 tabular-nums ${isUnread ? 'text-violet-400' : 'text-white/25'}`}>
                {conv.updatedAt ? formatTime(conv.updatedAt) : ''}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className={`text-xs truncate ${isUnread ? 'text-white/60' : 'text-white/30'}`}>
                {conv.lastMessage ? cleanPreview(conv.lastMessage) : <span className="italic text-white/20">Nouvelle conversation</span>}
              </p>
              <button onClick={(e) => deleteConversation(conv.id, e)} disabled={deletingId === conv.id}
                aria-label={`Supprimer la conversation avec ${other?.name || 'cet utilisateur'}`}
                className="lsb-conversation-delete opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-500/10 text-white/20 hover:text-red-400">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
        {(isBooking || isUnread) && (
          <div className="lsb-conversation-labels">
            {isBooking && <span className="is-booking">Booking</span>}
            {isUnread && <span className="is-unread">Non lu</span>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`lsb-conversations
      flex flex-col border-r border-white/[0.06]
      bg-gradient-to-b from-[#0e0e1a] to-[#0b0b15]
      w-full md:w-80 lg:w-96 shrink-0
      ${activeConvId && mobileView === 'chat' ? 'hidden md:flex' : 'flex'}
    `}>
      {/* Header */}
      <div className="lsb-conversations-header px-4 pt-5 pb-3 border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="lsb-conversations-kicker">VOS ÉCHANGES</p>
            <div className="lsb-conversations-title">
              <h1>Messages</h1>
              {unreadCount > 0 && <span>{unreadCount}</span>}
            </div>
          </div>
          <button
            type="button"
            aria-label="Nouveau message"
            onClick={() => document.getElementById('conversation-search')?.focus()}
            className="lsb-new-message"
          >
            <SquarePen className="w-4 h-4" />
          </button>
        </div>

        {/* Barre de recherche unifiée */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            id="conversation-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher ou démarrer une conversation…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all"
          />
        </div>

        {!isSearching && (
          <div className="lsb-message-filters" aria-label="Filtrer les conversations">
            <button type="button" className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>Tous · {conversations.length}</button>
            <button type="button" className={filter === 'unread' ? 'is-active' : ''} onClick={() => setFilter('unread')}>Non lus · {unreadCount}</button>
            <button type="button" className={filter === 'bookings' ? 'is-active' : ''} onClick={() => setFilter('bookings')}>Bookings · {bookingCount}</button>
          </div>
        )}

        {/* Résultats de recherche */}
        {isSearching && (
          <div className="mt-2 rounded-xl border border-white/[0.07] bg-[#0f0f1c] overflow-hidden max-h-72 overflow-y-auto shadow-xl shadow-black/40">
            {searchLoading && matchingContacts.length === 0 ? (
              <div className="flex items-center gap-2 p-3 text-sm text-white/40">
                <Loader2 className="w-4 h-4 animate-spin" /> Recherche…
              </div>
            ) : matchingContacts.length === 0 && otherResults.length === 0 ? (
              <p className="p-3 text-sm text-white/30">Aucun résultat</p>
            ) : (
              <>
                {matchingContacts.length > 0 && (
                  <>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/25">Contacts</p>
                    {matchingContacts.map((u) => {
                      const Icon = ROLE_ICON[u.role]
                      return (
                        <button key={u.id} onClick={() => startConversation(u.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.05] transition text-left">
                          <Avatar src={u.profile?.avatar || ''} alt={getDisplayName(u)} size={36} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate text-white/90">{getDisplayName(u)}</p>
                            <div className={`flex items-center gap-1 text-[11px] mt-0.5 ${ROLE_COLOR[u.role]}`}>
                              <Icon className="w-2.5 h-2.5" /><span>{ROLE_LABEL[u.role]}</span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </>
                )}
                {otherResults.length > 0 && (
                  <>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/25">Autres utilisateurs</p>
                    {otherResults.map((u) => {
                      const Icon = ROLE_ICON[u.role]
                      return (
                        <button key={u.id} onClick={() => startConversation(u.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.05] transition text-left">
                          <Avatar src={u.profile?.avatar || ''} alt={getDisplayName(u)} size={36} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate text-white/90">{getDisplayName(u)}</p>
                            <div className={`flex items-center gap-1 text-[11px] mt-0.5 ${ROLE_COLOR[u.role]}`}>
                              <Icon className="w-2.5 h-2.5" /><span>{ROLE_LABEL[u.role]}</span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Liste des conversations existantes (quand pas en recherche) */}
      {!isSearching && (
        <div className="flex-1 overflow-y-auto py-1">
          {filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 py-12">
              {!convLoaded ? (
                <Loader2 className="w-6 h-6 text-violet-400/40 animate-spin" />
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white/15" />
                  </div>
                  <p className="text-sm text-white/25">Aucune conversation</p>
                  <p className="text-xs text-white/15">Recherche un utilisateur pour démarrer</p>
                </>
              )}
            </div>
          ) : filter === 'all' ? (
            <>
              {priorityConversations.length > 0 && (
                <section className="lsb-conversation-group">
                  <div className="lsb-conversation-group-title"><span>À TRAITER</span><strong>{priorityConversations.length} priorité{priorityConversations.length > 1 ? 's' : ''}</strong></div>
                  {priorityConversations.map(renderConversation)}
                </section>
              )}
              {otherConversations.length > 0 && (
                <section className="lsb-conversation-group">
                  <div className="lsb-conversation-group-title"><span>AUTRES ÉCHANGES</span></div>
                  {otherConversations.map(renderConversation)}
                </section>
              )}
            </>
          ) : (
            <section className="lsb-conversation-group">
              <div className="lsb-conversation-group-title"><span>{filter === 'unread' ? 'NON LUS' : 'BOOKINGS'}</span><strong>{filteredConvs.length} résultat{filteredConvs.length > 1 ? 's' : ''}</strong></div>
              {filteredConvs.map(renderConversation)}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
