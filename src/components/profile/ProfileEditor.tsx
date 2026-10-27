'use client'

/**
 * Éditeur du Studio profil : toutes les informations du profil se modifient ici
 * (les Réglages ne gardent que les utilisateurs bloqués et la suppression du compte).
 */

import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import CityAutocomplete from '@/components/CityAutocomplete'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { MUSIC_STYLES, SPECIALTIES_BY_ROLE } from '@/constants/specialties'
import { NATIONAL_RADIUS_KM } from '@/utils/radius'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'
import { ROLE_TEXT, SOCIAL_FIELDS } from './utils'
import type { EditorSection, ProfileData, ProfileRole } from './types'

type Form = {
  pseudo: string; firstName: string; lastName: string; showRealName: boolean
  activity: string; bio: string
  location: string; radiusKm: number | null; address: string; postalCode: string; city: string; showAddress: boolean
  specialties: string[]; styles: string[]; showStyles: boolean
  youtubeUrl: string; showYoutubeUrl: boolean; soundcloudUrl: string; showSoundcloud: boolean
  instagramUrl: string; tiktokUrl: string; facebookUrl: string; twitterUrl: string; linkedinUrl: string; websiteUrl: string
  cvText: string; feeInfo: string
}

const RADIUS_CHOICES = [50, 100, 200, 500, 1000]

const INPUT = 'w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-violet-500/50'

function initialForm(profile: ProfileData, role: ProfileRole): Form {
  const u = profile.user
  return {
    pseudo: u?.pseudo || '', firstName: u?.firstName || '', lastName: u?.lastName || '',
    showRealName: Boolean(profile.showRealName),
    activity: (role === 'ORGANIZER' ? profile.typeEtablissement : profile.profession) || '',
    bio: profile.bio || '',
    location: profile.location || '', radiusKm: profile.radiusKm ?? null,
    address: profile.address || '', postalCode: profile.postalCode || '', city: profile.city || '', showAddress: Boolean(profile.showAddress),
    specialties: profile.specialties || [], styles: profile.styles || [], showStyles: profile.showStyles !== false,
    youtubeUrl: profile.youtubeUrl || '', showYoutubeUrl: profile.showYoutubeUrl !== false,
    soundcloudUrl: profile.soundcloudUrl || '', showSoundcloud: Boolean(profile.showSoundcloud),
    instagramUrl: profile.instagramUrl || '', tiktokUrl: profile.tiktokUrl || '', facebookUrl: profile.facebookUrl || '',
    twitterUrl: profile.twitterUrl || '', linkedinUrl: profile.linkedinUrl || '', websiteUrl: profile.websiteUrl || '',
    cvText: profile.cvText || '', feeInfo: profile.feeInfo || '',
  }
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-white/70">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-white/35">{hint}</span>}
    </label>
  )
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="flex w-full items-center justify-between gap-3 py-2 text-left">
      <span className="text-sm text-white/80">{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${value ? 'bg-violet-500' : 'bg-white/10'}`}>
        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  )
}

function Chips({ options, selected, onChange, max }: { options: string[]; selected: string[]; onChange: (v: string[]) => void; max?: number }) {
  const toggle = (item: string) => {
    if (selected.includes(item)) onChange(selected.filter(s => s !== item))
    else if (!max || selected.length < max) onChange([...selected, item])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(item => (
        <button key={item} type="button" onClick={() => toggle(item)} aria-pressed={selected.includes(item)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${selected.includes(item) ? 'border-violet-400/50 bg-violet-500/20 text-violet-100' : 'border-white/10 bg-white/5 text-white/55 hover:text-white'}`}>
          {item}
        </button>
      ))}
    </div>
  )
}

type Props = {
  profile: ProfileData
  role: ProfileRole
  initialSection?: EditorSection
  onClose: () => void
  onSaved: (profile: ProfileData) => void
}

