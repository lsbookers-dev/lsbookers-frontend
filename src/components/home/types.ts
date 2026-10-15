/** Types partagés de la page d'accueil (fil, carrousel, tendances). */
import type { OfferDetail } from '@/components/OfferModal'

export type FeaturedProfile = {
  id: number
  name: string
  avatar: string | null
  banner: string | null
  profession: string | null
  location: string | null
  role: string
  /** Choisi à la main dans Admin › Carrousel (sinon : profil parmi les plus suivis) */
  isFeatured: boolean
  profileUrl: string
}

export type PostMedia = { id?: number; url: string; mediaType: string; order?: number }

export type Post = {
  id: number
  media: string
  mediaType: string
  caption: string | null
  title: string
  createdAt: string
  likesCount: number
  commentsCount: number
  likedByMe: boolean
  isFromFollow: boolean
  feedType?: 'followed' | 'trending' | 'suggestion' | null
  additionalMedia?: PostMedia[]
  author: {
    profileId: number
    userId: number | null
    name: string
    avatar: string | null
    role: string | null
    profession: string | null
    profileUrl: string
  }
}

export type AdminPost = {
  id: number
  title: string | null
  content: string | null
  mediaUrl: string | null
  mediaType: string | null
  pinned: boolean
  createdAt: string
}

export type Offer = OfferDetail & { endDate?: string | null }

export type TrendCriterion = 'search' | 'views' | 'bookings' | 'likes'

export type TrendItem = {
  id: number
  profileId: number
  name: string
  avatar: string | null
  profession: string | null
  location: string | null
  count: number
  profileUrl: string
}
