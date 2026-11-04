'use client'

import { apiFetch } from '@/utils/auth'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from 'lucide-react'
import { useAuth, type LoginError, type AdminCodeStep } from '@/context/AuthContext'
import { usePublicSettings } from '@/context/PublicSettingsContext'
import { apiUrl } from '@/utils/api'
import PublicBrand from '@/components/PublicBrand'
import { PUBLIC_IMAGE_BLUR } from '@/lib/publicSettings.shared'

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Bonjour'
  if (h >= 12 && h < 18) return 'Bon après-midi'
  if (h >= 18 && h < 22) return 'Bonsoir'
  return 'Bonne nuit'
}

/* ─────────────────────────────────────────────────────────
   PANNEAU GAUCHE — minimaliste
───────────────────────────────────────────────────────── */
function BrandingPanel({ logoUrl }: { logoUrl?: string | null }) {
  return (
    <aside className="hidden lg:flex flex-col justify-between border-r border-white/8">

      <div className="p-10">
        <PublicBrand logoUrl={logoUrl} />

        <div className="mt-16">
          <h1 className="text-5xl font-black tracking-tight leading-[1.1]">
            Content de<br />
            te revoir.
          </h1>
          <p className="mt-6 text-lg text-white/50 leading-relaxed max-w-xs">
            Des opportunités t&apos;attendent<br />de l&apos;autre côté.
          </p>
        </div>
      </div>

      <div className="p-10">
        <p className="text-xs text-white/30">© {new Date().getFullYear()} LSBookers — Tous droits réservés.</p>
      </div>
    </aside>
  )
}

/* ─────────────────────────────────────────────────────────
   COMPTE ADMIN — code de sécurité reçu par e-mail
───────────────────────────────────────────────────────── */
function AdminCodeForm({ step, onResend, onCancel }: {
  step: AdminCodeStep
  onResend: () => Promise<void>
  onCancel: () => void
}) {
  const { verifyAdminCode } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await verifyAdminCode(step.challenge, code)
    } catch (err) {
      const authError = err as LoginError & { attemptsLeft?: number }
      if (authError.code === 'ADMIN_CODE_WRONG') {
        setError(`Code incorrect. Encore ${authError.attemptsLeft} essai${authError.attemptsLeft === 1 ? '' : 's'}.`)
      } else if (authError.code === 'ADMIN_CODE_EXPIRED') {
        setError('Ce code n\'est plus valable. Demandez un nouveau code.')
      } else if (authError.status === 429) {
        setError('Trop de tentatives. Réessayez dans 5 minutes.')
      } else {
        setError('Le code n\'a pas pu être vérifié.')
      }
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setError(null)
    setCode('')
    await onResend()
    setResent(true)
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-7 shadow-2xl">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent-light ring-1 ring-accent/40">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-black">Code de sécurité</h2>
          <p className="mt-1 text-sm text-white/55">
            Un code à 6 chiffres vient d&apos;être envoyé à <span className="text-white">{step.emailHint}</span>. Il est valable 10 minutes.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}
      {resent && !error && (
        <div className="mb-4 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-white/80">Nouveau code envoyé.</div>
      )}

      <input
        autoFocus
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="••••••"
        aria-label="Code de sécurité"
        className="w-full rounded-xl bg-white/5 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-white placeholder-white/25 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/60 transition"
      />

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="mt-4 w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-500 disabled:opacity-60 transition shadow-lg shadow-purple-900/40"
      >
        {loading ? 'Vérification…' : 'Ouvrir l\'admin →'}
      </button>

      <div className="mt-4 flex items-center justify-between text-xs text-white/45">
        <button type="button" onClick={onCancel} className="hover:text-white transition">← Retour</button>
        <button type="button" onClick={resend} className="underline underline-offset-4 hover:text-white transition">Renvoyer un code</button>
      </div>
    </form>
  )
}