export default function ProfileEditor({ profile, role, initialSection = 'identity', onClose, onSaved }: Props) {
  const { setUser } = useAuth()
  const { notify } = useFeedback()
  const [form, setForm] = useState<Form>(() => initialForm(profile, role))
  const [section, setSection] = useState<EditorSection>(initialSection)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const text = ROLE_TEXT[role]
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm(f => ({ ...f, [key]: value }))

  const addressFields = (label: string, hint: string) => (
    <div className="space-y-3 rounded-xl border border-white/[0.08] p-4">
      <p className="text-sm text-white/70">{label} <span className="text-white/35">{hint}</span></p>
      <AddressAutocomplete value={form.address} onChange={v => set('address', v)} placeholder="Tapez l’adresse : 12 rue de la République…" className={INPUT}
        onSelect={a => setForm(f => ({ ...f, address: a.address, postalCode: a.postalCode || f.postalCode, city: a.city || f.city }))} />
      <div className="grid grid-cols-[8rem_1fr] gap-3">
        <input value={form.postalCode} onChange={e => set('postalCode', e.target.value)} maxLength={10} placeholder="69001" aria-label="Code postal" className={INPUT} />
        <input value={form.city} onChange={e => set('city', e.target.value)} maxLength={100} placeholder="Lyon" aria-label="Ville" className={INPUT} />
      </div>
    </div>
  )

  const sections = useMemo(() => ([
    { key: 'identity', label: 'Identité' },
    { key: 'presentation', label: 'Présentation' },
    { key: 'location', label: 'Localisation' },
    { key: 'specialties', label: role === 'ARTIST' ? 'Spécialités & styles' : 'Spécialités' },
    { key: 'media', label: 'Vidéo & son' },
    { key: 'socials', label: 'Réseaux sociaux' },
    ...(role !== 'ORGANIZER' ? [{ key: 'career', label: 'Parcours & tarifs' }] : []),
  ] as { key: EditorSection; label: string }[]), [role])

  const save = async () => {
    if (!form.pseudo.trim() || !form.firstName.trim() || !form.lastName.trim()) {
      setSection('identity')
      setError('Le pseudo, le prénom et le nom sont obligatoires.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      // Les infos privées (naissance, téléphone, statut, SIRET…) se modifient dans Réglages › Mon compte
      const accountRes = await apiFetch(apiUrl('profile/me/account'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pseudo: form.pseudo.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
        }),
      })
      if (!accountRes.ok) throw new Error(await apiErrorMessage(accountRes, 'Impossible d’enregistrer ton identité.'))

      const profileRes = await apiFetch(apiUrl(`profile/${profile.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showRealName: form.showRealName,
          [role === 'ORGANIZER' ? 'typeEtablissement' : 'profession']: form.activity.trim() || null,
          bio: form.bio.trim() || null,
          location: form.location.trim() || null,
          radiusKm: form.radiusKm,
          // Organisateur : adresse de l'établissement (Localisation). Les autres rôles : adresse postale dans les Réglages
          ...(role === 'ORGANIZER' ? {
            address: form.address.trim() || null, postalCode: form.postalCode.trim() || null, city: form.city.trim() || null,
            showAddress: form.showAddress,
          } : {}),
          specialties: form.specialties,
          ...(role === 'ARTIST' ? {
            styles: form.styles, showStyles: form.showStyles,
            soundcloudUrl: form.soundcloudUrl.trim() || null, showSoundcloud: form.showSoundcloud,
          } : {}),
          youtubeUrl: form.youtubeUrl.trim() || null,
          showYoutubeUrl: form.showYoutubeUrl,
          ...Object.fromEntries(SOCIAL_FIELDS.map(field => [field.key, form[field.key].trim() || null])),
          ...(role !== 'ORGANIZER' ? { cvText: form.cvText.trim() || null, feeInfo: form.feeInfo.trim() || null } : {}),
        }),
      })
      if (!profileRes.ok) throw new Error(await apiErrorMessage(profileRes, 'Impossible d’enregistrer le profil.'))
      const { profile: updated } = await profileRes.json()

      setUser(u => (u ? { ...u, name: form.pseudo.trim() } : u))
      onSaved({
        ...profile,
        ...updated,
        user: {
          ...profile.user,
          ...updated?.user,
        },
      })
      notify('Profil enregistré')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’enregistrer le profil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-label="Modifier mon profil" className="flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden border-white/10 bg-[#0d0c12] text-white shadow-2xl sm:h-[88vh] sm:rounded-2xl sm:border">
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3.5 sm:px-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[.18em] text-violet-300/80">Studio profil</span>
            <h2 className="font-display text-xl font-semibold">Modifier mon profil</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="grid h-10 w-10 place-items-center rounded-xl text-white/50 hover:bg-white/5 hover:text-white"><X size={18} /></button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/[0.08] px-3 py-2 sm:w-52 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r sm:py-4" aria-label="Sections">
            {sections.map(item => (
              <button key={item.key} type="button" onClick={() => setSection(item.key)} aria-current={section === item.key}
                className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm transition ${section === item.key ? 'bg-violet-500/15 text-white' : 'text-white/50 hover:text-white'}`}>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
            {section === 'identity' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Pseudo"><input value={form.pseudo} onChange={e => set('pseudo', e.target.value)} maxLength={30} className={INPUT} /></Field>
                  <div className="hidden sm:block" />
                  <Field label="Prénom"><input value={form.firstName} onChange={e => set('firstName', e.target.value)} maxLength={50} className={INPUT} /></Field>
                  <Field label="Nom"><input value={form.lastName} onChange={e => set('lastName', e.target.value)} maxLength={50} className={INPUT} /></Field>
                </div>
                <div className="rounded-xl border border-white/[0.08] px-4 py-2">
                  <Toggle value={form.showRealName} onChange={v => set('showRealName', v)} label="Afficher mon prénom et mon nom à la place du pseudo" />
                </div>
              </>
            )}

            {section === 'presentation' && (
              <>
                <Field label={text.activityLabel}><input value={form.activity} onChange={e => set('activity', e.target.value)} maxLength={100} placeholder={text.activityPlaceholder} className={INPUT} /></Field>
                <Field label={text.about} hint={`${form.bio.length}/600`}>
                  <textarea value={form.bio} onChange={e => set('bio', e.target.value)} maxLength={600} rows={6} placeholder="Présente-toi en quelques lignes…" className={`${INPUT} resize-none`} />
                </Field>
              </>
            )}

            {section === 'location' && (
              <>
                <Field label="Ville">
                  <CityAutocomplete value={form.location} onChange={v => set('location', v)} placeholder="Ex : Lyon" inputClassName={INPUT} />
                </Field>
                <div>
                  <span className="mb-2 block text-sm text-white/70">Rayon d&apos;intervention</span>
                  <div className="flex flex-wrap gap-2">
                    {[...RADIUS_CHOICES, NATIONAL_RADIUS_KM].map(km => (
                      <button key={km} type="button" onClick={() => set('radiusKm', form.radiusKm === km ? null : km)} aria-pressed={form.radiusKm === km}
                        className={`rounded-xl border px-4 py-2 text-sm transition ${form.radiusKm === km ? 'border-violet-400/50 bg-violet-500/20 text-violet-100' : 'border-white/10 bg-white/5 text-white/60 hover:text-white'}`}>
                        {km === NATIONAL_RADIUS_KM ? 'National' : `${km} km`}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-white/35">Clique à nouveau sur un choix pour le retirer.</p>
                </div>
                {role === 'ORGANIZER' && (
                  <>
                    {addressFields('Adresse de l’établissement', '(facultative, aussi utilisée sur vos devis et factures)')}
                    <div className="rounded-xl border border-white/[0.08] px-4 py-2">
                      <Toggle value={form.showAddress} onChange={v => set('showAddress', v)} label="Afficher l’adresse exacte sur mon profil (la carte se place dessus)" />
                      <p className="pb-2 text-[11px] text-white/35">Désactivé : seule votre ville apparaît sur la carte.</p>
                    </div>
                  </>
                )}
              </>
            )}

            {section === 'specialties' && (
              <>
                <div>
                  <span className="mb-2 block text-sm text-white/70">Spécialités <span className="text-white/35">({form.specialties.length}/20)</span></span>
                  <Chips options={SPECIALTIES_BY_ROLE[role] || []} selected={form.specialties} onChange={v => set('specialties', v)} max={20} />
                </div>
                {role === 'ARTIST' && (
                  <div className="border-t border-white/[0.08] pt-5">
                    <span className="mb-2 block text-sm text-white/70">Styles musicaux</span>
                    <Chips options={MUSIC_STYLES} selected={form.styles} onChange={v => set('styles', v)} max={30} />
                    <div className="mt-3"><Toggle value={form.showStyles} onChange={v => set('showStyles', v)} label="Afficher mes styles sur mon profil" /></div>
                  </div>
                )}
              </>
            )}

            {section === 'media' && (
              <>
                <div>
                  <Field label="Vidéo de présentation (YouTube ou Vimeo)">
                    <input value={form.youtubeUrl} onChange={e => set('youtubeUrl', e.target.value)} placeholder="youtube.com/watch?v=…" className={INPUT} />
                  </Field>
                  {form.youtubeUrl && <Toggle value={form.showYoutubeUrl} onChange={v => set('showYoutubeUrl', v)} label="Afficher la vidéo sur mon profil" />}
                </div>
                {role === 'ARTIST' && (
                  <div>
                    <Field label="SoundCloud">
                      <input value={form.soundcloudUrl} onChange={e => set('soundcloudUrl', e.target.value)} placeholder="soundcloud.com/ton-profil" className={INPUT} />
                    </Field>
                    {form.soundcloudUrl && <Toggle value={form.showSoundcloud} onChange={v => set('showSoundcloud', v)} label="Afficher le lecteur SoundCloud sur mon profil" />}
                  </div>
                )}
              </>
            )}

            {section === 'socials' && (
              <div className="space-y-3">
                {SOCIAL_FIELDS.map(field => (
                  <Field key={field.key} label={field.label}>
                    <input type="url" inputMode="url" value={form[field.key]} onChange={e => set(field.key, e.target.value)} placeholder={field.placeholder} className={INPUT} />
                  </Field>
                ))}
              </div>
            )}

            {section === 'career' && (
              <>
                <Field label="CV / Expérience" hint={`${form.cvText.length}/5000`}>
                  <textarea value={form.cvText} onChange={e => set('cvText', e.target.value)} maxLength={5000} rows={7} placeholder="Ton parcours, tes expériences, tes formations…" className={`${INPUT} resize-none`} />
                </Field>
                <Field label={text.fees} hint={`${form.feeInfo.length}/2000`}>
                  <textarea value={form.feeInfo} onChange={e => set('feeInfo', e.target.value)} maxLength={2000} rows={5} placeholder="Ex : à partir de 500 € · devis sur demande · frais de déplacement en sus…" className={`${INPUT} resize-none`} />
                </Field>
              </>
            )}

          </div>
        </div>

        <footer className="border-t border-white/[0.08] px-4 py-3 sm:px-5">
          {error && <p className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm text-white/55 hover:text-white">Annuler</button>
            <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-50">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}
