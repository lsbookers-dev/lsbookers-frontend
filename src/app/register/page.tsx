'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import axios, { isAxiosError } from 'axios'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Role = 'ARTIST' | 'ORGANIZER' | 'PROVIDER'
type LegalStatus = 'INDIVIDUAL' | 'AUTO_ENTREPRENEUR' | 'COMPANY'
type OrganizerType = 'INDIVIDUAL' | 'PROFESSIONAL'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const API = (process.env.NEXT_PUBLIC_API_URL || 'https://lsbookers-backend-production.up.railway.app').replace(/\/$/, '')

// ─────────────────────────────────────────────
// Composants UI réutilisables
// ─────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-white/75">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-white/35">{hint}</p>}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-purple-500/60"
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  const { options, ...rest } = props
  return (
    <div className="relative">
      <select
        {...rest}
        className="w-full appearance-none rounded-xl bg-white/5 px-4 py-2.5 pr-10 text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-purple-500/60"
      >
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-neutral-900">{o.label}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">▾</span>
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {message}
    </div>
  )
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:opacity-60 shadow-lg shadow-purple-900/30"
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
          Chargement…
        </span>
      ) : label}
    </button>
  )
}

// ─────────────────────────────────────────────
// Barre de progression améliorée
// ─────────────────────────────────────────────
const STEPS = ['Compte', 'Identité', 'Statut', 'Prêt !']

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="mb-6">
      <div className="relative flex items-center justify-between">
        {/* Ligne de fond */}
        <div className="absolute left-0 right-0 top-3.5 h-0.5 bg-white/10 -z-0" />
        {/* Ligne de progression */}
        <div
          className="absolute left-0 top-3.5 h-0.5 bg-purple-500 transition-all duration-500 -z-0"
          style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((label, i) => {
          const n = i + 1
          const done   = n < current
          const active = n === current
          return (
            <div key={i} className="flex flex-col items-center gap-1.5 z-10">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all
                ${done   ? 'bg-purple-600 text-white ring-2 ring-purple-500/30'
                : active ? 'bg-neutral-900 text-white ring-2 ring-purple-500'
                :          'bg-white/8 text-white/35 ring-1 ring-white/10'}`}>
                {done ? '✓' : n}
              </div>
              <span className={`hidden sm:block text-[10px] font-medium transition
                ${active ? 'text-white' : done ? 'text-purple-400' : 'text-white/30'}`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Panneau gauche — évolue selon l'étape
// ─────────────────────────────────────────────
const STEP_CONTENT = [
  {
    emoji: '✦',
    title: 'Rejoins la scène.',
    subtitle: 'Choisis ton rôle pour commencer. Tu peux être artiste, organisateur ou prestataire.',
    items: ['Réseau social dédié à l\'événementiel', 'Agenda & gestion des événements', 'Offres d\'emploi & mise en relation'],
  },
  {
    emoji: '👤',
    title: 'Qui es-tu ?',
    subtitle: 'Ces informations permettent de créer ton profil public et de sécuriser ton compte.',
    items: ['Ton pseudo sera visible sur ton profil', 'Tes données personnelles restent privées', 'Tu pourras tout modifier après inscription'],
  },
  {
    emoji: '📋',
    title: 'Statut légal.',
    subtitle: 'Ces informations sont nécessaires pour activer les paiements sur la plateforme.',
    items: ['Informations sécurisées et chiffrées', 'Requises uniquement pour les paiements', 'Tu pourras les compléter plus tard'],
  },
  {
    emoji: '🎉',
    title: 'Bienvenue !',
    subtitle: 'Ton compte est créé. Confirme ton email pour commencer à utiliser LSBookers.',
    items: ['Profil visible sur la plateforme', 'Accès à la messagerie et aux offres', 'Commence à construire ton réseau'],
  },
]

function BrandingPanel({ step }: { step: number }) {
  const content = STEP_CONTENT[step - 1] || STEP_CONTENT[0]
  return (
    <aside className="hidden lg:flex flex-col justify-between border-r border-white/8">

      <div className="p-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/15 group-hover:ring-white/30 transition flex items-center justify-center">
            <span className="font-black text-base tracking-widest">LS</span>
          </div>
          <div className="leading-tight">
            <p className="text-lg font-extrabold tracking-tight">LSBookers</p>
            <p className="text-[10px] text-white/50 tracking-widest uppercase">Réseau événementiel</p>
          </div>
        </Link>

        <div className="mt-12 space-y-4 transition-all">
          <div className="text-3xl">{content.emoji}</div>
          <h1 className="text-3xl font-black tracking-tight leading-tight">{content.title}</h1>
          <p className="text-white/55 text-sm max-w-xs leading-relaxed">{content.subtitle}</p>

          <ul className="mt-6 space-y-3">
            {content.items.map(item => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-white/60">
                <span className="text-purple-400 mt-0.5 flex-shrink-0">✦</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Indicateur d'étape */}
        <div className="mt-10 flex items-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${i + 1 === step ? 'w-8 bg-purple-500' : i + 1 < step ? 'w-4 bg-purple-500/50' : 'w-4 bg-white/15'}`}
            />
          ))}
        </div>
      </div>

      <div className="p-10">
        <p className="text-xs text-white/30">© {new Date().getFullYear()} LSBookers — Tous droits réservés.</p>
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter()

  const BG = process.env.NEXT_PUBLIC_LANDING_BG ||
    'https://res.cloudinary.com/dzpie6sij/image/upload/v1755121809/Landing_fz7zqx.png'

  const [step, setStep]   = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Étape 1
  const [email, setEmail]                   = useState('')
  const [password, setPassword]             = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole]                     = useState<Role>('ARTIST')

  // Étape 2
  const [pseudo, setPseudo]                       = useState('')
  const [firstName, setFirstName]                 = useState('')
  const [lastName, setLastName]                   = useState('')
  const [dateOfBirth, setDateOfBirth]             = useState('')
  const [phone, setPhone]                         = useState('')
  const [countryOfResidence, setCountryOfResidence] = useState('France')

  // Étape 3
  const [legalStatus, setLegalStatus]           = useState<LegalStatus>('INDIVIDUAL')
  const [organizerType, setOrganizerType]       = useState<OrganizerType>('INDIVIDUAL')
  const [establishmentName, setEstablishmentName] = useState('')
  const [typeEtablissement, setTypeEtablissement] = useState('')
  const [siret, setSiret]                       = useState('')
  const [city, setCity]                         = useState('')

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    setStep(2)
  }

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStep(3)
  }

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await axios.post(
        `${API}/api/auth/register-complete`,
        {
          email, password, role,
          pseudo, firstName, lastName,
          dateOfBirth: dateOfBirth || undefined,
          phone: phone || undefined,
          countryOfResidence,
          legalStatus,
          organizerType: role === 'ORGANIZER' ? organizerType : undefined,
          establishmentName: (role === 'ORGANIZER' && organizerType === 'PROFESSIONAL') ? establishmentName || undefined : undefined,
          typeEtablissement: (role === 'ORGANIZER' && organizerType === 'PROFESSIONAL') ? typeEtablissement || undefined : undefined,
          siret: legalStatus !== 'INDIVIDUAL' ? siret || undefined : undefined,
          city: city || undefined,
        },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      )
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setStep(4)
    } catch (err) {
      if (isAxiosError(err)) {
        const msg = err.response?.data?.error
        if (err.response?.status === 400 && msg?.includes('inscrit')) {
          setError('Un compte existe déjà avec cet email. Retourne à l\'étape 1 pour en changer.')
        } else if (err.response?.status === 409) {
          setError('Ce pseudo est déjà utilisé. Retourne à l\'étape 2 pour en changer.')
        } else if (err.response?.status === 429) {
          setError('Trop de tentatives. Réessayez dans 5 minutes.')
        } else {
          setError(msg || 'Échec de la création du compte.')
        }
      } else {
        setError('Erreur réseau.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white">

      {/* Photo de fond */}
      <Image src={BG} alt="LSBookers" fill priority sizes="100vw" className="z-0 object-cover" />
      <div className="absolute inset-0 z-10 bg-black/60" />
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute -top-32 -left-28 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-pink-500/15 blur-3xl" />
      </div>

      <div className="relative z-20 mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">

        <BrandingPanel step={step} />

        <main className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">

            {/* En-tête mobile */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/15 flex items-center justify-center">
                <span className="font-black text-sm tracking-widest">LS</span>
              </div>
              <span className="font-extrabold text-base">LSBookers</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-7 shadow-2xl">

              {/* En-tête formulaire */}
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">Créer un compte</h2>
                  {step < 4 && (
                    <p className="text-sm text-white/45 mt-0.5">
                      Déjà inscrit ?{' '}
                      <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition">
                        Se connecter
                      </Link>
                    </p>
                  )}
                </div>
                <Link
                  href="/"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition"
                >
                  ← Retour
                </Link>
              </div>

              {/* Barre de progression */}
              <ProgressBar current={step} />

              {error && <div className="mb-4"><ErrorBox message={error} /></div>}

              {/* ─── ÉTAPE 1 : Compte ─── */}
              {step === 1 && (
                <form onSubmit={handleStep1} className="space-y-4">

                  <Field label="Type de compte">
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: 'ARTIST',    label: 'Artiste',       icon: '🎤', desc: 'DJ, musicien, performer…' },
                        { value: 'ORGANIZER', label: 'Organisateur',  icon: '🎪', desc: 'Club, festival, soirée…' },
                        { value: 'PROVIDER',  label: 'Prestataire',   icon: '📸', desc: 'Photo, son, déco…' },
                      ] as { value: Role; label: string; icon: string; desc: string }[]).map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setRole(opt.value)}
                          className={`flex flex-col items-center gap-2 rounded-xl border p-3.5 text-center text-xs transition
                            ${role === opt.value
                              ? 'border-purple-500 bg-purple-500/15 text-white'
                              : 'border-white/10 bg-white/4 text-white/55 hover:border-white/20 hover:text-white'}`}
                        >
                          <span className="text-2xl">{opt.icon}</span>
                          <span className="font-semibold text-xs">{opt.label}</span>
                          <span className="text-[10px] text-white/40 leading-tight">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Email">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-base">✉️</span>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="nom@domaine.com"
                        className="w-full rounded-xl bg-white/5 pl-10 pr-4 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/60 transition"
                      />
                    </div>
                  </Field>

                  <Field label="Mot de passe">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-base">🔒</span>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="Au moins 8 caractères"
                        className="w-full rounded-xl bg-white/5 pl-10 pr-4 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/60 transition"
                      />
                    </div>
                  </Field>

                  <Field label="Confirmer le mot de passe">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-base">🔒</span>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className="w-full rounded-xl bg-white/5 pl-10 pr-4 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/60 transition"
                      />
                    </div>
                  </Field>

                  <SubmitButton loading={loading} label="Continuer →" />

                  <p className="text-center text-xs text-white/35">
                    En t&apos;inscrivant, tu acceptes nos{' '}
                    <Link href="/legal/terms" className="underline underline-offset-4 hover:text-white transition">
                      conditions d&apos;utilisation
                    </Link>.
                  </p>
                </form>
              )}

              {/* ─── ÉTAPE 2 : Identité ─── */}
              {step === 2 && (
                <form onSubmit={handleStep2} className="space-y-4">
                  <p className="text-sm text-white/50 -mt-1">
                    {role === 'ARTIST'
                      ? 'Ces informations permettent de sécuriser ton compte et d\'identifier ton profil.'
                      : 'Ces informations permettent d\'identifier votre établissement.'}
                  </p>

                  {role === 'ARTIST' ? (
                    <Field label="Pseudo / Nom de scène" hint="Lettres, chiffres, tirets et underscores — 3 à 30 caractères.">
                      <Input type="text" value={pseudo} onChange={e => setPseudo(e.target.value)} required placeholder="Ex. DJNova, MC Flash…" pattern="[a-zA-Z0-9_.\-]{3,30}" title="3 à 30 caractères : lettres, chiffres, tirets, underscores" />
                    </Field>
                  ) : role === 'ORGANIZER' ? (
                    <Field label="Nom de l'établissement / Nom commercial" hint="Ce nom apparaîtra sur votre profil public.">
                      <Input type="text" value={pseudo} onChange={e => setPseudo(e.target.value)} required placeholder="Ex. ClubNova, FestivalLumieres…" pattern="[a-zA-Z0-9_.\-]{3,30}" title="3 à 30 caractères" />
                    </Field>
                  ) : (
                    <Field label="Nom commercial / Nom de votre activité" hint="Ce nom apparaîtra sur votre profil public.">
                      <Input type="text" value={pseudo} onChange={e => setPseudo(e.target.value)} required placeholder="Ex. PhotoStudio94, SonPro…" pattern="[a-zA-Z0-9_.\-]{3,30}" title="3 à 30 caractères" />
                    </Field>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Field label={role === 'ARTIST' ? 'Prénom' : 'Prénom du responsable'}>
                      <Input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required autoComplete="given-name" placeholder="Prénom" />
                    </Field>
                    <Field label={role === 'ARTIST' ? 'Nom' : 'Nom du responsable'}>
                      <Input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required autoComplete="family-name" placeholder="Nom" />
                    </Field>
                  </div>

                  {role !== 'ARTIST' && (
                    <p className="text-xs text-white/35 -mt-2">Utilisés uniquement pour la vérification légale — non visibles publiquement.</p>
                  )}

                  <Field label={role === 'ARTIST' ? 'Date de naissance (optionnel)' : 'Date de naissance du responsable (optionnel)'}>
                    <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} max={new Date(Date.now() - 13 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} />
                  </Field>

                  <Field label="Téléphone (optionnel)">
                    <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" placeholder="+33 6 XX XX XX XX" />
                  </Field>

                  <Field label="Pays">
                    <Select value={countryOfResidence} onChange={e => setCountryOfResidence(e.target.value)} options={[
                      { value: 'France', label: 'France' },
                      { value: 'Belgique', label: 'Belgique' },
                      { value: 'Suisse', label: 'Suisse' },
                      { value: 'Luxembourg', label: 'Luxembourg' },
                      { value: 'Canada', label: 'Canada' },
                      { value: 'Autre', label: 'Autre' },
                    ]} />
                  </Field>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/60 hover:bg-white/10 hover:text-white transition">
                      ← Retour
                    </button>
                    <SubmitButton loading={loading} label="Continuer →" />
                  </div>
                </form>
              )}

              {/* ─── ÉTAPE 3 : Statut légal ─── */}
              {step === 3 && (
                <form onSubmit={handleStep3} className="space-y-4">
                  <p className="text-sm text-white/50 -mt-1">
                    Ces informations légales sont obligatoires pour utiliser les services de paiement.
                  </p>

                  <Field label="Ton statut">
                    <div className="space-y-2">
                      {([
                        { value: 'INDIVIDUAL',       label: 'Particulier',              desc: 'Tu agis à titre personnel.' },
                        { value: 'AUTO_ENTREPRENEUR', label: 'Auto-entrepreneur',        desc: 'Tu as un numéro SIRET.' },
                        { value: 'COMPANY',           label: 'Société / Association',    desc: 'SARL, SAS, association…' },
                      ] as { value: LegalStatus; label: string; desc: string }[]).map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setLegalStatus(opt.value)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition
                            ${legalStatus === opt.value
                              ? 'border-purple-500 bg-purple-500/15 text-white'
                              : 'border-white/10 bg-white/4 text-white/55 hover:border-white/20 hover:text-white'}`}
                        >
                          <span className={`h-4 w-4 flex-shrink-0 rounded-full border-2 transition ${legalStatus === opt.value ? 'border-purple-400 bg-purple-400' : 'border-white/30'}`} />
                          <div>
                            <p className="text-sm font-medium">{opt.label}</p>
                            <p className="text-xs text-white/45">{opt.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </Field>

                  {legalStatus !== 'INDIVIDUAL' && (
                    <Field label={legalStatus === 'COMPANY' ? 'Numéro SIRET / KBIS' : 'Numéro SIRET'} hint="Ce numéro sera vérifié lors de l'activation des paiements.">
                      <Input type="text" value={siret} onChange={e => setSiret(e.target.value)} placeholder="Ex. 12345678900012" maxLength={17} />
                    </Field>
                  )}

                  {role === 'ORGANIZER' && (
                    <>
                      <Field label="Tu organises en tant que">
                        <div className="grid grid-cols-2 gap-2">
                          {([
                            { value: 'INDIVIDUAL',   label: 'Particulier',    desc: 'Soirée privée' },
                            { value: 'PROFESSIONAL', label: 'Professionnel',  desc: 'Club, festival, agence…' },
                          ] as { value: OrganizerType; label: string; desc: string }[]).map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setOrganizerType(opt.value)}
                              className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs transition
                                ${organizerType === opt.value
                                  ? 'border-purple-500 bg-purple-500/15 text-white'
                                  : 'border-white/10 bg-white/4 text-white/55 hover:border-white/20'}`}
                            >
                              <span className="font-semibold">{opt.label}</span>
                              <span className="text-white/40">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </Field>

                      {organizerType === 'PROFESSIONAL' && (
                        <>
                          <Field label="Nom de l'établissement">
                            <Input type="text" value={establishmentName} onChange={e => setEstablishmentName(e.target.value)} placeholder="Ex. Club Nova, Festival Lumières…" />
                          </Field>
                          <Field label="Type d'établissement">
                            <Select value={typeEtablissement} onChange={e => setTypeEtablissement(e.target.value)} options={[
                              { value: '', label: '— Sélectionner —' },
                              { value: 'Club / Discothèque', label: 'Club / Discothèque' },
                              { value: 'Bar', label: 'Bar' },
                              { value: 'Festival', label: 'Festival' },
                              { value: 'Salle de concert', label: 'Salle de concert' },
                              { value: 'Agence événementielle', label: 'Agence événementielle' },
                              { value: 'Restaurant', label: 'Restaurant' },
                              { value: 'Association', label: 'Association' },
                              { value: 'Autre', label: 'Autre' },
                            ]} />
                          </Field>
                        </>
                      )}
                    </>
                  )}

                  <Field label="Ville (optionnel)">
                    <Input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Ex. Paris, Lyon, Marseille…" />
                  </Field>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/60 hover:bg-white/10 hover:text-white transition">
                      ← Retour
                    </button>
                    <SubmitButton loading={loading} label="Terminer →" />
                  </div>

                  <p className="text-center text-xs text-white/35">
                    Tu pourras compléter ton profil public dans tes paramètres.
                  </p>
                </form>
              )}

              {/* ─── ÉTAPE 4 : Confirmation email ─── */}
              {step === 4 && (
                <div className="space-y-5 py-2 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/25">
                    <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-xl font-black">Vérifie ton email !</h3>
                    <p className="mt-2 text-sm text-white/55">
                      Un email de confirmation t&apos;a été envoyé. Clique sur le lien pour activer ton compte avant de te connecter.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-left text-sm text-white/60 space-y-1.5">
                    <p>1. Ouvre ta boîte mail</p>
                    <p>2. Cherche un email de <span className="text-purple-400">noreply@lsbookers.com</span></p>
                    <p>3. Clique sur &quot;Confirmer mon email&quot;</p>
                    <p>4. Reviens ici pour te connecter</p>
                  </div>

                  <button
                    onClick={() => router.replace('/login')}
                    className="w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white transition hover:bg-purple-500 shadow-lg shadow-purple-900/30"
                  >
                    J&apos;ai confirmé → Se connecter
                  </button>

                  <p className="text-xs text-white/35">
                    Pas reçu l&apos;email ?{' '}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await fetch(`${API}/api/auth/resend-verification`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email }),
                          })
                        } catch {}
                        alert('Email renvoyé !')
                      }}
                      className="text-white/55 underline underline-offset-4 hover:text-white transition"
                    >
                      Renvoyer
                    </button>
                  </p>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
