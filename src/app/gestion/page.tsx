'use client'

/**
 * /gestion — « Mes profils gérés » (agent d'artistes, plusieurs salles).
 * Liste des profils gérés et des invitations, « Agir en tant que », renvoyer / annuler,
 * et la fenêtre « Ajouter un profil » (maquette C1) : inviter un membre ou créer un profil.
 */

import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import SafeImage from '@/components/SafeImage'
import LsIcon from '@/components/ui/LsIcon'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'
import { switchToProfile, type ManagedProfile } from '@/components/managed/ProfileSwitcher'
import AddProfileModal from '@/components/managed/AddProfileModal'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'

const ROLE_LABEL: Record<string, string> = { ARTIST: 'Artiste', ORGANIZER: 'Organisateur', PROVIDER: 'Prestataire' }
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '')

function statusLabel(m: ManagedProfile) {
  if (m.status === 'ACTIVE') return { text: 'Géré', cls: 'bg-accent/15 text-accent-light' }
  if (m.status === 'EXPIRED') return { text: 'Invitation expirée', cls: 'bg-red-500/10 text-red-300' }
  if (m.origin === 'CREATED') return { text: `En attente de validation · jusqu’au ${fmtDate(m.expiresAt)}`, cls: 'bg-gold/10 text-gold-light' }
  return { text: `Invitation envoyée · jusqu’au ${fmtDate(m.expiresAt)}`, cls: 'bg-gold/10 text-gold-light' }
}

