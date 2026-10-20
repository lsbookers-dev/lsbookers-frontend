'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import PublicBrand from '@/components/PublicBrand'
import { usePublicSettings } from '@/context/PublicSettingsContext'
import { PUBLIC_IMAGE_BLUR } from '@/lib/publicSettings.shared'
import LsIcon, { LsBullet, type LsIconName } from '@/components/ui/LsIcon'
import InstallGuide from '@/components/install/InstallGuide'
import { useInstall } from '@/lib/install'

/* ─────────────────────────────────────────────────────────
   COMPOSANTS UI
───────────────────────────────────────────────────────── */

function StepCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex gap-5">
      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
        <span className="text-purple-400 font-black text-lg">{num}</span>
      </div>
      <div>
        <h3 className="text-white font-semibold text-base mb-1">{title}</h3>
        <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function AudienceCard({
  icon,
  title,
  subtitle,
  items,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  items: string[]
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md hover:bg-white/8 transition">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/20 border border-purple-500/30">
        {icon}
      </div>
      <div>
        <h3 className="text-white font-bold text-lg">{title}</h3>
        <p className="text-white/50 text-sm">{subtitle}</p>
      </div>
      <ul className="space-y-1.5 mt-1">
        {items.map(item => (
          <li key={item} className="flex items-center gap-2 text-sm text-white/70">
            <LsBullet />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   SECTION APPLICATION : installer LS Bookers sur l'écran d'accueil (choix L2 d'Antho, 21/10/2026)
───────────────────────────────────────────────────────── */
const APP_BENEFITS: { icon: LsIconName; label: string; gold?: boolean }[] = [
  { icon: 'home', label: 'Une icône comme une application' },
  { icon: 'phone', label: 'En plein écran, sans barre du navigateur' },
  { icon: 'bolt', label: 'Toujours à jour, rien à télécharger' },
  { icon: 'star', label: 'Gratuit', gold: true },
]

function AppSection() {
  const { ready, standalone } = useInstall()

  // Arrivée depuis le QR code (?installer=1) : on descend directement au guide
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).get('installer')) return
    // Petit délai : la page (image du haut, polices) doit être en place avant de descendre
    const timer = setTimeout(() => document.getElementById('installer')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400)
    return () => clearTimeout(timer)
  }, [])

  // Déjà ouverte depuis l'application installée : rien à expliquer
  if (ready && standalone) return null

  return (
    <section id="installer" className="relative scroll-mt-6 overflow-hidden bg-background py-16 sm:py-20">
      <div className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative mx-auto max-w-5xl px-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent-light">
          <LsIcon name="phone" size={12} tone="inherit" /> L’application LS Bookers
        </span>
        <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
          LS Bookers sur votre <span className="text-accent-light">écran d’accueil.</span>
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/55">
          Ajoutez LS Bookers à votre téléphone en trois gestes, sans passer par l’App Store ni le Play Store :
          vos messages, votre agenda et vos offres s’ouvrent d’un geste.
        </p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {APP_BENEFITS.map(b => (
            <li key={b.label} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${b.gold ? 'border-gold/40 text-gold-light' : 'border-white/10 text-white/70'}`}>
              <LsIcon name={b.icon} size={13} tone={b.gold ? 'gold' : 'accent'} />
              {b.label}
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <InstallGuide />
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { landingBgUrl: bgUrl, landingLogoUrl: logoUrl } = usePublicSettings()

  return (
    <div className="w-full bg-neutral-950 text-white overflow-x-hidden">

      {/* ══════════════════════════════════════════════════
          SECTION 1 — HERO PLEIN ÉCRAN
      ══════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-screen flex flex-col overflow-hidden" style={{ background: '#0c0a14' }}>

        {/* Photo de fond — affichée uniquement si l'URL est définie */}
        {bgUrl && (
          <Image
            src={bgUrl}
            alt="LSBookers — Plateforme événementielle"
            fill
            priority
            sizes="100vw"
            quality={82}
            placeholder="blur"
            blurDataURL={PUBLIC_IMAGE_BLUR}
            className="z-0 object-cover"
          />
        )}

        {/* Overlays */}
        <div className="absolute inset-0 z-10 bg-black/55" />
        <div className="absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 z-10 h-72 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none" />

        {/* Glows */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute -top-32 -left-28 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-pink-500/15 blur-3xl" />
        </div>

        {/* Contenu hero */}
        <div className="relative z-20 flex flex-col min-h-screen">

          {/* ── Header ── */}
          <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
            <PublicBrand logoUrl={logoUrl} size="large" hideTextOnMobile />

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition backdrop-blur"
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 transition shadow-lg shadow-purple-900/40"
              >
                Créer un compte
              </Link>
            </div>
          </header>

          {/* ── Hero centré ── */}
          <main className="flex-1 flex items-center justify-center px-6 py-16">
            <div className="max-w-3xl w-full text-center flex flex-col items-center gap-6">

              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-1.5 text-xs text-white/75 backdrop-blur">
                <LsBullet /> Réseau social &amp; Plateforme de mise en relation événementielle
              </p>

              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
                La nouvelle scène
                <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  de l&apos;événementiel.
                </span>
              </h1>

              <p className="max-w-xl text-base md:text-lg text-white/65 leading-relaxed">
                LSBookers connecte artistes, organisateurs et prestataires.
                Publie ton profil, trouve des opportunités et développe ton réseau en quelques clics.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-purple-600 px-7 py-3 text-base font-semibold text-white hover:bg-purple-500 transition shadow-lg shadow-purple-900/40 sm:w-auto"
                >
                  Rejoindre gratuitement
                </Link>
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-7 py-3 text-base text-white/80 hover:bg-white/10 hover:text-white transition backdrop-blur sm:w-auto"
                >
                  J&apos;ai déjà un compte
                </Link>
              </div>

            </div>
          </main>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION APP — TÉLÉCHARGER L'APPLICATION
      ══════════════════════════════════════════════════ */}
      <AppSection />

      {/* ══════════════════════════════════════════════════
          SECTION 2 — BANDE PROMESSES + CONFIANCE
      ══════════════════════════════════════════════════ */}
      <section className="border-y border-white/8 bg-white/3 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-5">

          {/* Promesses produit */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/60">
            <span className="flex items-center gap-2">
              <LsBullet /> Gratuit pour commencer
            </span>
            <span className="hidden sm:block text-white/15">|</span>
            <span className="flex items-center gap-2">
              <LsBullet /> Agenda professionnel intégré
            </span>
            <span className="hidden sm:block text-white/15">|</span>
            <span className="flex items-center gap-2">
              <LsBullet /> Messagerie directe
            </span>
            <span className="hidden sm:block text-white/15">|</span>
            <span className="flex items-center gap-2">
              <LsBullet /> Offres d&apos;emploi événementiel
            </span>
            <span className="hidden sm:block text-white/15">|</span>
            <span className="flex items-center gap-2">
              <LsBullet /> Système d&apos;avis
            </span>
          </div>

          {/* Ligne séparatrice */}
          <div className="my-4 border-t border-white/5" />

          {/* Confiance technique */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/35">
            <span className="flex items-center gap-1.5"><LsIcon name="lock" size={13} tone="inherit" /> Données sécurisées</span>
            <span className="hidden sm:block text-white/10">·</span>
            <span className="flex items-center gap-1.5"><LsIcon name="globe" size={13} tone="inherit" /> Hébergé en Europe</span>
            <span className="hidden sm:block text-white/10">·</span>
            <span className="flex items-center gap-1.5"><LsIcon name="payment" size={13} tone="inherit" /> Paiements via Stripe</span>
            <span className="hidden sm:block text-white/10">·</span>
            <span>Support francophone</span>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 3 — POUR QUI ?
      ══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">

        <div className="text-center mb-12">
          <p className="text-xs text-purple-400 font-semibold tracking-widest uppercase mb-3">Pour qui ?</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            Une plateforme, trois univers.
          </h2>
          <p className="mt-3 text-white/55 max-w-lg mx-auto text-sm md:text-base">
            Que tu sois sur scène, derrière la console ou dans les coulisses, LSBookers est fait pour toi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <AudienceCard
            icon={<LsIcon name="mic" size={24} />}
            title="Artistes"
            subtitle="DJ · Chanteur · Saxophoniste · Danseur…"
            items={[
              'Profil public avec agenda',
              'Reçois des propositions de booking',
              'Publie ton actualité',
              'Développe ton réseau pro',
            ]}
          />
          <AudienceCard
            icon={<LsIcon name="venue" size={24} />}
            title="Organisateurs"
            subtitle="Club · Festival · Agence · Soirée privée…"
            items={[
              'Trouve les artistes qu\'il te faut',
              'Publie tes offres d\'emploi',
              'Gère ton agenda d\'événements',
              'Évalue tes collaborations',
            ]}
          />
          <AudienceCard
            icon={<LsIcon name="tools" size={24} />}
            title="Prestataires"
            subtitle="Photo · Son · Décoration · Traiteur…"
            items={[
              'Mets ton activité en avant',
              'Réponds aux offres d\'emploi',
              'Collabore avec les organisateurs',
              'Construis ta réputation',
            ]}
          />
        </div>

      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 4 — COMMENT ÇA MARCHE
      ══════════════════════════════════════════════════ */}
      <section className="border-t border-white/8 bg-white/2">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* Texte gauche */}
            <div>
              <p className="text-xs text-purple-400 font-semibold tracking-widest uppercase mb-3">Comment ça marche</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-10">
                Simple. Rapide. Efficace.
              </h2>

              <div className="flex flex-col gap-8">
                <StepCard
                  num="01"
                  title="Crée ton profil"
                  desc="Inscris-toi gratuitement en quelques minutes. Renseigne ton activité, tes spécialités, ta localisation et une photo. Ton profil devient visible sur toute la plateforme."
                />
                <StepCard
                  num="02"
                  title="Trouve des opportunités"
                  desc="Parcours les offres d'emploi publiées par les organisateurs, explore les profils d'artistes et de prestataires, et contacte directement les personnes qui t'intéressent."
                />
                <StepCard
                  num="03"
                  title="Collabore & développe ton réseau"
                  desc="Échange via la messagerie intégrée, planifie tes événements dans ton agenda et accumule des avis après chaque collaboration pour renforcer ta crédibilité."
                />
              </div>
            </div>

            {/* Bloc décoratif droite */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-sm">

                {/* Carte principale */}
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center"><LsIcon name="mic" /></div>
                    <div>
                      <p className="text-sm font-semibold text-white">DJ Nova</p>
                      <p className="text-xs text-white/45">Paris · Disponible ce week-end</p>
                    </div>
                    <span className="ml-auto text-xs bg-green-500/15 text-green-400 border border-green-500/20 rounded-full px-2.5 py-0.5">Disponible</span>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {['House', 'Techno', 'Club'].map(tag => (
                      <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-white/8 text-white/60 border border-white/10">{tag}</span>
                    ))}
                  </div>
                  <div className="h-px bg-white/8 mb-4" />
                  <div className="flex items-center justify-between text-xs text-white/45">
                    <span className="flex items-center gap-1"><LsIcon name="star" size={13} tone="gold" /> 4.9 · 48 avis</span>
                    <span>127 abonnés</span>
                  </div>
                </div>

                {/* Badge flottant */}
                <div className="absolute -top-4 -right-4 rounded-xl border border-purple-500/30 bg-purple-600/20 backdrop-blur px-4 py-2.5 shadow-xl">
                  <p className="text-xs text-white/60">Nouvelle offre</p>
                  <p className="text-sm font-semibold text-white">Soirée Club · 14 juil.</p>
                </div>

                {/* Badge flottant bas */}
                <div className="absolute -bottom-4 -left-4 rounded-xl border border-white/10 bg-neutral-900/90 backdrop-blur px-4 py-2.5 shadow-xl">
                  <p className="flex items-center gap-1.5 text-xs text-white/60"><LsIcon name="message" size={14} />Message reçu</p>
                  <p className="text-sm font-semibold text-white">Club Nova t&apos;a contacté</p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION 5 — CTA FINAL
      ══════════════════════════════════════════════════ */}
      <section className="border-t border-white/8">
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28 overflow-hidden">

          {/* Glows décoratifs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-64 w-[600px] rounded-full bg-purple-600/15 blur-3xl" />
          </div>

          <div className="relative text-center flex flex-col items-center gap-6">
            <p className="text-xs text-purple-400 font-semibold tracking-widest uppercase">Rejoins la communauté</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight max-w-2xl">
              Prêt à faire partie de la scène ?
            </h2>
            <p className="text-white/55 max-w-md text-base">
              Crée ton profil gratuitement et commence à te connecter avec les acteurs de l&apos;événementiel dès aujourd&apos;hui.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center rounded-xl bg-purple-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-purple-500 transition shadow-lg shadow-purple-900/40 sm:w-auto"
              >
                Créer mon compte — c&apos;est gratuit
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-base text-white/70 hover:bg-white/10 hover:text-white transition sm:w-auto"
              >
                Se connecter
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════ */}
      <footer className="border-t border-white/8">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-white/40">
          <p>© {new Date().getFullYear()} LSBookers — Tous droits réservés.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/legal/terms" className="hover:text-white transition">Conditions</Link>
            <Link href="/legal/privacy" className="hover:text-white transition">Confidentialité</Link>
            <Link href="/legal/mentions" className="hover:text-white transition">Mentions légales</Link>
            <Link href="/contact" className="hover:text-white transition">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
