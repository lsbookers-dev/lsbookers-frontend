'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { apiFetch } from '@/utils/auth'
import { X } from 'lucide-react'
import LsIcon from '@/components/ui/LsIcon'

export type Announcement = { text: string; url: string }

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
const DISMISS_KEY = 'lsb:announcement-dismissed'
// Une annonce fermée ne revient pas ; une nouvelle annonce (texte ou lien différent) réapparaît
const announcementKey = (a: Announcement) => `${a.text}|${a.url}`

/**
 * Annonce LS Bookers au centre de l'en-tête (choix B6), écrite dans Admin › Paramètres.
 * `preview` : aperçu dans l'admin (toujours visible, lien inactif).
 */
export default function HeaderAnnouncement({ announcement, preview = false, mobile = false }: { announcement: Announcement | null; preview?: boolean; mobile?: boolean }) {
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
      <span className={`min-w-0 ${mobile ? 'line-clamp-2' : 'truncate'}`}>{announcement.text}</span>
      {announcement.url && cta}
    </>
  )
  const linkClass = `flex min-w-0 flex-1 items-center gap-2 pl-3 ${mobile ? 'py-2.5' : 'py-1.5'}`

  return (
    <div className={mobile ? 'px-4 pt-3 md:hidden' : `min-w-0 flex-1 justify-center ${preview ? 'flex' : 'hidden md:flex'}`}>
      <div className={`flex min-w-0 items-center gap-1 border border-accent/35 bg-accent/10 pr-1 text-xs text-accent-light ${mobile ? 'rounded-2xl' : 'max-w-xl rounded-full'}`}>
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

/**
 * Version téléphone : l'en-tête n'existe pas sur téléphone, l'annonce s'affiche en haut de la page
 * (sauf dans Messages, où la conversation occupe tout l'écran).
 */
export function MobileAnnouncement() {
  const pathname = usePathname()
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)

  useEffect(() => {
    apiFetch(`${API_BASE}/api/admin/settings`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => setAnnouncement(d?.announcementActive && d.announcementText ? { text: d.announcementText, url: d.announcementUrl || '' } : null))
      .catch(() => {})
  }, [])

  if (pathname.startsWith('/messages')) return null
  return <HeaderAnnouncement announcement={announcement} mobile />
}
