'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import {
  Save, ArrowLeft, Music, MapPin, User, Briefcase,
  CheckCircle, XCircle, ShieldOff, ShieldAlert,
  Plus, X, Calendar, Euro, IdCard
} from 'lucide-react'
import { apiFetch } from '@/utils/auth'
import { getSpecialtiesForOfferType } from '@/constants/specialties'
import CityAutocomplete from '@/components/CityAutocomplete'
import DeleteAccountSection from '@/components/DeleteAccountSection'

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

// Spécialités par rôle — triées alphabétiquement
const SPECIALTIES_BY_ROLE: Record<string, string[]> = {
  ARTIST: [
    'Acrobate', 'Accordéoniste', 'Animateur', 'Artiste de cirque',
    'Bassiste', 'Batteur', 'Chanteur(se)', 'Chorale', 'Clown', 'Comédien',
    'Cracheur de feu', 'Danseur LED', 'Danseur(se)', 'DJ', 'Échassier',
    'Fanfare', 'Graffeur', 'Groupe', 'Groupe de danse', 'Guitariste',
    'Humoriste', 'Hypnotiseur', 'Imitateur', 'Influenceur / Créateur de contenu',
    'Jongleur', 'Magicien', 'Maître de cérémonie', 'Mentaliste', 'Mime',
    'Orchestre', 'Peintre Live', 'Percussionniste', 'Performer', 'Pianiste',
    'Présentateur', 'Saxophoniste', 'Sculpteur Live', 'Speed Painter',
    'Stand-upper', 'Streamer', 'Trompettiste', 'Violoncelliste', 'Violoniste',
  ],
  ORGANIZER: [
    'Agence événementielle', 'Anniversaire', 'Arena', 'Association',
    'Baptême', 'Bar', 'Beach Club', 'Camping', 'Casino',
    'Centre commercial', 'Centre culturel', 'Château', 'Collectivité',
    'Comité des fêtes', 'Congrès', 'Discothèque / Club', 'Domaine',
    'Entreprise / CE', 'Événement sportif', 'Festival', 'Gala', 'Hôtel',
    'Lancement de produit', 'Mairie', 'Mariage', 'Organisateur de soirées',
    'Palais des congrès', 'Parc d\'attractions', 'Plage privée', 'Pub',
    'Restaurant', 'Rooftop', 'Salle de réception', 'Salle de spectacle',
    'Salle des fêtes', 'Salon professionnel', 'Séminaire', 'Soirée étudiante',
    'Soirée privée', 'Théâtre', 'Village vacances', 'Wedding Planner', 'Zénith',
  ],
  PROVIDER: [
    'Arche de cérémonie', 'Baby-sitter événementielle', 'Ballons', 'Barman',
    'Borne 360°', 'Cake Designer', 'Chauffeur privé', 'Chef à domicile',
    'Coiffeur', 'Contrôle d\'accès', 'Costumier', 'Décorateur',
    'Designer événementiel', 'DJ Tech', 'Drone', 'Éclairagiste',
    'Effets spéciaux', 'Fleuriste', 'Food Truck', 'Glacier',
    'Hôtesse d\'accueil', 'Location de matériel', 'Location de sonorisation',
    'Location limousine', 'Location lumière', 'Location mobilier',
    'Location scène', 'Location vaisselle', 'Location véhicules',
    'Maquilleur', 'Monteur vidéo', 'Nettoyage', 'Pâtissier',
    'Photographe', 'Photobooth', 'Pyrotechnicien', 'Régisseur',
    'Régisseur général', 'Régisseur plateau', 'Retouche photo',
    'Scène', 'Sécurité', 'Serveur', 'Serveuse', 'Signalétique',
    'Sommelier', 'Sonorisateur', 'Structure', 'Styliste',
    'Technicien audiovisuel', 'Technicien lumière', 'Technicien son',
    'Traiteur', 'Transport de matériel', 'Vidéaste', 'Vidéoprojection', 'Voiturier',
  ],
}

