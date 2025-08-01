'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import AdminHeader from '@/components/AdminHeader'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.replace('/login')
    } else if (user.role !== 'ADMIN') {
      router.replace('/home')
    }
  }, [user, router])

  if (!user || user.role !== 'ADMIN') return null

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminHeader />
      <main className="p-6">{children}</main>
    </div>
  )
}