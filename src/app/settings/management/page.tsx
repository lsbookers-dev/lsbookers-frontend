'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import SafeImage from '@/components/SafeImage'
import { publicProfileHref } from '@/components/profile/utils'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'
import { SettingRow, SettingsButton, SettingsCard, SettingsTitle, Toggle } from '@/components/settings/ui'
import { journalDate, journalText, type JournalEntry } from '@/components/managed/journal'

type Management = {
  id: number
  status: 'ACTIVE' | 'PENDING'
  requireApproval: boolean
  createdAt: string
  acceptedAt: string | null
  manager: { id: number; name: string; role: string; avatar: string | null; profileId: number | null }
}

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '')

/** Réglages › Gestion de mon profil : qui gère mon profil, invitations reçues, retirer l'accès */
export default function ManagementSettingsPage() {
  const { notify, confirm } = useFeedback()
  const [list, setList] = useState<Management[] | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  // Choix « accord avant booking » pour chaque invitation en attente (coché par défaut)
  const [approval, setApproval] = useState<Record<number, boolean>>({})
  const [entries, setEntries] = useState<JournalEntry[]>([])

  const load = useCallback(() => {
    apiFetch(apiUrl('managers/mine'), { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { managements: [] }))
      .then(data => setList(data.managements || []))
      .catch(() => setList([]))
  }, [])
  useEffect(load, [load])
  useEffect(() => {
    apiFetch(apiUrl('managers/mine/journal'), { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { entries: [] }))
      .then(d => setEntries(d.entries || []))
      .catch(() => {})
  }, [])

  const act = async (id: number, path: string, method: string, body?: object, success?: string) => {
    setBusyId(id)
    try {
      const res = await apiFetch(apiUrl(`managers/mine/${id}${path}`), {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Action impossible pour le moment.'))
      if (success) notify(success)
      load()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Action impossible pour le moment.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const revoke = async (m: Management) => {
    const ok = await confirm({
      title: `Retirer l’accès de ${m.manager.name} ?`,
      message: 'Cette personne ne pourra plus agir pour votre profil, dès maintenant. Vous gardez tout : profil, avis, agenda, conversations et bookings en cours.',
      confirmLabel: 'Retirer l’accès',
      danger: true,
    })
    if (ok) act(m.id, '', 'DELETE', undefined, 'Accès retiré')
  }

  const active = (list || []).filter(m => m.status === 'ACTIVE')
  const pending = (list || []).filter(m => m.status === 'PENDING')

  return (
    <>
      <SettingsTitle
        title="Gestion de mon profil"
        description="Un agent, ou la personne qui gère vos lieux, peut gérer votre profil à votre place. Vous gardez la main : l’argent de vos bookings reste versé sur votre compte et vous pouvez retirer l’accès à tout moment."
      />

      {list === null && <SettingsCard><p className="text-sm text-white/45">Chargement…</p></SettingsCard>}

      {list !== null && !active.length && !pending.length && (
        <SettingsCard>
          <p className="text-sm text-white/60">Personne ne gère votre profil.</p>
          <p className="mt-1 text-xs text-white/40">Si quelqu’un vous invite à gérer votre profil, l’invitation apparaîtra ici et dans vos notifications.</p>
        </SettingsCard>
      )}

      {pending.map(m => {
        const requireApproval = approval[m.id] ?? true
        return (
          <SettingsCard key={m.id} title="Invitation reçue">
            <div className="flex items-center gap-3">
              <SafeImage type="avatar" src={m.manager.avatar} name={m.manager.name} size={40} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{m.manager.name} souhaite gérer votre profil</p>
                <p className="text-xs text-white/45">Agenda, messages, publications et bookings · reçue le {fmtDate(m.createdAt)}</p>
              </div>
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-white/[0.04] p-3">
              <input type="checkbox" checked={requireApproval} onChange={e => setApproval(a => ({ ...a, [m.id]: e.target.checked }))} className="mt-0.5 h-4 w-4 accent-violet-500" />
              <span>
                <span className="block text-sm text-white">Me demander mon accord avant d’accepter un booking</span>
                <span className="block text-xs text-white/45">L’organisateur verra « en attente de confirmation de l’artiste ».</span>
              </span>
            </label>
            {publicProfileHref(m.manager.role, m.manager.id) && (
              <Link href={publicProfileHref(m.manager.role, m.manager.id)!} className="mt-3 inline-block text-xs text-accent-light hover:underline">Voir le profil de {m.manager.name}</Link>
            )}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <SettingsButton disabled={busyId === m.id} onClick={() => act(m.id, '/decline', 'POST', undefined, 'Invitation refusée')}>Refuser</SettingsButton>
              <SettingsButton variant="primary" disabled={busyId === m.id} onClick={() => act(m.id, '/accept', 'POST', { requireApproval }, `${m.manager.name} gère maintenant votre profil`)}>Accepter</SettingsButton>
            </div>
          </SettingsCard>
        )
      })}

      {active.map(m => (
        <SettingsCard key={m.id} title="Votre profil est géré par">
          <div className="flex items-center gap-3">
            <SafeImage type="avatar" src={m.manager.avatar} name={m.manager.name} size={40} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{m.manager.name}</p>
              <p className="text-xs text-white/45">Depuis le {fmtDate(m.acceptedAt)}</p>
            </div>
          </div>
          <div className="mt-4">
            <SettingRow label="Me demander mon accord avant d’accepter un booking" description="Quand votre gestionnaire accepte un booking, vous le confirmez ou le refusez.">
              <Toggle checked={m.requireApproval} disabled={busyId === m.id} label="Accord avant booking"
                onChange={next => act(m.id, '', 'PATCH', { requireApproval: next }, next ? 'Vous confirmerez chaque booking' : 'Votre gestionnaire peut accepter les bookings seul')} />
            </SettingRow>
          </div>
          <div className="mt-4 flex justify-end">
            <SettingsButton variant="danger" disabled={busyId === m.id} onClick={() => revoke(m)}>Retirer l’accès</SettingsButton>
          </div>
        </SettingsCard>
      ))}

      {entries.length > 0 && (
        <SettingsCard title="Ce que votre gestionnaire a fait pour vous" description="Les dernières actions faites pour votre profil (les messages n’y figurent pas).">
          <ul className="grid gap-2">
            {entries.slice(0, 20).map(e => (
              <li key={e.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="text-white/75"><b className="font-semibold text-white">{e.managerName || 'Votre gestionnaire'}</b> {journalText(e)}</span>
                <span className="shrink-0 text-xs text-white/40">{journalDate(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        </SettingsCard>
      )}
    </>
  )
}
