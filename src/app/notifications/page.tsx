'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { apiFetch } from '@/utils/auth'
import { notificationTarget } from '@/utils/notificationLinks'
import PublicationModal from '@/components/PublicationModal'
import type { PubCardData } from '@/components/PublicationCard'
import LsIcon from '@/components/ui/LsIcon'
import { NotificationIcon, notificationType } from '@/lib/notificationTypes'

// ─── Types ───────────────────────────────────────────────────────────────────

type Notif = {
  id: number
  type: string
  content: string
  read: boolean
  createdAt: string
  actor?: { id: number; name?: string | null; avatar?: string | null; role?: string | null } | null
  conversationId?: number | null
  offerId?: number | null
  publicationId?: number | null
  staffId?: number | null
  eventId?: number | null
  staffStatus?: string | null
}

// Pictos et libellés des types : lib/notificationTypes

// ─── Constantes ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 30

// ─── Composant ───────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { user } = useAuth() as { user: { id: number | string } | null }
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

  const [all, setAll]             = useState<Notif[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(false)
  const [filterUnread, setFilterUnread] = useState(false)
  const [cursor, setCursor]       = useState<number | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const [pubModal, setPubModal]   = useState<PubCardData | null>(null)

  // « Lu » uniquement pour les notifications réellement affichées (pas les plus anciennes)
  const markShownAsRead = useCallback((list: Notif[]) => {
    const ids = list.filter(n => !n.read).map(n => n.id)
    if (!ids.length || !API_BASE) return
    apiFetch(`${API_BASE}/api/notifications/mark-read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
      .then(() => window.dispatchEvent(new Event('lsb:unread-changed')))
      .catch(() => {})
  }, [API_BASE])

  const openPublication = async (id: number) => {
    try {
      const res = await apiFetch(`${API_BASE}/api/publications/${id}`)
      if (res.ok) setPubModal(await res.json() as PubCardData)
    } catch { /* silencieux */ }
  }
  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    if (!user?.id || !API_BASE) return
    setLoading(true)
    setError(false)
    try {
      const res = await apiFetch(`${API_BASE}/api/notifications?limit=${PAGE_SIZE}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const list: Notif[] = data.notifications || []
      setAll(list)
      setCursor(data.nextCursor ?? null)
      // Les nouvelles restent mises en avant pendant cette visite, mais les pastilles s'effacent
      markShownAsRead(list)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [API_BASE, user?.id, markShownAsRead])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  // Notifications plus anciennes, par paquets de 30
  const loadMore = async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await apiFetch(`${API_BASE}/api/notifications?limit=${PAGE_SIZE}&before=${cursor}`)
      if (res.ok) {
        const data = await res.json()
        markShownAsRead(data.notifications || [])
        setAll(prev => {
          const seen = new Set(prev.map(n => n.id))
          return [...prev, ...(data.notifications || []).filter((n: Notif) => !seen.has(n.id))]
        })
        setCursor(data.nextCursor ?? null)
      }
    } catch { /* silencieux */ }
    setLoadingMore(false)
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  const markAsRead = async (id: number) => {
    try {
      await apiFetch(`${API_BASE}/api/notifications/${id}`, {
        method: 'PATCH',
        })
      setAll(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch { /* silencieux */ }
  }

  const respondStaffInvitation = async (notifId: number, staffId: number, eventId: number, response: 'ACCEPT' | 'REFUSE') => {
    try {
      const res = await apiFetch(`${API_BASE}/api/events/${eventId}/staff/${staffId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      })
      if (res.ok) {
        const newStatus = response === 'ACCEPT' ? 'BOOKED' : 'CANCELLED'
        setAll(prev => prev.map(n => n.id === notifId ? { ...n, read: true, staffStatus: newStatus } : n))
        markAsRead(notifId)
      }
    } catch { /* silencieux */ }
  }

  const markAllAsRead = async () => {
    setMarkingAll(true)
    try {
      await apiFetch(`${API_BASE}/api/notifications/mark-all-read`, {
        method: 'PATCH',
        })
      setAll(prev => prev.map(n => ({ ...n, read: true })))
    } catch { /* silencieux */ }
    setMarkingAll(false)
  }

  // ── Données filtrées ───────────────────────────────────────────────────────

  const filtered  = filterUnread ? all.filter(n => !n.read) : all
  const unreadCount = all.filter(n => !n.read).length

  const handleFilterToggle = () => setFilterUnread(v => !v)

  // ── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen text-white lsb-surface-page lsb-notifications-page">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <p className="lsb-eyebrow">ACTIVITÉ</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Notifications<span className="text-violet-400">.</span></h1>
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <LsIcon name="bell" size={34} tone="muted" className="mx-auto mb-3" />
            <p className="text-sm text-white/30">
              {filterUnread ? 'Aucune notification non lue.' : 'Aucune notification.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(notif => {
              const cfg  = notificationType(notif.type)
              const target = notificationTarget(notif)
              const link = target && 'href' in target ? target.href : null
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
                        <NotificationIcon type={notif.type} box={36} />
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-white/60">
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

                      {/* Alerte sécurité — action par email */}
                      {notif.type === 'NEW_DEVICE_LOGIN' && (
                        <span className="mt-2 flex items-center gap-1.5 text-xs text-gold group-hover:text-gold-light">
                          <LsIcon name="shield" tone="inherit" size={15} />Ce n’était pas vous ? Retirez l’appareil dans Réglages › Connexion et sécurité
                        </span>
                      )}

                      {/* Invitation staff — boutons Accepter / Refuser */}
                      {notif.type === 'STAFF_INVITATION' && notif.staffId && notif.eventId && (
                        notif.staffStatus === 'BOOKED' ? (
                          <p className="mt-2 flex items-center gap-1 text-xs text-emerald-400"><LsIcon name="check" tone="inherit" size={15} />Invitation acceptée</p>
                        ) : notif.staffStatus === 'CANCELLED' ? (
                          <p className="mt-2 flex items-center gap-1 text-xs text-red-400"><LsIcon name="close" tone="inherit" size={15} />Invitation refusée</p>
                        ) : (
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={e => { e.preventDefault(); respondStaffInvitation(notif.id, notif.staffId!, notif.eventId!, 'ACCEPT') }}
                              className="flex-1 py-1.5 rounded-lg bg-emerald-600/70 hover:bg-emerald-600 text-white text-xs font-medium transition"
                            >
                              Accepter
                            </button>
                            <button
                              onClick={e => { e.preventDefault(); respondStaffInvitation(notif.id, notif.staffId!, notif.eventId!, 'REFUSE') }}
                              className="flex-1 py-1.5 rounded-lg bg-red-600/50 hover:bg-red-600/80 text-white text-xs font-medium transition"
                            >
                              Refuser
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )

              if (target && 'publicationId' in target) {
                return (
                  <button key={notif.id} type="button" className="block w-full text-left" onClick={() => openPublication(target.publicationId)}>
                    {content}
                  </button>
                )
              }
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

        {/* Voir plus (notifications plus anciennes) */}
        {!loading && !error && cursor && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60 hover:bg-white/10 disabled:opacity-40 transition"
            >
              {loadingMore ? 'Chargement…' : 'Voir plus'}
            </button>
          </div>
        )}

      </div>

      {/* Publication ouverte depuis une notification (j'aime, commentaire, identification) */}
      {pubModal && (
        <PublicationModal pub={pubModal} onClose={() => setPubModal(null)} onCountChange={() => {}} />
      )}
    </main>
  )
}
