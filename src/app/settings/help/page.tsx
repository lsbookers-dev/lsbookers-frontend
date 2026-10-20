'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { SettingsCard, SettingsTitle } from '@/components/settings/ui'

const LinkRow = ({ href, label, description }: { href: string; label: string; description?: string }) => (
  <Link href={href} className="flex items-center gap-3 border-t border-white/[0.06] py-3 first:border-t-0 first:pt-0 last:pb-0 transition hover:text-white">
    <span className="min-w-0 flex-1">
      <span className="block text-sm text-white/90">{label}</span>
      {description && <span className="block text-xs text-white/45">{description}</span>}
    </span>
    <ChevronRight size={16} className="text-white/30" />
  </Link>
)

/** Réglages › Aide et informations légales */
export default function HelpSettingsPage() {
  return (
    <>
      <SettingsTitle title="Aide et informations légales" description="Besoin d’aide, ou d’une information sur vos droits ?" />

      <SettingsCard title="Nous contacter">
        <LinkRow href="/contact?sujet=probleme" label="Signaler un problème" description="Un bug, une page qui ne s’affiche pas correctement…" />
        <LinkRow href="/contact?sujet=compte" label="Une question sur mon compte" />
        <LinkRow href="/contact?sujet=abus" label="Signaler un abus" description="Un comportement ou un contenu qui ne respecte pas les règles" />
        <LinkRow href="/contact?sujet=donnees" label="Une question sur mes données personnelles" description="Accès, correction, suppression de vos données" />
      </SettingsCard>

      <SettingsCard title="Informations légales" description="Les textes définitifs sont en cours de rédaction et seront publiés avant le lancement.">
        <LinkRow href="/legal/terms" label="Conditions générales d’utilisation" />
        <LinkRow href="/legal/privacy" label="Politique de confidentialité" />
        <LinkRow href="/legal/mentions" label="Mentions légales" />
      </SettingsCard>

      <p className="px-1 text-xs text-white/30">LS Bookers · version bêta</p>
    </>
  )
}