export default function ManagedProfilesPage() {
  const { user, acting } = useAuth()
  const { notify, confirm } = useFeedback()
  const [list, setList] = useState<ManagedProfile[] | null>(null)
  const [slots, setSlots] = useState<{ used: number; included: number; extra: number; unlimited: boolean } | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const enabled = !!user?.canManageProfiles || !!acting

  const load = useCallback(() => {
    apiFetch(apiUrl('managers/profiles'), { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { profiles: [] }))
      .then(data => { setList(data.profiles || []); setSlots(data.slots || null) })
      .catch(() => setList([]))
  }, [])
  useEffect(() => { if (enabled) load() }, [enabled, load])

  const act = async (m: ManagedProfile, path: string, method: string, success: string) => {
    setBusyId(m.id)
    try {
      const res = await apiFetch(apiUrl(`managers/profiles/${m.id}${path}`), { method })
      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Action impossible pour le moment.'))
      notify(success)
      load()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Action impossible pour le moment.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const stop = async (m: ManagedProfile) => {
    const name = m.profile?.name || m.invitedEmail || 'ce profil'
    const ok = await confirm(m.status === 'ACTIVE'
      ? { title: `Arrêter de gérer ${name} ?`, message: 'Vous ne pourrez plus agir pour ce profil. La personne garde tout et sera prévenue.', confirmLabel: 'Arrêter la gestion', danger: true }
      : { title: 'Annuler cette invitation ?', message: m.origin === 'CREATED' ? 'Le profil préparé sera supprimé (il n’a jamais été publié).' : undefined, confirmLabel: 'Annuler l’invitation', danger: true })
    if (ok) act(m, '', 'DELETE', m.status === 'ACTIVE' ? 'Gestion arrêtée' : 'Invitation annulée')
  }

  if (!enabled) {
    return (
      <div className="lsb-page grid min-h-[60vh] place-items-center text-center">
        <div className="max-w-md">
          <LsIcon name="follow" size={30} tone="accent" />
          <h1 className="mt-3 text-xl font-semibold">Gérer plusieurs profils</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">Agents d’artistes, gérants de plusieurs salles : la formule Business vous permettra de gérer plusieurs profils depuis votre compte. Elle arrive bientôt sur « Offres et abonnements ».</p>
        </div>
      </div>
    )
  }

  const active = (list || []).filter(m => m.status === 'ACTIVE')
  const waiting = (list || []).filter(m => m.status !== 'ACTIVE')
  const onlyArtists = active.length > 0 && active.every(m => m.profile?.role === 'ARTIST')

  return (
    <div className="lsb-page grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[.2em] text-accent">Gestion</span>
          <h1 className="mt-1 text-[clamp(1.6rem,3.5vw,2.2rem)] font-semibold leading-tight">{onlyArtists ? 'Mes artistes' : 'Mes profils'}<em className="not-italic text-accent">.</em></h1>
          <p className="mt-1 text-sm text-muted">Choisissez un profil pour agir en son nom : agenda, messages, publications et bookings.</p>
          {slots && !slots.unlimited && (
            <p className="mt-1 text-xs text-gold-light">
              {slots.used} profil{slots.used > 1 ? 's' : ''} sur {slots.included + slots.extra} · formule Business ({slots.included} inclus{slots.extra ? ` + ${slots.extra} en plus` : ''}). Une invitation en attente occupe une place.
            </p>
          )}
        </div>
        <button type="button" onClick={() => setAdding(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-3.5 text-xs font-semibold text-white transition hover:bg-accent-strong">
          <Plus className="h-4 w-4" aria-hidden="true" />Ajouter un profil
        </button>
      </header>

      {list === null && <div className="h-40 animate-pulse rounded-[18px] bg-white/[0.04]" />}

      {list !== null && !list.length && (
        <div className="rounded-[18px] border border-dashed border-white/15 p-8 text-center">
          <p className="text-sm text-white/70">Vous ne gérez encore aucun profil.</p>
          <p className="mt-1 text-xs text-muted">Invitez un membre déjà inscrit, ou préparez le profil d’un artiste ou d’un lieu qui n’est pas encore sur LS Bookers.</p>
          <button type="button" onClick={() => setAdding(true)} className="mt-4 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-strong">Ajouter un profil</button>
        </div>
      )}

      {active.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {active.map(m => (
            <article key={m.id} className="flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-4">
              <div className="flex items-center gap-3">
                <SafeImage type="avatar" src={m.profile?.avatar} name={m.profile?.name} size={44} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{m.profile?.name}</p>
                  <p className="truncate text-xs text-muted">{[m.profile?.role && ROLE_LABEL[m.profile.role], m.profile?.location].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
              <p className="text-xs text-muted">{m.requireApproval ? 'Confirme lui-même chaque booking' : 'Vous acceptez les bookings seul'}</p>
              <div className="mt-auto flex flex-wrap gap-2">
                <button type="button" onClick={() => switchToProfile(m.profile!.id)} className="flex-1 rounded-xl border border-accent/50 px-3 py-2 text-xs font-semibold text-accent-light hover:bg-accent/15">
                  {acting?.profileId === m.profile?.id ? 'Profil en cours' : 'Agir en tant que'}
                </button>
                <button type="button" disabled={busyId === m.id} onClick={() => stop(m)} className="rounded-xl border border-white/12 px-3 py-2 text-xs text-white/60 hover:text-white disabled:opacity-50">Arrêter</button>
              </div>
            </article>
          ))}
        </section>
      )}

      {waiting.length > 0 && (
        <section className="rounded-[18px] border border-line bg-surface p-4">
          <h2 className="mb-2 text-sm font-semibold">Invitations</h2>
          <ul className="divide-y divide-white/[0.06]">
            {waiting.map(m => {
              const label = statusLabel(m)
              return (
                <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                  <SafeImage type="avatar" src={m.profile?.avatar} name={m.profile?.name || m.invitedEmail || '?'} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">{m.profile?.name || m.invitedEmail}</p>
                    <span className={`mt-0.5 inline-block rounded-md px-2 py-0.5 text-[11px] ${label.cls}`}>{label.text}</span>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" disabled={busyId === m.id} onClick={() => act(m, '/resend', 'POST', 'Invitation renvoyée')} className="rounded-xl border border-white/12 px-3 py-1.5 text-xs text-white/70 hover:text-white disabled:opacity-50">Renvoyer</button>
                    <button type="button" disabled={busyId === m.id} onClick={() => stop(m)} className="rounded-xl border border-white/12 px-3 py-1.5 text-xs text-white/50 hover:text-white disabled:opacity-50">Annuler</button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {adding && <AddProfileModal onClose={() => setAdding(false)} onDone={() => { setAdding(false); load() }} />}
    </div>
  )
}
