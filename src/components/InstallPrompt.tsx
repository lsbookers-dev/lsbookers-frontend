'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import InstallGuide from '@/components/install/InstallGuide'
import { useInstall } from '@/lib/install'

const SNOOZE_KEY = 'lsb:install-prompt-snoozed-until'
const SNOOZE_DAYS = 7

/**
 * Petite fenêtre « Installer LS Bookers » en bas de l'écran (téléphone, tablette, ou ordinateur
 * quand le navigateur propose l'installation). « Plus tard » la cache pendant 7 jours.
 * Pas sur la landing, qui a déjà sa section d'installation.
 */
export default function InstallPrompt() {
  const pathname = usePathname()
  const { ready, platform, standalone, canPrompt, promptInstall } = useInstall()
  const [snoozed, setSnoozed] = useState(true)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    try {
      const until = Number(localStorage.getItem(SNOOZE_KEY) || 0)
      setSnoozed(Date.now() < until)
    } catch {
      setSnoozed(false)
    }
  }, [])

  const snooze = () => {
    try { localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 24 * 3600 * 1000)) } catch { /* stockage indisponible */ }
    setSnoozed(true)
    setShowGuide(false)
  }

  useEffect(() => {
    if (!showGuide) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowGuide(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showGuide])

  const mobile = platform === 'ios' || platform === 'android'
  if (!ready || standalone || pathname === '/' || (snoozed && !showGuide)) return null
  if (!mobile && !canPrompt) return null

  const install = async () => {
    if (canPrompt) { if (await promptInstall()) snooze() }
    else setShowGuide(true)
  }

  return (
    <>
      {!showGuide && (
        <div className="fixed bottom-20 left-4 right-4 z-[200] md:bottom-6 md:left-auto md:right-6 md:w-80">
          <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-surface/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <Image src="/icons/icon-192.png" alt="" width={44} height={44} className="shrink-0 rounded-xl ring-1 ring-white/10" unoptimized />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight text-white">Installer LS Bookers</p>
              <p className="mt-0.5 text-xs leading-tight text-white/50">Une icône sur votre écran d’accueil</p>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <button type="button" onClick={install} className="rounded-lg bg-accent-strong px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent">
                {canPrompt ? 'Installer' : 'Comment faire ?'}
              </button>
              <button type="button" onClick={snooze} className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10">
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center sm:p-4" onClick={() => setShowGuide(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Installer LS Bookers"
            onClick={e => e.stopPropagation()}
            className="relative max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/12 bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <Image src="/icons/icon-192.png" alt="" width={44} height={44} className="rounded-xl ring-1 ring-white/10" unoptimized />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">Installer LS Bookers</p>
                <p className="text-xs text-white/50">En trois gestes, sans App Store ni Play Store</p>
              </div>
              <button type="button" onClick={() => setShowGuide(false)} aria-label="Fermer" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 transition hover:bg-white/10 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <InstallGuide onInstalled={snooze} />
            <button type="button" onClick={snooze} className="mt-4 w-full rounded-xl bg-white/[0.06] py-3 text-sm text-white/60 transition hover:bg-white/10">
              Plus tard
            </button>
          </div>
        </div>
      )}
    </>
  )
}
