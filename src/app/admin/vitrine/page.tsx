'use client'

// Admin › Vitrine : ce qui est mis en avant pour tous les membres — carrousel de l'accueil
// et publications LS Bookers dans le fil (refonte du 31/10/2026)

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader, SubTabs } from '@/components/admin/ui'
import CarouselPanel from '@/components/admin/CarouselPanel'
import PublicationsPanel from '@/components/admin/PublicationsPanel'

type Tab = 'carousel' | 'posts'

function ShowcaseContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'posts' ? 'posts' : 'carousel')
  const select = (t: Tab) => { setTab(t); router.replace(`/admin/vitrine?tab=${t}`) }
  return (
    <div>
      <PageHeader title="Vitrine" subtitle="Ce que tous les membres voient mis en avant : carrousel de l'accueil et publications LS Bookers." />
      <SubTabs<Tab> value={tab} onChange={select} tabs={[{ key: 'carousel', label: "Carrousel de l'accueil" }, { key: 'posts', label: 'Publications LS Bookers' }]} />
      {tab === 'carousel' ? <CarouselPanel /> : <PublicationsPanel />}
    </div>
  )
}

export default function AdminShowcasePage() {
  return <Suspense fallback={null}><ShowcaseContent /></Suspense>
}
