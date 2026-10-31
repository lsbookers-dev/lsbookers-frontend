'use client'

// Admin : fermeture de la session après 1 h sans aucune activité (souris, clavier, toucher).
// Les rafraîchissements automatiques des pastilles ne comptent pas comme une activité.
// L'heure de la dernière activité est partagée entre les onglets ouverts.

import { useEffect, useRef } from 'react'

const IDLE_MS = 60 * 60 * 1000
const STORAGE_KEY = 'lsb_admin_activity'
const EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'] as const

function readLast(): number {
  try { return Number(localStorage.getItem(STORAGE_KEY)) || 0 } catch { return 0 }
}

export function useAdminIdleLogout(onIdle: () => void, enabled = true) {
  // Dernière version du rappel, sans relancer le minuteur à chaque affichage
  const onIdleRef = useRef(onIdle)
  useEffect(() => { onIdleRef.current = onIdle }, [onIdle])

  useEffect(() => {
    if (!enabled) return
    let last = Date.now()
    let lastSaved = 0
    try { localStorage.setItem(STORAGE_KEY, String(last)) } catch { }

    const markActive = () => {
      last = Date.now()
      // Écrit au plus toutes les 15 s (pointermove arrive très souvent)
      if (last - lastSaved > 15_000) {
        lastSaved = last
        try { localStorage.setItem(STORAGE_KEY, String(last)) } catch { }
      }
    }
    const check = () => {
      const latest = Math.max(last, readLast())
      if (Date.now() - latest > IDLE_MS) onIdleRef.current()
    }
    const onVisible = () => { if (document.visibilityState === 'visible') check() }

    EVENTS.forEach(e => window.addEventListener(e, markActive, { passive: true }))
    document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(check, 30_000)
    return () => {
      EVENTS.forEach(e => window.removeEventListener(e, markActive))
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [enabled])
}
