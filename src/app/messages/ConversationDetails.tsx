'use client'

import Link from 'next/link'
import { CalendarDays, ExternalLink, UserRound } from 'lucide-react'
import { Avatar } from './MessageUI'
import { ROLE_LABEL } from './_helpers'
import type { Conversation } from './types'

export default function ConversationDetails({
  conversation,
  currentUserId,
}: {
  conversation: Conversation | null
  currentUserId: number | null
}) {
  const participant = conversation?.participants.find((item) => item.id !== currentUserId)
    ?? conversation?.participants[0]

  if (!participant) {
    return null
  }

  const rolePath = participant.role === 'ARTIST'
    ? 'artist'
    : participant.role === 'ORGANIZER'
      ? 'organizer'
      : 'provider'

  return (
    <aside className="lsb-conversation-details hidden xl:flex">
      <div className="lsb-details-profile">
        <Avatar src={participant.profile?.avatar || ''} alt={participant.name} size={68} />
        <h2>{participant.name}</h2>
        <p>{ROLE_LABEL[participant.role]}</p>
        <Link href={`/${rolePath}/${participant.id}`} className="lsb-details-profile-link">
          Voir le profil <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="lsb-details-section">
        <span>CONVERSATION</span>
        <div><CalendarDays className="w-4 h-4" /> Mise à jour {new Date(conversation!.updatedAt).toLocaleDateString('fr-FR')}</div>
        <div><UserRound className="w-4 h-4" /> {ROLE_LABEL[participant.role]}</div>
      </div>
    </aside>
  )
}
