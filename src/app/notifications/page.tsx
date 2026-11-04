'use client'

/**
 * Page Notifications — choix B2 d'Antho (04/11/2026) : menu des sujets à gauche avec le nombre
 * de nouvelles (une ligne de filtres sur téléphone), liste rangée par jour à droite.
 * Mise en forme commune avec la cloche : lib/notificationFeed + components/notifications/NotificationRow.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import LsIcon, { type LsIconName } from '@/components/ui/LsIcon'
import NotificationRow from '@/components/notifications/NotificationRow'
import PublicationModal from '@/components/PublicationModal'
import type { PubCardData } from '@/components/PublicationCard'
import { buildFeed, type FeedNotif } from '@/lib/notificationFeed'

const PAGE_SIZE = 30

type CategoryKey = 'all' | 'bookings' | 'offers' | 'events' | 'reviews' | 'network' | 'account'
type Summary = Partial<Record<Exclude<CategoryKey, 'all'> | 'total', number>>

const CATEGORIES: { key: CategoryKey; label: string; icon: LsIconName }[] = [
  { key: 'all', label: 'Tout', icon: 'bell' },
  { key: 'bookings', label: 'Bookings', icon: 'booking' },
  { key: 'offers', label: 'Offres', icon: 'offer' },
  { key: 'events', label: 'Événements', icon: 'stage' },
  { key: 'reviews', label: 'Avis', icon: 'star' },
  { key: 'network', label: 'Réseau', icon: 'follow' },
  { key: 'account', label: 'Compte', icon: 'shield' },
]

export default function NotificationsPage() {
  const { user } = useAuth() as { user: { id: number | string } | null }
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

  const [category, setCategory] = useState<CategoryKey>('all')
  const [list, setList] = useState<FeedNotif[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [cursor, setCursor] = useState<number | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [summary, setSummary] = useState<Summary>({})
  const [pubModal, setPubModal] = useState<PubCardData | null>(null)
  const [responding, setResponding] = useState<Record<number, boolean>>({})

  const listUrl = useCallback((before?: number | null) => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) })
    if (category !== 'all') params.set('category', category)
    if (before) params.set('before', String(before))
    return `${API_BASE}/api/notifications?${params}`
  }, [API_BASE, category])

  // Nombre de nouvelles par sujet à l'arrivée sur la page (relevé une fois, avant de marquer « lu »)
  const summaryLoaded = useRef(false)
  const loadSummary = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/notifications/summary`, { cache: 'no-store' })
      if (res.ok) setSummary(await res.json())
    } catch { /* silencieux */ }
  }, [API_BASE])

  // « Lu » uniquement pour ce qui est affiché ; les nouvelles restent en avant pendant la visite
  const markShownAsRead = useCallback(async (shown: FeedNotif[]) => {
    const ids = shown.filter(n => !n.read).map(n => n.id)
    if (ids.length) {
      try {
        await apiFetch(`${API_BASE}/api/notifications/mark-read`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        })
        window.dispatchEvent(new Event('lsb:unread-changed'))
      } catch { /* silencieux */ }
    }
  }, [API_BASE])

  const fetchFirstPage = useCallback(async () => {
    if (!user?.id || !API_BASE) return
    setLoading(true)
    setError(false)
    if (!summaryLoaded.current) { summaryLoaded.current = true; await loadSummary() }
    try {
      const res = await apiFetch(listUrl())
      if (!res.ok) throw new Error()
      const data = await res.json()
      const rows: FeedNotif[] = data.notifications || []
      setList(rows)
      setCursor(data.nextCursor ?? null)
      void markShownAsRead(rows)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [API_BASE, user?.id, listUrl, markShownAsRead, loadSummary])

  useEffect(() => { void fetchFirstPage() }, [fetchFirstPage])

  const loadMore = async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await apiFetch(listUrl(cursor))
      if (res.ok) {
        const data = await res.json()
        const rows: FeedNotif[] = data.notifications || []
        setList(prev => {
          const seen = new Set(prev.map(n => n.id))
          return [...prev, ...rows.filter(n => !seen.has(n.id))]
        })
        setCursor(data.nextCursor ?? null)
        void markShownAsRead(rows)
      }
    } catch { /* silencieux */ }
    setLoadingMore(false)
  }

  const markAllAsRead = async () => {
    setList(prev => prev.map(n => ({ ...n, read: true })))
    try {
      await apiFetch(`${API_BASE}/api/notifications/mark-all-read`, { method: 'PATCH' })
      window.dispatchEvent(new Event('lsb:unread-changed'))
    } catch { /* silencieux */ }
    setSummary({})
  }

  const deleteNotifs = async (ids: number[]) => {
    setList(prev => prev.filter(n => !ids.includes(n.id)))
    try {
      await apiFetch(`${API_BASE}/api/notifications/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      window.dispatchEvent(new Event('lsb:unread-changed'))
    } catch { /* silencieux */ }
  }

  const openPublication = async (id: number) => {
    try {
      const res = await apiFetch(`${API_BASE}/api/publications/${id}`)
      if (res.ok) setPubModal(await res.json() as PubCardData)
    } catch { /* silencieux */ }
  }

  const respondStaffInvitation = async (notifId: number, staffId: number, eventId: number, response: 'ACCEPT' | 'REFUSE') => {
    setResponding(r => ({ ...r, [notifId]: true }))
    try {
      const res = await apiFetch(`${API_BASE}/api/events/${eventId}/staff/${staffId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      })
      if (res.ok) {
        const staffStatus = response === 'ACCEPT' ? 'BOOKED' : 'CANCELLED'
        setList(prev => prev.map(n => (n.id === notifId ? { ...n, read: true, staffStatus } : n)))
      }
    } catch { /* silencieux */ }
    setResponding(r => { const copy = { ...r }; delete copy[notifId]; return copy })
  }

  const sections = useMemo(() => buildFeed(list), [list])
  const hasUnread = list.some(n => !n.read)
  const current = CATEGORIES.find(c => c.key === category)!
  const countOf = (key: CategoryKey) => (key === 'all' ? summary.total : summary[key]) || 0

  return (
    <main className="min-h-screen text-white lsb-surface-page lsb-notifications-page">
      <div className="mx-auto max-w-5xl px-4 py-8">

        {/* En-tête */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="lsb-eyebrow">ACTIVITÉ</p>
            <h1 className="text-2xl font-bold text-white md:text-3xl">Notifications<span className="text-accent-light">.</span></h1>
          </div>
          {hasUnread && (
            <button type="button" onClick={markAllAsRead} className="rounded-full border border-line bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/[0.08] hover:text-white">
              Tout lire
            </button>
          )}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[210px_minmax(0,1fr)]">
          {/* Sujets : colonne sur ordinateur, ligne de filtres sur téléphone */}
          <nav aria-label="Sujets" className="md:sticky md:top-24 md:self-start">
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:flex-col md:gap-0.5 md:overflow-visible md:px-0 md:pb-0">
              {CATEGORIES.map(c => {
                const active = c.key === category
                const count = countOf(c.key)
                return (
                  <li key={c.key} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setCategory(c.key)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex w-full items-center gap-2.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition md:rounded-xl md:border-transparent md:py-2 ${
                        active ? 'border-accent bg-accent text-white md:bg-accent/15 md:text-white' : 'border-line text-white/60 hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      <LsIcon name={c.icon} tone={active ? 'inherit' : 'muted'} size={16} />
                      <span className="flex-1 text-left">{c.label}</span>
                      {count > 0 && (
                        <span className={`rounded-full px-1.5 text-[11px] font-medium ${active ? 'bg-white/20 text-white' : 'bg-accent/20 text-accent-light'}`}>{count > 99 ? '99+' : count}</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
            <Link href="/settings/notifications" className="mt-4 hidden items-center gap-2 border-t border-line px-3 pt-4 text-xs text-white/45 transition hover:text-white md:flex">
              <LsIcon name="tools" tone="inherit" size={14} />Choisir ce que je reçois
            </Link>
          </nav>

          {/* Liste */}
          <section aria-label={`Notifications : ${current.label}`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                <p className="text-xs text-white/40">Chargement…</p>
              </div>
            ) : error ? (
              <div className="space-y-3 py-16 text-center">
                <p className="text-sm text-red-300">Impossible de charger les notifications.</p>
                <button type="button" onClick={fetchFirstPage} className="rounded-xl bg-white/10 px-4 py-2 text-xs text-white/75 transition hover:bg-white/20">Réessayer</button>
              </div>
            ) : list.length === 0 ? (
              <div className="rounded-2xl border border-line bg-surface py-16 text-center">
                <LsIcon name={current.icon} size={30} tone="muted" className="mx-auto mb-3" />
                <p className="text-sm text-white/50">
                  {category === 'all' ? 'Aucune notification pour l’instant.' : `Aucune notification dans « ${current.label} ».`}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-line bg-surface p-2">
                {sections.map(section => (
                  <div key={section.label}>
                    <p className="px-4 pb-1.5 pt-4 text-[11px] font-medium uppercase tracking-wider text-white/40">{section.label}</p>
                    <div className="space-y-0.5">
                      {section.items.map(item => (
                        <NotificationRow
                          key={item.key}
                          item={item}
                          onOpenPublication={openPublication}
                          onStaffRespond={respondStaffInvitation}
                          responding={!!responding[item.lead.id]}
                          onDelete={deleteNotifs}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && cursor && (
              <div className="mt-6 flex justify-center">
                <button type="button" onClick={loadMore} disabled={loadingMore} className="rounded-xl border border-line bg-white/[0.04] px-4 py-2 text-xs text-white/70 transition hover:bg-white/[0.08] disabled:opacity-40">
                  {loadingMore ? 'Chargement…' : 'Voir plus'}
                </button>
              </div>
            )}

            <Link href="/settings/notifications" className="mt-6 flex items-center justify-center gap-2 text-xs text-white/45 transition hover:text-white md:hidden">
              <LsIcon name="tools" tone="inherit" size={14} />Choisir ce que je reçois
            </Link>
          </section>
        </div>
      </div>

      {/* Publication ouverte depuis une notification (J'aime, commentaire, identification) */}
      {pubModal && (
        <PublicationModal pub={pubModal} onClose={() => setPubModal(null)} onCountChange={() => {}} />
      )}
    </main>
  )
}
