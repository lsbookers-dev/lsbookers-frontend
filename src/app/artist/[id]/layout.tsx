import type { ReactNode } from 'react'
import { profileMetadata } from '@/lib/profileMetadata'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return profileMetadata(id, 'Artiste')
}

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
