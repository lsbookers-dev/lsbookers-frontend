'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trash2, Archive, ArchiveRestore, Mail, MailOpen, RefreshCw, Inbox } from 'lucide-react'

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return t ? { Authorization: `Bearer ${t}`, ...extra } : { ...extra }
}

type ContactMsg = {
  id: number
  name: string
  email: string
  subject?: string | null
  message: string
  isRead: boolean
  isArchived: boolean
  createdAt: string
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMsg[]>([])
  const [total, setTotal] = useState(0)
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [selected, setSelected] = useState<ContactMsg | null>(null)

  const load = useCallback(async (archived: boolean) => {
    setLoading(true)
    try {
      const res = await fetch(
        `${API}/api/contact/admin?archived=${archived}&limit=50`,
        { headers: getAuthHeaders(), cache: 'no-store' }
      )
      if (!res.ok) throw new Error()
      const d = await res.json()
      setMessages(d.messages || [])
      setTotal(d.total || 0)
      setUnread(d.unreadCount ?? 0)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(showArchived) }, [showArchived, load])

  const markRead = async (msg: ContactMsg) => {
    if (msg.isRead) return
    try {
      await fetch(`${API}/api/contact/admin/${msg.id}/read`, {
        method: 'PATCH', headers: getAuthHeaders(),
      })
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m))
      setUnread(u => Math.max(0, u - 1))
    } catch { /* ignore */ }
  }

  const openMessage = (msg: ContactMsg) => {
    setSelected(msg)
    markRead(msg)
  }

  const archive = async (msg: ContactMsg) => {
    const next = !msg.isArchived
    try {
      await fetch(`${API}/api/contact/admin/${msg.id}/archive`, {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ archived: next }),
      })
      setMessages(prev => prev.filter(m => m.id !== msg.id))
      if (selected?.id === msg.id) setSelected(null)
      setTotal(t => t - 1)
      if (!msg.isRead && next) setUnread(u => Math.max(0, u - 1))
    } catch { /* ignore */ }
  }

  const remove = async (msg: ContactMsg) => {
    if (!confirm(`Supprimer ce message de ${msg.name} ?`)) return
    try {
      await fetch(`${API}/api/contact/admin/${msg.id}`, {
        method: 'DELETE', headers: getAuthHeaders(),
      })
      setMessages(prev => prev.filter(m => m.id !== msg.id))
      if (selected?.id === msg.id) setSelected(null)
      setTotal(t => t - 1)
      if (!msg.isRead) setUnread(u => Math.max(0, u - 1))
    } catch { /* ignore */ }
  }

  return (
    <div className="max-w-6xl mx-auto">

      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Messages de contact
            {unread > 0 && (
              <span className="text-sm px-2 py-0.5 rounded-full bg-emerald-600 text-white font-semibold">
                {unread} non lu{unread > 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p className="text-sm text-white/40 mt-0.5">{total} message{total !== 1 ? 's' : ''} {showArchived ? 'archivés' : 'reçus'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowArchived(a => !a); setSelected(null) }}
            className={`px-3 py-2 rounded-xl text-sm border transition ${
              showArchived
                ? 'bg-white/10 border-white/20'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            {showArchived ? '← Boîte de réception' : 'Archives'}
          </button>
          <button
            onClick={() => load(showArchived)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
            title="Rafraîchir"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {loading && <p className="text-white/40 text-sm mb-4">Chargement…</p>}

      {!loading && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3 text-white/30">
          <Inbox size={40} />
          <p className="text-sm">{showArchived ? 'Aucun message archivé.' : 'Aucun message reçu.'}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">

        {/* Liste */}
        <div className="space-y-2">
          {messages.map(msg => (
            <button
              key={msg.id}
              onClick={() => openMessage(msg)}
              className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                selected?.id === msg.id
                  ? 'bg-emerald-600/10 border-emerald-500/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/8'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {msg.isRead
                    ? <MailOpen size={14} className="text-white/30 flex-shrink-0" />
                    : <Mail size={14} className="text-emerald-400 flex-shrink-0" />
                  }
                  <p className={`text-sm truncate ${msg.isRead ? 'text-white/60' : 'font-semibold text-white'}`}>
                    {msg.name}
                  </p>
                </div>
                <span className="text-xs text-white/30 flex-shrink-0">
                  {new Date(msg.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </span>
              </div>
              {msg.subject && (
                <p className="text-xs text-white/40 truncate mt-0.5 ml-5">{msg.subject}</p>
              )}
              <p className="text-xs text-white/30 truncate mt-0.5 ml-5 line-clamp-1">{msg.message}</p>
            </button>
          ))}
        </div>

        {/* Détail */}
        {selected ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

            {/* Actions */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-lg">{selected.subject || 'Sans sujet'}</h2>
                <p className="text-xs text-white/40 mt-0.5">
                  {new Date(selected.createdAt).toLocaleDateString('fr-FR', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => archive(selected)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition"
                  title={selected.isArchived ? 'Désarchiver' : 'Archiver'}
                >
                  {selected.isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                </button>
                <button
                  onClick={() => remove(selected)}
                  className="p-2 rounded-lg bg-red-600/10 hover:bg-red-600/30 text-red-400 transition"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Expéditeur */}
            <div className="bg-white/5 rounded-xl p-4 mb-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-400 font-semibold text-sm">
                {selected.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">{selected.name}</p>
                <a
                  href={`mailto:${selected.email}`}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  {selected.email}
                </a>
                <p className="text-xs text-white/30 mt-0.5">
                  Pour lui répondre, utilisez votre messagerie email.
                </p>
              </div>
            </div>

            {/* Corps du message */}
            <div className="bg-black/30 rounded-xl p-5">
              <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                {selected.message}
              </p>
            </div>

            {/* Bouton répondre par email */}
            <a
              href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || 'Votre message sur LSBookers')}`}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-medium transition"
            >
              <Mail size={14} />
              Répondre par email
            </a>
          </div>
        ) : (
          <div className="hidden lg:flex items-center justify-center text-white/20 text-sm border border-white/5 rounded-2xl">
            Sélectionnez un message pour le lire
          </div>
        )}
      </div>
    </div>
  )
}
