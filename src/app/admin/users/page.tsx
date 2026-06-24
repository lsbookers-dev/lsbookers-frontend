'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Trash2, Search, RefreshCw } from 'lucide-react'

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return t ? { Authorization: `Bearer ${t}`, ...extra } : { ...extra }
}

type ListedUser = {
  id: number
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  email: string
  role: string
  emailVerified: boolean
  createdAt: string
  profile?: { id: number; avatar?: string | null } | null
}

const ROLE_COLORS: Record<string, string> = {
  ARTIST:    'bg-pink-600/20 text-pink-400 border-pink-600/30',
  ORGANIZER: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  PROVIDER:  'bg-violet-600/20 text-violet-400 border-violet-600/30',
}

const ROLE_LABELS: Record<string, string> = {
  ARTIST: 'Artiste', ORGANIZER: 'Organisateur', PROVIDER: 'Prestataire',
}

const displayName = (u: ListedUser) =>
  u.pseudo || [u.firstName, u.lastName].filter(Boolean).join(' ') || '—'

const LIMIT = 20

export default function AdminUsersPage() {
  const [q, setQ]         = useState('')
  const [users, setUsers]  = useState<ListedUser[]>([])
  const [total, setTotal]  = useState(0)
  const [page, setPage]    = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]  = useState<string | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [changingRole, setChangingRole] = useState<number | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const load = useCallback(async (pageIndex: number, search: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(pageIndex * LIMIT) })
      if (search.trim()) params.set('q', search.trim())

      const res = await fetch(`${API}/api/admin/users?${params}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch {
      setError('Impossible de charger les utilisateurs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(page, q) }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const search = () => { setPage(0); load(0, q) }

  const changeRole = async (u: ListedUser, newRole: string) => {
    if (newRole === u.role) return
    if (!confirm(`Changer le rôle de ${displayName(u)} de ${ROLE_LABELS[u.role] || u.role} vers ${ROLE_LABELS[newRole] || newRole} ?`)) return
    setChangingRole(u.id)
    try {
      const res = await fetch(`${API}/api/admin/users/${u.id}/role`, {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error()
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x))
    } catch {
      alert('Échec du changement de rôle.')
    } finally {
      setChangingRole(null)
    }
  }

  const deleteUser = async (u: ListedUser) => {
    if (!confirm(`Supprimer le compte de ${displayName(u)} (${u.email}) ? Cette action est irréversible.`)) return
    setDeleting(u.id)
    try {
      const res = await fetch(`${API}/api/admin/users/${u.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error()
      setUsers(prev => prev.filter(x => x.id !== u.id))
      setTotal(prev => prev - 1)
    } catch {
      alert('Échec de la suppression.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="text-sm text-white/40 mt-0.5">{total} compte{total !== 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={() => load(page, q)}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
          title="Rafraîchir"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Recherche */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Rechercher par pseudo, nom, email…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
        <button
          onClick={search}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
        >
          Rechercher
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {loading && <p className="text-white/50 text-sm mb-4">Chargement…</p>}

      {/* Liste */}
      {!loading && users.length === 0 && (
        <p className="text-white/40 text-sm">Aucun utilisateur trouvé.</p>
      )}

      <div className="space-y-2">
        {users.map(u => (
          <div
            key={u.id}
            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
          >
            {/* Avatar */}
            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-neutral-700 flex-shrink-0">
              {u.profile?.avatar ? (
                <Image src={u.profile.avatar} alt={displayName(u)} fill className="object-cover" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white/60">
                  {displayName(u).charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm truncate">{displayName(u)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[u.role] || 'bg-white/10 text-white/50 border-white/10'}`}>
                  {ROLE_LABELS[u.role] || u.role}
                </span>
                {!u.emailVerified && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-600/20 text-yellow-400 border border-yellow-600/30">
                    Email non vérifié
                  </span>
                )}
              </div>
              <p className="text-xs text-white/40 truncate mt-0.5">
                {u.email} · #{u.id} · Inscrit le {new Date(u.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>

            {/* Changer le rôle */}
            <select
              value={u.role}
              onChange={e => changeRole(u, e.target.value)}
              disabled={changingRole === u.id}
              className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white disabled:opacity-40 flex-shrink-0 cursor-pointer"
              title="Changer le rôle"
            >
              <option value="ARTIST">Artiste</option>
              <option value="ORGANIZER">Organisateur</option>
              <option value="PROVIDER">Prestataire</option>
            </select>

            {/* Supprimer */}
            <button
              onClick={() => deleteUser(u)}
              disabled={deleting === u.id}
              className="p-2 rounded-lg bg-red-600/10 hover:bg-red-600/30 text-red-400 disabled:opacity-40 flex-shrink-0"
              title="Supprimer ce compte"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center gap-3 justify-center">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-sm"
          >
            ← Précédent
          </button>
          <span className="text-sm text-white/50">Page {page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page + 1 >= totalPages}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-sm"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}
