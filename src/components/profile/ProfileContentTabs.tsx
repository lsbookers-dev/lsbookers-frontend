'use client'

/** Onglets Publications (ou Réalisations) / Albums / Identifications d'un profil. */

import { useState } from 'react'
import { Plus } from 'lucide-react'
import PublicationsSection from '@/components/PublicationsSection'
import AlbumsTab from '@/components/AlbumsTab'
import TaggedPublicationsTab from '@/components/TaggedPublicationsTab'
import { getAuthToken } from '@/utils/auth'
import type { useProfilePublications } from '@/hooks/useProfilePublications'
import type { ProfileMode, ProfilePublication, ProfileRole } from './types'
import { ROLE_TEXT } from './utils'

type Tab = 'publications' | 'albums' | 'identifications'

type Props = {
  profileId: number
  ownerUserId: number
  role: ProfileRole
  mode: ProfileMode
  pubs: ReturnType<typeof useProfilePublications<ProfilePublication>>
  onAdd?: () => void
  onDelete?: (id: number) => void
}

export default function ProfileContentTabs({ profileId, ownerUserId, role, mode, pubs, onAdd, onDelete }: Props) {
  const [tab, setTab] = useState<Tab>('publications')
  const isOwner = mode === 'studio'
  const tabs: { key: Tab; label: string }[] = [
    { key: 'publications', label: ROLE_TEXT[role].publications },
    { key: 'albums', label: 'Albums' },
    { key: 'identifications', label: 'Identifications' },
  ]

  return (
    <section className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-xl bg-white/[0.04] p-1" role="tablist">
          {tabs.map(item => (
            <button key={item.key} type="button" role="tab" aria-selected={tab === item.key} onClick={() => setTab(item.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${tab === item.key ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white'}`}>
              {item.label}
            </button>
          ))}
        </div>
        {isOwner && tab === 'publications' && onAdd && (
          <button type="button" onClick={onAdd} className="flex items-center gap-1 rounded-full bg-violet-600 px-3 py-1.5 text-xs text-white transition hover:bg-violet-500">
            <Plus size={13} /> Ajouter
          </button>
        )}
      </div>

      {tab === 'publications' && (
        <PublicationsSection
          title={ROLE_TEXT[role].publications}
          publications={pubs.publications}
          total={pubs.total}
          hasMore={pubs.hasMore}
          loadingMore={pubs.loadingMore}
          onLoadMore={pubs.loadMore}
          isOwner={isOwner}
          ownerUserId={ownerUserId}
          onDelete={onDelete}
        />
      )}
      {tab === 'albums' && (
        <AlbumsTab
          profileId={profileId}
          isOwner={isOwner}
          token={isOwner ? getAuthToken() ?? '' : ''}
          accent={ROLE_TEXT[role].accent}
          publications={pubs.publications}
        />
      )}
      {tab === 'identifications' && <TaggedPublicationsTab profileId={profileId} />}
    </section>
  )
}
