// messages/ConversationList.tsx — Panneau gauche : liste des conversations

'use client'

import { Search, MessageCircle, Plus, X, Loader2, Trash2 } from 'lucide-react'
import { Avatar } from './MessageUI'
import { ROLE_ICON, ROLE_COLOR, ROLE_LABEL, formatTime } from './_helpers'
import type { Conversation, SearchUser } from './types'

interface ConversationListProps {
  conversations: Conversation[]
  currentUserId: number | null
  convSearch: string
  setConvSearch: (v: string) => void
  showNewConv: boolean
  setShowNewConv: (v: boolean) => void
  newConvSearch: string
  setNewConvSearch: (v: string) => void
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

export default function ConversationList({
  conversations, currentUserId, convSearch, setConvSearch,
  showNewConv, setShowNewConv, newConvSearch, setNewConvSearch,
  searchResults, searchLoading, activeConvId, mobileView,
  deletingId, selectConv, startConversation, deleteConversation,
}: ConversationListProps) {

  const filteredConvs = conversations.filter((c) => {
    if (!convSearch.trim()) return true
    const other = c.participants.find((p) => p.id !== currentUserId) ?? c.participants[0]
    return other?.name?.toLowerCase().includes(convSearch.toLowerCase())
  })

  return (
    <div className={`
      flex flex-col border-r border-white/8 bg-[#0d0d14]
      w-full md:w-80 lg:w-96 shrink-0
      ${activeConvId && mobileView === 'chat' ? 'hidden md:flex' : 'flex'}
    `}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold">Messages</h1>
          <button
            onClick={() => setShowNewConv(!showNewConv)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
              showNewConv ? 'bg-violet-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {showNewConv ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {/* Recherche nouvelle conversation */}
        {showNewConv && (
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                type="text"
                value={newConvSearch}
                onChange={(e) => setNewConvSearch(e.target.value)}
                placeholder="Chercher un utilisateur…"
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition"
              />
            </div>
            {newConvSearch.trim() && (
              <div className="mt-1 rounded-xl border border-white/8 bg-[#111118] overflow-hidden max-h-56 overflow-y-auto">
                {searchLoading ? (
                  <div className="flex items-center gap-2 p-3 text-sm text-white/40">
                    <Loader2 className="w-4 h-4 animate-spin" /> Recherche…
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="p-3 text-sm text-white/30">Aucun résultat</p>
                ) : (
                  searchResults.map((u) => {
                    const Icon = ROLE_ICON[u.role]
                    return (
                      <button
                        key={u.id}
                        onClick={() => startConversation(u.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition text-left"
                      >
                        <Avatar src={u.profile?.avatar || ''} alt={getDisplayName(u)} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{getDisplayName(u)}</p>
                          <div className={`flex items-center gap-1 text-xs ${ROLE_COLOR[u.role]}`}>
                            <Icon className="w-3 h-3" />
                            <span>{ROLE_LABEL[u.role]}</span>
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Filtre conversations existantes */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
          <input
            type="text"
            value={convSearch}
            onChange={(e) => setConvSearch(e.target.value)}
            placeholder="Filtrer…"
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] text-sm text-white placeholder-white/20 focus:outline-none border border-transparent focus:border-white/10 transition"
          />
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto">
        {filteredConvs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 py-12">
            <MessageCircle className="w-10 h-10 text-white/10" />
            <p className="text-sm text-white/30">
              {conversations.length === 0 ? 'Aucune conversation' : 'Aucun résultat'}
            </p>
            {conversations.length === 0 && (
              <button
                onClick={() => setShowNewConv(true)}
                className="text-xs text-violet-400 hover:text-violet-300 transition"
              >
                Démarrer une conversation
              </button>
            )}
          </div>
        ) : (
          filteredConvs.map((conv) => {
            const other = conv.participants.find((p) => p.id !== currentUserId) ?? conv.participants[0]
            const isActive = conv.id === activeConvId
            const isUnread =
              !!conv.lastMessageMeta &&
              conv.lastMessageMeta.senderId !== currentUserId &&
              !conv.lastMessageMeta.seen

            return (
              <div
                key={conv.id}
                onClick={() => selectConv(conv.id)}
                className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition relative ${
                  isActive ? 'bg-white/8 border-r-2 border-violet-500' : 'hover:bg-white/[0.04]'
                }`}
              >
                <Avatar src={other?.profile?.avatar || ''} alt={other?.name || '?'} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${isUnread ? 'font-semibold text-white' : 'font-medium text-white/80'}`}>
                      {other?.name}
                    </p>
                    <span className="text-[10px] text-white/30 shrink-0">
                      {conv.updatedAt ? formatTime(conv.updatedAt) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className={`text-xs truncate ${isUnread ? 'text-white/70' : 'text-white/35'}`}>
                      {conv.lastMessage || 'Nouvelle conversation'}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {isUnread && <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />}
                      <button
                        onClick={(e) => deleteConversation(conv.id, e)}
                        disabled={deletingId === conv.id}
                        className="opacity-0 group-hover:opacity-100 transition p-1 rounded-md hover:bg-red-500/10 text-white/30 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
