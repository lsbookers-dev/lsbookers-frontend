'use client'

import { apiFetch } from '@/utils/auth'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import axios, { isAxiosError } from 'axios'
import { apiUrl } from '@/utils/api'
import { usePublicSettings } from '@/context/PublicSettingsContext'
import { PUBLIC_IMAGE_BLUR } from '@/lib/publicSettings.shared'
import { Eye, EyeOff, Check, Loader2, Sparkles, Mic2, User, FileText, Gift, Mail, Lock, CalendarDays, Building2, ChefHat, Users, Search } from 'lucide-react'
import { SPECIALTIES_BY_ROLE } from '@/constants/specialties'
import LsIcon, { LsBullet } from '@/components/ui/LsIcon'
import CityAutocomplete from '@/components/CityAutocomplete'
import PublicBrand from '@/components/PublicBrand'

// ─── Types ───────────────────────────────────────────────────────────────────
type Role = 'ARTIST' | 'ORGANIZER' | 'PROVIDER'
type LegalType = 'INDIVIDUAL' | 'INTERMITTENT' | 'PROFESSIONAL'
type Plan = 'FREE' | 'PRO' | 'AGENCY'
type SignupPrices = { prices: Record<string, { monthCents: number; yearCents: number }>; agency?: { monthCents: number; yearCents: number; includedProfiles: number; extraMonthCents: number; extraYearCents: number }; trialDays: number; limits: { applicationsPerMonth: number; bookingRequestsPerMonth: number }; commission: { freePct: number; proPct: number } }
const formatPrice = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: cents % 100 ? 2 : 0 })
type PseudoStatus = 'idle' | 'checking' | 'available' | 'taken'
type SiretStatus  = 'idle' | 'checking' | 'valid' | 'invalid'

// ─── Étape 2 : « Que fais-tu ? » ─────────────────────────────────────────────
// Recherche par métier (le rôle est déduit tout seul) ou une des 4 phrases.
const SPECIALTIES = SPECIALTIES_BY_ROLE as Record<Role, string[]>
const AGENCY_SPECIALTY = 'Agence artistique / booking'
const VENUES_SPECIALTY = 'Groupe de lieux'
const ROLE_LABEL: Record<Role, string> = { ARTIST: 'Artiste', PROVIDER: 'Prestataire', ORGANIZER: 'Organisateur' }

type Path = 'PERFORM' | 'SERVICE' | 'HOST' | 'MULTI'
type Multi = 'ARTISTS' | 'VENUES'
const PATHS: { value: Path; role: Role; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'PERFORM', role: 'ARTIST',    label: 'Je me produis',                         desc: 'Musicien, DJ, danseur, magicien…',      icon: <Mic2 className="h-5 w-5 text-violet-400" /> },
  { value: 'SERVICE', role: 'PROVIDER',  label: 'Je propose un service',                 desc: 'Traiteur, photo, son, déco, sécurité…', icon: <ChefHat className="h-5 w-5 text-violet-400" /> },
  { value: 'HOST',    role: 'ORGANIZER', label: 'J’accueille ou j’organise des événements', desc: 'Salle, club, festival, mariage, mairie…', icon: <CalendarDays className="h-5 w-5 text-violet-400" /> },
  { value: 'MULTI',   role: 'ORGANIZER', label: 'Je gère plusieurs profils',             desc: 'Agent d’artistes, plusieurs salles',    icon: <Users className="h-5 w-5 text-violet-400" /> },
]
const MULTI_CHOICES: { value: Multi; label: string; desc: string; specialty: string; icon: React.ReactNode }[] = [
  { value: 'ARTISTS', label: 'Des artistes',                  desc: 'Agent, manager, tourneur, booker',              specialty: AGENCY_SPECIALTY, icon: <Mic2 className="h-5 w-5 text-violet-400" /> },
  { value: 'VENUES',  label: 'Plusieurs lieux ou événements', desc: 'Groupe de salles, festival à plusieurs scènes', specialty: VENUES_SPECIALTY, icon: <Building2 className="h-5 w-5 text-violet-400" /> },
]

