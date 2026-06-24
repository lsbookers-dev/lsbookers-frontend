'use client'

import { useEffect, useState } from 'react'
import { UserPlus, UserMinus, UserX, ShieldOff } from 'lucide-react'

interface Props {
  targetUserId: number
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function FollowButton({ targetUserId }: Props) {
  const [following, setFollowing] = useState(false)
  const [blocked, setBlocked]     = useState(false)
  const [loading, setLoading]     = useState(true)
  const [busy, setBusy]           = useState(false)
  const [showBlockMenu, setShowBlockMenu] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [fRes, bRes] = await Promise.all([
          fetch(`${API_BASE}/api/follow/status/${targetUserId}`, { headers: authHeaders() }),
          fetch(`${API_BASE}/api/block/status/${targetUserId}`,  { headers: authHeaders() }),
        ])
        if (fRes.ok) { const d = await fRes.json(); setFollowing(d.following) }
        if (bRes.ok) { const d = await bRes.json(); setBlocked(d.blocked) }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [targetUserId])

  const handleFollow = async () => {
    if (busy) return
    setBusy(true)
    try {
      const method = following ? 'DELETE' : 'POST'
      const res = await fetch(`${API_BASE}/api/follow/${targetUserId}`, {
        method,
        headers: authHeaders(),
      })
      if (res.ok) setFollowing(!following)
    } finally {
      setBusy(false)
    }
  }

  const handleBlock = async () => {
    if (busy) return
    setBusy(true)
    setShowBlockMenu(false)
    try {
      const method = blocked ? 'DELETE' : 'POST'
      const res = await fetch(`${API_BASE}/api/block/${targetUserId}`, {
        method,
        headers: authHeaders(),
      })
      if (res.ok) {
        setBlocked(!blocked)
        if (!blocked) setFollowing(false) // unfollow auto au blocage
      }
    } finally {
      setBusy(false)
    }
  }

  if (loading) return null

  if (blocked) {
    return (
      <button
        onClick={handleBlock}
        disabled={busy}
        className="flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition disabled:opacity-40"
      >
        <ShieldOff size={16} />
        Débloquer
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 relative">
      {/* Bouton Follow / Unfollow */}
      <button
        onClick={handleFollow}
        disabled={busy}
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-40 ${
          following
            ? 'border border-white/20 bg-white/10 text-white hover:bg-white/20'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        }`}
      >
        {following ? <UserMinus size={16} /> : <UserPlus size={16} />}
        {following ? 'Abonné' : 'Suivre'}
      </button>

      {/* Menu bloquer */}
      <div className="relative">
        <button
          onClick={() => setShowBlockMenu(v => !v)}
          className="flex items-center justify-center h-9 w-9 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition text-white/50 hover:text-white"
          title="Plus d'options"
        >
          ···
        </button>

        {showBlockMenu && (
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-xl border border-white/10 bg-[#111118] shadow-2xl py-1">
            <button
              onClick={handleBlock}
              disabled={busy}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition"
            >
              <UserX size={15} />
              Bloquer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
