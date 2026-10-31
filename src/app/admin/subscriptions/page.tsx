import { redirect } from 'next/navigation'

// Ancienne page « Offres » (refonte du 31/10/2026) : chaque onglet a trouvé sa place
export default async function AdminOffersRedirect({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  if (tab === 'settings') redirect('/admin/settings?tab=rules')
  if (tab === 'extras') redirect('/admin/settings?tab=services')
  if (tab === 'cancellations') redirect('/admin/users?status=watch')
  redirect(`/admin/ventes${tab === 'orders' || tab === 'codes' ? `?tab=${tab}` : ''}`)
}