const STYLES = [
  'Electro', 'House', 'Techno', 'Deep House', 'RNB', 'Hip-Hop', 'Rap', 'Trap',
  'Reggaeton', 'Afrobeats', 'Dancehall', 'Jazz', 'Blues', 'Soul', 'Funk',
  'Pop', 'Rock', 'Latino', 'Salsa', 'Bachata', 'Kizomba', 'Gospel', 'Classique',
]

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Profile = {
  id: number
  bio: string
  location: string
  country: string
  specialties: string[]
  styles: string[]
  radiusKm: number | null
  soundcloudUrl: string
  showSoundcloud: boolean
  showStyles: boolean
  youtubeUrl: string
  showYoutubeUrl: boolean
  showRealName: boolean
  avatar: string | null
  banner: string | null
}

// Informations saisies à l'inscription (privées, jamais affichées sur le profil public)
type Account = {
  pseudo: string
  firstName: string
  lastName: string
  dateOfBirth: string
  phone: string
  countryOfResidence: string
  legalStatus: '' | 'INDIVIDUAL' | 'INTERMITTENT' | 'AUTO_ENTREPRENEUR' | 'COMPANY'
  establishmentName: string
  siret: string
}

const EMPTY_ACCOUNT: Account = {
  pseudo: '', firstName: '', lastName: '', dateOfBirth: '', phone: '',
  countryOfResidence: '', legalStatus: '', establishmentName: '', siret: '',
}

const isProfessional = (status: Account['legalStatus']) => status === 'COMPANY' || status === 'AUTO_ENTREPRENEUR'

const inputClass = 'w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-white/70 mb-2 block">{label}</span>
      {children}
    </label>
  )
}

