'use client'

/** Artiste / prestataire : son lien de booking à partager (bio Instagram, signature e-mail…). */

import { useEffect, useState } from 'react'
import LsIcon from '@/components/ui/LsIcon'
import { useFeedback } from '@/components/ui/Feedback'
import { SpacePanel } from './ui'

export default function BookingLinkCard({ userId, name }: { userId: number | string; name: string }) {
  const { notify } = useFeedback()
  const [origin, setOrigin] = useState('https://lsbookers.com')
  useEffect(() => { setOrigin(window.location.origin) }, [])
  const link = `${origin}/b/${userId}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      notify('Lien copié')
    } catch {
      notify('Copie impossible : sélectionnez le lien pour le copier.', 'error')
    }
  }

  const share = async () => {
    if (!navigator.share) return copy()
    try { await navigator.share({ title: `${name} sur LS Bookers`, text: 'Mes disponibilités et ma demande de booking', url: link }) } catch { /* partage annulé */ }
  }

  return (
    <SpacePanel kicker="Visibilité" title="Mon lien de booking">
      <p className="text-xs text-muted">Mettez-le dans votre bio Instagram, votre signature e-mail ou vos messages : on y voit votre profil, et on vous demande une date en deux clics.</p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 select-all truncate rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-accent-light">{link.replace(/^https?:\/\//, '')}</code>
        <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong">
          <LsIcon name="document" size={16} tone="inherit" />Copier
        </button>
        <button type="button" onClick={share} className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2.5 text-sm text-white/80 transition hover:text-white">
          <LsIcon name="share" size={16} tone="inherit" />Partager
        </button>
      </div>
    </SpacePanel>
  )
}
