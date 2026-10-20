'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'
import { Field, SETTINGS_INPUT, SettingRow, SettingsButton, SettingsCard, SettingsTitle } from '@/components/settings/ui'

type LegalStatus = '' | 'INDIVIDUAL' | 'INTERMITTENT' | 'AUTO_ENTREPRENEUR' | 'COMPANY'
const isProfessional = (status: LegalStatus) => status === 'COMPANY' || status === 'AUTO_ENTREPRENEUR'

type Form = {
  dateOfBirth: string; phone: string; countryOfResidence: string
  legalStatus: LegalStatus; siret: string; establishmentName: string
  address: string; postalCode: string; city: string
}

const EMPTY: Form = { dateOfBirth: '', phone: '', countryOfResidence: '', legalStatus: '', siret: '', establishmentName: '', address: '', postalCode: '', city: '' }

/** Réglages › Mon compte : adresse e-mail, identité publique (renvoi au Studio) et infos privées */
export default function AccountSettingsPage() {
  const { notify } = useFeedback()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [identity, setIdentity] = useState('')
  const [profileId, setProfileId] = useState<number | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm(f => ({ ...f, [key]: value }))

  useEffect(() => {
    apiFetch(apiUrl('profile/me'), { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const p = data?.profile
        if (!p) return
        const u = p.user || {}
        setProfileId(p.id)
        setRole(u.role || '')
        setEmail(u.email || '')
        setIdentity([u.pseudo, [u.firstName, u.lastName].filter(Boolean).join(' ')].filter(Boolean).join(' · '))
        setForm({
          dateOfBirth: u.dateOfBirth ? String(u.dateOfBirth).slice(0, 10) : '',
          phone: u.phone || '',
          countryOfResidence: u.countryOfResidence || '',
          legalStatus: (p.legalStatus as LegalStatus) || '',
          siret: p.siret || '',
          establishmentName: p.establishmentName || '',
          address: p.address || '', postalCode: p.postalCode || '', city: p.city || '',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileId) return
    setSaving(true)
    try {
      const professional = isProfessional(form.legalStatus)
      const accountRes = await apiFetch(apiUrl('profile/me/account'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateOfBirth: form.dateOfBirth || null,
          phone: form.phone.trim() || null,
          countryOfResidence: form.countryOfResidence.trim() || null,
          ...(form.legalStatus ? { legalStatus: form.legalStatus } : {}),
          ...(role === 'ORGANIZER' && form.legalStatus ? { organizerType: professional ? 'PROFESSIONAL' : 'INDIVIDUAL' } : {}),
          establishmentName: role === 'ORGANIZER' && professional ? form.establishmentName.trim() || null : null,
          siret: professional ? form.siret.replace(/\s/g, '') || null : null,
        }),
      })
      if (!accountRes.ok) throw new Error(await apiErrorMessage(accountRes, 'Impossible d’enregistrer vos informations.'))
      // Adresse postale (devis et factures) : pour l'organisateur, c'est l'adresse de l'établissement, réglée dans le Studio
      if (role !== 'ORGANIZER') {
        const profileRes = await apiFetch(apiUrl(`profile/${profileId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: form.address.trim() || null, postalCode: form.postalCode.trim() || null, city: form.city.trim() || null }),
        })
        if (!profileRes.ok) throw new Error(await apiErrorMessage(profileRes, 'Impossible d’enregistrer votre adresse.'))
      }
      notify('Informations enregistrées')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Impossible d’enregistrer vos informations.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SettingsTitle title="Mon compte" description="Les informations de votre compte. Ce que les autres voient se règle dans le Studio profil." />

      <SettingsCard>
        <SettingRow label="Adresse e-mail" description={loading ? 'Chargement…' : email}>
          <Link href="/settings/security#email" className="text-xs text-accent-light hover:text-white">Modifier</Link>
        </SettingRow>
        <SettingRow label="Pseudo, prénom et nom" description={identity || 'Visibles sur votre profil public'}>
          <Link href="/studio-profile" className="text-xs text-accent-light hover:text-white">Studio profil</Link>
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Informations privées" description="Jamais affichées sur votre profil public. Elles servent à votre compte et, pour les professionnels, à vos devis et factures.">
        {loading ? (
          <p className="text-sm text-white/40">Chargement…</p>
        ) : (
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date de naissance"><input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} className={SETTINGS_INPUT} /></Field>
              <Field label="Téléphone"><input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} maxLength={20} placeholder="06 12 34 56 78" className={SETTINGS_INPUT} /></Field>
              <Field label="Pays de résidence"><input value={form.countryOfResidence} onChange={e => set('countryOfResidence', e.target.value)} maxLength={100} placeholder="France" className={SETTINGS_INPUT} /></Field>
              <Field label="Statut">
                <select value={isProfessional(form.legalStatus) ? 'COMPANY' : form.legalStatus} onChange={e => set('legalStatus', e.target.value as LegalStatus)} className={SETTINGS_INPUT}>
                  <option value="">Non renseigné</option>
                  <option value="INDIVIDUAL">Particulier</option>
                  <option value="INTERMITTENT">Intermittent du spectacle</option>
                  <option value="COMPANY">Professionnel (auto-entrepreneur, société…)</option>
                </select>
              </Field>
              {isProfessional(form.legalStatus) && (
                <Field label="Numéro SIRET"><input value={form.siret} onChange={e => set('siret', e.target.value)} inputMode="numeric" maxLength={17} placeholder="14 chiffres" className={SETTINGS_INPUT} /></Field>
              )}
              {role === 'ORGANIZER' && isProfessional(form.legalStatus) && (
                <Field label="Nom de l’établissement"><input value={form.establishmentName} onChange={e => set('establishmentName', e.target.value)} maxLength={200} className={SETTINGS_INPUT} /></Field>
              )}
            </div>

            {role !== 'ORGANIZER' ? (
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem_minmax(0,0.8fr)]">
                <Field label="Adresse postale" hint="Utilisée sur vos devis et factures, jamais affichée."><input value={form.address} onChange={e => set('address', e.target.value)} maxLength={200} placeholder="12 rue de la République" className={SETTINGS_INPUT} /></Field>
                <Field label="Code postal"><input value={form.postalCode} onChange={e => set('postalCode', e.target.value)} maxLength={10} inputMode="numeric" className={SETTINGS_INPUT} /></Field>
                <Field label="Ville"><input value={form.city} onChange={e => set('city', e.target.value)} maxLength={100} className={SETTINGS_INPUT} /></Field>
              </div>
            ) : (
              <p className="text-xs text-white/40">L’adresse de votre établissement se règle dans le Studio profil, rubrique « Localisation ».</p>
            )}

            <div className="flex justify-end">
              <SettingsButton type="submit" variant="primary" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</SettingsButton>
            </div>
          </form>
        )}
      </SettingsCard>
    </>
  )
}
