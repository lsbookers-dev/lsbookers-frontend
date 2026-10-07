'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

// Suppression définitive du compte par l'utilisateur (RGPD), confirmée par mot de passe
export default function DeleteAccountSection() {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const canDelete = password.length > 0 && confirmText.trim().toUpperCase() === 'SUPPRIMER' && !deleting

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canDelete) return
    setDeleting(true)
    setError('')
    try {
      const res = await apiFetch(`${API}/api/auth/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        await logout()
        return
      }
      const data = await res.json().catch(() => null)
      setError(data?.error || data?.message || 'Impossible de supprimer le compte.')
    } catch {
      setError('Impossible de joindre le serveur. Réessayez.')
    }
    setDeleting(false)
  }

  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-red-400"><Trash2 size={18} /></span>
        <h2 className="text-base font-semibold text-white">Supprimer mon compte</h2>
      </div>
      <p className="text-sm text-white/50">
        Votre compte, votre profil, vos publications, messages, événements, bookings et fichiers
        seront définitivement supprimés. Cette action est irréversible.
      </p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-4 rounded-xl border border-red-500/30 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10 transition"
        >
          Supprimer mon compte
        </button>
      ) : (
        <form onSubmit={handleDelete} className="mt-4 space-y-3">
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            className="h-10 w-full rounded-xl bg-white/5 px-3 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-red-500/50"
          />
          <input
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="Tapez SUPPRIMER pour confirmer"
            className="h-10 w-full rounded-xl bg-white/5 px-3 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-red-500/50"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!canDelete}
              className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-40 transition"
            >
              {deleting ? 'Suppression…' : 'Supprimer définitivement'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setPassword(''); setConfirmText(''); setError('') }}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
