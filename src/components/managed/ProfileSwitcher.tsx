'use client'

/**
 * « Vous agissez en tant que » (maquette A1) : en haut de la barre latérale, pour un compte
 * qui gère plusieurs profils (agent d'artistes, plusieurs salles). Choisir un profil recharge
 * le site comme ce profil ; « (vous) » revient à son propre profil.
 * + ActingBanner : bandeau rappel visible partout (aussi sur téléphone) quand on agit pour un autre profil.
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, Plus, Users } from 'lucide-react'
import SafeImage from '@/components/SafeImage'
import { useAuth } from '@/context/AuthContext'
import { apiFetch, setActingProfileId } from '@/utils/auth'
import { apiUrl } from '@/utils/api'

export type ManagedProfile = {
  id: number
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED'
  origin: 'INVITED' | 'CREATED'
  requireApproval: boolean
  invitedEmail: string | null
  expiresAt: string | null
  acceptedAt: string | null
  profile: { id: number; name: string; avatar: string | null; role: string | null; location: string | null; specialties: string[] } | null
}

const ROLE_LABEL: Record<string, string> = { ARTIST: 'Artiste', ORGANIZER: 'Organisateur', PROVIDER: 'Prestataire' }

/** Bascule vers un profil géré (ou vers soi avec null) et recharge le site comme ce profil */
export function switchToProfile(profileId: number | null) {
  setActingProfileId(profileId)
  window.location.assign('/space')
}

export function useManagedProfiles(enabled: boolean) {
  const [profiles, setProfiles] = useState<ManagedProfile[] | null>(null)
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    apiFetch(apiUrl('managers/profiles'), { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : { profiles: [] }))
      .then(data => { if (!cancelled) setProfiles(data.profiles || []) })
      .catch(() => { if (!cancelled) setProfiles([]) })
    return () => { cancelled = true }
  }, [enabled])
  return profiles
}

export default function ProfileSwitcher() {
  const { user, acting } = useAuth()
  const enabled = !!user && (!!user.canManageProfiles || !!acting)
  const profiles = useManagedProfiles(enabled)
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', onKey) }
  }, [open])

  if (!enabled || !user) return null

  const self = acting
    ? { name: acting.manager.name, avatar: acting.manager.avatar }
    : { name: user.name || 'Mon profil', avatar: user.avatarUrl || null }
  const current = acting ? { name: user.name || 'Profil', avatar: user.avatarUrl || null, sub: 'Profil géré' } : { ...self, sub: 'Votre profil' }
  const active = (profiles || []).filter(p => p.status === 'ACTIVE' && p.profile)

  return (
    <div ref={box} className="lsb-switcher relative mb-3">
      <p className="lsb-switcher-label mb-1 px-1 text-[10px] font-semibold uppercase tracking-[.14em] text-muted">Vous agissez en tant que</p>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-haspopup="listbox"
        className={`flex w-full items-center gap-2 rounded-xl border px-2 py-2 text-left transition ${acting ? 'border-accent/60 bg-accent/10' : 'border-line bg-surface-2 hover:border-white/20'}`}>
        <SafeImage type="avatar" src={current.avatar} name={current.name} size={28} />
        <span className="lsb-switcher-text min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-white">{current.name}</span>
          <span className="block truncate text-[10px] text-muted">{current.sub}</span>
        </span>
        <ChevronDown className="lsb-switcher-text h-4 w-4 flex-shrink-0 text-muted" aria-hidden="true" />
      </button>

      {open && (
        <div role="listbox" aria-label="Choisir le profil" className="absolute left-0 right-0 top-full z-50 mt-1 min-w-[12rem] rounded-xl border border-line bg-surface-2 p-1 shadow-2xl">
          <button type="button" role="option" aria-selected={!acting} onClick={() => (acting ? switchToProfile(null) : setOpen(false))}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-white/90 hover:bg-accent/15">
            <SafeImage type="avatar" src={self.avatar} name={self.name} size={24} />
            <span className="min-w-0 flex-1 truncate">{self.name} <span className="text-muted">(vous)</span></span>
            {!acting && <Check className="h-3.5 w-3.5 text-accent-light" aria-hidden="true" />}
          </button>
          {profiles === null && <p className="px-2 py-1.5 text-[11px] text-muted">Chargement…</p>}
          {active.map(m => {
            const selected = acting?.profileId === m.profile!.id
            return (
              <button key={m.id} type="button" role="option" aria-selected={selected} onClick={() => (selected ? setOpen(false) : switchToProfile(m.profile!.id))}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-white/90 hover:bg-accent/15 ${selected ? 'bg-accent/15' : ''}`}>
                <SafeImage type="avatar" src={m.profile!.avatar} name={m.profile!.name} size={24} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{m.profile!.name}</span>
                  {m.profile!.role && <span className="block text-[10px] text-muted">{ROLE_LABEL[m.profile!.role] || ''}</span>}
                </span>
                {selected && <Check className="h-3.5 w-3.5 text-accent-light" aria-hidden="true" />}
              </button>
            )
          })}
          <div className="mt-1 border-t border-line pt-1">
            <Link href="/gestion" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-accent-light hover:bg-accent/15">
              {acting ? <Users className="h-3.5 w-3.5" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
              {acting ? 'Mes profils gérés' : 'Ajouter ou gérer mes profils'}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

/** Bandeau rappel « Vous agissez pour … » (toutes tailles d'écran) */
export function ActingBanner() {
  const { user, acting } = useAuth()
  if (!acting || !user) return null
  return (
    <div className="flex items-center justify-between gap-3 border-b border-accent/30 bg-accent/15 px-4 py-2 text-xs text-accent-light">
      <span className="min-w-0 truncate">
        Vous agissez pour <b className="font-semibold text-white">{user.name}</b>, en tant que {acting.manager.name}
      </span>
      <button type="button" onClick={() => switchToProfile(null)} className="flex-shrink-0 rounded-lg border border-accent/40 px-2.5 py-1 font-semibold text-white hover:bg-accent/25">
        Revenir à mon profil
      </button>
    </div>
  )
}
