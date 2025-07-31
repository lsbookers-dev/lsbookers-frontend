'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminHeader() {
  const pathname = usePathname()

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard' }, 
    { label: 'Paramètres du site', path: '/admin/settings' },
    { label: 'Utilisateurs', path: '/admin/users' },
    { label: 'Abonnements', path: '/admin/subscriptions' },
    { label: 'Statistiques', path: '/admin/stats' },
    { label: 'Déconnexion', path: '/login' },
  ]

  return (
    <header className="bg-gray-900 text-white p-4 shadow flex items-center justify-between">
      <div className="text-xl font-bold">LSBookers Admin</div>
      <nav className="space-x-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`hover:underline ${
              pathname === item.path ? 'text-yellow-400 font-semibold' : ''
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}