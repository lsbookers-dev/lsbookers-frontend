'use client'

import { useParams } from 'next/navigation'
import PublicProfile from '@/components/profile/PublicProfile'

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>()
  return <PublicProfile userId={id} />
}
