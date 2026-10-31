import { redirect } from 'next/navigation'

// Les statistiques sont maintenant sur l'Accueil de l'admin (refonte du 31/10/2026)
export default function AdminStatsPage() {
  redirect('/admin/dashboard')
}
