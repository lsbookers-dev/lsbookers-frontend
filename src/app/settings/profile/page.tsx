'use client'

/**
 * Réglages du compte. Toutes les informations du profil se modifient dans le Studio profil ;
 * ici ne restent que les utilisateurs bloqués et la suppression du compte.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, ShieldAlert, ShieldOff, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import SafeImage from '@/components/SafeImage'
import DeleteAccountSection from '@/components/DeleteAccountSection'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'

type BlockedUser = {
  id: number
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  avatar?: string | null
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="mb-5 flex items-center gap-2">
        <span className="text-violet-300">{icon}</span>
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function AccountSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { notify } = useFeedback()
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loadingBlocked, setLoadingBlocked] = useState(true)
  const [unblockingId, setUnblockingId] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    apiFetch(apiUrl('block/list'))
      .then(r => (r.ok ? r.json() : { blocked: [] }))
      .then(data => setBlockedUsers(data.blocked || []))
      .catch(() => {})
      .finally(() => setLoadingBlocked(false))
  }, [user])

  const unblock = async (targetId: number) => {
    setUnblockingId(targetId)
    try {
      const res = await apiFetch(apiUrl(`block/${targetId}`), { method: 'DELETE' })
      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Impossible de débloquer cet utilisateur.'))
      setBlockedUsers(prev => prev.filter(u => u.id !== targetId))
      notify('Utilisateur débloqué')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Impossible de débloquer cet utilisateur.', 'error')
    } finally {
      setUnblockingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#08080d] text-white">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-white/60 transition hover:text-white">
            <ArrowLeft size={16} /> Retour
          </button>
          <span className="text-sm font-semibold">Réglages</span>
          <span className="w-16" />
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        {user?.role !== 'ADMIN' && (
          <Link href="/studio-profile" className="flex items-center gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/[0.07] p-5 transition hover:bg-violet-500/[0.12]">
            <Sparkles size={18} className="shrink-0 text-violet-300" />
            <span className="flex-1">
              <span className="block text-sm font-semibold">Modifier mon profil</span>
              <span className="block text-xs text-white/50">Photo, présentation, spécialités, liens, infos privées : tout se modifie dans le Studio profil.</span>
            </span>
            <ArrowRight size={16} className="text-white/40" />
          </Link>
        )}

        <Section title="Utilisateurs bloqués" icon={<ShieldAlert size={18} />}>
          {loadingBlocked ? (
            <p className="text-sm text-white/40">Chargement…</p>
          ) : blockedUsers.length === 0 ? (
            <p className="text-sm text-white/40">Tu n&apos;as bloqué aucun utilisateur.</p>
          ) : (
            <ul className="space-y-3">
              {blockedUsers.map(u => {
                const name = u.pseudo || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Utilisateur'
                return (
                  <li key={u.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <SafeImage type="avatar" src={u.avatar} name={name} size={40} />
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">{name}</p>
                    <button
                      onClick={() => unblock(u.id)}
                      disabled={unblockingId === u.id}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                    >
                      <ShieldOff size={13} />
                      {unblockingId === u.id ? 'En cours…' : 'Débloquer'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>

        {user?.role !== 'ADMIN' && <DeleteAccountSection />}
      </div>
    </div>
  )
}
