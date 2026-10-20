'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import SafeImage from '@/components/SafeImage'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'
import { SettingRow, SettingsButton, SettingsCard, SettingsTitle, Toggle } from '@/components/settings/ui'
import { useAccountSettings } from '@/components/settings/useAccountSettings'

type BlockedUser = { id: number; pseudo?: string | null; firstName?: string | null; lastName?: string | null; avatar?: string | null }

const MESSAGE_CHOICES = [
  { value: 'EVERYONE', label: 'Tout le monde', description: 'Tout membre de LS Bookers peut vous écrire.' },
  { value: 'FOLLOWED', label: 'Les membres que je suis', description: 'Seules les personnes que vous suivez peuvent ouvrir une conversation. Les bookings et candidatures restent possibles.' },
] as const

/** Réglages › Confidentialité */
export default function PrivacySettingsPage() {
  const { notify } = useFeedback()
  const { settings, update } = useAccountSettings()
  const [blocked, setBlocked] = useState<BlockedUser[] | null>(null)
  const [unblockingId, setUnblockingId] = useState<number | null>(null)

  useEffect(() => {
    apiFetch(apiUrl('block/list'))
      .then(r => (r.ok ? r.json() : { blocked: [] }))
      .then(data => setBlocked(data.blocked || []))
      .catch(() => setBlocked([]))
  }, [])

  const unblock = async (id: number) => {
    setUnblockingId(id)
    try {
      const res = await apiFetch(apiUrl(`block/${id}`), { method: 'DELETE' })
      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Impossible de débloquer ce membre.'))
      setBlocked(list => (list || []).filter(u => u.id !== id))
      notify('Membre débloqué')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Impossible de débloquer ce membre.', 'error')
    } finally {
      setUnblockingId(null)
    }
  }

  return (
    <>
      <SettingsTitle title="Confidentialité" description="Qui peut vous contacter et où votre profil apparaît." />

      <SettingsCard title="Qui peut m’envoyer un message" description="S’applique aux nouvelles conversations ; celles déjà ouvertes continuent normalement.">
        <div className="grid gap-2" role="radiogroup" aria-label="Qui peut m’envoyer un message">
          {MESSAGE_CHOICES.map(choice => {
            const selected = settings?.messagePolicy === choice.value
            return (
              <button
                key={choice.value}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!settings}
                onClick={() => { if (!selected) void update({ messagePolicy: choice.value }) }}
                className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition disabled:opacity-50 ${selected ? 'border-accent/50 bg-accent/10' : 'border-white/8 hover:border-white/20'}`}
              >
                <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${selected ? 'border-accent-light' : 'border-white/30'}`}>
                  {selected && <span className="h-2 w-2 rounded-full bg-accent-light" />}
                </span>
                <span>
                  <span className="block text-sm text-white/90">{choice.label}</span>
                  <span className="block text-xs leading-relaxed text-white/45">{choice.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </SettingsCard>

      <SettingsCard>
        <SettingRow label="Apparaître dans la Recherche et les Tendances" description="Désactivé, votre profil reste accessible par son lien et vos publications restent visibles, mais vous n’apparaissez plus dans la Recherche, les Tendances ni le carrousel de l’accueil.">
          <Toggle
            label="Apparaître dans la Recherche et les Tendances"
            checked={settings ? !settings.hiddenFromSearch : true}
            disabled={!settings}
            onChange={visible => update({ hiddenFromSearch: !visible }, visible ? 'Vous apparaissez dans la Recherche et les Tendances' : 'Vous n’apparaissez plus dans la Recherche et les Tendances')}
          />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Membres bloqués" description="Un membre bloqué ne voit plus votre profil ni vos publications, et ne peut plus vous écrire.">
        {blocked === null ? (
          <p className="text-sm text-white/40">Chargement…</p>
        ) : blocked.length === 0 ? (
          <p className="text-sm text-white/40">Vous n’avez bloqué aucun membre.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {blocked.map(u => {
              const name = u.pseudo || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Membre'
              return (
                <li key={u.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <SafeImage type="avatar" src={u.avatar} name={name} size={36} />
                  <span className="min-w-0 flex-1 truncate text-sm text-white/90">{name}</span>
                  <SettingsButton onClick={() => unblock(u.id)} disabled={unblockingId === u.id}>{unblockingId === u.id ? 'En cours…' : 'Débloquer'}</SettingsButton>
                </li>
              )
            })}
          </ul>
        )}
      </SettingsCard>
    </>
  )
}
