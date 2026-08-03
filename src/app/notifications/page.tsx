'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { getAuthToken } from '@/utils/auth'

// ─── Types ───────────────────────────────────────────────────────────────────

type Notif = {
  id: number
  type: string
  content: string
  read: boolean
  createdAt: string
  actor?: { id: number; name?: string | null; avatar?: string | null } | null
  conversationId?: number | null
  offerId?: number | null
}

// ─── Config types visuels ────────────────────────────────────────────────────

type TypeConfig = { icon: string; color: string; label: string }

const TYPE_CONFIG: Record<string, TypeConfig> = {
  // Messages
  NEW_MESSAGE:           { icon: '💬', color: 'bg-blue-500/15 text-blue-300',   label: 'Message' },
  // Bookings
  BOOKING_REQUEST:       { icon: '📩', color: 'bg-violet-500/15 text-violet-300', label: 'Demande booking' },
  BOOKING_ACCEPTED:      { icon: '✅', color: 'bg-green-500/15 text-green-300',   label: 'Booking accepté' },
  BOOKING_DECLINED:      { icon: '❌', color: 'bg-red-500/15 text-red-300',       label: 'Booking refusé' },
  BOOKING_CANCELLED:     { icon: '🚫', color: 'bg-red-500/15 text-red-300',       label: 'Booking annulé' },
  CANCELLATION_REQUEST:  { icon: '⚠️', color: 'bg-orange-500/15 text-orange-300', label: 'Demande annulation' },
  CANCELLATION_ACCEPTED: { icon: '✅', color: 'bg-green-500/15 text-green-300',   label: 'Annulation acceptée' },
  CANCELLATION_DECLINED: { icon: '❌', color: 'bg-red-500/15 text-red-300',       label: 'Annulation refusée' },
  PAYMENT_RECEIVED:      { icon: '💳', color: 'bg-green-500/15 text-green-300',   label: 'Paiement reçu' },
  // Offres
  NEW_OFFER:             { icon: '🎯', color: 'bg-pink-500/15 text-pink-300',     label: 'Nouvelle offre' },
  // Réseau social
  NEW_FOLLOW:            { icon: '👤', color: 'bg-teal-500/15 text-teal-300',     label: 'Nouvel abonné' },
  NEW_COMMENT:           { icon: '💭', color: 'bg-indigo-500/15 text-indigo-300', label: 'Commentaire' },
  NEW_LIKE:              { icon: '❤️', color: 'bg-rose-500/15 text-rose-300',     label: 'Like' },
  // Fallback
  DEFAULT:               { icon: '🔔', color: 'bg-white/10 text-white/50',        label: 'Notification' },
}

function getConfig(type: string): TypeConfig {
  return TYPE_CONFIG[type] || TYPE_CONFIG.DEFAULT
}

function getLink(notif: Notif): string | null {
  if (notif.conversationId) return `/messages?conv=${notif.conversationId}`
  if (notif.offerId) return `/offers`
  return null
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

// ─── Composant ───────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { user } = useAuth() as { user: { id: number | string } | null }
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

  const [all, setAll]             = useState<Notif[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(false)
  const [filterUnread, setFilterUnread] = useState(false)
  const [page, setPage]           = useState(1)
  const [markingAll, setMarkingAll] = useState(false)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    if (!user?.id || !API_BASE) return
    setLoading(true)
    setError(false)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAll(data.notifications || [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [API_BASE, user?.id])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  // ── Actions ────────────────────────────────────────────────────────────────

  const markAsRead = async (id: number) => {
    try {
      const token = getAuthToken()
      await fetch(`${API_BASE}/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      setAll(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch { /* silencieux */ }
  }

  const markAllAsRead = async () => {
    setMarkingAll(true)
    try {
      const token = getAuthToken()
      await fetch(`${API_BASE}/api/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      setAll(prev => prev.map(n => ({ ...n, read: true })))
    } catch { /* silencieux */ }
    setMarkingAll(false)
  }

  // ── Données filtrées + paginées ────────────────────────────────────────────

  const filtered  = filterUnread ? all.filter(n => !n.read) : all
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const unreadCount = all.filter(n => !n.read).length

  const handleFilterToggle = () => {
    setFilterUnread(v => !v)
    setPage(1)
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-white/40 mt-0.5">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Filtre non lus */}
            <button
              onClick={handleFilterToggle}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                filterUnread
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
              }`}
            >
              Non lues
            </button>
            {/* Tout marquer comme lu */}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 disabled:opacity-40 transition"
              >
                {markingAll ? '…' : 'Tout lire'}
              </button>
            )}
          </div>
        </div>

        {/* États */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-white/30">Chargement…</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-sm text-red-400/80">Impossible de charger les notifications.</p>
            <button onClick={fetchNotifications}
              className="text-xs bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-white/70 transition">
              Réessayer
            </button>
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">🔔</p>
            <p className="text-sm text-white/30">
              {filterUnread ? 'Aucune notification non lue.' : 'Aucune notification.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {paginated.map(notif => {
              const cfg  = getConfig(notif.type)
              const link = getLink(notif)
              const content = (
                <div
                  className={`relative rounded-2xl border transition cursor-pointer group ${
                    notif.read
                      ? 'bg-white/[0.02] border-white/8 hover:bg-white/5'
                      : 'bg-white/[0.06] border-white/15 hover:bg-white/10'
                  }`}
                  onClick={() => { if (!notif.read) markAsRead(notif.id) }}
                >
                  {/* Point non-lu */}
                  {!notif.read && (
                    <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-violet-400" />
                  )}

                  <div className="flex items-start gap-3 p-4">
                    {/* Avatar ou icône type */}
                    <div className="shrink-0 mt-0.5">
                      {notif.actor?.avatar ? (
                        <img src={notif.actor.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${cfg.color}`}>
                          {cfg.icon}
                        </div>
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      {notif.actor?.name && (
                        <p className="text-xs font-semibold text-white/80 mb-0.5">{notif.actor.name}</p>
                      )}
                      <p className="text-sm text-white/70 leading-relaxed">{notif.content}</p>
                      <p className="text-[11px] text-white/30 mt-1.5">
                        {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )

              return link ? (
                <Link key={notif.id} href={link} className="block">
                  {content}
                </Link>
              ) : (
                <div key={notif.id}>{content}</div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60 hover:bg-white/10 disabled:opacity-30 transition"
            >
              ←
            </button>
            <span className="text-xs text-white/40">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60 hover:bg-white/10 disabled:opacity-30 transition"
            >
              →
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
