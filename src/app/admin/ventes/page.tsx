'use client'

// Admin › Ventes : commandes payées à valider, abonnés Pro et Business, codes promo (refonte du 31/10/2026)

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch } from '@/utils/auth'
import { API, PageHeader, SubTabs } from '@/components/admin/ui'
import { CodesTab, OrdersTab, SubscribersTab } from '@/components/admin/billingTabs'

type Tab = 'orders' | 'subscribers' | 'codes'

function SalesContent() {
  const params = useSearchParams()
  const router = useRouter()
  const initial = params.get('tab') as Tab
  const [tab, setTab] = useState<Tab>(['orders', 'subscribers', 'codes'].includes(initial) ? initial : 'subscribers')
  const [pending, setPending] = useState(0)
  useEffect(() => {
    apiFetch(`${API}/api/admin/badges`, { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(d => setPending(d?.sales || 0)).catch(() => {})
  }, [tab])
  const select = (t: Tab) => { setTab(t); router.replace(`/admin/ventes?tab=${t}`) }

  return (
    <div>
      <PageHeader title="Ventes" subtitle="Abonnés Pro et Business, services payants à valider, codes promo." />
      <SubTabs<Tab>
        value={tab}
        onChange={select}
        tabs={[
          { key: 'subscribers', label: 'Abonnés' },
          { key: 'orders', label: 'À valider', badge: pending },
          { key: 'codes', label: 'Codes promo' },
        ]}
      />
      {tab === 'subscribers' && <SubscribersTab />}
      {tab === 'orders' && <OrdersTab />}
      {tab === 'codes' && <CodesTab />}
    </div>
  )
}

export default function AdminSalesPage() {
  return <Suspense fallback={null}><SalesContent /></Suspense>
}
