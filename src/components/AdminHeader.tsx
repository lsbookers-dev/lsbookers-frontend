// src/components/AdminHeader.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NavLink = ({ href, label }: { href: string; label: string }) => {
  const pathname = usePathname()
  const active = pathname === href
  return (
    <Link
      href={href}
      className={`block px-4 py-2 rounded border ${
        active ? 'border-white/30 bg-white/10' : 'border-white/10 hover:bg-white/10'
      }`}
    >
      {label}
    </Link>
  )
}

export default function AdminHeader() {
  return (
    <header className="border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <h1 className="text-xl font-semibold mb-3">LSBookers — Admin</h1>
        <nav className="flex gap-2 text-sm">
          <NavLink href="/admin/dashboard" label="Dashboard" />
          <NavLink href="/admin/users" label="Utilisateurs" />
          <NavLink href="/admin/subscriptions" label="Abonnements" />
          <NavLink href="/admin/stats" label="Statistiques" />
          <NavLink href="/admin/settings" label="Paramètres" />
        </nav>
      </div>
    </header>
  )
}