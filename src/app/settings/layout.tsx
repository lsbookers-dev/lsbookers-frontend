import type { ReactNode } from 'react'
import SettingsShell from '@/components/settings/SettingsShell'

export const metadata = { title: 'Réglages' }

export default function Layout({ children }: { children: ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>
}
