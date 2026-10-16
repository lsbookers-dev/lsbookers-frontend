'use client'

import Image from 'next/image'

/**
 * Zone de publication de l'accueil (choix A1 d'Antho, 16/10/2026) : « Quoi de neuf ? » + « Publier ».
 * Les raccourcis Photo / Vidéo / Plusieurs photos ont été retirés à sa demande le même jour.
 */
export default function HomeComposer({ firstName, avatarUrl, onOpen }: {
  firstName?: string | null
  avatarUrl?: string | null
  onOpen: () => void
}) {
  return (
    <section className="mb-4 flex items-center gap-3 rounded-2xl border border-accent/30 bg-surface p-3 sm:p-3.5">
      <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-accent-strong to-accent-light text-xs font-bold text-white">
        {avatarUrl
          ? <Image src={avatarUrl} alt="" fill sizes="40px" className="object-cover" unoptimized />
          : (firstName?.[0]?.toUpperCase() || 'LS')}
      </span>
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 truncate rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-left text-sm text-white/45 transition hover:bg-white/[0.07] hover:text-white/65"
      >
        Quoi de neuf{firstName ? `, ${firstName}` : ''} ?
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="shrink-0 rounded-xl bg-accent-strong px-4 py-2.5 text-xs font-medium text-white transition hover:bg-accent"
      >
        Publier
      </button>
    </section>
  )
}
