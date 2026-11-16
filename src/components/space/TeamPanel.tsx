'use client'

/**
 * Organisateur : « Mon équipe habituelle ». Les personnes déjà bookées y apparaissent seules ;
 * on peut aussi en ajouter à la main (et les retirer).
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, X } from 'lucide-react'
import SafeImage from '@/components/SafeImage'
import { publicProfileHref } from '@/components/profile/utils'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { useFeedback, apiErrorMessage } from '@/components/ui/Feedback'
import { EmptyLine, SpacePanel, type Person } from './ui'

export type TeamMember = Person & { collaborations: number; lastDate: string | null; specialty: string | null; location: string | null; manual?: boolean }

type Found = { id: number; pseudo: string | null; firstName: string | null; lastName: string | null; role: string; profile: { id: number; avatar: string | null } | null }
const foundName = (u: Found) => u.pseudo || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Membre'

export default function TeamPanel({ team: initialTeam }: { team: TeamMember[] }) {
  const { notify } = useFeedback()
  const [team, setTeam] = useState(initialTeam)
  const [adding, setAdding] = useState(false)
  const [q, setQ] = useState('')
  const [found, setFound] = useState<Found[]>([])
  useEffect(() => { setTeam(initialTeam) }, [initialTeam])

  // Recherche de membres (artistes et prestataires) à ajouter
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setFound([]); return }
    const t = setTimeout(async () => {
      const res = await apiFetch(apiUrl(`search/users?q=${encodeURIComponent(term)}&limit=8`)).catch(() => null)
      const d = res?.ok ? await res.json() : null
      setFound((d?.users || []).filter((u: Found) => u.profile && u.role !== 'ORGANIZER' && !team.some(m => m.profileId === u.profile!.id)))
    }, 250)
    return () => clearTimeout(t)
  }, [q, team])

  const addMember = async (u: Found) => {
    const res = await apiFetch(apiUrl('space/team'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: u.profile!.id }) })
    if (!res.ok) { notify(await apiErrorMessage(res, 'Ajout impossible.'), 'error'); return }
    setTeam((await res.json()).team || [])
    setQ(''); setFound([]); setAdding(false)
    notify(`${foundName(u)} ajouté à votre équipe.`)
  }

  const removeMember = async (m: TeamMember) => {
    const res = await apiFetch(apiUrl(`space/team/${m.profileId}`), { method: 'DELETE' })
    if (!res.ok) { notify(await apiErrorMessage(res, 'Impossible de retirer ce membre.'), 'error'); return }
    setTeam((await res.json()).team || [])
  }

  return (
    <SpacePanel kicker="Réseau" title="Mon équipe habituelle" action={
      <button type="button" onClick={() => setAdding(v => !v)} className="flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-semibold text-white/80 transition hover:text-white">
        <Plus size={12} /> Ajouter
      </button>
    }>
      {adding && (
        <div className="mb-3 grid gap-2 rounded-[14px] border border-line bg-surface-2 p-3">
          <input value={q} onChange={e => setQ(e.target.value)} autoFocus placeholder="Pseudo ou nom d’un artiste ou prestataire…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-accent/50" />
          {found.map(u => (
            <button key={u.id} type="button" onClick={() => addMember(u)} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-white/85 transition hover:bg-white/[0.05]">
              <SafeImage type="avatar" src={u.profile?.avatar} name={foundName(u)} size={28} />
              <span className="min-w-0 flex-1 truncate">{foundName(u)}</span>
              <span className="text-xs text-accent-light">Ajouter</span>
            </button>
          ))}
          {q.trim().length >= 2 && found.length === 0 && <p className="text-xs text-white/40">Aucun membre trouvé.</p>}
        </div>
      )}
      {team.length === 0 ? (
        <EmptyLine>Les artistes et prestataires avec qui vous avez travaillé apparaîtront ici, prêts à être rebookés. Vous pouvez aussi en ajouter avec « Ajouter ».</EmptyLine>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {team.map(member => {
            const href = publicProfileHref(member.role, member.userId ?? 0)
            return (
              <div key={member.profileId} className="grid gap-2.5 rounded-[14px] border border-line bg-surface-2 p-3">
                <div className="flex items-center gap-2.5">
                  <SafeImage type="avatar" src={member.avatar} name={member.name} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-white">{member.name}</p>
                    <p className="truncate text-[11px] text-muted">{[member.specialty, member.location].filter(Boolean).join(' · ') || 'Profil LS Bookers'}</p>
                  </div>
                </div>
                <p className="flex items-center justify-between gap-2 text-[11px] text-white/45">
                  {member.collaborations > 0 && member.lastDate ? (
                    <span>
                      <b className="font-semibold text-gold-light">{member.collaborations} collaboration{member.collaborations > 1 ? 's' : ''}</b>
                      {' · dernière le '}{new Date(member.lastDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  ) : <span>Ajouté par vous</span>}
                  {member.manual && (
                    <button type="button" onClick={() => removeMember(member)} aria-label={`Retirer ${member.name} de mon équipe`} className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-white/35 transition hover:bg-white/[0.06] hover:text-white">
                      <X size={12} />
                    </button>
                  )}
                </p>
                <div className="flex gap-1.5">
                  {href && (
                    <Link href={`${href}#agenda`} className="flex-1 rounded-lg bg-accent px-2 py-1.5 text-center text-xs font-semibold text-white transition hover:bg-accent-strong">
                      Rebooker
                    </Link>
                  )}
                  {member.userId && (
                    <Link href={`/messages?to=${member.userId}`} className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-white/70 transition hover:text-white">
                      Message
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SpacePanel>
  )
}