/* ─────────────────────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────────────────────── */
export default function LoginPage() {
  const { login } = useAuth()
  const { loginBgUrl: bgUrl, landingLogoUrl: logoUrl } = usePublicSettings()

  const [email, setEmail]                       = useState('')
  const [password, setPassword]                 = useState('')
  const [showPassword, setShowPassword]         = useState(false)
  const [error, setError]                       = useState<string | null>(null)
  const [loading, setLoading]                   = useState(false)
  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [resendLoading, setResendLoading]       = useState(false)
  const [resendSent, setResendSent]             = useState(false)
  const [greeting, setGreeting]                 = useState('Bienvenue')
  const [adminStep, setAdminStep]               = useState<AdminCodeStep | null>(null)
  const [adminNotice, setAdminNotice]           = useState<string | null>(null)

  useEffect(() => { setGreeting(getGreeting()) }, [])
  // Retour ici après la fermeture automatique de la session admin
  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get('admin')
    if (reason === 'idle') setAdminNotice('Session admin fermée après 1 heure sans activité. Reconnectez-vous.')
    else if (reason === 'expired') setAdminNotice('Session admin expirée. Reconnectez-vous.')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setEmailNotVerified(false)
    setLoading(true)
    try {
      const step = await login(email, password)
      if (step) setAdminStep(step)
    } catch (err) {
      let message = 'Échec de la connexion.'
      const authError = err as LoginError
      if (authError?.status) {
        if (authError.status === 401) {
          message = 'Identifiants incorrects.'
        } else if (authError.status === 403 && authError.code === 'EMAIL_NOT_VERIFIED') {
          setEmailNotVerified(true)
          setLoading(false)
          return
        } else if (authError.status === 403 && authError.code === 'PASSWORD_RESET_REQUIRED') {
          message = 'Ce compte a été sécurisé : choisis un nouveau mot de passe avec le lien reçu par e-mail, ou clique sur « Mot de passe oublié ».'
        } else if (authError.status === 429) {
          message = 'Trop de tentatives. Réessayez dans 5 minutes.'
        }
      } else if (authError instanceof TypeError) {
        message = 'Erreur réseau.'
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResendLoading(true)
    try {
      await apiFetch(apiUrl('auth/resend-verification'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      })
      setResendSent(true)
    } catch {
      setResendSent(true)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white" style={{ background: '#0c0a14' }}>

      <Image
        src={bgUrl}
        alt=""
        fill
        priority
        sizes="100vw"
        quality={82}
        placeholder="blur"
        blurDataURL={PUBLIC_IMAGE_BLUR}
        className="z-0 object-cover"
      />
      <div className="absolute inset-0 z-10 bg-black/60" />
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute -top-32 -left-28 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-pink-500/15 blur-3xl" />
      </div>

      {/* Grille 2 colonnes */}
      <div className="relative z-20 mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">

        <BrandingPanel logoUrl={logoUrl} />

        {/* Formulaire */}
        <main className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">

            {/* En-tête mobile */}
            <div className="mb-8 lg:hidden">
              <PublicBrand logoUrl={logoUrl} size="small" showTagline={false} />
            </div>

            {adminStep ? (
              <AdminCodeForm
                step={adminStep}
                onResend={async () => { const step = await login(email, password).catch(() => null); if (step) setAdminStep(step) }}
                onCancel={() => { setAdminStep(null); setPassword('') }}
              />
            ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-7 shadow-2xl"
            >
              {/* Titre */}
              <div className="mb-5">
                <p className="text-xs text-purple-400 font-semibold tracking-widest uppercase mb-1">{greeting}</p>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black">Se connecter</h2>
                  <Link
                    href="/"
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition"
                  >
                    ← Retour
                  </Link>
                </div>
                <p className="text-sm text-white/50 mt-1">
                  Pas encore de compte ?{' '}
                  <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition">
                    Créer un compte
                  </Link>
                </p>
              </div>

              {adminNotice && !error && (
                <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  {adminNotice}
                </div>
              )}

              {/* Erreurs */}
              {error && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {emailNotVerified && (
                <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  <p className="font-semibold">Email non confirmé</p>
                  <p className="mt-1 text-amber-200/70 text-xs">Vérifie ta boîte mail et clique sur le lien de confirmation.</p>
                  {resendSent ? (
                    <p className="mt-2 text-purple-400 text-xs">Email renvoyé !</p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="mt-2 text-xs text-amber-300 underline underline-offset-4 hover:text-white disabled:opacity-60"
                    >
                      {resendLoading ? 'Envoi…' : 'Renvoyer l\'email de confirmation'}
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-4">

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/75">Email</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"><Mail className="w-4 h-4" /></span>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="nom@domaine.com"
                      className="w-full rounded-xl bg-white/5 pl-10 pr-4 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/60 transition"
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-white/75">Mot de passe</label>
                    <Link href="/forgot-password" className="text-xs text-white/45 hover:text-purple-400 transition">
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"><Lock className="w-4 h-4" /></span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-white/5 pl-10 pr-10 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-purple-500/60 transition"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-white/60 transition">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Bouton */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-500 disabled:opacity-60 transition shadow-lg shadow-purple-900/40 mt-2"
                >
                  {loading ? 'Connexion…' : 'Se connecter →'}
                </button>

                <p className="text-center text-xs text-white/35">
                  Besoin d&apos;aide ?{' '}
                  <Link href="/contact" className="underline underline-offset-4 hover:text-white transition">
                    Contacte-nous
                  </Link>
                </p>

              </div>
            </form>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}
