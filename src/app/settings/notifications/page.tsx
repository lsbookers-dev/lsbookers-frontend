'use client'

import { SettingRow, SettingsCard, SettingsTitle, Toggle } from '@/components/settings/ui'
import { useAccountSettings } from '@/components/settings/useAccountSettings'

// Mêmes catégories que le serveur (backend/lib/notifPrefs.js)
const CATEGORIES: { key: string; label: string; description: string; emailOnly?: boolean }[] = [
  { key: 'bookings', label: 'Bookings', description: 'Demandes, réponses, annulations, éléments ajoutés, paiements' },
  { key: 'messages', label: 'Messages', description: 'Par e-mail quand vous n’êtes pas sur le site (au plus un par heure et par conversation)', emailOnly: true },
  { key: 'offers', label: 'Offres', description: 'Nouvelles offres et candidatures reçues' },
  { key: 'events', label: 'Événements', description: 'Invitations dans une équipe, réponses, rappels de checklist' },
  { key: 'reviews', label: 'Avis', description: 'Nouveaux avis, avis à laisser, réponses' },
  { key: 'network', label: 'Réseau', description: 'Abonnés, J’aime, commentaires, identifications' },
]

/** Réglages › Notifications et e-mails */
export default function NotificationSettingsPage() {
  const { settings, update } = useAccountSettings()
  const prefs = settings?.notifPrefs

  return (
    <>
      <SettingsTitle title="Notifications et e-mails" description="Choisissez ce que vous recevez dans la cloche et par e-mail. Les e-mails de sécurité (connexion, mot de passe) sont toujours envoyés." />

      <SettingsCard title="Par type">
        <div className="mb-2 hidden grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] gap-2 text-[11px] uppercase tracking-wider text-white/35 sm:grid">
          <span />
          <span className="text-center">Cloche</span>
          <span className="text-center">E-mail</span>
        </div>
        <ul className="divide-y divide-white/[0.06]">
          {CATEGORIES.map(cat => (
            <li key={cat.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3 first:pt-1 last:pb-0 sm:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem]">
              <span className="min-w-0">
                <span className="block text-sm text-white/90">{cat.label}</span>
                <span className="block text-xs leading-relaxed text-white/45">{cat.description}</span>
              </span>
              <span className="col-span-2 flex items-center gap-5 sm:col-span-2 sm:contents">
                <span className="flex items-center gap-2 sm:justify-center">
                  <span className="text-xs text-white/45 sm:hidden">Cloche</span>
                  {cat.emailOnly ? (
                    <span className="text-xs text-white/25" title="Les messages s’affichent sur « Messages », pas dans la cloche">—</span>
                  ) : (
                    <Toggle
                      label={`${cat.label} dans la cloche`}
                      checked={!!prefs?.[cat.key]?.bell}
                      disabled={!prefs}
                      onChange={bell => update({ notifPrefs: { [cat.key]: { bell } } })}
                    />
                  )}
                </span>
                <span className="flex items-center gap-2 sm:justify-center">
                  <span className="text-xs text-white/45 sm:hidden">E-mail</span>
                  <Toggle
                    label={`${cat.label} par e-mail`}
                    checked={!!prefs?.[cat.key]?.email}
                    disabled={!prefs}
                    onChange={email => update({ notifPrefs: { [cat.key]: { email } } })}
                  />
                </span>
              </span>
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard title="E-mails de LS Bookers">
        <SettingRow label="Récap de la semaine" description="Chaque lundi matin : vos dates de la semaine, les vues de votre profil, vos nouveaux abonnés et avis, les nouvelles offres.">
          <Toggle
            label="Récap de la semaine"
            checked={!!settings?.weeklyRecap}
            disabled={!settings}
            onChange={next => update({ weeklyRecap: next }, next ? 'Vous recevrez le récap chaque lundi matin' : 'Récap de la semaine désactivé')}
          />
        </SettingRow>
        <SettingRow label="Actualités LS Bookers" description="Nouveautés, conseils et événements de la plateforme, quelques fois par mois. Désinscription en un clic à tout moment.">
          <Toggle
            label="Actualités LS Bookers"
            checked={!!settings?.newsletterOptIn}
            disabled={!settings}
            onChange={next => update({ newsletterOptIn: next }, next ? 'Inscription aux actualités enregistrée' : 'Vous ne recevrez plus les actualités')}
          />
        </SettingRow>
      </SettingsCard>
    </>
  )
}
