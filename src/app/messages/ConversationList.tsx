'use client'

import { Search, MessageCircle, Loader2, Trash2 } from 'lucide-react'
import { Avatar } from './MessageUI'
import { ROLE_ICON, ROLE_COLOR, ROLE_LABEL, formatTime } from './_helpers'
import type { Conversation, SearchUser } from './types'

interface ConversationListProps {
  conversations: Conversation[]
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

export default function ConversationList({
  conversations, currentUserId, search, setSearch, contacts,
  searchResults, searchLoading, activeConvId, mobileView,
  deletingId, selectConv, startConversation, deleteConversation,
}: ConversationListProps) {

  const isSearching = search.trim().length > 0

  // Quand on cherche : fusionner contacts (en tête) + searchResults (les autres)
  const contactIds = new Set(contacts.map(c => c.id))
  const otherResults = searchResults.filter(u => !contactIds.has(u.id))

  const matchingContacts = isSearching
    ? contacts.filter(c => getDisplayName(c).toLowerCase().includes(search.toLowerCase()))
    : []

  // Filtrer conversations si pas en mode recherche
  const filteredConvs = !isSearching
    ? conversations
    : []

  return (
    <div className={`
      flex flex-col border-r border-white/[0.06]
      bg-gradient-to-b from-[#0e0e1a] to-[#0b0b15]
      w-full md:w-80 lg:w-96 shrink-0
      ${activeConvId && mobileView === 'chat' ? 'hidden md:flex' : 'flex'}
    `}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Messages
            </h1>
            {conversations.length > 0 && !isSearching && (
              <p className="text-[11px] text-white/25 mt-0.5">{conversations.length} conversation{conversations.length > 1 ? 's' : ''}</p>
            )}
          </div>
        </div>

        {/* Barre de recherche unifiée */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher ou démarrer une conversation…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all"
          />
        </div>

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
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white/15" />
              </div>
              <p className="text-sm text-white/25">Aucune conversation</p>
              <p className="text-xs text-white/15">Recherche un utilisateur pour démarrer</p>
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const other = conv.participants.find((p) => p.id !== currentUserId) ?? conv.participants[0]
              const isActive = conv.id === activeConvId
              const isUnread = !!conv.lastMessageMeta && conv.lastMessageMeta.senderId !== currentUserId && !conv.lastMessageMeta.seen

              return (
                <div key={conv.id} onClick={() => selectConv(conv.id)}
                  className={`group relative flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 ${
                    isActive ? 'bg-gradient-to-r from-violet-600/[0.18] via-violet-500/[0.08] to-transparent' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-gradient-to-b from-violet-400 to-purple-600" />}
                  <div className="relative shrink-0">
                    <Avatar src={other?.profile?.avatar || ''} alt={other?.name || '?'} size={44} />
                    {isUnread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-violet-500 border-2 border-[#0e0e1a] shadow-sm shadow-violet-500/50" />}
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
                        {conv.lastMessage || <span className="italic text-white/20">Nouvelle conversation</span>}
                      </p>
                      <button onClick={(e) => deleteConversation(conv.id, e)} disabled={deletingId === conv.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-500/10 text-white/20 hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
