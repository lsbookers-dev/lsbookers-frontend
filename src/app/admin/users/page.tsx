'use client'

import { useEffect, useMemo, useState } from 'react'

type Role = 'ARTIST' | 'ORGANIZER' | 'PROVIDER' | 'ADMIN'
type User = {
  id: number
  name: string
  email?: string
  role: Role
  isSuspended?: boolean
  subscription?: { planName: string; status: string } | null
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const token = useMemo(() => localStorage.getItem('token') || '', [])

  const fetchUsers = async () => {
    setLoading(true)
    setErr(null)
    try {
      const r = await fetch(
        `${API_BASE}/api/admin/users?search=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}&t=${Date.now()}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
      )
      if (!r.ok) throw new Error('HTTP ' + r.status)
      const data = await r.json()
      setUsers(Array.isArray(data?.users) ? data.users : data)
    } catch {
      setErr('Impossible de charger les utilisateurs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const suspend = async (id: number) => {
    if (!confirm('Suspendre cet utilisateur ?')) return
    try {
      const r = await fetch(`${API_BASE}/api/admin/users/${id}/suspend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!r.ok) throw new Error()
      await fetchUsers()
    } catch {
      alert('Échec suspension.')
    }
  }

  const unsuspend = async (id: number) => {
    if (!confirm('Réactiver cet utilisateur ?')) return
    try {
      const r = await fetch(`${API_BASE}/api/admin/users/${id}/unsuspend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!r.ok) throw new Error()
      await fetchUsers()
    } catch {
      alert('Échec réactivation.')
    }
  }

  const removeUser = async (id: number) => {
    if (!confirm('Supprimer définitivement cet utilisateur ?')) return
    try {
      const r = await fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!r.ok) throw new Error()
      await fetchUsers()
    } catch {
      alert('Échec suppression.')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gestion des utilisateurs</h1>

      <div className="flex items-center gap-2 mb-4">
        <input
          className="px-3 py-2 rounded bg-neutral-900 border border-white/10 flex-1"
          placeholder="Rechercher par nom, email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button onClick={() => { setPage(1); fetchUsers() }} className="px-3 py-2 rounded bg-white/10 hover:bg-white/20">
          Rechercher
        </button>
      </div>

      {loading && <p className="text-white/70">Chargement…</p>}
      {err && <p className="text-red-400">{err}</p>}

      {!loading && !err && (
        <>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/60">
                <tr>
                  <th className="text-left px-3 py-2">ID</th>
                  <th className="text-left px-3 py-2">Nom</th>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">Rôle</th>
                  <th className="text-left px-3 py-2">Abonnement</th>
                  <th className="text-right px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t border-white/10">
                    <td className="px-3 py-2">{u.id}</td>
                    <td className="px-3 py-2">{u.name}</td>
                    <td className="px-3 py-2">{u.email ?? '—'}</td>
                    <td className="px-3 py-2">{u.role}</td>
                    <td className="px-3 py-2">
                      {u.subscription ? `${u.subscription.planName} (${u.subscription.status})` : '—'}
                    </td>
                    <td className="px-3 py-2 text-right space-x-2">
                      {!u.isSuspended ? (
                        <button onClick={() => suspend(u.id)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20">Suspendre</button>
                      ) : (
                        <button onClick={() => unsuspend(u.id)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20">Réactiver</button>
                      )}
                      <button onClick={() => removeUser(u.id)} className="px-2 py-1 rounded bg-red-600/80 hover:bg-red-600">Supprimer</button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-white/50">Aucun résultat</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2 mt-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              Précédent
            </button>
            <span className="text-sm text-white/60">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              Suivant
            </button>
          </div>
        </>
      )}
    </div>
  )
}