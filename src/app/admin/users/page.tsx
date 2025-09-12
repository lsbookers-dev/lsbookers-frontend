'use client'

import React, { useEffect, useMemo, useState } from 'react'

type ListedUser = {
  id: number
  name: string | null
  email: string | null
  role: 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | 'ADMIN' | string
  createdAt: string
  profile?: { id: number; avatar?: string | null; banner?: string | null } | null
  subscription?: { status?: string | null; planId?: string | null } | null
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

export default function AdminUsersPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<ListedUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const limit = 20

  const token =
    typeof window !== 'undefined' ? window.localStorage.getItem('token') : null

  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  )

  async function load() {
    if (!API_BASE || !token) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      params.set('limit', String(limit))
      params.set('offset', String(page * limit))

      const res = await fetch(`${API_BASE}/api/admin/users?${params.toString()}`, {
        headers,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { total: number; users: ListedUser[] }
      setTotal(data.total)
      setItems(data.users || [])
    } catch (e) {
      console.error(e)
      setError("Impossible de charger les utilisateurs.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]) // on recharge à chaque changement de page

  const onSearch = async () => {
    setPage(0)
    await load()
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="p-2 text-white">
      <h1 className="text-2xl font-bold mb-4">Gestion des utilisateurs</h1>

      <div className="flex gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher par nom, email…"
          className="flex-1 bg-black/30 border border-white/10 rounded px-3 py-2"
        />
        <button
          onClick={onSearch}
          className="px-4 py-2 rounded bg-white/10 hover:bg-white/20"
        >
          Rechercher
        </button>
      </div>

      {error && <p className="text-red-400 mb-3">{error}</p>}
      {loading && <p className="text-white/70">Chargement…</p>}

      {!loading && items.length === 0 && (
        <p className="text-white/60">Aucun utilisateur trouvé.</p>
      )}

      <ul className="space-y-2">
        {items.map((u) => (
          <li
            key={u.id}
            className="rounded-xl border border-white/10 bg-black/30 p-3 flex items-center gap-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={u.profile?.avatar || '/default-avatar.png'}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/default-avatar.png'
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {u.name || '—'} <span className="text-white/40">#{u.id}</span>
              </p>
              <p className="text-sm text-white/60 truncate">
                {u.email || '—'} • {u.role}
              </p>
            </div>
            <div className="text-xs text-white/60">
              {u.subscription?.status ? (
                <span className="px-2 py-1 rounded bg-white/10 border border-white/10">
                  Abonnement: {u.subscription.status}
                </span>
              ) : (
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10">
                  Sans abonnement
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="px-3 py-1 rounded bg-white/10 disabled:opacity-40"
        >
          ←
        </button>
        <span className="text-sm">
          Page {page + 1} / {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page + 1 >= totalPages}
          className="px-3 py-1 rounded bg-white/10 disabled:opacity-40"
        >
          →
        </button>
      </div>
    </div>
  )
}