// ─────────────────────────────────────────────
// Composant Toggle
// ─────────────────────────────────────────────
function Toggle({ value, onChange, label, description }: {
  value: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-white/90">{label}</p>
        {description && <p className="text-xs text-white/45 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 shrink-0 rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-white/10'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Composant Tag sélectionnable
// ─────────────────────────────────────────────
function TagSelector({ options, selected, onChange }: {
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter(s => s !== item))
    } else {
      onChange([...selected, item])
    }
  }
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(item => (
        <button
          key={item}
          type="button"
          onClick={() => toggle(item)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            selected.includes(item)
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/80'
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Composant Section
// ─────────────────────────────────────────────
function Section({ title, icon, children }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-emerald-400">{icon}</span>
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────
export default function ProfileSettings() {
  const router = useRouter()
  const { user, setUser } = useAuth()
  const role = user?.role || 'ARTIST'
  const [account, setAccount] = useState<Account>(EMPTY_ACCOUNT)

  const [profile, setProfile] = useState<Profile>({
    id: 0,
    bio: '',
    location: '',
    country: '',
    specialties: [],
    styles: [],
    radiusKm: null,
    soundcloudUrl: '',
    showSoundcloud: false,
    showStyles: true,
    youtubeUrl: '',
    showYoutubeUrl: true,
    showRealName: false,
    avatar: null,
    banner: null,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  type BlockedUser = {
    id: number
    pseudo?: string | null
    firstName?: string | null
    lastName?: string | null
    role?: string | null
    avatar?: string | null
  }
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [unblockingId, setUnblockingId] = useState<number | null>(null)

  // ── Offres (organisateurs uniquement)
  type OfferItem = {
    id: number; title: string; description: string
    type: string; specialty?: string | null; date: string
    location: string; country: string; fee?: number | null
  }
  const [offers, setOffers] = useState<OfferItem[]>([])
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [submittingOffer, setSubmittingOffer] = useState(false)
  const [offerFormError, setOfferFormError] = useState<string | null>(null)
  const [offerForm, setOfferForm] = useState({
    title: '', description: '', type: 'ARTIST' as 'ARTIST' | 'PROVIDER' | 'ALL',
    specialty: '', date: '', time: '20:00', location: '', country: '', fee: '',
  })

  // ── Chargement du profil
  useEffect(() => {
    if (!user) return
    apiFetch(`${API}/api/profile/me`, { credentials: 'include' })
      .then(r => r.json())
      .then(({ profile: p }) => {
        if (!p) return
        setProfile({
          id: p.id,
          bio: p.bio || '',
          location: p.location || '',
          country: p.country || '',
          specialties: p.specialties || [],
          styles: p.styles || [],
          radiusKm: p.radiusKm ?? null,
          soundcloudUrl: p.soundcloudUrl || '',
          showSoundcloud: !!p.showSoundcloud,
          showStyles: p.showStyles !== false,
          youtubeUrl: p.youtubeUrl || '',
          showYoutubeUrl: p.showYoutubeUrl !== false,
          showRealName: p.showRealName ?? false,
          avatar: p.avatar || null,
          banner: p.banner || null,
        })
        setAccount({
          pseudo: p.user?.pseudo || '',
          firstName: p.user?.firstName || '',
          lastName: p.user?.lastName || '',
          dateOfBirth: p.user?.dateOfBirth ? String(p.user.dateOfBirth).slice(0, 10) : '',
          phone: p.user?.phone || '',
          countryOfResidence: p.user?.countryOfResidence || '',
          legalStatus: p.legalStatus || '',
          establishmentName: p.establishmentName || '',
          siret: p.siret || '',
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    // Charger la liste des bloqués
    apiFetch(`${API}/api/block/list`, {})
      .then(r => r.ok ? r.json() : { blocked: [] })
      .then(d => setBlockedUsers(d.blocked || []))
      .catch(() => {})

    // Charger les offres (organisateurs)
    if (user?.role === 'ORGANIZER') {
      apiFetch(`${API}/api/profile/me`, { credentials: 'include' })
        .then(r => r.json())
        .then(({ profile: p }) => {
          if (!p?.id) return
          return apiFetch(`${API}/api/offers?organizerId=${p.id}`)
        })
        .then(r => r?.json())
        .then(data => { if (Array.isArray(data)) setOffers(data) })
        .catch(() => {})
    }
  }, [user])

  // ── Débloquer un utilisateur
  const handleUnblock = async (targetId: number) => {
    setUnblockingId(targetId)
    try {
      const res = await apiFetch(`${API}/api/block/${targetId}`, {
        method: 'DELETE',
        })
      if (res.ok) {
        setBlockedUsers(prev => prev.filter(u => u.id !== targetId))
      }
    } catch {
      // silently fail
    } finally {
      setUnblockingId(null)
    }
  }

  // ── Sauvegarde
  const handleSave = async () => {
    if (!profile.id) return
    setSaving(true)
    setError(null)
    try {
      if (!account.pseudo.trim() || !account.firstName.trim() || !account.lastName.trim()) {
        throw new Error('Le pseudo, le prénom et le nom sont obligatoires.')
      }
      const professional = isProfessional(account.legalStatus)
      const accountRes = await apiFetch(`${API}/api/profile/me/account`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pseudo: account.pseudo.trim(),
          firstName: account.firstName.trim(),
          lastName: account.lastName.trim(),
          dateOfBirth: account.dateOfBirth || null,
          phone: account.phone.trim() || null,
          countryOfResidence: account.countryOfResidence.trim() || null,
          ...(account.legalStatus ? { legalStatus: account.legalStatus } : {}),
          ...(role === 'ORGANIZER' && account.legalStatus
            ? { organizerType: professional ? 'PROFESSIONAL' : 'INDIVIDUAL' }
            : {}),
          establishmentName: role === 'ORGANIZER' && professional ? account.establishmentName.trim() || null : null,
          siret: professional ? account.siret.replace(/\s/g, '') || null : null,
        }),
      })
      if (!accountRes.ok) {
        const d = await accountRes.json().catch(() => null)
        throw new Error(d?.message || d?.error || 'Impossible d’enregistrer les informations du compte.')
      }
      setUser(u => (u ? { ...u, name: account.pseudo.trim() } : u))

      const res = await apiFetch(`${API}/api/profile/${profile.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: profile.bio,
          location: profile.location,
          specialties: profile.specialties,
          styles: profile.styles,
          radiusKm: profile.radiusKm,
          soundcloudUrl: profile.soundcloudUrl,
          showSoundcloud: profile.showSoundcloud,
          showStyles: profile.showStyles,
          youtubeUrl: profile.youtubeUrl,
          showYoutubeUrl: profile.showYoutubeUrl,
          showRealName: profile.showRealName,
          avatar: profile.avatar,
          banner: profile.banner,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => null)
        throw new Error(d?.message || d?.error || 'Erreur serveur')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handlePublishOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    setOfferFormError(null)
    if (!offerForm.title || !offerForm.description || !offerForm.date || !offerForm.location || !offerForm.country) {
      setOfferFormError('Remplis tous les champs obligatoires.')
      return
    }
    if (!offerForm.specialty) {
      setOfferFormError('Veuillez sélectionner une spécialité.')
      return
    }
    setSubmittingOffer(true)
    try {
      const res = await apiFetch(`${API}/api/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       offerForm.title,
          description: offerForm.description,
          type:        offerForm.type,
          specialty:   offerForm.specialty,
          date:        `${offerForm.date}T${offerForm.time || '00:00'}:00`,
          location:    offerForm.location,
          country:     offerForm.country,
          fee:         offerForm.fee ? parseFloat(offerForm.fee) : null,
        }),
      })
      if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.message || d?.error || 'Erreur') }
      const created = await res.json()
      setOffers(prev => [created, ...prev])
      setShowOfferForm(false)
      setOfferForm({ title: '', description: '', type: 'ARTIST', specialty: '', date: '', time: '20:00', location: '', country: '', fee: '' })
    } catch (err: unknown) {
      setOfferFormError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSubmittingOffer(false)
    }
  }

  const handleDeleteOffer = async (offerId: number) => {
    if (!confirm('Supprimer cette offre ?')) return
    try {
      const res = await apiFetch(`${API}/api/offers/${offerId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Suppression refusée')
      setOffers(prev => prev.filter(o => o.id !== offerId))
    } catch { alert('Impossible de supprimer cette offre.') }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0b0b10_0%,_#050508_55%)] flex items-center justify-center">
        <div className="text-white/50 text-sm">Chargement…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white pb-20 lsb-surface-page lsb-settings-page">

      {/* Header fixe */}
      <div className="sticky top-[env(safe-area-inset-top)] md:top-[calc(4rem+env(safe-area-inset-top))] z-10 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition">
            <ArrowLeft size={16} />
            Retour
          </button>
          <span className="text-sm font-semibold">Studio profil</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 px-4 py-1.5 rounded-lg text-sm font-semibold transition"
          >
            {saving ? 'Enregistrement…' : <><Save size={14} /> Enregistrer</>}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Feedback */}
        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            <CheckCircle size={16} /> Profil enregistré avec succès !
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <XCircle size={16} /> {error}
          </div>
        )}

        {/* ── SECTION : Informations du compte (privées) ── */}
        <Section title="Informations du compte" icon={<IdCard size={18} />}>
          <p className="text-xs text-white/45 -mt-3 mb-5">
            Saisies à l&apos;inscription. Seul le pseudo (ou ton nom, si tu l&apos;as choisi ci-dessous) apparaît sur ton profil public ; le reste reste privé.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pseudo">
              <input value={account.pseudo} onChange={e => setAccount(a => ({ ...a, pseudo: e.target.value }))} maxLength={30} className={inputClass} />
            </Field>
            <Field label="Téléphone">
              <input type="tel" value={account.phone} onChange={e => setAccount(a => ({ ...a, phone: e.target.value }))} maxLength={20} placeholder="06 12 34 56 78" className={inputClass} />
            </Field>
            <Field label="Prénom">
              <input value={account.firstName} onChange={e => setAccount(a => ({ ...a, firstName: e.target.value }))} maxLength={50} className={inputClass} />
            </Field>
            <Field label="Nom">
              <input value={account.lastName} onChange={e => setAccount(a => ({ ...a, lastName: e.target.value }))} maxLength={50} className={inputClass} />
            </Field>
            <Field label="Date de naissance">
              <input type="date" value={account.dateOfBirth} onChange={e => setAccount(a => ({ ...a, dateOfBirth: e.target.value }))} className={`${inputClass} [color-scheme:dark]`} />
            </Field>
            <Field label="Pays de résidence">
              <input value={account.countryOfResidence} onChange={e => setAccount(a => ({ ...a, countryOfResidence: e.target.value }))} maxLength={100} placeholder="France" className={inputClass} />
            </Field>
            <Field label="Statut">
              <select
                value={isProfessional(account.legalStatus) ? 'COMPANY' : account.legalStatus}
                onChange={e => setAccount(a => ({ ...a, legalStatus: e.target.value as Account['legalStatus'] }))}
                className={`${inputClass} [color-scheme:dark]`}
              >
                <option value="">Non renseigné</option>
                <option value="INDIVIDUAL">Particulier</option>
                <option value="INTERMITTENT">Intermittent du spectacle</option>
                <option value="COMPANY">Professionnel (auto-entrepreneur, société…)</option>
              </select>
            </Field>
            {isProfessional(account.legalStatus) && (
              <Field label="Numéro SIRET">
                <input value={account.siret} onChange={e => setAccount(a => ({ ...a, siret: e.target.value }))} inputMode="numeric" maxLength={17} placeholder="14 chiffres" className={inputClass} />
              </Field>
            )}
            {role === 'ORGANIZER' && isProfessional(account.legalStatus) && (
              <div className="sm:col-span-2">
                <Field label="Nom de l&apos;établissement">
                  <input value={account.establishmentName} onChange={e => setAccount(a => ({ ...a, establishmentName: e.target.value }))} maxLength={200} placeholder="Ex : Alta Rocca Club" className={inputClass} />
                </Field>
              </div>
            )}
          </div>
        </Section>

        {/* ── SECTION : Identité publique ── */}
        <Section title="Identité publique" icon={<User size={18} />}>
          <div className="space-y-4">
            <Toggle
              value={profile.showRealName}
              onChange={v => setProfile(p => ({ ...p, showRealName: v }))}
              label="Afficher mon nom et prénom"
              description="Si désactivé, seul ton pseudo sera visible"
            />
            <div className="border-t border-white/8 pt-4">
              <label className="text-sm text-white/70 mb-2 block">Bio / Description</label>
              <textarea
                value={profile.bio}
                onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                rows={4}
                maxLength={600}
                placeholder="Présente-toi en quelques lignes…"
                className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50 resize-none"
              />
              <p className="text-xs text-white/30 text-right mt-1">{profile.bio.length}/600</p>
            </div>
          </div>
        </Section>

        {/* ── SECTION : Localisation ── */}
        <Section title="Localisation" icon={<MapPin size={18} />}>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/70 mb-2 block">Ville</label>
              <CityAutocomplete
                value={profile.location}
                onChange={v => setProfile(p => ({ ...p, location: v }))}
                placeholder="Ex : Paris, Lyon, Marseille…"
                inputClassName="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-sm text-white/70 mb-3 block">
                Rayon d&apos;intervention
                {profile.radiusKm
                  ? <span className="text-emerald-400 ml-1">— {profile.radiusKm >= 9999 ? 'National' : `${profile.radiusKm} km`}</span>
                  : <span className="text-white/35 ml-1">— non renseigné</span>
                }
              </label>
              <div className="flex flex-wrap gap-2">
                {[50, 100, 200, 500, 1000].map(km => (
                  <button
                    key={km}
                    type="button"
                    onClick={() => setProfile(p => ({ ...p, radiusKm: p.radiusKm === km ? null : km }))}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      profile.radiusKm === km
                        ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {km} km
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setProfile(p => ({ ...p, radiusKm: p.radiusKm === 9999 ? null : 9999 }))}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    profile.radiusKm === 9999
                      ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  National
                </button>
              </div>
              <p className="text-xs text-white/25 mt-2">Cliquer à nouveau sur une valeur pour la désélectionner</p>
            </div>
          </div>
        </Section>

        {/* ── SECTION : Spécialités ── */}
        <Section title="Spécialités" icon={<Briefcase size={18} />}>
          <p className="text-xs text-white/45 mb-1">Sélectionne tout ce qui te correspond</p>
          <TagSelector
            options={SPECIALTIES_BY_ROLE[role] || SPECIALTIES_BY_ROLE.ARTIST}
            selected={profile.specialties}
            onChange={v => setProfile(p => ({ ...p, specialties: v }))}
          />
        </Section>

        {/* ── SECTION : Styles (Artistes uniquement) ── */}
        {role === 'ARTIST' && (
          <Section title="Styles musicaux" icon={<Music size={18} />}>
            <p className="text-xs text-white/45 mb-1">Tes univers musicaux</p>
            <TagSelector
              options={STYLES}
              selected={profile.styles}
              onChange={v => setProfile(p => ({ ...p, styles: v }))}
            />
            <div className="mt-3 border-t border-white/8 pt-3">
              <Toggle
                value={profile.showStyles}
                onChange={v => setProfile(p => ({ ...p, showStyles: v }))}
                label="Afficher les styles sur mon profil"
                description="Visible par les autres utilisateurs"
              />
            </div>
          </Section>
        )}

        {/* ── SECTION : Médias (Artistes, Organisateurs & Prestataires) ── */}
        {(role === 'ARTIST' || role === 'PROVIDER' || role === 'ORGANIZER') && (
          <Section title="Liens médias" icon={<Music size={18} />}>
            <div className="space-y-4">
              {role === 'ARTIST' && (
                <div>
                  <label className="text-sm text-white/70 mb-2 flex items-center gap-1.5">
                    <span className="text-orange-400">☁</span> SoundCloud
                  </label>
                  <input
                    value={profile.soundcloudUrl}
                    onChange={e => setProfile(p => ({ ...p, soundcloudUrl: e.target.value }))}
                    placeholder="https://soundcloud.com/ton-profil"
                    className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <div className="mt-2 border-t border-white/8 pt-2">
                    <Toggle
                      value={profile.showSoundcloud}
                      onChange={v => setProfile(p => ({ ...p, showSoundcloud: v }))}
                      label="Afficher le player SoundCloud sur mon profil"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm text-white/70 mb-2 flex items-center gap-1.5">
                  <span className="text-red-400">▶</span> Vidéo de prestation (YouTube / Vimeo)
                </label>
                <input
                  value={profile.youtubeUrl}
                  onChange={e => setProfile(p => ({ ...p, youtubeUrl: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50"
                />
                {profile.youtubeUrl && (
                  <div className="mt-3 border-t border-white/8 pt-3">
                    <Toggle
                      value={profile.showYoutubeUrl}
                      onChange={v => setProfile(p => ({ ...p, showYoutubeUrl: v }))}
                      label="Afficher la vidéo sur mon profil"
                      description="Visible par les autres utilisateurs"
                    />
                  </div>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* ── SECTION : Mes offres (Organisateurs uniquement) ── */}
        {role === 'ORGANIZER' && (
          <Section title="Mes offres" icon={<Briefcase size={18} />}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-white/40">Offres publiées sur la plateforme</p>
              <button
                type="button"
                onClick={() => { setShowOfferForm(v => !v); setOfferForm(p => ({ ...p, location: profile.location, country: profile.country })) }}
                className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-full transition-colors"
              >
                <Plus size={13} />
                Publier une offre
              </button>
            </div>

            {/* Formulaire */}
            {showOfferForm && (
              <form onSubmit={handlePublishOffer} className="mb-4 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-purple-300">Nouvelle offre</p>
                  <button type="button" onClick={() => setShowOfferForm(false)}>
                    <X size={16} className="text-white/30 hover:text-white/60" />
                  </button>
                </div>

                <input required value={offerForm.title}
                  onChange={e => setOfferForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Titre *"
                  className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/50"
                />
                <textarea required rows={3} value={offerForm.description}
                  onChange={e => setOfferForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Description *"
                  className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/50 resize-none"
                />

                <div className="grid grid-cols-2 gap-2">
                  <select value={offerForm.type}
                    onChange={e => setOfferForm(p => ({ ...p, type: e.target.value as typeof offerForm.type, specialty: '' }))}
                    className="h-10 rounded-xl bg-white/5 px-3 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="ARTIST">Artiste</option>
                    <option value="PROVIDER">Prestataire</option>
                    <option value="ALL">Tous profils</option>
                  </select>
                  <select value={offerForm.specialty}
                    onChange={e => setOfferForm(p => ({ ...p, specialty: e.target.value }))}
                    className="h-10 rounded-xl bg-white/5 px-3 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="">Spécialité *</option>
                    {getSpecialtiesForOfferType(offerForm.type as 'ARTIST' | 'PROVIDER' | 'ALL').map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input required type="date" value={offerForm.date}
                      onChange={e => setOfferForm(p => ({ ...p, date: e.target.value }))}
                      className="h-10 w-full rounded-xl bg-white/5 pl-8 pr-3 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <input type="time" value={offerForm.time}
                    onChange={e => setOfferForm(p => ({ ...p, time: e.target.value }))}
                    className="h-10 rounded-xl bg-white/5 px-3 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3 text-white/30 pointer-events-none z-10" />
                    <CityAutocomplete
                      value={offerForm.location}
                      onChange={v => setOfferForm(p => ({ ...p, location: v }))}
                      placeholder="Ville *"
                      inputClassName="h-10 w-full rounded-xl bg-white/5 pl-8 pr-3 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <input required value={offerForm.country}
                    onChange={e => setOfferForm(p => ({ ...p, country: e.target.value }))}
                    placeholder="Pays *"
                    className="h-10 rounded-xl bg-white/5 px-3 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                <div className="relative">
                  <Euro size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input type="number" min="0" step="0.01" value={offerForm.fee}
                    onChange={e => setOfferForm(p => ({ ...p, fee: e.target.value }))}
                    placeholder="Tarif proposé (optionnel)"
                    className="h-10 w-full rounded-xl bg-white/5 pl-8 pr-3 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                {offerFormError && <p className="text-xs text-red-400">{offerFormError}</p>}

                <button type="submit" disabled={submittingOffer}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {submittingOffer ? 'Publication…' : 'Publier'}
                </button>
              </form>
            )}

            {/* Liste des offres */}
            {offers.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-4">Aucune offre publiée</p>
            ) : (
              <div className="space-y-3">
                {offers.map(o => (
                  <div key={o.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{o.title}</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {new Date(o.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {' · '}{o.location}, {o.country}
                          {o.fee != null ? ` · ${o.fee.toLocaleString('fr-FR')} €` : ''}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteOffer(o.id)} className="text-white/20 hover:text-red-400 transition flex-shrink-0">
                        <X size={15} />
                      </button>
                    </div>
                    <p className="text-xs text-white/50 mt-2 line-clamp-2">{o.description}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ── Section Utilisateurs bloqués ── */}
        <Section title="Utilisateurs bloqués" icon={<ShieldAlert size={18} />}>
          {blockedUsers.length === 0 ? (
            <p className="text-sm text-white/40">Vous n&apos;avez bloqué aucun utilisateur.</p>
          ) : (
            <ul className="space-y-3">
              {blockedUsers.map(u => {
                const displayName =
                  u.pseudo ||
                  [u.firstName, u.lastName].filter(Boolean).join(' ') ||
                  'Utilisateur'
                const avatarSrc = u.avatar || '/default-avatar.png'
                return (
                  <li key={u.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden">
                      <Image src={avatarSrc} alt={displayName} fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{displayName}</p>
                      <p className="text-xs text-white/40">{u.role}</p>
                    </div>
                    <button
                      onClick={() => handleUnblock(u.id)}
                      disabled={unblockingId === u.id}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition disabled:opacity-40"
                    >
                      <ShieldOff size={13} />
                      {unblockingId === u.id ? 'En cours…' : 'Débloquer'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>

        {/* ── Suppression du compte ── */}
        {role !== 'ADMIN' && <DeleteAccountSection />}

      </div>
    </div>
  )
}
