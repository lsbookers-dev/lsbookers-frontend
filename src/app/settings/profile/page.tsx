'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Ancienne adresse des réglages (liens et favoris existants) → nouvelle page Réglages */
export default function OldSettingsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/settings') }, [router])
  return null
}
