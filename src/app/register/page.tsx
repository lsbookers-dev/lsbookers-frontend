'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import axios, { isAxiosError } from 'axios'
import { apiUrl } from '@/utils/api'
import { Eye, EyeOff, Check, Loader2, Sparkles, Mic2, User, FileText, Gift } from 'lucide-react'
import CityAutocomplete from '@/components/CityAutocomplete'

// ─── Types ───────────────────────────────────────────────────────────────────
type Role = 'ARTIST' | 'ORGANIZER' | 'PROVIDER'
type LegalType = 'INDIVIDUAL' | 'PROFESSIONAL'
type Plan = 'MONTHLY' | 'YEARLY'
type PseudoStatus = 'idle' | 'checking' | 'available' | 'taken'
type SiretStatus  = 'idle' | 'checking' | 'valid' | 'invalid'

// ─── Spécialités ─────────────────────────────────────────────────────────────
const SPECIALTIES: Record<Role, string[]> = {
  ARTIST: [
    'Acrobate','Accordéoniste','Animateur','Artiste de cirque','Bassiste','Batteur',
    'Chanteur(se)','Chorale','Clown','Comédien','Cracheur de feu','Danseur LED',
    'Danseur(se)','DJ','Échassier','Fanfare','Graffeur','Groupe','Groupe de danse',
    'Guitariste','Humoriste','Hypnotiseur','Imitateur','Influenceur / Créateur de contenu',
    'Jongleur','Magicien','Maître de cérémonie','Mentaliste','Mime','Orchestre',
    'Peintre Live','Percussionniste','Performer','Pianiste','Présentateur','Saxophoniste',
    'Sculpteur Live','Speed Painter','Stand-upper','Streamer','Trompettiste',
    'Violoncelliste','Violoniste',
  ],
  ORGANIZER: [
    'Agence événementielle','Anniversaire','Arena','Association','Baptême','Bar',
    'Beach Club','Camping','Casino','Centre commercial','Centre culturel','Château',
    'Collectivité','Comité des fêtes','Congrès','Discothèque / Club','Domaine',
    'Entreprise / CE','Événement sportif','Festival','Gala','Hôtel',
    'Lancement de produit','Mairie','Mariage','Organisateur de soirées',
    'Palais des congrès',"Parc d'attractions",'Plage privée','Pub','Restaurant',
    'Rooftop','Salle de réception','Salle de spectacle','Salle des fêtes',
    'Salon professionnel','Séminaire','Soirée étudiante','Soirée privée','Théâtre',
    'Village vacances','Wedding Planner','Zénith',
  ],
  PROVIDER: [
    'Arche de cérémonie','Baby-sitter événementielle','Ballons','Barman','Borne 360°',
    'Cake Designer','Chauffeur privé','Chef à domicile','Coiffeur',"Contrôle d'accès",
    'Costumier','Décorateur','Designer événementiel','DJ Tech','Drone','Éclairagiste',
    'Effets spéciaux','Fleuriste','Food Truck','Glacier',"Hôtesse d'accueil",
    'Location de matériel','Location de sonorisation','Location limousine',
    'Location lumière','Location mobilier','Location scène','Location vaisselle',
    'Location véhicules','Maquilleur','Monteur vidéo','Nettoyage','Pâtissier',
    'Photographe','Photobooth','Pyrotechnicien','Régisseur','Régisseur général',
    'Régisseur plateau','Retouche photo','Scène','Sécurité','Serveur','Serveuse',
    'Signalétique','Sommelier','Sonorisateur','Structure','Styliste',
    'Technicien audiovisuel','Technicien lumière','Technicien son','Traiteur',
    'Transport de matériel','Vidéaste','Vidéoprojection','Voiturier',
  ],
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────
function inputCls(extra = '') {
  return `w-full rounded-xl bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-violet-500/60 ${extra}`
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-white/75">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-white/35">{hint}</p>}
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

function PrimaryBtn({ loading, label, disabled }: { loading?: boolean; label: string; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50 shadow-lg shadow-violet-900/30"
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />Chargement…
        </span>
      ) : label}
    </button>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/60 hover:bg-white/10 hover:text-white transition"
    >
      ← Retour
    </button>
  )
}

