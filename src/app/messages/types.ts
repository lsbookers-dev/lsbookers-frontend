// messages/types.ts — Tous les types partagés de la messagerie

export type Role = 'ARTIST' | 'ORGANIZER' | 'PROVIDER'

export interface Participant {
  id: number
  name: string
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  role: Role
  profile?: { avatar?: string | null } | null
  profileId?: number | null
  lastActiveAt?: string | null
}

export interface Conversation {
  id: number
  participants: Participant[]
  lastMessage: string
  lastMessageMeta?: {
    id: number
    senderId: number
    seen: boolean
    createdAt: string
    attachmentType?: string | null
  } | null
  updatedAt: string
}

export interface BookingRequestData {
  id: number
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'
  startDate: string
  fee?: number | null
  message?: string | null
  requesterId: number
  targetId: number
  paymentStatus?: string | null
  cancellationRequestedBy?: number | null
  cancellationNote?: string | null
  cancellationRequesterUserId?: number | null
  requesterUserId?: number | null
  targetUserId?: number | null
}

export interface Message {
  id: string
  content: string
  type?: string | null
  bookingRequestId?: number | null
  bookingRequest?: BookingRequestData | null
  attachmentUrl?: string | null
  attachmentType?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | null
  attachmentName?: string | null
  createdAt: string
  seen: boolean
  sender: { id: number; name: string; image?: string | null }
  sharedProfile?: {
    userId: number
    profileId: number | null
    name: string
    role: string
    avatar: string | null
    profession: string | null
    location: string | null
    profileUrl: string
  } | null
  sharedOffer?: {
    id: number
    title: string
    description: string
    type: 'ARTIST' | 'PROVIDER' | 'ALL'
    specialty: string | null
    location: string
    country: string
    date: string
    fee: number | null
    radiusKm: number | null
    applicantCount: number
    status: string
    createdAt: string
    organizer: {
      id: number
      userId: number | null
      avatar: string | null
      name: string
    }
  } | null
}

export interface SearchUser {
  id: number
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  role: Role
  profile?: { avatar?: string | null } | null
}
