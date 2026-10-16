'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import LsIcon from '@/components/ui/LsIcon'

export type Announcement = { text: string; url: string }

const DISMISS_KEY = 'lsb:announcement-dismissed'
// Une annonce fermée ne revient pas ; une nouvelle annonce (texte ou lien différent) réapparaît
const announcementKey = (a: Announcement) => `${a.text}|${a.url}`

/**
 * Annonce LS Bookers au centre de l'en-tête (choix B6), écrite dans Admin › Paramètres.
 * `preview` : aperçu dans l'admin (toujours visible, lien inactif).
 */
export default function HeaderAnnouncement({ announcement, preview = false }: { announcement: Announcement | null; preview?: boolean }) {
  const [dismissed, setDismissed] = useState<string | null>(null)

  useEffect(() => {
    try { setDismissed(localStorage.getItem(DISMISS_KEY)) } catch { /* stockage indisponible */ }
  }, [])

  if (!announcement?.text || (!preview && dismissed === announcementKey(announcement))) return null

  const close = () => {
    const key = announcementKey(announcement)
    setDismissed(key)
    try { localStorage.setItem(DISMISS_KEY, key) } catch { /* stockage indisponible */ }
  }

  const external = announcement.url.startsWith('https://')
  const cta = <span className="shrink-0 font-semibold text-white">Voir</span>
  const content = (
    <>
      <LsIcon name="bolt" size={15} tone="accent" />
      <span className="min-w-0 truncate">{announcement.text}</span>
      {announcement.url && cta}
    </>
  )
  const linkClass = 'flex min-w-0 items-center gap-2 py-1.5 pl-3'

  return (
    <div className={`min-w-0 flex-1 justify-center ${preview ? 'flex' : 'hidden md:flex'}`}>
      <div className="flex min-w-0 max-w-xl items-center gap-1 rounded-full border border-accent/35 bg-accent/10 pr-1 text-xs text-accent-light">
        {!announcement.url || preview ? (
          <span className={linkClass}>{content}</span>
        ) : external ? (
          <a href={announcement.url} target="_blank" rel="noopener noreferrer" className={`${linkClass} transition hover:text-white`}>{content}</a>
        ) : (
          <Link href={announcement.url} className={`${linkClass} transition hover:text-white`}>{content}</Link>
        )}
        <button type="button" onClick={preview ? undefined : close} aria-label="Fermer l'annonce" className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white">
          <X size={13} />
        </button>
      </div>
    </div>
  )
}