// ─── Barre de progression ─────────────────────────────────────────────────────
const STEPS = ['Compte', 'Profil', 'Identité', 'Statut', 'Offre']

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="mb-6">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 right-0 top-3.5 h-0.5 bg-white/10 -z-0" />
        <div
          className="absolute left-0 top-3.5 h-0.5 bg-violet-500 transition-all duration-500 -z-0"
          style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((label, i) => {
          const n = i + 1
          const done   = n < current
          const active = n === current
          return (
            <div key={i} className="flex flex-col items-center gap-1.5 z-10">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all
                ${done   ? 'bg-violet-600 text-white ring-2 ring-violet-500/30'
                : active ? 'bg-[#1a1525] text-white ring-2 ring-violet-500'
                :          'bg-[#1a1525] text-white/35 ring-1 ring-white/10'}`}>
                {done ? <Check className="h-3.5 w-3.5" /> : n}
              </div>
              <span className={`hidden sm:block text-[10px] font-medium transition
                ${active ? 'text-white' : done ? 'text-violet-400' : 'text-white/30'}`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Panneau gauche ───────────────────────────────────────────────────────────
const BRANDING: { icon: React.ReactNode; title: string; subtitle: string; items: string[] }[] = [
  {
    icon: <Sparkles className="h-7 w-7 text-violet-400" />,
    title: 'Rejoins la scène.',
    subtitle: 'Crée ton compte en quelques minutes et rejoins le réseau événementiel de référence.',
    items: ['Réseau social dédié à l\'événementiel', 'Agenda & gestion des événements', 'Offres d\'emploi & mise en relation'],
  },
  {
    icon: <Mic2 className="h-7 w-7 text-violet-400" />,
    title: 'Ton activité.',
    subtitle: 'Choisis ton rôle et sélectionne tes spécialités pour que les organisateurs te trouvent.',
    items: ['Artiste, organisateur ou prestataire', 'Spécialités visibles sur ton profil', 'Modifier à tout moment dans les réglages'],
  },
  {
    icon: <User className="h-7 w-7 text-violet-400" />,
    title: 'Qui es-tu ?',
    subtitle: 'Ces informations créent ton profil public et sécurisent ton compte.',
    items: ['Ton pseudo sera visible sur ton profil', 'Tes données personnelles restent privées', 'Tout peut être modifié après inscription'],
  },
  {
    icon: <FileText className="h-7 w-7 text-violet-400" />,
    title: 'Ton statut.',
    subtitle: 'Nécessaire pour activer les fonctionnalités de facturation sur la plateforme.',
    items: ['Particulier ou professionnel', 'SIRET vérifié en temps réel', 'Informations sécurisées et chiffrées'],
  },
  {
    icon: <Gift className="h-7 w-7 text-violet-400" />,
    title: '3 mois gratuits.',
    subtitle: 'Choisis ta formule et profite de 3 mois d\'essai complet — sans engagement.',
    items: ['Aucun prélèvement pendant l\'essai', '2 mois offerts sur la formule annuelle', '-20% sur les prestations avec le plan annuel'],
  },
]

function BrandingPanel({ step, logoUrl }: { step: number; logoUrl?: string | null }) {
  const content = BRANDING[Math.min(step - 1, BRANDING.length - 1)]
  return (
    <aside className="hidden lg:flex flex-col justify-between border-r border-white/8">
      <div className="p-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          {logoUrl ? (
            <Image src={logoUrl} alt="LSBookers" width={180} height={46} className="object-contain h-11 w-auto" unoptimized />
          ) : (
            <>
              <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/15 group-hover:ring-white/30 transition flex items-center justify-center">
                <span className="font-black text-base tracking-widest">LS</span>
              </div>
              <div className="leading-tight">
                <p className="text-lg font-extrabold tracking-tight">LSBookers</p>
                <p className="text-[10px] text-white/50 tracking-widest uppercase">Réseau événementiel</p>
              </div>
            </>
          )}
        </Link>

        <div className="mt-12 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            {content.icon}
          </div>
          <h1 className="text-3xl font-black tracking-tight leading-tight">{content.title}</h1>
          <p className="text-white/55 text-sm max-w-xs leading-relaxed">{content.subtitle}</p>
          <ul className="mt-6 space-y-3">
            {content.items.map(item => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-white/60">
                <span className="text-violet-400 mt-0.5 flex-shrink-0">✦</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex items-center gap-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-500
              ${i + 1 === step ? 'w-8 bg-violet-500' : i + 1 < step ? 'w-4 bg-violet-500/50' : 'w-4 bg-white/15'}`}
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

// ─── Composant Tag ────────────────────────────────────────────────────────────
const MAX_SPECIALTIES = 20

function TagSelector({ options, selected, onChange }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void
}) {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter(t => t !== tag))
    } else if (selected.length < MAX_SPECIALTIES) {
      onChange([...selected, tag])
    }
  }
  const atLimit = selected.length >= MAX_SPECIALTIES
  return (
    <div className="space-y-2">
      {atLimit && (
        <p className="text-xs text-amber-400/80">Maximum {MAX_SPECIALTIES} spécialités atteint.</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map(tag => {
          const isSelected = selected.includes(tag)
          const isDisabled = !isSelected && atLimit
          return (
            <button key={tag} type="button" onClick={() => toggle(tag)} disabled={isDisabled}
              className={`rounded-full px-3 py-1 text-xs font-medium transition border
                ${isSelected
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : isDisabled
                    ? 'bg-white/[0.02] border-white/5 text-white/20 cursor-not-allowed'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25 hover:text-white/80'}`}>
              {tag}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter()
  const DEFAULT_BG = 'https://res.cloudinary.com/dzpie6sij/image/upload/v1755121809/Landing_fz7zqx.png'
  const [bgUrl, setBgUrl] = useState(DEFAULT_BG)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  useEffect(() => {
    fetch(apiUrl('admin/settings')).then(r => r.json())
      .then(d => {
        if (d?.registerBgUrl) setBgUrl(d.registerBgUrl)
        if (d?.landingLogoUrl) setLogoUrl(d.landingLogoUrl)
      })
      .catch(() => {})
  }, [])

  const [step, setStep]     = useState(1)
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // ── Étape 1 : Compte ──
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirmPwd, setConfirmPwd]   = useState('')
  const [showPwd, setShowPwd]         = useState(false)
  const [showCfm, setShowCfm]         = useState(false)

  // ── Étape 2 : Profil ──
  const [role, setRole]               = useState<Role | null>(null)
  const [specialties, setSpecialties] = useState<string[]>([])

  // ── Étape 3 : Identité ──
  const [pseudo, setPseudo]                     = useState('')
  const [firstName, setFirstName]               = useState('')
  const [lastName, setLastName]                 = useState('')
  const [dateOfBirth, setDateOfBirth]           = useState('')
  const [country, setCountry]                   = useState('France')
  const [city, setCity]                         = useState('')
  const [phone, setPhone]                       = useState('')
  const [pseudoStatus, setPseudoStatus]         = useState<PseudoStatus>('idle')
  const [isAdult, setIsAdult]                   = useState(false)

  // ── Étape 4 : Statut ──
  const [legalType, setLegalType]   = useState<LegalType | null>(null)
  const [siret, setSiret]           = useState('')
  const [siretStatus, setSiretStatus] = useState<SiretStatus>('idle')
  const [siretName, setSiretName]   = useState('')

  // ── Étape 5 : Offre ──
  const [plan, setPlan]             = useState<Plan>('YEARLY')
  const [promoCode, setPromoCode]   = useState('')

  // ── Helpers ──
  const go = (n: number) => { setStep(n); setError(null) }

  const trialEnd = new Date()
  trialEnd.setMonth(trialEnd.getMonth() + 3)
  const trialEndStr = trialEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  // Vérification pseudo
  const checkPseudo = useCallback(async (value: string) => {
    if (!value || value.trim().length < 3) { setPseudoStatus('idle'); return }
    setPseudoStatus('checking')
    try {
      const res = await fetch(`${apiUrl('auth/check-pseudo')}?pseudo=${encodeURIComponent(value.trim())}`)
      const d = await res.json()
      setPseudoStatus(d.available ? 'available' : 'taken')
    } catch { setPseudoStatus('idle') }
  }, [])

  // Vérification SIRET
  const checkSiret = async () => {
    const raw = siret.replace(/\s/g, '')
    if (raw.length !== 14) { setSiretStatus('invalid'); return }
    setSiretStatus('checking')
    try {
      const res = await fetch(`${apiUrl('auth/validate-siret')}?siret=${raw}`)
      const d = await res.json()
      if (d.valid) { setSiretStatus('valid'); setSiretName(d.companyName || '') }
      else { setSiretStatus('invalid'); setSiretName('') }
    } catch { setSiretStatus('invalid') }
  }

  // ── Soumission finale (étape 5) ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdult) { setError('Tu dois certifier être majeur pour t\'inscrire.'); return }
    if (!role) { setError('Rôle manquant.'); return }
    setError(null); setLoading(true)
    try {
      await axios.post(
        apiUrl('auth/register-complete'),
        {
          email, password, role,
          pseudo, firstName, lastName,
          dateOfBirth: dateOfBirth || undefined,
          phone: phone || undefined,
          countryOfResidence: country,
          legalStatus: legalType === 'PROFESSIONAL' ? 'COMPANY' : 'INDIVIDUAL',
          organizerType: role === 'ORGANIZER' ? (legalType === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'INDIVIDUAL') : undefined,
          siret: legalType === 'PROFESSIONAL' ? siret.replace(/\s/g, '') : undefined,
          city: city || undefined,
          specialties: specialties.length > 0 ? specialties : undefined,
        },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      )
      go(6)
    } catch (err) {
      if (isAxiosError(err)) {
        const msg = err.response?.data?.error
        if (err.response?.status === 400 && msg?.includes('inscrit')) {
          setError('Un compte existe déjà avec cet email. Retourne à l\'étape 1.')
        } else if (err.response?.status === 409) {
          setError('Ce pseudo est déjà utilisé. Retourne à l\'étape 3.')
        } else if (err.response?.status === 429) {
          setError('Trop de tentatives. Réessaye dans 5 minutes.')
        } else {
          setError(msg || 'Échec de la création du compte.')
        }
      } else { setError('Erreur réseau.') }
    } finally { setLoading(false) }
  }

  // ── Handlers de navigation ──
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    if (password !== confirmPwd) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    go(2)
  }

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    if (!role) { setError('Choisis un type de profil pour continuer.'); return }
    go(3)
  }

  const handleStep3 = (e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    if (pseudoStatus === 'taken') { setError('Ce pseudo est déjà utilisé.'); return }
    go(4)
  }

  const handleStep4 = (e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    if (!legalType) { setError('Choisis ton statut pour continuer.'); return }
    if (legalType === 'PROFESSIONAL') {
      if (siret.replace(/\s/g, '').length !== 14) { setError('Le numéro SIRET doit contenir 14 chiffres.'); return }
      if (siretStatus === 'invalid') { setError('SIRET invalide ou introuvable. Vérifie le numéro.'); return }
      if (siretStatus === 'idle' || siretStatus === 'checking') { setError('Vérifie ton numéro SIRET avant de continuer.'); return }
    }
    go(5)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white" style={{ background: '#0c0a14' }}>
      <Image src={bgUrl} alt="LSBookers" fill priority sizes="100vw" className="z-0 object-cover" />
      <div className="absolute inset-0 z-10 bg-black/60" />
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute -top-32 -left-28 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-pink-500/15 blur-3xl" />
      </div>

      <div className="relative z-20 mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">
        {step <= 5 && <BrandingPanel step={step} logoUrl={logoUrl} />}

        <main className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">

            {/* Logo mobile */}
            {step <= 5 && (
              <div className="lg:hidden flex items-center gap-3 mb-8">
                <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/15 flex items-center justify-center">
                  <span className="font-black text-sm tracking-widest">LS</span>
                </div>
                <span className="font-extrabold text-base">LSBookers</span>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-7 shadow-2xl">

              {/* En-tête */}
              {step <= 5 && (
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black">Créer un compte</h2>
                    <p className="text-sm text-white/45 mt-0.5">
                      Déjà inscrit ?{' '}
                      <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition">Se connecter</Link>
                    </p>
                  </div>
                  {step === 1 ? (
                    <Link href="/" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition">
                      ← Retour
                    </Link>
                  ) : (
                    <button type="button" onClick={() => go(step - 1)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition">
                      ← Retour
                    </button>
                  )}
                </div>
              )}

              {step <= 5 && <ProgressBar current={step} />}
              {error && <div className="mb-4"><ErrorBox message={error} /></div>}

              {/* ── ÉTAPE 1 : Compte ────────────────────────────────────────── */}
              {step === 1 && (
                <form onSubmit={handleStep1} className="space-y-4">
                  <Field label="Email">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">✉️</span>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        required autoComplete="email" placeholder="nom@domaine.com"
                        className={inputCls('pl-10')} />
                    </div>
                  </Field>

                  <Field label="Mot de passe">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">🔒</span>
                      <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                        required autoComplete="new-password" placeholder="Au moins 8 caractères"
                        className={inputCls('pl-10 pr-10')} />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>

                  <Field label="Confirmer le mot de passe">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">🔒</span>
                      <input type={showCfm ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                        required autoComplete="new-password" placeholder="••••••••"
                        className={inputCls('pl-10 pr-10')} />
                      <button type="button" onClick={() => setShowCfm(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                        {showCfm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>

                  <PrimaryBtn loading={loading} label="Continuer →" />
                  <p className="text-center text-xs text-white/35">
                    En t&apos;inscrivant, tu acceptes nos{' '}
                    <Link href="/legal/terms" className="underline underline-offset-4 hover:text-white transition">conditions d&apos;utilisation</Link>.
                  </p>
                </form>
              )}

              {/* ── ÉTAPE 2 : Profil (rôle + spécialités) ───────────────────── */}
              {step === 2 && (
                <form onSubmit={handleStep2} className="space-y-5">
                  <p className="text-sm text-white/50 -mt-1">Sélectionne ton type d&apos;activité, puis tes spécialités.</p>

                  {/* Cartes rôle */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {([
                      { value: 'ARTIST' as Role,    label: 'Artiste',      icon: '🎤', desc: 'DJ, musicien, performer…' },
                      { value: 'ORGANIZER' as Role,  label: 'Organisateur', icon: '🎪', desc: 'Club, festival, soirée…' },
                      { value: 'PROVIDER' as Role,   label: 'Prestataire',  icon: '📸', desc: 'Photo, son, déco…' },
                    ]).map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => { setRole(opt.value); setSpecialties([]) }}
                        className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition
                          ${role === opt.value
                            ? 'border-violet-500 bg-violet-500/15 shadow-lg shadow-violet-900/20'
                            : 'border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/[0.06]'}`}>
                        <span className="text-3xl">{opt.icon}</span>
                        <span className={`font-semibold text-xs ${role === opt.value ? 'text-white' : 'text-white/70'}`}>{opt.label}</span>
                        <span className="text-[10px] text-white/35 leading-tight">{opt.desc}</span>
                        {role === opt.value && (
                          <span className="mt-1 rounded-full bg-violet-500 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wide">Sélectionné</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Spécialités — apparaissent après sélection du rôle */}
                  {role && (
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white/80">Tes spécialités <span className="text-white/30 font-normal">(optionnel)</span></p>
                        </div>
                        {specialties.length > 0 && (
                          <span className="rounded-full bg-violet-500/20 border border-violet-400/30 px-2 py-0.5 text-[10px] text-violet-200 font-medium flex-shrink-0">
                            {specialties.length} ✓
                          </span>
                        )}
                      </div>
                      <div className="max-h-28 overflow-y-auto pr-1 scrollbar-thin">
                        <TagSelector options={SPECIALTIES[role]} selected={specialties} onChange={setSpecialties} />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <BackBtn onClick={() => go(1)} />
                    <PrimaryBtn loading={loading} label="Continuer →" />
                  </div>
                </form>
              )}

              {/* ── ÉTAPE 3 : Identité ───────────────────────────────────────── */}
              {step === 3 && (
                <form onSubmit={handleStep3} className="space-y-4">
                  <p className="text-sm text-white/50 -mt-1">Ces informations créent ton profil public.</p>

                  {/* Pseudo */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-white/75">
                        {role === 'ARTIST' ? 'Pseudo / Nom de scène' : role === 'ORGANIZER' ? "Nom de l'établissement" : 'Nom commercial'}
                      </label>
                      {pseudoStatus === 'checking' && <span className="text-xs text-white/40">Vérification…</span>}
                      {pseudoStatus === 'available' && <span className="text-xs text-emerald-400">✓ Disponible</span>}
                      {pseudoStatus === 'taken'     && <span className="text-xs text-red-400">✗ Déjà utilisé</span>}
                    </div>
                    <input
                      type="text" value={pseudo}
                      onChange={e => { setPseudo(e.target.value); setPseudoStatus('idle') }}
                      onBlur={e => checkPseudo(e.target.value)}
                      required placeholder={role === 'ARTIST' ? 'Ex. DJ Nova, MC Flash…' : 'Ex. Club Nova, Festival Lumières…'}
                      pattern="[a-zA-Z0-9_ .\-]{3,30}" title="3 à 30 caractères"
                      className={inputCls(`${pseudoStatus === 'available' ? 'ring-emerald-500/50' : pseudoStatus === 'taken' ? 'ring-red-500/50' : ''}`)}
                    />
                    <p className="mt-1 text-xs text-white/35">Lettres, chiffres, espaces, tirets — 3 à 30 caractères.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Prénom">
                      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                        required autoComplete="given-name" placeholder="Prénom" className={inputCls()} />
                    </Field>
                    <Field label="Nom">
                      <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                        required autoComplete="family-name" placeholder="Nom" className={inputCls()} />
                    </Field>
                  </div>

                  <Field label="Date de naissance" hint="Optionnel — doit être le 18 ans ou plus.">
                    <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}
                      max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      className={inputCls()} />
                  </Field>

                  <Field label="Pays">
                    <div className="relative">
                      <select value={country} onChange={e => setCountry(e.target.value)}
                        className="w-full appearance-none rounded-xl bg-white/5 px-4 py-2.5 pr-10 text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-violet-500/60">
                        {['France','Belgique','Suisse','Luxembourg','Canada','Autre'].map(c => (
                          <option key={c} value={c} className="bg-neutral-900">{c}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">▾</span>
                    </div>
                  </Field>

                  <Field label="Ville" hint="Optionnel.">
                    <CityAutocomplete value={city} onChange={setCity} placeholder="Ex. Paris, Lyon, Marseille…" />
                  </Field>

                  <Field label="Téléphone" hint="Optionnel.">
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      autoComplete="tel" placeholder="+33 6 XX XX XX XX" className={inputCls()} />
                  </Field>

                  {/* Case majorité */}
                  <label htmlFor="is-adult" className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5 flex-shrink-0">
                      <input
                        id="is-adult"
                        type="checkbox"
                        checked={isAdult}
                        onChange={e => setIsAdult(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition
                        ${isAdult ? 'border-violet-500 bg-violet-600' : 'border-white/25 bg-white/5 group-hover:border-white/40'}`}>
                        {isAdult && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </div>
                    <span className="text-xs text-white/55 leading-relaxed">
                      Je certifie avoir <strong className="text-white/75">18 ans ou plus</strong> et être autorisé à m&apos;inscrire sur cette plateforme.
                    </span>
                  </label>

                  <div className="flex gap-3">
                    <BackBtn onClick={() => go(2)} />
                    <PrimaryBtn loading={loading} label="Continuer →" disabled={!isAdult} />
                  </div>
                </form>
              )}

              {/* ── ÉTAPE 4 : Statut légal ───────────────────────────────────── */}
              {step === 4 && (
                <form onSubmit={handleStep4} className="space-y-4">
                  <p className="text-sm text-white/50 -mt-1">Nécessaire pour activer les fonctionnalités de facturation.</p>

                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: 'INDIVIDUAL' as LegalType,   label: 'Particulier',    icon: '👤', desc: 'Tu agis à titre personnel.' },
                      { value: 'PROFESSIONAL' as LegalType, label: 'Professionnel',  icon: '🏢', desc: 'Auto-entrepreneur, société…' },
                    ]).map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => { setLegalType(opt.value); setSiretStatus('idle'); setSiretName('') }}
                        className={`flex flex-col items-center gap-2.5 rounded-2xl border p-5 text-center transition
                          ${legalType === opt.value
                            ? 'border-violet-500 bg-violet-500/15 shadow-lg shadow-violet-900/20'
                            : 'border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/[0.06]'}`}>
                        <span className="text-3xl">{opt.icon}</span>
                        <span className={`font-semibold text-sm ${legalType === opt.value ? 'text-white' : 'text-white/70'}`}>{opt.label}</span>
                        <span className="text-[11px] text-white/40 leading-tight">{opt.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* SIRET — apparaît si Professionnel */}
                  {legalType === 'PROFESSIONAL' && (
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-sm font-semibold text-white/80">Numéro SIRET / KBIS</p>
                      <div className="flex gap-2">
                        <input
                          type="text" value={siret}
                          onChange={e => { setSiret(e.target.value); setSiretStatus('idle'); setSiretName('') }}
                          placeholder="14 chiffres — ex. 12345678900012"
                          maxLength={17}
                          className={inputCls(`flex-1 ${siretStatus === 'valid' ? 'ring-emerald-500/50' : siretStatus === 'invalid' ? 'ring-red-500/50' : ''}`)}
                        />
                        <button type="button" onClick={checkSiret} disabled={siretStatus === 'checking'}
                          className="flex-shrink-0 rounded-xl border border-violet-500/40 bg-violet-500/15 px-4 py-2.5 text-sm text-violet-200 hover:bg-violet-500/25 transition disabled:opacity-50">
                          {siretStatus === 'checking' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Vérifier'}
                        </button>
                      </div>
                      {siretStatus === 'valid' && (
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2">
                          <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                          <p className="text-xs text-emerald-300">{siretName || 'SIRET vérifié et valide'}</p>
                        </div>
                      )}
                      {siretStatus === 'invalid' && (
                        <p className="text-xs text-red-400">SIRET introuvable dans le registre officiel. Vérifie le numéro.</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <BackBtn onClick={() => go(3)} />
                    <PrimaryBtn loading={loading} label="Continuer →" />
                  </div>
                </form>
              )}

              {/* ── ÉTAPE 5 : Offre / Abonnement ─────────────────────────────── */}
              {step === 5 && (
                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Message essai gratuit */}
                  <div className="flex items-center gap-3 rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-3">
                    <span className="text-lg flex-shrink-0">🎁</span>
                    <p className="text-xs text-violet-200 leading-relaxed">
                      <strong>3 mois d&apos;essai gratuit</strong> — aucun prélèvement avant le <strong>{trialEndStr}</strong>.
                    </p>
                  </div>

                  {/* Cartes plans */}
                  <div className="space-y-3">
                    {/* Plan annuel — recommandé */}
                    <button type="button" onClick={() => setPlan('YEARLY')}
                      className={`relative w-full text-left rounded-2xl border p-4 transition
                        ${plan === 'YEARLY'
                          ? 'border-violet-500 bg-violet-500/15 shadow-lg shadow-violet-900/20'
                          : 'border-white/10 bg-white/4 hover:border-white/20'}`}>
                      <div className="absolute -top-2.5 left-4">
                        <span className="rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide shadow">
                          Recommandé
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-3 mt-1">
                        <div>
                          <p className={`font-semibold text-sm ${plan === 'YEARLY' ? 'text-white' : 'text-white/70'}`}>Formule annuelle</p>
                          <p className="text-xs text-white/40 mt-0.5">8,33 € / mois facturé annuellement</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-black text-lg ${plan === 'YEARLY' ? 'text-white' : 'text-white/60'}`}>99,90 €</p>
                          <p className="text-[10px] text-white/35">par an</p>
                        </div>
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {[
                          'Accès complet à toute la plateforme',
                          'Messagerie & bookings illimités',
                          'Agenda professionnel & offres',
                          '2 mois offerts (économisez 23,98 €)',
                          '-20 % sur les prestations réservées via LSBookers',
                        ].map(f => (
                          <li key={f} className="flex items-center gap-2 text-xs text-white/60">
                            <Check className={`h-3 w-3 flex-shrink-0 ${plan === 'YEARLY' ? 'text-violet-400' : 'text-white/30'}`} />
                            <span className={f.includes('2 mois') || f.includes('-20') ? 'text-violet-200 font-medium' : ''}>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </button>

                    {/* Plan mensuel */}
                    <button type="button" onClick={() => setPlan('MONTHLY')}
                      className={`w-full text-left rounded-2xl border p-4 transition
                        ${plan === 'MONTHLY'
                          ? 'border-violet-500 bg-violet-500/15 shadow-lg shadow-violet-900/20'
                          : 'border-white/10 bg-white/4 hover:border-white/20'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`font-semibold text-sm ${plan === 'MONTHLY' ? 'text-white' : 'text-white/70'}`}>Formule mensuelle</p>
                          <p className="text-xs text-white/40 mt-0.5">Sans engagement — résiliable à tout moment</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-black text-lg ${plan === 'MONTHLY' ? 'text-white' : 'text-white/60'}`}>9,99 €</p>
                          <p className="text-[10px] text-white/35">par mois</p>
                        </div>
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {[
                          'Accès complet à toute la plateforme',
                          'Messagerie & bookings illimités',
                          'Agenda professionnel & offres',
                          'Support prioritaire',
                        ].map(f => (
                          <li key={f} className="flex items-center gap-2 text-xs text-white/60">
                            <Check className={`h-3 w-3 flex-shrink-0 ${plan === 'MONTHLY' ? 'text-violet-400' : 'text-white/30'}`} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  </div>

                  {/* Code promo */}
                  <Field label="Code promo" hint="Optionnel — sera appliqué à ton premier prélèvement.">
                    <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Ex. LSBOOKERS2026" className={inputCls('tracking-widest font-mono')} />
                  </Field>

                  <div className="flex gap-3">
                    <BackBtn onClick={() => go(4)} />
                    <PrimaryBtn loading={loading} label="Créer mon compte →" />
                  </div>

                  <p className="text-center text-xs text-white/30 leading-relaxed">
                    Aucune CB requise pour l&apos;essai. Après les 3 mois, tu seras invité à choisir ton moyen de paiement.
                  </p>
                </form>
              )}

              {/* ── ÉTAPE 6 : Confirmation email ─────────────────────────────── */}
              {step === 6 && (
                <div className="space-y-5 py-2">
                  <div className="text-center space-y-3">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/25">
                      <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-black">Vérifie ton email !</h3>
                      <p className="mt-2 text-sm text-white/55 max-w-xs mx-auto">
                        Un email de confirmation a été envoyé à <strong className="text-white/70">{email}</strong>. Clique sur le lien pour activer ton compte.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white/60 space-y-1.5">
                    <p>1. Ouvre ta boîte mail</p>
                    <p>2. Cherche un email de <span className="text-violet-400">noreply@lsbookers.com</span></p>
                    <p>3. Clique sur <strong>&quot;Confirmer mon email&quot;</strong></p>
                    <p>4. Reviens ici pour te connecter</p>
                  </div>

                  <button onClick={() => router.replace('/login')}
                    className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-500 shadow-lg shadow-violet-900/30">
                    J&apos;ai confirmé → Se connecter
                  </button>

                  <p className="text-center text-xs text-white/35">
                    Pas reçu l&apos;email ?{' '}
                    <button type="button"
                      onClick={async () => {
                        try { await fetch(apiUrl('auth/resend-verification'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }) } catch {}
                        alert('Email renvoyé !')
                      }}
                      className="text-white/55 underline underline-offset-4 hover:text-white transition">
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
