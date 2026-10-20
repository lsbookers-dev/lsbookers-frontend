'use client'

import Link from 'next/link'
import { SettingRow, SettingsCard, SettingsTitle } from '@/components/settings/ui'

/** Réglages › Abonnement et paiements (factures et coordonnées bancaires : avec le paiement en ligne, étape Stripe) */
export default function SubscriptionSettingsPage() {
  return (
    <>
      <SettingsTitle title="Abonnement et paiements" description="Votre formule LS Bookers et, bientôt, vos paiements." />

      <SettingsCard>
        <SettingRow label="Votre formule" description="Formule gratuite. Les formules Pro arrivent avec le paiement en ligne.">
          <Link href="/subscriptions" className="text-xs text-accent-light hover:text-white">Voir les formules</Link>
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Paiements et factures" description="Le paiement en ligne des bookings arrive prochainement. Vous retrouverez ici vos factures LS Bookers, votre moyen de paiement et le compte bancaire qui reçoit vos cachets.">
        <p className="text-xs text-white/35">Rien à régler pour l’instant.</p>
      </SettingsCard>
    </>
  )
}
