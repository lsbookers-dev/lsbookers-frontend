'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS]               = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed]       = useState(false)
  const [mounted, setMounted]           = useState(false)

  useEffect(() => {
    setMounted(true)
    // Déjà installée ?
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
    )
    // iOS ?
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
    setIsIOS(ios)
    // Déjà fermée cette session ?
    const wasDismissed = sessionStorage.getItem('pwa-prompt-dismissed')
    if (wasDismissed) setDismissed(true)

    // Capture du prompt Android
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') {
      setInstallEvent(null)
      setDismissed(true)
    }
  }

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-prompt-dismissed', '1')
    setDismissed(true)
    setShowIOSGuide(false)
  }

  if (!mounted || isStandalone || dismissed) return null
  if (!installEvent && !isIOS) return null

  return (
    <>
      {/* ── Bannière flottante en bas ── */}
      {!showIOSGuide && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[200] animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-neutral-900/95 backdrop-blur-2xl p-3 shadow-2xl shadow-black/50">
            {/* Icône app */}
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/10">
              <Image src="/icons/icon-192.png" alt="LSBookers" width={48} height={48} unoptimized />
            </div>

            {/* Texte */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">Installer LSBookers</p>
              <p className="text-xs text-white/50 leading-tight mt-0.5">Accès rapide depuis votre écran</p>
            </div>

            {/* Boutons */}
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              {installEvent ? (
                <button
                  onClick={handleInstall}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition"
                >
                  Installer
                </button>
              ) : isIOS ? (
                <button
                  onClick={() => setShowIOSGuide(true)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition"
                >
                  Comment ?
                </button>
              ) : null}
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 bg-white/8 hover:bg-white/15 text-white/60 text-xs rounded-lg transition"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Guide iOS (modal) ── */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center p-4 pb-8">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowIOSGuide(false)}
          />
          <div className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-neutral-900/98 backdrop-blur-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-white/10">
                <Image src="/icons/icon-192.png" alt="LSBookers" width={48} height={48} unoptimized />
              </div>
              <div>
                <p className="font-bold text-white">Installer LSBookers</p>
                <p className="text-xs text-white/50">sur votre iPhone / iPad</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {[
                { step: '1', icon: '⬆️', text: 'Appuyez sur le bouton Partager en bas de Safari' },
                { step: '2', icon: '➕', text: 'Faites défiler et appuyez sur « Sur l\'écran d\'accueil »' },
                { step: '3', icon: '✅', text: 'Appuyez sur « Ajouter » en haut à droite' },
              ].map(({ step, icon, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-sm flex-shrink-0">
                    <span>{icon}</span>
                  </div>
                  <p className="text-sm text-white/75 leading-relaxed pt-1">{text}</p>
                </div>
              ))}
            </div>

            {/* Indicateur flèche vers le bas (Safari share button) */}
            <div className="flex flex-col items-center gap-2 mb-5">
              <div className="h-px w-full bg-white/10" />
              <p className="text-xs text-white/30 text-center">
                Le bouton Partager ressemble à ça →{' '}
                <span className="text-white/60">⬆️</span>
              </p>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full py-3 rounded-xl bg-white/8 hover:bg-white/15 text-white/60 text-sm font-medium transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  )
}