// Mots que les gens tapent mais qui ne sont pas le nom exact du métier
const JOB_SYNONYMS: Record<string, string> = {
  [AGENCY_SPECIALTY]: 'agent manager tourneur booker representant production',
  [VENUES_SPECIALTY]: 'plusieurs salles gerant proprietaire lieux',
  'Discothèque / Club': 'boite de nuit night club',
  'Salle de spectacle': 'salle de concert',
  'Traiteur': 'cuisine repas buffet',
  'Photographe': 'photo',
  'Vidéaste': 'video film',
  'Sonorisateur': 'sono son',
  'Chanteur(se)': 'chant chanteuse chanteur',
  'Groupe': 'groupe de musique band',
}
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const ALL_JOBS = (['ARTIST', 'PROVIDER', 'ORGANIZER'] as Role[]).flatMap(role =>
  SPECIALTIES[role].map(label => ({ label, role, haystack: normalize(`${label} ${JOB_SYNONYMS[label] || ''}`) })))

function searchJobs(query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  if (!words.length) return []
  const first = normalize(query.trim())
  return ALL_JOBS
    .filter(job => words.every(w => job.haystack.includes(w)))
    .sort((a, b) => Number(normalize(b.label).startsWith(first)) - Number(normalize(a.label).startsWith(first)) || a.label.localeCompare(b.label, 'fr'))
    .slice(0, 6)
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
    subtitle: 'Dis-nous ce que tu fais pour que les bonnes personnes te trouvent.',
    items: ['Tape ton métier, on s’occupe du reste', 'Agents et gérants de plusieurs lieux bienvenus', 'Modifiable à tout moment dans les réglages'],
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
    title: 'Ta formule.',
    subtitle: 'Commence gratuitement, ou passe directement à la version Pro.',
    items: ['Compte gratuit sans carte bancaire', 'Version Pro résiliable à tout moment', 'Code Fondateur ou code promo accepté'],
  },
]

