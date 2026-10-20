'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { useFeedback } from '@/components/ui/Feedback'

/**
 * Bandeau affiché sur toutes les pages tant que le compte est en pause (Réglages › Mes données),
 * avec un bouton pour le réactiver.
 */
export default function PausedAccountBanner() {
  const pathname = usePathname()
  const { notify } = useFeedback()
  const [paused, setPaused] = useState(false)
  const [busy, setBusy] = useState(false)

  const check = useCallback(() => {
    apiFetch(apiUrl('account/settings'), { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => setPaused(!!d?.settings?.pausedAt))
      .catch(() => {})
  }, [])

  useEffect(() => {
    check()
    window.addEventListener('lsb:account-pause-changed', check)
    return () => window.removeEventListener('lsb:account-pause-changed', check)
  }, [check])

  if (!paused || pathname.startsWith('/messages')) return null

  const resume = async () => {
    setBusy(true)
    try {
      const res = await apiFetch(apiUrl('account/resume'), { method: 'POST' })
      if (!res.ok) throw new Error()
      setPaused(false)
      window.dispatchEvent(new Event('lsb:account-pause-changed'))
      notify('Votre compte est de nouveau visible')
    } catch {
      notify('Impossible de réactiver le compte. Réessayez.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-4 pt-3 md:px-6">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-gold/[0.07] px-4 py-3 text-sm text-gold-light">
        <span>Votre compte est en pause : votre profil et vos publications sont invisibles pour les autres membres.</span>
        <button type="button" onClick={resume} disabled={busy} className="rounded-xl bg-accent-strong px-4 py-2 text-xs font-medium text-white transition hover:bg-accent disabled:opacity-50">
          {busy ? '…' : 'Réactiver'}
        </button>
      </div>
    </div>
  )
}
