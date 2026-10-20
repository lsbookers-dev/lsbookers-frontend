'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Check, Copy, MoreHorizontal, MoreVertical } from 'lucide-react'
import LsIcon from '@/components/ui/LsIcon'
import { useInstall, type InstallPlatform } from '@/lib/install'

/**
 * Guide d'installation de l'application (choix L2 d'Antho, 21/10/2026) :
 * onglets iPhone / iPad, Android, Ordinateur ; l'onglet de l'appareil du visiteur est choisi d'office.
 * Utilisé sur la landing et dans la petite fenêtre « Installer LS Bookers ».
 */

const TABS: { key: InstallPlatform; label: string }[] = [
  { key: 'ios', label: 'iPhone / iPad' },
  { key: 'android', label: 'Android' },
  { key: 'desktop', label: 'Ordinateur' },
]

/* ── Illustrations : écrans simplifiés, l'endroit où toucher est entouré d'or ── */
const Target = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center gap-1 rounded-md bg-accent-strong px-1.5 py-0.5 text-white ring-2 ring-gold ${className}`}>{children}</span>
)

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div aria-hidden="true" className="relative h-28 overflow-hidden rounded-xl border border-white/10 bg-[#1b1925] text-[11px] text-white/60">
      {children}
    </div>
  )
}

const IosShare = () => (
  <Screen>
    <div className="absolute inset-x-2 top-2 h-3 rounded bg-white/[0.06]" />
    <div className="absolute inset-x-2 top-7 h-12 rounded-lg bg-white/[0.04]" />
    <div className="absolute inset-x-2 bottom-2 flex h-7 items-center justify-around rounded-lg bg-[#2a2736]">
      <span>‹</span>
      <Target><LsIcon name="share" size={13} tone="inherit" /></Target>
      <MoreHorizontal size={14} />
    </div>
  </Screen>
)

const IosMenu = () => (
  <Screen>
    <div className="absolute inset-x-2 top-2 grid gap-1 rounded-lg bg-[#2a2736] p-1.5">
      <span className="px-1">Copier</span>
      <span className="px-1">Ajouter aux favoris</span>
      <Target className="justify-between"><span>Sur l’écran d’accueil</span><LsIcon name="plus" size={12} tone="inherit" /></Target>
      <span className="px-1">Imprimer</span>
    </div>
  </Screen>
)

const IosAdd = () => (
  <Screen>
    <div className="absolute inset-x-2 top-2 flex items-center justify-between">
      <span>Annuler</span>
      <Target>Ajouter</Target>
    </div>
    <div className="absolute inset-x-2 top-10 flex items-center gap-2 rounded-lg bg-white/[0.04] p-2">
      <Image src="/icons/icon-96.png" alt="" width={28} height={28} className="rounded-lg" unoptimized />
      <span className="text-white/80">LS Bookers</span>
    </div>
  </Screen>
)

const AndroidMenu = () => (
  <Screen>
    <div className="absolute inset-x-2 top-2 flex h-7 items-center justify-between rounded-lg bg-[#2a2736] px-2">
      <span className="truncate">lsbookers.com</span>
      <Target><MoreVertical size={13} /></Target>
    </div>
    <div className="absolute inset-x-2 top-11 h-14 rounded-lg bg-white/[0.04]" />
  </Screen>
)

const AndroidList = () => (
  <Screen>
    <div className="absolute right-2 top-2 grid w-[85%] gap-1 rounded-lg bg-[#2a2736] p-1.5">
      <span className="px-1">Nouvel onglet</span>
      <span className="px-1">Favoris</span>
      <Target><LsIcon name="phone" size={12} tone="inherit" /><span>Installer l’application</span></Target>
      <span className="px-1">Partager…</span>
    </div>
  </Screen>
)

const AndroidConfirm = () => (
  <Screen>
    <div className="absolute inset-x-3 top-4 rounded-lg bg-[#2a2736] p-2">
      <div className="flex items-center gap-2">
        <Image src="/icons/icon-96.png" alt="" width={24} height={24} className="rounded-md" unoptimized />
        <span className="text-white/80">Installer LS Bookers ?</span>
      </div>
      <div className="mt-2 flex justify-end gap-2"><span>Annuler</span><Target>Installer</Target></div>
    </div>
  </Screen>
)

type Step = { illus: React.ReactNode; title: React.ReactNode; hint: string }

const STEPS: Record<'ios' | 'android', Step[]> = {
  ios: [
    { illus: <IosShare />, title: <>Touchez <b className="font-semibold text-white">Partager</b></>, hint: 'Le carré avec une flèche : en bas de Safari sur iPhone, en haut à droite sur iPad. Pas visible ? Touchez d’abord « ··· ».' },
    { illus: <IosMenu />, title: <>Choisissez <b className="font-semibold text-white">Sur l’écran d’accueil</b></>, hint: 'Faites défiler la liste vers le bas si vous ne le voyez pas.' },
    { illus: <IosAdd />, title: <>Touchez <b className="font-semibold text-white">Ajouter</b></>, hint: 'L’icône LS Bookers apparaît sur votre écran d’accueil : ouvrez-la comme une application.' },
  ],
  android: [
    { illus: <AndroidMenu />, title: <>Ouvrez le <b className="font-semibold text-white">menu</b> du navigateur</>, hint: 'Les 3 points en haut à droite dans Chrome (en bas dans Samsung Internet).' },
    { illus: <AndroidList />, title: <>Touchez <b className="font-semibold text-white">Installer l’application</b></>, hint: 'Selon le téléphone : « Ajouter à l’écran d’accueil ».' },
    { illus: <AndroidConfirm />, title: <>Confirmez avec <b className="font-semibold text-white">Installer</b></>, hint: 'L’icône LS Bookers apparaît avec vos autres applications.' },
  ],
}

function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {steps.map((step, i) => (
        <li key={i} className="grid content-start gap-2.5 rounded-2xl border border-white/8 bg-surface p-3">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/25 text-xs font-semibold text-accent-light">{i + 1}</span>
          {step.illus}
          <p className="text-sm text-white/80">{step.title}</p>
          <p className="-mt-1.5 text-xs leading-relaxed text-white/40">{step.hint}</p>
        </li>
      ))}
    </ol>
  )
}

/** Ouvert dans Instagram, Facebook… : il faut d'abord passer par le vrai navigateur */
function InAppNotice({ app, platform }: { app: string; platform: InstallPlatform }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText('https://lsbookers.com')
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch { /* presse-papiers indisponible */ }
  }
  const browser = platform === 'ios' ? 'Safari' : 'Chrome'
  return (
    <div className="mb-4 rounded-2xl border border-gold/30 bg-gold/[0.07] p-4 text-sm text-gold-light">
      <p className="font-semibold">Vous êtes dans {app}</p>
      <p className="mt-1 text-xs leading-relaxed text-gold-light/80">
        L’installation n’est pas possible ici. Ouvrez la page dans {browser} : touchez « ··· » en haut de l’écran puis
        « Ouvrir dans le navigateur », ou copiez le lien et collez-le dans {browser}.
      </p>
      <button type="button" onClick={copy} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-accent-strong px-3.5 py-2 text-xs font-medium text-white transition hover:bg-accent">
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Lien copié' : 'Copier le lien'}
      </button>
    </div>
  )
}

export default function InstallGuide({ onInstalled }: { onInstalled?: () => void }) {
  const { ready, platform, inAppBrowser, canPrompt, promptInstall } = useInstall()
  // Aucun onglet tant que l'appareil n'est pas reconnu (évite d'afficher un instant le mauvais)
  const [tab, setTab] = useState<InstallPlatform | null>(null)
  const [showAndroidSteps, setShowAndroidSteps] = useState(false)

  // L'onglet de l'appareil du visiteur est choisi d'office
  useEffect(() => { if (ready) setTab(platform) }, [ready, platform])

  const install = async () => { if (await promptInstall()) onInstalled?.() }

  return (
    <div>
      <div role="tablist" aria-label="Choisir votre appareil" className="mb-4 flex flex-wrap gap-1.5 sm:gap-2">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-3 py-1.5 text-xs transition sm:px-4 sm:text-sm ${tab === t.key ? 'border-accent/50 bg-accent/20 text-white' : 'border-white/10 text-white/55 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {inAppBrowser && tab === platform && <InAppNotice app={inAppBrowser} platform={platform} />}

      {tab === 'ios' && <Steps steps={STEPS.ios} />}

      {tab === 'android' && (
        canPrompt && platform === 'android' && !showAndroidSteps ? (
          <div className="rounded-2xl border border-white/8 bg-surface p-5 text-center sm:text-left">
            <p className="text-sm text-white/80">Votre téléphone permet l’installation en un clic.</p>
            <button type="button" onClick={install} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-accent-strong px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent">
              <LsIcon name="phone" size={16} tone="inherit" /> Installer LS Bookers
            </button>
            <button type="button" onClick={() => setShowAndroidSteps(true)} className="mt-3 block text-xs text-white/40 underline-offset-2 hover:text-white/70 hover:underline sm:inline sm:ml-4">
              Le bouton ne fonctionne pas ? Voir les étapes
            </button>
          </div>
        ) : <Steps steps={STEPS.android} />
      )}

      {tab === 'desktop' && (
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-white/8 bg-surface p-5 sm:flex-row sm:items-center">
          <Image src="/install-qr.svg" alt="QR code vers lsbookers.com" width={132} height={132} className="rounded-xl" unoptimized />
          <div className="text-center sm:text-left">
            <p className="text-base font-semibold text-white">Scannez avec votre téléphone</p>
            <p className="mt-1 text-sm leading-relaxed text-white/50">
              Ouvrez l’appareil photo et visez le code : LS Bookers s’ouvre sur votre téléphone. Suivez ensuite les 3 étapes de l’onglet iPhone ou Android.
            </p>
            {canPrompt && platform === 'desktop' && (
              <button type="button" onClick={install} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/12 px-4 py-2 text-xs text-white/80 transition hover:bg-white/[0.06] hover:text-white">
                Installer aussi sur cet ordinateur
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
