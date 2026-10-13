'use client'

/**
 * Corps d'un profil (sous l'en-tête), identique dans le Studio et le profil public.
 * Les blocs varient selon le rôle ; dans le Studio, les blocs vides invitent à compléter.
 */

import AgendaCalendar from '@/components/AgendaCalendar'
import ReviewsPanel from '@/components/ReviewsPanel'
import type { Offer } from '@/components/offers/OfferCard'
import ProfileContentTabs from './ProfileContentTabs'
import {
  CvIcon, FeesIcon, MapSection, OffersSection, SocialSection, SoundcloudSection, StylesSection, TextSection, VideoSection,
} from './ProfileSections'
import type { EditorSection, ProfileData, ProfileMode, ProfilePublication, ProfileRole } from './types'
import type { useProfilePublications } from '@/hooks/useProfilePublications'
import { ROLE_TEXT } from './utils'

type Props = {
  profile: ProfileData
  role: ProfileRole
  mode: ProfileMode
  pubs: ReturnType<typeof useProfilePublications<ProfilePublication>>
  offers: Offer[]
  viewer?: { role: string | null; profileId: number | null }
  isOwner?: boolean
  onEdit?: (section: EditorSection) => void
  onAddPublication?: () => void
  onDeletePublication?: (id: number) => void
  onPublishOffer?: () => void
  onDeleteOffer?: (offer: Offer) => void
}

export default function ProfileBody({
  profile, role, mode, pubs, offers, viewer, isOwner = false,
  onEdit, onAddPublication, onDeletePublication, onPublishOffer, onDeleteOffer,
}: Props) {
  const text = ROLE_TEXT[role]
  const section = { profile, mode, onEdit }
  const hasCareer = role !== 'ORGANIZER'
  const offersBlock = role !== 'ARTIST' && (
    <OffersSection offers={offers} mode={mode} onPublish={onPublishOffer} onDelete={onDeleteOffer} />
  )

  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="mt-6 grid grid-cols-1 gap-6 pb-16 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <TextSection title={text.about} value={profile.bio} emptyText="Présente-toi en quelques lignes." section="presentation" mode={mode} onEdit={onEdit} />
          <div id="agenda" className="scroll-mt-20">
            <AgendaCalendar
              profileId={profile.id}
              isOwner={false}
              showAvailability
              viewerRole={mode === 'public' ? viewer?.role ?? null : null}
              viewerProfileId={mode === 'public' ? viewer?.profileId ?? null : null}
            />
          </div>
          {role === 'ORGANIZER' && <MapSection {...section} />}
          <ProfileContentTabs
            profileId={profile.id}
            ownerUserId={profile.userId}
            role={role}
            mode={mode}
            pubs={pubs}
            onAdd={onAddPublication}
            onDelete={onDeletePublication}
          />
          {role === 'ORGANIZER' && offersBlock}
          {hasCareer && (
            <TextSection title="CV / Expérience" icon={CvIcon} value={profile.cvText} emptyText="Aucun CV renseigné." section="career" mode={mode} onEdit={onEdit} />
          )}
        </div>

        <aside className="min-w-0 space-y-5">
          <ReviewsPanel profileId={profile.id} isOwner={isOwner || mode === 'studio'} />
          {hasCareer && (
            <TextSection title={text.fees} icon={FeesIcon} value={profile.feeInfo} emptyText="Aucun tarif renseigné." section="career" mode={mode} onEdit={onEdit} />
          )}
          {role === 'ARTIST' && <StylesSection {...section} />}
          {role === 'ARTIST' && <SoundcloudSection {...section} />}
          <VideoSection {...section} />
          {role === 'PROVIDER' && offersBlock}
          <SocialSection {...section} />
        </aside>
      </div>
    </div>
  )
}
