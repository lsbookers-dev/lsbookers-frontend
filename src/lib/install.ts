'use client'

/**
 * Installation de l'application (écran d'accueil) : reconnaissance de l'appareil et bouton
 * « Installer » natif (Chrome / Edge, Android et ordinateur).
 *
 * Le navigateur n'envoie l'événement « beforeinstallprompt » qu'une seule fois par page :
 * il est gardé ici pour que la landing et la petite fenêtre d'installation puissent s'en servir.
 */
import { useEffect, useState } from 'react'

export type InstallPlatform = 'ios' | 'android' | 'desktop'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach(fn => fn())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

export function detectPlatform(ua: string): InstallPlatform {
  // iPadOS se présente comme un Mac : on le reconnaît à l'écran tactile
  const iPadAsMac = /Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1
  if (/iPhone|iPad|iPod/.test(ua) || iPadAsMac) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

/** Navigateur intégré d'une application (Instagram, Facebook, TikTok…) : l'installation y est impossible */
export function detectInAppBrowser(ua: string): string | null {
  if (/Instagram/i.test(ua)) return 'Instagram'
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'Facebook'
  if (/musical_ly|BytedanceWebview|TikTok/i.test(ua)) return 'TikTok'
  if (/Snapchat/i.test(ua)) return 'Snapchat'
  if (/LinkedInApp/i.test(ua)) return 'LinkedIn'
  return null
}

export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
}

/** État d'installation : appareil, navigateur intégré, appli déjà installée, bouton natif disponible */
export function useInstall() {
  const [state, setState] = useState({
    ready: false,
    platform: 'desktop' as InstallPlatform,
    inAppBrowser: null as string | null,
    standalone: false,
    canPrompt: false,
  })

  useEffect(() => {
    const ua = navigator.userAgent
    const update = () => setState({
      ready: true,
      platform: detectPlatform(ua),
      inAppBrowser: detectInAppBrowser(ua),
      standalone: isStandaloneDisplay(),
      canPrompt: !!deferredPrompt,
    })
    update()
    listeners.add(update)
    return () => { listeners.delete(update) }
  }, [])

  /** Ouvre la fenêtre d'installation du navigateur ; vrai si le visiteur a accepté */
  const promptInstall = async () => {
    if (!deferredPrompt) return false
    const event = deferredPrompt
    await event.prompt()
    const { outcome } = await event.userChoice
    deferredPrompt = null
    notify()
    return outcome === 'accepted'
  }

  return { ...state, promptInstall }
}
