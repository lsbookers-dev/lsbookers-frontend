'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch, storeSession } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'
import LsIcon from '@/components/ui/LsIcon'
import { Field, SETTINGS_INPUT, SettingRow, SettingsButton, SettingsCard, SettingsTitle, Toggle } from '@/components/settings/ui'
import { useAccountSettings } from '@/components/settings/useAccountSettings'

type Session = { id: number; name: string; createdAt: string; lastUsedAt: string; current: boolean }

function lastSeen(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 15) return 'Actif maintenant'
  if (min < 60) return `Actif il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Actif il y a ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? 'Actif hier' : `Actif il y a ${d} jours`
}

/** Réglages › Connexion et sécurité */
export default function SecuritySettingsPage() {
  const { notify, confirm } = useFeedback()
  const { settings, setSettings, update } = useAccountSettings()

  // ── Adresse e-mail ──
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailBusy, setEmailBusy] = useState(false)

  const requestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailBusy(true)
    try {
      const res = await apiFetch(apiUrl('account/email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: newEmail.trim(), password: emailPassword }),
      })
      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Impossible de changer d’adresse.'))
      const { pendingEmail } = await res.json()
      setSettings(s => (s ? { ...s, pendingEmail } : s))
      setNewEmail(''); setEmailPassword('')
      notify(`E-mail de confirmation envoyé à ${pendingEmail}`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Impossible de changer d’adresse.', 'error')
    } finally {
      setEmailBusy(false)
    }
  }

  const cancelEmailChange = async () => {
    const res = await apiFetch(apiUrl('account/email'), { method: 'DELETE' })
    if (res.ok) { setSettings(s => (s ? { ...s, pendingEmail: null } : s)); notify('Demande annulée') }
  }

  // ── Mot de passe ──
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) { notify('Le nouveau mot de passe doit contenir au moins 8 caractères.', 'error'); return }
    if (passwordMismatch) return
    setPasswordBusy(true)
    try {
      const res = await apiFetch(apiUrl('account/password'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Impossible de changer le mot de passe.'))
      const data = await res.json()
      storeSession(data.token)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setSettings(s => (s ? { ...s, passwordChangedAt: new Date().toISOString() } : s))
      notify('Mot de passe modifié. Vos autres appareils ont été déconnectés.')
      void loadSessions()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Impossible de changer le mot de passe.', 'error')
    } finally {
      setPasswordBusy(false)
    }
  }

  // ── Appareils ──
  const [sessions, setSessions] = useState<Session[] | null>(null)
  const [legacyCurrent, setLegacyCurrent] = useState(false)
  const loadSessions = useCallback(async () => {
    const res = await apiFetch(apiUrl('account/sessions'), { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    setSessions(data.sessions || [])
    setLegacyCurrent(!!data.legacyCurrent)
  }, [])
  useEffect(() => { void loadSessions() }, [loadSessions])

  const removeSession = async (s: Session) => {
    if (!(await confirm({ title: `Déconnecter « ${s.name} » ?`, message: 'Cet appareil devra se reconnecter avec votre mot de passe.', confirmLabel: 'Déconnecter', danger: true }))) return
    const res = await apiFetch(apiUrl(`account/sessions/${s.id}`), { method: 'DELETE' })
    if (!res.ok) { notify(await apiErrorMessage(res, 'Impossible de retirer cet appareil.'), 'error'); return }
    setSessions(list => (list || []).filter(x => x.id !== s.id))
    notify('Appareil déconnecté')
  }

  const revokeOthers = async () => {
    if (!(await confirm({ title: 'Se déconnecter de tous les autres appareils ?', message: 'Seul cet appareil restera connecté. À faire en cas de téléphone perdu ou si vous pensez qu’on a accès à votre compte.', confirmLabel: 'Tout déconnecter', danger: true }))) return
    const res = await apiFetch(apiUrl('account/sessions/revoke-others'), { method: 'POST' })
    if (!res.ok) { notify(await apiErrorMessage(res, 'Impossible de déconnecter les autres appareils.'), 'error'); return }
    storeSession((await res.json()).token)
    notify('Tous vos autres appareils sont déconnectés')
    void loadSessions()
  }

  const others = (sessions || []).filter(s => !s.current)

  return (
    <>
      <SettingsTitle title="Connexion et sécurité" description="Votre adresse e-mail, votre mot de passe et les appareils connectés à votre compte." />

      <div id="email" className="scroll-mt-24">
        <SettingsCard title="Adresse e-mail" description="Elle sert à vous connecter et à recevoir les e-mails de LS Bookers.">
          <SettingRow label="Adresse actuelle" description={settings?.email || 'Chargement…'} />
          {settings?.pendingEmail ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/25 bg-gold/[0.06] px-3.5 py-3 text-xs text-gold-light">
              <span>En attente de confirmation : <strong className="font-semibold">{settings.pendingEmail}</strong>. Cliquez sur le lien reçu à cette adresse (valable 24 h).</span>
              <button type="button" onClick={cancelEmailChange} className="text-white/60 underline-offset-2 hover:text-white hover:underline">Annuler</button>
            </div>
          ) : (
            <form onSubmit={requestEmailChange} className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
              <Field label="Nouvelle adresse"><input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="nom@domaine.fr" autoComplete="email" className={SETTINGS_INPUT} /></Field>
              <Field label="Mot de passe actuel"><input type="password" required value={emailPassword} onChange={e => setEmailPassword(e.target.value)} autoComplete="current-password" className={SETTINGS_INPUT} /></Field>
              <SettingsButton type="submit" variant="primary" disabled={emailBusy}>{emailBusy ? 'Envoi…' : 'Changer'}</SettingsButton>
            </form>
          )}
        </SettingsCard>
      </div>

      <SettingsCard
        title="Mot de passe"
        description={settings?.passwordChangedAt
          ? `Modifié le ${new Date(settings.passwordChangedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}. Le changer déconnecte vos autres appareils.`
          : 'Le changer déconnecte vos autres appareils.'}
      >
        <form onSubmit={changePassword} className="grid gap-3 sm:grid-cols-3">
          <Field label="Mot de passe actuel"><input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" className={SETTINGS_INPUT} /></Field>
          <Field label="Nouveau mot de passe" hint="8 caractères minimum"><input type="password" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" className={SETTINGS_INPUT} /></Field>
          <Field label="Confirmer le nouveau"><input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" className={`${SETTINGS_INPUT} ${passwordMismatch ? 'border-red-400/50' : ''}`} /></Field>
          <div className="flex items-center justify-between gap-3 sm:col-span-3">
            <span className="text-xs text-red-300">{passwordMismatch ? 'Les deux mots de passe ne sont pas identiques.' : ''}</span>
            <SettingsButton type="submit" variant="primary" disabled={passwordBusy || passwordMismatch}>{passwordBusy ? 'Enregistrement…' : 'Changer le mot de passe'}</SettingsButton>
          </div>
        </form>
      </SettingsCard>

      <SettingsCard title="Appareils connectés" description="Les appareils utilisés ces 30 derniers jours. Retirez ceux que vous ne reconnaissez pas.">
        {sessions === null ? (
          <p className="text-sm text-white/40">Chargement…</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {legacyCurrent && (
              <li className="flex items-center gap-3 py-3 first:pt-0">
                <LsIcon name="phone" size={20} tone="accent" />
                <span className="min-w-0 flex-1 text-sm">Cet appareil <span className="block text-xs text-white/40">Connecté avant la mise en place de cette liste</span></span>
              </li>
            )}
            {sessions.map(s => (
              <li key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <LsIcon name="phone" size={20} tone={s.current ? 'accent' : 'muted'} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-white/90">
                    {s.name}{s.current && <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] text-accent-light">Cet appareil</span>}
                  </span>
                  <span className="block text-xs text-white/40">{s.current ? 'Actif maintenant' : lastSeen(s.lastUsedAt)} · connecté le {new Date(s.createdAt).toLocaleDateString('fr-FR')}</span>
                </span>
                {!s.current && <SettingsButton onClick={() => removeSession(s)}>Déconnecter</SettingsButton>}
              </li>
            ))}
          </ul>
        )}
        {(others.length > 0 || legacyCurrent) && (
          <div className="mt-4 flex justify-end border-t border-white/[0.06] pt-4">
            <SettingsButton variant="danger" onClick={revokeOthers}>Se déconnecter de tous les autres appareils</SettingsButton>
          </div>
        )}
      </SettingsCard>

      <SettingsCard>
        <SettingRow label="Alerte de nouvelle connexion" description="Une notification et un e-mail quand un appareil inconnu se connecte à votre compte.">
          <Toggle
            label="Alerte de nouvelle connexion"
            checked={!!settings?.loginAlerts}
            disabled={!settings}
            onChange={next => update({ loginAlerts: next }, next ? 'Alerte activée' : 'Alerte désactivée')}
          />
        </SettingRow>
      </SettingsCard>
    </>
  )
}
