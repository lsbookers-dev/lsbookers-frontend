'use client'

/**
 * Fenêtre de bienvenue (choix A3 d'Antho, 04/11/2026) : s'ouvre une seule fois par compte,
 * à la première connexion. Trois premiers pas selon le profil, et le Pro (ou Business) en encart discret.
 */
import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { useAuth, isPublicPath } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { usePlan, price } from '@/lib/plan'

// Spécialités données à l'inscription par « Je gère plusieurs profils »
const AGENCY_SPECIALTY = 'Agence artistique / booking'
const VENUES_SPECIALTY = 'Groupe de lieux'

type Step = { title: string; text: string; href: string }

function stepsFor(role: string, specialties: string[]): { steps: Step[]; business: boolean } {
  const profile = { title: 'Complète ton profil', text: 'Photo, bio, liens : c’est ta vitrine', href: '/studio-profile' }
  if (specialties.includes(AGENCY_SPECIALTY) || specialties.includes(VENUES_SPECIALTY)) {
    const artists = specialties.includes(AGENCY_SPECIALTY)
    return {
      business: true,
      steps: [
        { title: 'Complète le profil de ta structure', text: 'Logo, présentation, ville', href: '/studio-profile' },
        { title: artists ? 'Ajoute tes artistes' : 'Ajoute tes lieux', text: 'Avec la formule Business, tout se gère depuis ce compte', href: '/subscriptions' },
        artists
          ? { title: 'Regarde les offres', text: 'Les organisateurs y publient leurs besoins', href: '/offers' }
          : { title: 'Publie ta première offre', text: 'Les artistes et prestataires te répondent', href: '/offers' },
      ],
    }
  }
  if (role === 'ORGANIZER') {
    return {
      business: false,
      steps: [
        { ...profile, text: 'Photo, présentation, adresse : c’est ta vitrine' },
        { title: 'Publie ta première offre', text: 'Les artistes et prestataires te répondent', href: '/offers' },
        { title: 'Trouve des artistes et prestataires', text: 'Recherche par métier et par ville', href: '/search' },
      ],
    }
  }
  return {
    business: false,
    steps: [
      profile,
      { title: 'Publie ta première photo ou vidéo', text: 'Elle apparaît dans le fil d’accueil', href: '/home' },
      { title: 'Regarde les offres', text: 'Les organisateurs y publient leurs besoins', href: '/offers' },
    ],
  }
}

export default function WelcomeModal() {
  const { user, acting, loading, setUser } = useAuth()
  const { plan } = usePlan()
  const pathname = usePathname()
  const [closed, setClosed] = useState(false)

  if (closed || loading || !user || acting || user.role === 'ADMIN' || user.welcomeSeenAt) return null
  if (isPublicPath(pathname)) return null

  const { steps, business } = stepsFor(user.role, user.profile?.specialties || [])
  const firstName = user.name ? `, ${user.name}` : ''
  const proPrice = business ? plan?.agencyPrices?.monthCents : plan?.prices?.monthCents

  // Vue une fois pour toutes, quel que soit le bouton
  const close = () => {
    setClosed(true)
    setUser(u => (u ? { ...u, welcomeSeenAt: new Date().toISOString() } : u))
    apiFetch(apiUrl('account/welcome-seen'), { method: 'POST' }).catch(() => {})
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md space-y-4 rounded-3xl border border-white/12 bg-surface p-5 shadow-2xl sm:p-6"
      >
        <button type="button" onClick={close} aria-label="Fermer" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/[0.07] text-white/60 transition hover:text-white">
          <X size={16} />
        </button>

        <h2 id="welcome-title" className="pr-10 text-xl font-bold leading-tight text-white">
          Bienvenue{firstName} ! Trois choses pour bien démarrer
        </h2>

        <ol className="space-y-2">
          {steps.map((step, i) => (
            <li key={step.title}>
              <Link href={step.href} onClick={close} className="grid grid-cols-[2rem_1fr] items-center gap-3 rounded-2xl border border-white/[0.09] bg-surface-2 p-3 transition hover:border-accent/40">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/15 text-sm font-bold text-accent-light">{i + 1}</span>
                <span>
                  <span className="block text-sm font-semibold text-white">{step.title}</span>
                  <span className="block text-xs text-white/50">{step.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <Link href="/subscriptions" onClick={close} className="flex items-center justify-between gap-3 rounded-2xl border border-gold/35 bg-gold/[0.12] px-4 py-3 text-sm transition hover:bg-gold/[0.18]">
          <span className="text-white/80">
            {business ? 'Pour gérer plusieurs profils : ' : 'Envie d’aller plus loin ? '}
            <b className="text-gold-light">{business ? 'Business' : 'Pro'}{proPrice ? ` dès ${price(proPrice)}/mois` : ''}</b>
          </span>
          <span className="whitespace-nowrap font-semibold text-gold">Voir →</span>
        </Link>

        <div className="space-y-1">
          <Link href={steps[0].href} onClick={close} className="block rounded-xl bg-accent px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-accent-strong">
            {business ? 'Compléter le profil de ma structure' : 'Compléter mon profil'}
          </Link>
          <button type="button" onClick={close} className="block w-full py-2 text-center text-sm text-white/50 transition hover:text-white">
            Plus tard
          </button>
        </div>
      </div>
    </div>
  )
}
