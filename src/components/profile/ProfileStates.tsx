'use client'

/** Écran de chargement et écran « profil introuvable », communs aux pages profil. */

import Link from 'next/link'
import { UserX } from 'lucide-react'

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen text-white lsb-profile-page" aria-busy="true" aria-label="Chargement du profil">
      <div className="h-48 animate-pulse bg-white/[0.04] sm:h-56 md:h-64 lg:h-72" />
      <div className="mx-auto max-w-6xl px-4">
        <div className="relative -mt-12 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5">
          <div className="flex items-center gap-4">
            <div className="h-[82px] w-[82px] animate-pulse rounded-xl bg-white/[0.08]" />
            <div className="space-y-2">
              <div className="h-5 w-40 animate-pulse rounded bg-white/[0.08]" />
              <div className="h-3 w-56 animate-pulse rounded bg-white/[0.06]" />
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            {[0, 1].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl bg-white/[0.04]" />)}
          </div>
          <div className="space-y-5">
            {[0, 1, 2].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" />)}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProfileUnavailable({ title, message, action }: {
  title: string
  message: string
  action?: { href: string; label: string }
}) {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 text-white">
      <div className="max-w-sm text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.05] text-white/40"><UserX size={26} /></span>
        <h1 className="mt-4 text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-white/50">{message}</p>
        {action && (
          <Link href={action.href} className="mt-5 inline-block rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">{action.label}</Link>
        )}
      </div>
    </div>
  )
}
