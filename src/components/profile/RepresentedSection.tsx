'use client'

/**
 * Profil public d'une agence (formule Agence) : ses profils gérés.
 * « Artistes représentés » s'il n'y a que des artistes, « Nos lieux » que des organisateurs, sinon « Nos profils ».
 */

import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import type { RepresentedProfile } from './types'
import { publicProfileHref } from './utils'

export default function RepresentedSection({ title, profiles }: { title: string; profiles: RepresentedProfile[] }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-surface p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[.14em] text-accent-light">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {profiles.map(p => {
          const href = publicProfileHref(p.role, p.userId)
          const card = (
            <>
              <SafeImage type="avatar" src={p.avatar} name={p.name} size={52} />
              <span className="mt-2 block truncate text-sm font-semibold text-white">{p.name}</span>
              <span className="block truncate text-xs text-white/45">{[p.specialty, p.location].filter(Boolean).join(' · ') || ' '}</span>
            </>
          )
          return href ? (
            <Link key={p.profileId} href={href} className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center transition hover:border-accent/40 hover:bg-accent/10">{card}</Link>
          ) : (
            <div key={p.profileId} className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">{card}</div>
          )
        })}
      </div>
    </section>
  )
}
