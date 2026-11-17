import Link from 'next/link'
import type { ReactNode } from 'react'
import { LEGAL_VERSION_LABEL } from '@/content/legal'

/** Mise en page commune des pages légales : titre, date de version, liens entre les deux pages */
export default function LegalPage({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="lsb-page text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-xs text-white/45 transition hover:text-white">← LS Bookers</Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-white/45">{LEGAL_VERSION_LABEL}</p>
        {aside}
        <div className="mt-6 text-[15px]">{children}</div>
        <nav className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-sm text-white/50" aria-label="Informations légales">
          <Link href="/legal/mentions" className="hover:text-white">Mentions légales</Link>
          <Link href="/legal/conditions" className="hover:text-white">Conditions et confidentialité</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </nav>
      </div>
    </div>
  )
}