function BrandingPanel({ step, logoUrl }: { step: number; logoUrl?: string | null }) {
  const content = BRANDING[Math.min(step - 1, BRANDING.length - 1)]
  return (
    <aside className="hidden lg:flex flex-col justify-between border-r border-white/8">
      <div className="p-10">
        <PublicBrand logoUrl={logoUrl} />

        <div className="mt-12 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            {content.icon}
          </div>
          <h1 className="text-3xl font-black tracking-tight leading-tight">{content.title}</h1>
          <p className="text-white/55 text-sm max-w-xs leading-relaxed">{content.subtitle}</p>
          <ul className="mt-6 space-y-3">
            {content.items.map(item => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-white/60">
                <LsBullet className="mt-1" />
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
  const { registerBgUrl: bgUrl, landingLogoUrl: logoUrl } = usePublicSettings()

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
  const [path, setPath]               = useState<Path | null>(null)
  const [multi, setMulti]             = useState<Multi | null>(null)
  const [jobQuery, setJobQuery]       = useState('')
  const [pinnedJob, setPinnedJob]     = useState<string | null>(null) // métier choisi : affiché en tête des spécialités
  const jobResults = useMemo(() => searchJobs(jobQuery), [jobQuery])

  const choosePath = (value: Path) => {
    const next = PATHS.find(p => p.value === value)!.role
    if (next !== role) setSpecialties([])
    setPath(value); setRole(next); setMulti(null); setError(null)
    if (value !== 'MULTI') setPlan(p => (p === 'AGENCY' ? 'FREE' : p))
  }
  const chooseMulti = (value: Multi) => {
    const spec = MULTI_CHOICES.find(m => m.value === value)!.specialty
    const others = MULTI_CHOICES.map(m => m.specialty)
    setMulti(value); setPinnedJob(spec); setError(null)
    setPlan('AGENCY') // formule proposée en premier à l'étape Offre
    setSpecialties(prev => [spec, ...prev.filter(s => !others.includes(s))])
  }
  // Un métier trouvé par la recherche : rôle, phrase et spécialité choisis d'un coup
  const chooseJob = (label: string, jobRole: Role) => {
    const multiChoice = MULTI_CHOICES.find(m => m.specialty === label)
    setPath(multiChoice ? 'MULTI' : jobRole === 'ARTIST' ? 'PERFORM' : jobRole === 'PROVIDER' ? 'SERVICE' : 'HOST')
    setMulti(multiChoice ? multiChoice.value : null)
    setSpecialties(prev => [label, ...(jobRole === role ? prev.filter(s => s !== label) : [])].slice(0, MAX_SPECIALTIES))
    setRole(jobRole); setPinnedJob(label); setJobQuery(''); setError(null)
  }

  // ── Étape 3 : Identité ──
  const [pseudo, setPseudo]                     = useState('')
  const [firstName, setFirstName]               = useState('')
  const [lastName, setLastName]                 = useState('')
  const [dateOfBirth, setDateOfBirth]           = useState('')
  const [dobDay, setDobDay]                     = useState('')
  const [dobMonth, setDobMonth]                 = useState('')
  const [dobYear, setDobYear]                   = useState('')
  const [country, setCountry]                   = useState('France')
  const [city, setCity]                         = useState('')
  const [phone, setPhone]                       = useState('')
  const [pseudoStatus, setPseudoStatus]         = useState<PseudoStatus>('idle')
  const [isAdult, setIsAdult]                   = useState(false)

  // Synchroniser la date complète depuis les 3 sélects
  useEffect(() => {
    if (dobDay && dobMonth && dobYear) {
      setDateOfBirth(`${dobYear}-${dobMonth}-${dobDay}`)
    } else {
      setDateOfBirth('')
    }
  }, [dobDay, dobMonth, dobYear])

  // ── Étape 4 : Statut ──
  const [legalType, setLegalType]   = useState<LegalType | null>(null)
  const [siret, setSiret]           = useState('')
  const [siretStatus, setSiretStatus] = useState<SiretStatus>('idle')
  const [siretName, setSiretName]   = useState('')

  // ── Étape 5 : Offre ──
  const [plan, setPlan]             = useState<Plan>('FREE')
  const [billingInterval, setBillingInterval] = useState<'MONTH' | 'YEAR'>('MONTH')
  const [promoCode, setPromoCode]   = useState('')
  const [signupPrices, setSignupPrices] = useState<SignupPrices | null>(null)
  useEffect(() => {
    fetch(apiUrl('billing/prices')).then(r => (r.ok ? r.json() : null)).then(setSignupPrices).catch(() => {})
  }, [])
  const rolePrices = role ? signupPrices?.prices?.[role] : null
  const signupLimits = signupPrices?.limits
  const signupCommission = signupPrices?.commission

  // ── Helpers ──
  const go = (n: number) => { setStep(n); setError(null) }


  // Vérification pseudo
  const checkPseudo = useCallback(async (value: string) => {
    if (!value || value.trim().length < 3) { setPseudoStatus('idle'); return }
    setPseudoStatus('checking')
    try {
      const res = await apiFetch(`${apiUrl('auth/check-pseudo')}?pseudo=${encodeURIComponent(value.trim())}`)
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
      const res = await apiFetch(`${apiUrl('auth/validate-siret')}?siret=${raw}`)
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
          legalStatus: legalType === 'PROFESSIONAL' ? 'COMPANY' : legalType === 'INTERMITTENT' ? 'INTERMITTENT' : 'INDIVIDUAL',
          organizerType: role === 'ORGANIZER' ? (legalType === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'INDIVIDUAL') : undefined,
          siret: legalType === 'PROFESSIONAL' ? siret.replace(/\s/g, '') : undefined,
          city: city,
          specialties: specialties.length > 0 ? specialties : undefined,
          plan,
          billingInterval,
          promoCode: promoCode.trim() || undefined,
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
    if (!role) { setError('Tape ton métier ou choisis une des phrases pour continuer.'); return }
    if (path === 'MULTI' && !multi) { setError('Précise ce que tu gères : des artistes ou plusieurs lieux.'); return }
    go(3)
  }

  const handleStep3 = (e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    if (pseudoStatus === 'taken') { setError('Ce pseudo est déjà utilisé.'); return }
    if (!city.trim()) { setError('La ville est requise.'); return }
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
      {/* Fond calé sur l'écran (pas sur la page) : il ne bouge pas quand le formulaire s'allonge */}
      <div className="fixed inset-0 z-0">
        <Image
          src={bgUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          quality={82}
          placeholder="blur"
          blurDataURL={PUBLIC_IMAGE_BLUR}
          className="object-cover"
        />
      </div>
      <div className="fixed inset-0 z-10 bg-black/60" />
      <div className="pointer-events-none fixed inset-0 z-10">
        <div className="absolute -top-32 -left-28 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-pink-500/15 blur-3xl" />
      </div>

      <div className="relative z-20 mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">
        {step <= 5 && <BrandingPanel step={step} logoUrl={logoUrl} />}

        <main className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">

            {/* Logo mobile */}
            {step <= 5 && (
              <div className="mb-8 lg:hidden">
                <PublicBrand logoUrl={logoUrl} size="small" showTagline={false} />
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-7 shadow-2xl">

              {/* En-tête */}
              {step <= 5 && (
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-2xl font-black">Créer un compte</h2>
                    <p className="text-sm text-white/45 mt-0.5">
                      Déjà inscrit ?{' '}
                      <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition">Se connecter</Link>
                    </p>
                  </div>
                  {step === 1 ? (
                    <Link href="/" className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition">
                      ← Retour
                    </Link>
                  ) : (
                    <button type="button" onClick={() => go(step - 1)}
                      className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition">
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
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"><Mail className="w-4 h-4" /></span>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        required autoComplete="email" placeholder="nom@domaine.com"
                        className={inputCls('pl-10')} />
                    </div>
                  </Field>

                  <Field label="Mot de passe">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"><Lock className="w-4 h-4" /></span>
                      <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                        required autoComplete="new-password" placeholder="Au moins 8 caractères"
                        className={inputCls('pl-10 pr-10')} />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-white/60 transition">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>

                  <Field label="Confirmer le mot de passe">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"><Lock className="w-4 h-4" /></span>
                      <input type={showCfm ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                        required autoComplete="new-password" placeholder="••••••••"
                        className={inputCls('pl-10 pr-10')} />
                      <button type="button" onClick={() => setShowCfm(v => !v)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-white/60 transition">
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
                <form onSubmit={handleStep2} className="space-y-4">
                  <div>
                    <p className="text-base font-semibold text-white">Que fais-tu ?</p>
                    <div className="relative mt-2">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                      <input type="search" value={jobQuery} onChange={e => setJobQuery(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (jobResults[0]) chooseJob(jobResults[0].label, jobResults[0].role) } }}
                        placeholder="Tape ton métier : traiteur, DJ, salle…" aria-label="Rechercher ton métier"
                        className={inputCls('pl-10')} />
                    </div>
                    {jobQuery.trim() && (
                      <div className="mt-1.5 rounded-xl border border-white/10 bg-[#1a1824] p-1">
                        {jobResults.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-white/45">Aucun métier trouvé. Choisis plutôt une des phrases ci-dessous.</p>
                        ) : jobResults.map(job => (
                          <button key={`${job.role}-${job.label}`} type="button" onClick={() => chooseJob(job.label, job.role)}
                            className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-white/85 transition hover:bg-violet-500/15">
                            <span>{job.label}</span>
                            <span className="flex-shrink-0 rounded-md bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-200">{ROLE_LABEL[job.role]}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-center text-xs text-white/35">ou choisis</p>

                  <div className="grid gap-2">
                    {PATHS.map(opt => (
                      <button key={opt.value} type="button" onClick={() => choosePath(opt.value)} aria-pressed={path === opt.value}
                        className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition
                          ${path === opt.value
                            ? 'border-violet-500 bg-violet-500/15 shadow-lg shadow-violet-900/20'
                            : 'border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/[0.06]'}`}>
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-600/20">{opt.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm font-semibold ${path === opt.value ? 'text-white' : 'text-white/80'}`}>{opt.label}</span>
                          <span className="block text-xs text-white/40">{opt.desc}</span>
                        </span>
                        {path === opt.value && <Check className="h-4 w-4 flex-shrink-0 text-violet-300" />}
                      </button>
                    ))}
                  </div>

                  {/* « Je gère plusieurs profils » : des artistes ou plusieurs lieux */}
                  {path === 'MULTI' && (
                    <div className="space-y-2 rounded-2xl border border-white/8 bg-white/[0.03] p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-sm font-semibold text-white/80">Tu gères…</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {MULTI_CHOICES.map(opt => (
                          <button key={opt.value} type="button" onClick={() => chooseMulti(opt.value)} aria-pressed={multi === opt.value}
                            className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition
                              ${multi === opt.value ? 'border-violet-500 bg-violet-500/15' : 'border-white/10 bg-white/4 hover:border-white/20'}`}>
                            {opt.icon}
                            <span>
                              <span className="block text-sm font-semibold text-white/85">{opt.label}</span>
                              <span className="block text-xs text-white/40">{opt.desc}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                      {multi && (
                        <p className="text-xs leading-relaxed text-gold-light/80">
                          On crée d&apos;abord le profil de ta structure. Ensuite, la formule Agence te permettra d&apos;ajouter {multi === 'ARTISTS' ? 'tes artistes' : 'tes lieux'}.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Spécialités — apparaissent une fois le choix fait */}
                  {role && (path !== 'MULTI' || multi) && (
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white/80">Tes spécialités <span className="text-white/30 font-normal">(optionnel)</span></p>
                        {specialties.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 border border-violet-400/30 px-2 py-0.5 text-[10px] text-violet-200 font-medium flex-shrink-0">
                            {specialties.length} <LsIcon name="check" size={13} tone="inherit" />
                          </span>
                        )}
                      </div>
                      <div className="max-h-28 overflow-y-auto pr-1 scrollbar-thin">
                        <TagSelector options={pinnedJob && SPECIALTIES[role].includes(pinnedJob) ? [pinnedJob, ...SPECIALTIES[role].filter(t => t !== pinnedJob)] : SPECIALTIES[role]} selected={specialties} onChange={setSpecialties} />
                      </div>
                    </div>
                  )}

                  <p className="text-center text-xs text-white/40">Quel que soit ton choix, tu pourras aussi créer des événements et booker d&apos;autres membres.</p>

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
                      {pseudoStatus === 'available' && <span className="flex items-center gap-1 text-xs text-emerald-400"><LsIcon name="check" size={14} tone="inherit" />Disponible</span>}
                      {pseudoStatus === 'taken'     && <span className="flex items-center gap-1 text-xs text-red-400"><LsIcon name="close" size={14} tone="inherit" />Déjà utilisé</span>}
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

                  {/* Date de naissance — 3 sélects */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-white/75">Date de naissance</label>
                    <div className="grid grid-cols-3 gap-2">
                      <select value={dobDay} onChange={e => setDobDay(e.target.value)}
                        className="w-full appearance-none rounded-xl bg-white/5 px-3 py-2.5 text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-violet-500/60">
                        <option value="" className="bg-neutral-900 text-white/50">Jour</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={String(d).padStart(2, '0')} className="bg-neutral-900">{d}</option>
                        ))}
                      </select>
                      <select value={dobMonth} onChange={e => setDobMonth(e.target.value)}
                        className="w-full appearance-none rounded-xl bg-white/5 px-3 py-2.5 text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-violet-500/60">
                        <option value="" className="bg-neutral-900 text-white/50">Mois</option>
                        {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m, i) => (
                          <option key={m} value={String(i + 1).padStart(2, '0')} className="bg-neutral-900">{m}</option>
                        ))}
                      </select>
                      <select value={dobYear} onChange={e => setDobYear(e.target.value)}
                        className="w-full appearance-none rounded-xl bg-white/5 px-3 py-2.5 text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-violet-500/60">
                        <option value="" className="bg-neutral-900 text-white/50">Année</option>
                        {Array.from({ length: 83 }, (_, i) => new Date().getFullYear() - 18 - i).map(y => (
                          <option key={y} value={String(y)} className="bg-neutral-900">{y}</option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-1 text-xs text-white/35">Tu dois avoir 18 ans ou plus pour t&apos;inscrire.</p>
                  </div>

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

                  <Field label="Ville">
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
                  <p className="text-sm text-white/50 -mt-1">Choisis le statut qui correspond à ton activité.</p>

                  <div className="grid grid-cols-3 gap-2.5">
                    {([
                      { value: 'INDIVIDUAL' as LegalType,    label: 'Particulier',    icon: <User className="h-6 w-6 text-violet-400" />,      desc: 'Sans activité déclarée.' },
                      { value: 'INTERMITTENT' as LegalType,  label: 'Intermittent',   icon: <Mic2 className="h-6 w-6 text-violet-400" />,      desc: 'Intermittent du spectacle.' },
                      { value: 'PROFESSIONAL' as LegalType,  label: 'Professionnel',  icon: <Building2 className="h-6 w-6 text-violet-400" />, desc: 'Auto-entrepreneur, société…' },
                    ]).map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => { setLegalType(opt.value); setSiretStatus('idle'); setSiretName('') }}
                        className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition
                          ${legalType === opt.value
                            ? 'border-violet-500 bg-violet-500/15 shadow-lg shadow-violet-900/20'
                            : 'border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/[0.06]'}`}>
                        <div className="h-10 w-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">{opt.icon}</div>
                        <span className={`font-semibold text-xs ${legalType === opt.value ? 'text-white' : 'text-white/70'}`}>{opt.label}</span>
                        <span className="text-[10px] text-white/40 leading-tight">{opt.desc}</span>
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

              {/* ── ÉTAPE 5 : Formule (gratuit par défaut, Pro en option) ─────── */}
              {step === 5 && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-3">
                    {/* Formule Agence : proposée en premier à ceux qui gèrent plusieurs profils */}
                    {path === 'MULTI' && signupPrices?.agency && (
                      <button type="button" onClick={() => setPlan('AGENCY')}
                        className={`relative w-full text-left rounded-2xl border p-4 transition
                          ${plan === 'AGENCY' ? 'border-accent bg-accent/15 shadow-lg shadow-black/20' : 'border-white/10 bg-white/4 hover:border-white/20'}`}>
                        <span className="absolute -top-2.5 right-4 rounded-md bg-gold px-2 py-0.5 text-[10px] font-semibold text-[#1a1408]">Pour vous</span>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className={`font-semibold text-sm ${plan === 'AGENCY' ? 'text-white' : 'text-white/70'}`}>Formule Agence</p>
                            <p className="text-xs text-white/40 mt-0.5">Gérer plusieurs profils depuis ton compte</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`font-black text-lg ${plan === 'AGENCY' ? 'text-white' : 'text-white/60'}`}>{formatPrice(billingInterval === 'YEAR' ? signupPrices.agency.yearCents : signupPrices.agency.monthCents)}</p>
                            <p className="text-[10px] text-white/35">{billingInterval === 'YEAR' ? 'par an' : 'par mois'}</p>
                          </div>
                        </div>
                        <ul className="mt-3 space-y-1.5">
                          {[
                            `${signupPrices.agency.includedProfiles} profils gérés inclus, tous en Pro`,
                            'Ton propre profil passe en Pro aussi',
                            `${formatPrice(billingInterval === 'YEAR' ? signupPrices.agency.extraYearCents : signupPrices.agency.extraMonthCents)} ${billingInterval === 'YEAR' ? 'par an' : 'par mois'} par profil en plus`,
                          ].map(f => (
                            <li key={f} className="flex items-center gap-2 text-xs text-white/60">
                              <Check className={`h-3 w-3 flex-shrink-0 ${plan === 'AGENCY' ? 'text-accent-light' : 'text-white/30'}`} />{f}
                            </li>
                          ))}
                        </ul>
                      </button>
                    )}
                    {/* Compte gratuit — choisi par défaut */}
                    <button type="button" onClick={() => setPlan('FREE')}
                      className={`w-full text-left rounded-2xl border p-4 transition
                        ${plan === 'FREE' ? 'border-accent bg-accent/15 shadow-lg shadow-black/20' : 'border-white/10 bg-white/4 hover:border-white/20'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`font-semibold text-sm ${plan === 'FREE' ? 'text-white' : 'text-white/70'}`}>Compte gratuit</p>
                          <p className="text-xs text-white/40 mt-0.5">Pour démarrer, sans carte bancaire</p>
                        </div>
                        <p className={`font-black text-lg ${plan === 'FREE' ? 'text-white' : 'text-white/60'}`}>0 €</p>
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {[
                          'Profil, publications et messagerie',
                          'Bookings reçus et acceptés sans limite',
                          signupLimits ? `${role === 'ORGANIZER' ? `${signupLimits.bookingRequestsPerMonth} demandes de booking` : `${signupLimits.applicationsPerMonth} candidatures`} par mois` : 'Quelques limites mensuelles',
                        ].map(f => (
                          <li key={f} className="flex items-center gap-2 text-xs text-white/60">
                            <Check className={`h-3 w-3 flex-shrink-0 ${plan === 'FREE' ? 'text-accent-light' : 'text-white/30'}`} />{f}
                          </li>
                        ))}
                      </ul>
                    </button>

                    {/* Version Pro — en option */}
                    <button type="button" onClick={() => setPlan('PRO')}
                      className={`relative w-full text-left rounded-2xl border p-4 transition
                        ${plan === 'PRO' ? 'border-accent bg-accent/15 shadow-lg shadow-black/20' : 'border-white/10 bg-white/4 hover:border-white/20'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`font-semibold text-sm ${plan === 'PRO' ? 'text-white' : 'text-white/70'}`}>Version Pro</p>
                          <p className="text-xs text-white/40 mt-0.5">Tout illimité, résiliable à tout moment</p>
                        </div>
                        {rolePrices && (
                          <div className="text-right flex-shrink-0">
                            <p className={`font-black text-lg ${plan === 'PRO' ? 'text-white' : 'text-white/60'}`}>{formatPrice(billingInterval === 'YEAR' ? rolePrices.yearCents : rolePrices.monthCents)}</p>
                            <p className="text-[10px] text-white/35">{billingInterval === 'YEAR' ? 'par an' : 'par mois'}</p>
                          </div>
                        )}
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {[
                          'Candidatures, demandes et événements illimités',
                          'Module Finances, devis et factures',
                          role === 'ORGANIZER' ? 'Budget, équipe et documents d’événement' : `Commission réduite${signupCommission ? ` à ${String(signupCommission.proPct).replace('.', ',')} %` : ''} sur les bookings payés en ligne`,
                          'Badge Pro et meilleure place dans la recherche',
                        ].map(f => (
                          <li key={f} className="flex items-center gap-2 text-xs text-white/60">
                            <Check className={`h-3 w-3 flex-shrink-0 ${plan === 'PRO' ? 'text-accent-light' : 'text-white/30'}`} />{f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  </div>

                  {((plan === 'PRO' && rolePrices) || (plan === 'AGENCY' && signupPrices?.agency)) && (
                    <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1 text-xs">
                      {(['MONTH', 'YEAR'] as const).map(i => {
                        const p = plan === 'AGENCY' ? signupPrices!.agency! : rolePrices!
                        return (
                        <button key={i} type="button" onClick={() => setBillingInterval(i)}
                          className={`flex-1 rounded-lg px-3 py-2 font-medium transition ${billingInterval === i ? 'bg-accent-strong text-white' : 'text-white/55 hover:text-white'}`}>
                          {i === 'YEAR' ? `Annuel · ${formatPrice(p.yearCents)}${Math.round(p.yearCents / p.monthCents) < 12 ? ` (${Math.round(p.yearCents / p.monthCents)} mois payés, 12 mois d’accès)` : ''}` : `Mensuel · ${formatPrice(p.monthCents)}`}
                        </button>
                        )
                      })}
                    </div>
                  )}

                  <Field label="Code promo ou code Fondateur" hint="Optionnel — appliqué à votre première connexion.">
                    <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Ex. FONDATEUR-XXXXXXXX" className={inputCls('tracking-widest font-mono')} />
                  </Field>

                  <div className="flex gap-3">
                    <BackBtn onClick={() => go(4)} />
                    <PrimaryBtn loading={loading} label="Créer mon compte →" />
                  </div>

                  <p className="text-center text-xs text-white/30 leading-relaxed">
                    {plan === 'AGENCY'
                      ? 'Après la confirmation de votre e-mail, vous finaliserez la formule Agence en enregistrant votre carte, puis vous ajouterez vos profils.'
                      : plan === 'PRO'
                      ? 'Après la confirmation de votre e-mail, vous finaliserez la version Pro en enregistrant votre carte. Un code de lancement vous offre des mois gratuits.'
                      : 'Aucune carte bancaire demandée. Vous pourrez passer en Pro à tout moment.'}
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
                        try { await apiFetch(apiUrl('auth/resend-verification'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }) } catch {}
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
