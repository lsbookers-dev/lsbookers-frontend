'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * /settings : sur téléphone, la liste des rubriques (affichée par SettingsShell).
 * Sur ordinateur et tablette, on ouvre directement « Mon compte ».
 */
export default function SettingsIndexPage() {
  const router = useRouter()
  useEffect(() => {
    if (window.matchMedia('(min-width: 768px)').matches) router.replace('/settings/account')
  }, [router])
  return null
}
