'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-white/80">{label}</label>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-white placeholder-white/40 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-emerald-500/60"
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  const { options, ...rest } = props
  return (
    <div className="relative">
      <select
        {...rest}
        className="w-full appearance-none rounded-xl bg-white/5 px-4 py-2.5 pr-10 text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-emerald-500/60"
      >
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-neutral-900">
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">▾</span>
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
      {message}
    </div>
  )
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
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
// Barre de progression
// ─────────────────────────────────────────────
const STEPS = ['Compte', 'Identité', 'Profil', 'Prêt !']

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {STEPS.map((label, i) => {
          const stepNum = i + 1
          const done = stepNum < current
          const active = stepNum === current
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition
                  ${done ? 'bg-emerald-600 text-white' : active ? 'bg-emerald-600/30 ring-2 ring-emerald-500 text-white' : 'bg-white/10 text-white/40'}`}
              >
                {done ? '✓' : stepNum}
              </div>
              <span className={`hidden sm:block text-xs transition ${active ? 'text-white' : done ? 'text-emerald-400' : 'text-white/30'}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`absolute hidden`} />
              )}
            </div>
          )
        })}
      </div>
      {/* Ligne de progression */}
      <div className="relative mt-2 h-1 w-full rounded-full bg-white/10">
        <div
          className="h-1 rounded-full bg-emerald-600 transition-all duration-500"
          style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // ── Étape 1 ──
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<Role>('ARTIST')

  // ── Étape 2 ──
  const [pseudo, setPseudo] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [phone, setPhone] = useState('')
  const [countryOfResidence, setCountryOfResidence] = useState('France')

  // ── Étape 3 ──
  const [legalStatus, setLegalStatus] = useState<LegalStatus>('INDIVIDUAL')
  const [organizerType, setOrganizerType] = useState<OrganizerType>('INDIVIDUAL')
  const [establishmentName, setEstablishmentName] = useState('')
  const [typeEtablissement, setTypeEtablissement] = useState('')
  const [siret, setSiret] = useState('')
  const [city, setCity] = useState('')

  // ─────────────────────────────────────────────
  // Étape 1 : validation locale uniquement
  // ─────────────────────────────────────────────
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setStep(2)
  }

  // ─────────────────────────────────────────────
  // Étape 2 : navigation locale uniquement
  // ─────────────────────────────────────────────
  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStep(3)
  }

  // ─────────────────────────────────────────────
  // Étape 3 : unique appel API — crée le compte complet
  // ─────────────────────────────────────────────
  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await axios.post(
        `${API}/api/auth/register-complete`,
        {
          // Étape 1
          email, password, role,
          // Étape 2
          pseudo, firstName, lastName,
          dateOfBirth: dateOfBirth || undefined,
          phone: phone || undefined,
          countryOfResidence,
          // Étape 3
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
          setError(msg || "Échec de la création du compte.")
        }
      } else {
        setError("Erreur réseau.")
      }
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────
  // Rendu
  // ─────────────────────────────────────────────
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_#0b0b10_0%,_#050508_55%)] text-white">

      {/* Glows décoratifs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-28 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-[42rem] -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-[4rem] border border-white/5 bg-white/5 blur-2xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">

        {/* Panneau branding */}
        <aside className="hidden lg:flex flex-col justify-between border-r border-white/10">
          <div className="p-10">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/15 group-hover:ring-white/25 transition flex items-center justify-center">
                <span className="font-black text-lg tracking-widest">LS</span>
              </div>
              <div className="leading-tight">
                <p className="text-xl font-extrabold tracking-tight">Bookers</p>
                <p className="text-xs text-white/60">Plateforme de booking</p>
              </div>
            </Link>

            <div className="mt-12 space-y-5">
              <h1 className="text-4xl font-extrabold tracking-tight">
                Rejoins la scène,{' '}
                <span className="text-emerald-400">en quelques étapes.</span>
              </h1>
              <p className="max-w-md text-white/70">
                Crée ton compte et commence à publier, réserver et collaborer.
                Un environnement professionnel, moderne et pensé pour l&apos;événementiel.
              </p>

              <div className="mt-8 space-y-3 text-sm text-white/60">
                {["Réseau social dédié à l'événementiel", "Agenda & gestion des événements", "Contrats et paiements sécurisés"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-10">
            <p className="text-xs text-white/50">
              © {new Date().getFullYear()} LSBookers — Tous droits réservés.
            </p>
          </div>
        </aside>

        {/* Carte formulaire */}
        <main className="flex items-center justify-center p-6 lg:p-12">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">

            {/* En-tête */}
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Créer un compte</h2>
              <Link
                href="/"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                Retour
              </Link>
            </div>

            {step < 4 && (
              <p className="mb-5 text-sm text-white/65">
                Déjà un compte ?{' '}
                <Link href="/login" className="underline underline-offset-4 hover:text-white">
                  Se connecter
                </Link>
              </p>
            )}

            {/* Barre de progression */}
            <ProgressBar current={step} />

            {error && <ErrorBox message={error} />}

            {/* ─── ÉTAPE 1 : Compte ─── */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <Field label="Type de compte">
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'ARTIST', label: 'Artiste', desc: 'DJ, musicien, performer…' },
                      { value: 'ORGANIZER', label: 'Organisateur', desc: 'Club, festival, soirée privée…' },
                      { value: 'PROVIDER', label: 'Prestataire', desc: 'Photo, son, décoration…' },
                    ] as { value: Role; label: string; desc: string }[]).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRole(opt.value)}
                        className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center text-xs transition
                          ${role === opt.value
                            ? 'border-emerald-500 bg-emerald-500/15 text-white'
                            : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
                          }`}
                      >
                        <span className="font-semibold">{opt.label}</span>
                        <span className="text-white/50 leading-tight">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Email">
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="nom@domaine.com"
                  />
                </Field>

                <Field label="Mot de passe">
                  <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Au moins 8 caractères"
                  />
                </Field>

                <Field label="Confirmer le mot de passe">
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                </Field>

                <SubmitButton loading={loading} label="Continuer →" />

                <p className="text-center text-xs text-white/50">
                  En t&apos;inscrivant, tu acceptes nos{' '}
                  <Link href="/legal/terms" className="underline underline-offset-4 hover:text-white">
                    conditions d&apos;utilisation
                  </Link>.
                </p>
              </form>
            )}

            {/* ─── ÉTAPE 2 : Identité ─── */}
            {step === 2 && (
              <form onSubmit={handleStep2} className="space-y-4">
                <p className="text-sm text-white/60">
                  {role === 'ARTIST'
                    ? "Ces informations permettent de sécuriser ton compte et d'identifier ton profil."
                    : "Ces informations permettent d'identifier votre établissement et de respecter la réglementation."}
                </p>

                {/* Champ principal — adapté au rôle */}
                {role === 'ARTIST' ? (
                  <Field label="Pseudo / Nom de scène (visible sur ton profil)">
                    <Input
                      type="text"
                      value={pseudo}
                      onChange={e => setPseudo(e.target.value)}
                      required
                      placeholder="Ex. DJNova, MC Flash…"
                      pattern="[a-zA-Z0-9_.\-]{3,30}"
                      title="3 à 30 caractères : lettres, chiffres, tirets, underscores"
                    />
                    <p className="mt-1 text-xs text-white/40">Lettres, chiffres, tirets et underscores — 3 à 30 caractères.</p>
                  </Field>
                ) : role === 'ORGANIZER' ? (
                  <Field label="Nom de l&apos;établissement / Nom commercial">
                    <Input
                      type="text"
                      value={pseudo}
                      onChange={e => setPseudo(e.target.value)}
                      required
                      placeholder="Ex. ClubNova, FestivalLumieres…"
                      pattern="[a-zA-Z0-9_.\-]{3,30}"
                      title="3 à 30 caractères : lettres, chiffres, tirets, underscores"
                    />
                    <p className="mt-1 text-xs text-white/40">Ce nom apparaîtra sur votre profil public. Lettres, chiffres, tirets — 3 à 30 caractères.</p>
                  </Field>
                ) : (
                  <Field label="Nom commercial / Nom de votre activité" >
                    <Input
                      type="text"
                      value={pseudo}
                      onChange={e => setPseudo(e.target.value)}
                      required
                      placeholder="Ex. PhotoStudio94, SonPro…"
                      pattern="[a-zA-Z0-9_.\-]{3,30}"
                      title="3 à 30 caractères : lettres, chiffres, tirets, underscores"
                    />
                    <p className="mt-1 text-xs text-white/40">Ce nom apparaîtra sur votre profil public. Lettres, chiffres, tirets — 3 à 30 caractères.</p>
                  </Field>
                )}

                {/* Prénom / Nom — libellé adapté au rôle */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label={role === 'ARTIST' ? 'Prénom' : 'Prénom du responsable'}>
                    <Input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      required
                      autoComplete="given-name"
                      placeholder="Prénom"
                    />
                  </Field>
                  <Field label={role === 'ARTIST' ? 'Nom' : 'Nom du responsable'}>
                    <Input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      required
                      autoComplete="family-name"
                      placeholder="Nom"
                    />
                  </Field>
                </div>
                {role !== 'ARTIST' && (
                  <p className="text-xs text-white/40 -mt-2">
                    Utilisés uniquement pour la vérification légale et les paiements — non visibles publiquement.
                  </p>
                )}

                <Field label={role === 'ARTIST' ? 'Date de naissance (optionnel)' : 'Date de naissance du responsable (optionnel)'}>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    max={new Date(Date.now() - 13 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  />
                </Field>

                <Field label="Téléphone (optionnel)">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="+33 6 XX XX XX XX"
                  />
                </Field>

                <Field label="Pays">
                  <Select
                    value={countryOfResidence}
                    onChange={e => setCountryOfResidence(e.target.value)}
                    options={[
                      { value: 'France', label: 'France' },
                      { value: 'Belgique', label: 'Belgique' },
                      { value: 'Suisse', label: 'Suisse' },
                      { value: 'Luxembourg', label: 'Luxembourg' },
                      { value: 'Canada', label: 'Canada' },
                      { value: 'Autre', label: 'Autre' },
                    ]}
                  />
                </Field>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
                  >
                    ← Retour
                  </button>
                  <SubmitButton loading={loading} label="Continuer →" />
                </div>
              </form>
            )}

            {/* ─── ÉTAPE 3 : Profil légal ─── */}
            {step === 3 && (
              <form onSubmit={handleStep3} className="space-y-4">
                <p className="text-sm text-white/60">
                  Ces informations légales sont obligatoires pour utiliser les services de paiement.
                </p>

                {/* Statut légal */}
                <Field label="Ton statut">
                  <div className="space-y-2">
                    {([
                      { value: 'INDIVIDUAL', label: 'Particulier', desc: 'Tu agis à titre personnel.' },
                      { value: 'AUTO_ENTREPRENEUR', label: 'Auto-entrepreneur', desc: 'Tu as un numéro SIRET.' },
                      { value: 'COMPANY', label: 'Société / Association', desc: 'SARL, SAS, association…' },
                    ] as { value: LegalStatus; label: string; desc: string }[]).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setLegalStatus(opt.value)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition
                          ${legalStatus === opt.value
                            ? 'border-emerald-500 bg-emerald-500/15 text-white'
                            : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
                          }`}
                      >
                        <span className={`h-4 w-4 flex-shrink-0 rounded-full border-2 transition ${legalStatus === opt.value ? 'border-emerald-400 bg-emerald-400' : 'border-white/30'}`} />
                        <div>
                          <p className="text-sm font-medium">{opt.label}</p>
                          <p className="text-xs text-white/50">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </Field>

                {/* SIRET si auto-entrepreneur ou société */}
                {legalStatus !== 'INDIVIDUAL' && (
                  <Field label={legalStatus === 'COMPANY' ? 'Numéro SIRET / KBIS' : 'Numéro SIRET'}>
                    <Input
                      type="text"
                      value={siret}
                      onChange={e => setSiret(e.target.value)}
                      placeholder="Ex. 12345678900012"
                      maxLength={17}
                    />
                    <p className="mt-1 text-xs text-white/40">Ce numéro sera vérifié lors de l&apos;activation des paiements.</p>
                  </Field>
                )}

                {/* Champs spécifiques Organisateur */}
                {role === 'ORGANIZER' && (
                  <>
                    <Field label="Tu organises en tant que">
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { value: 'INDIVIDUAL', label: 'Particulier', desc: 'Soirée privée' },
                          { value: 'PROFESSIONAL', label: 'Professionnel', desc: 'Club, festival, agence…' },
                        ] as { value: OrganizerType; label: string; desc: string }[]).map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setOrganizerType(opt.value)}
                            className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs transition
                              ${organizerType === opt.value
                                ? 'border-emerald-500 bg-emerald-500/15 text-white'
                                : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                              }`}
                          >
                            <span className="font-semibold">{opt.label}</span>
                            <span className="text-white/50">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </Field>

                    {organizerType === 'PROFESSIONAL' && (
                      <>
                        <Field label="Nom de l&apos;établissement">
                          <Input
                            type="text"
                            value={establishmentName}
                            onChange={e => setEstablishmentName(e.target.value)}
                            placeholder="Ex. Club Nova, Festival Lumières…"
                          />
                        </Field>
                        <Field label="Type d&apos;établissement">
                          <Select
                            value={typeEtablissement}
                            onChange={e => setTypeEtablissement(e.target.value)}
                            options={[
                              { value: '', label: '— Sélectionner —' },
                              { value: 'Club / Discothèque', label: 'Club / Discothèque' },
                              { value: 'Bar', label: 'Bar' },
                              { value: 'Festival', label: 'Festival' },
                              { value: 'Salle de concert', label: 'Salle de concert' },
                              { value: 'Agence événementielle', label: 'Agence événementielle' },
                              { value: 'Restaurant', label: 'Restaurant' },
                              { value: 'Association', label: 'Association' },
                              { value: 'Autre', label: 'Autre' },
                            ]}
                          />
                        </Field>
                      </>
                    )}
                  </>
                )}

                <Field label="Ville (optionnel)">
                  <Input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Ex. Paris, Lyon, Marseille…"
                  />
                </Field>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
                  >
                    ← Retour
                  </button>
                  <SubmitButton loading={loading} label="Terminer →" />
                </div>

                <p className="text-center text-xs text-white/40">
                  Tu pourras compléter ton profil public dans tes paramètres.
                </p>
              </form>
            )}

            {/* ─── ÉTAPE 4 : Vérification email ─── */}
            {step === 4 && (
              <div className="space-y-5 py-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 ring-2 ring-amber-500/40">
                  <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-xl font-bold">Vérifie ton email !</h3>
                  <p className="mt-2 text-sm text-white/60">
                    Un email de confirmation t&apos;a été envoyé. Clique sur le lien pour activer ton compte avant de te connecter.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/70 space-y-1">
                  <p>1. Ouvre ta boîte mail</p>
                  <p>2. Cherche un email de <span className="text-emerald-400">noreply@lsbookers.com</span></p>
                  <p>3. Clique sur &quot;Confirmer mon email&quot;</p>
                  <p>4. Reviens ici pour te connecter</p>
                </div>

                <button
                  onClick={() => router.replace('/login')}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-500"
                >
                  J&apos;ai confirmé → Se connecter
                </button>

                <p className="text-xs text-white/40">
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
                    className="text-white/60 underline underline-offset-4 hover:text-white"
                  >
                    Renvoyer
                  </button>
                </p>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}
