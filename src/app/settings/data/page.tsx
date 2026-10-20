'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'
import DeleteAccountSection from '@/components/DeleteAccountSection'
import { SettingRow, SettingsButton, SettingsCard, SettingsTitle } from '@/components/settings/ui'
import { useAccountSettings } from '@/components/settings/useAccountSettings'

/** Réglages › Mes données : télécharger, mettre en pause, supprimer */
export default function DataSettingsPage() {
  const { notify, confirm } = useFeedback()
  const { settings, setSettings, reload } = useAccountSettings()
  // Réactivation depuis le bandeau du haut : cette page se met à jour aussi
  useEffect(() => {
    const onChange = () => { void reload() }
    window.addEventListener('lsb:account-pause-changed', onChange)
    return () => window.removeEventListener('lsb:account-pause-changed', onChange)
  }, [reload])
  const [exporting, setExporting] = useState(false)
  const [pausing, setPausing] = useState(false)

  const download = async () => {
    setExporting(true)
    try {
      const res = await apiFetch(apiUrl('account/export'))
      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Impossible de préparer vos données.'))
      const blob = await res.blob()
      const name = `lsbookers-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      notify('Vos données sont téléchargées')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Impossible de préparer vos données.', 'error')
    } finally {
      setExporting(false)
    }
  }

  const togglePause = async () => {
    const paused = !!settings?.pausedAt
    if (!paused && !(await confirm({
      title: 'Mettre votre compte en pause ?',
      message: 'Votre profil et vos publications deviennent invisibles pour les autres membres, et personne ne peut ouvrir de nouvelle conversation avec vous. Tout est conservé : vous pouvez réactiver votre compte quand vous voulez.',
      confirmLabel: 'Mettre en pause',
    }))) return
    setPausing(true)
    try {
      const res = await apiFetch(apiUrl(paused ? 'account/resume' : 'account/pause'), { method: 'POST' })
      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Impossible de modifier le compte.'))
      setSettings((await res.json()).settings)
      window.dispatchEvent(new Event('lsb:account-pause-changed'))
      notify(paused ? 'Votre compte est de nouveau visible' : 'Votre compte est en pause')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Impossible de modifier le compte.', 'error')
    } finally {
      setPausing(false)
    }
  }

  const paused = !!settings?.pausedAt

  return (
    <>
      <SettingsTitle title="Mes données" description="Vos données vous appartiennent : récupérez-les, faites une pause ou supprimez votre compte." />

      <SettingsCard>
        <SettingRow label="Télécharger mes données" description="Un fichier avec votre compte, votre profil, vos publications, vos messages envoyés, vos bookings, avis et offres.">
          <SettingsButton onClick={download} disabled={exporting}>{exporting ? 'Préparation…' : 'Télécharger'}</SettingsButton>
        </SettingRow>
      </SettingsCard>

      {settings?.role !== 'ADMIN' && (
        <SettingsCard>
          <SettingRow
            label={paused ? 'Votre compte est en pause' : 'Mettre mon compte en pause'}
            description={paused
              ? `Depuis le ${new Date(settings!.pausedAt!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} : votre profil et vos publications sont invisibles pour les autres membres.`
              : 'Une alternative à la suppression : votre profil devient invisible, mais tout est conservé.'}
          >
            <SettingsButton onClick={togglePause} disabled={!settings || pausing} variant={paused ? 'primary' : 'secondary'}>
              {pausing ? '…' : paused ? 'Réactiver' : 'Mettre en pause'}
            </SettingsButton>
          </SettingRow>
        </SettingsCard>
      )}

      {settings?.role !== 'ADMIN' && <DeleteAccountSection />}
    </>
  )
}
