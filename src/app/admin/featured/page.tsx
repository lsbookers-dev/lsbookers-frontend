import { redirect } from 'next/navigation'

// Déplacé dans Admin › Vitrine (refonte du 31/10/2026)
export default function Page() {
  redirect('/admin/vitrine?tab=carousel')
}
