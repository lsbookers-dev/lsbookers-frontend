'use client'

import { useRef } from 'react'
import Image from 'next/image'
import LsIcon, { type LsIconName } from '@/components/ui/LsIcon'

type Shortcut = { key: string; label: string; icon: LsIconName; accept: string; multiple: boolean }

const SHORTCUTS: Shortcut[] = [
  { key: 'photo',  label: 'Photo',            icon: 'image',  accept: 'image/jpeg,image/png,image/webp,image/gif', multiple: false },
  { key: 'video',  label: 'Vidéo',            icon: 'video',  accept: 'video/mp4,video/quicktime,video/webm,video/ogg', multiple: false },
  { key: 'photos', label: 'Plusieurs photos', icon: 'camera', accept: 'image/jpeg,image/png,image/webp,image/gif', multiple: true },
]

/**
 * Zone de publication de l'accueil (choix A1 d'Antho, 16/10/2026) : « Quoi de neuf ? » + raccourcis.
 * Un raccourci ouvre d'abord le choix de fichiers, puis la fenêtre de publication avec ces fichiers.
 */
export default function HomeComposer({ firstName, avatarUrl, onOpen }: {
  firstName?: string | null
  avatarUrl?: string | null
  onOpen: (files?: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const pick = (shortcut: Shortcut) => {
    const input = inputRef.current
    if (!input) return onOpen()
    input.accept = shortcut.accept
    input.multiple = shortcut.multiple
    input.value = ''
    input.click()
  }

  return (
    <section className="mb-4 rounded-2xl border border-accent/30 bg-surface p-3 sm:p-3.5">
      <div className="flex items-center gap-3">
        <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-accent-strong to-accent-light text-xs font-bold text-white">
          {avatarUrl
            ? <Image src={avatarUrl} alt="" fill sizes="40px" className="object-cover" unoptimized />
            : (firstName?.[0]?.toUpperCase() || 'LS')}
        </span>
        <button
          type="button"
          onClick={() => onOpen()}
          className="min-w-0 flex-1 truncate rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-left text-sm text-white/45 transition hover:bg-white/[0.07] hover:text-white/65"
        >
          Quoi de neuf{firstName ? `, ${firstName}` : ''} ?
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2 sm:pl-[3.25rem]">
        {SHORTCUTS.map(s => (
          <button
            key={s.key}
            type="button"
            onClick={() => pick(s)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/75 transition hover:border-accent/40 hover:bg-accent/10 hover:text-white"
          >
            <LsIcon name={s.icon} size={15} tone="accent" />
            {s.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onOpen()}
          className="ml-auto rounded-xl bg-accent-strong px-4 py-2 text-xs font-medium text-white transition hover:bg-accent"
        >
          Publier
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={e => {
          const files = e.target.files ? Array.from(e.target.files) : []
          if (files.length) onOpen(files)
        }}
      />
    </section>
  )
}
