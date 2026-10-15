export type ProfileRole = 'ARTIST' | 'ORGANIZER' | 'PROVIDER'

export type ProfileUser = {
  id: number
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  role?: string | null
  // Privé (renvoyé seulement par /profile/me)
  dateOfBirth?: string | null
  phone?: string | null
  countryOfResidence?: string | null
}

/** Profil tel que renvoyé par /profile/me (complet) ou /profile/user/:id (public). */
export type ProfileData = {
  id: number
  userId: number
  bio?: string | null
  profession?: string | null
  typeEtablissement?: string | null
  location?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  radiusKm?: number | null
  specialties?: string[]
  styles?: string[]
  avatar?: string | null
  banner?: string | null
  soundcloudUrl?: string | null
  showSoundcloud?: boolean
  showStyles?: boolean
  youtubeUrl?: string | null
  showYoutubeUrl?: boolean
  instagramUrl?: string | null
  facebookUrl?: string | null
  tiktokUrl?: string | null
  twitterUrl?: string | null
  linkedinUrl?: string | null
  websiteUrl?: string | null
  cvText?: string | null
  feeInfo?: string | null
  showRealName?: boolean
  followersCount?: number
  followingCount?: number
  reviewsAvg?: number | null
  reviewsCount?: number
  showAddress?: boolean
  // Privé (sauf adresse si showAddress)
  address?: string | null
  postalCode?: string | null
  city?: string | null
  legalStatus?: string | null
  organizerType?: string | null
  establishmentName?: string | null
  siret?: string | null
  user?: ProfileUser
}

export type ProfilePublication = {
  id: number
  title: string
  media: string
  mediaType: string
  caption?: string
  createdAt?: string
  _count?: { likes: number; comments: number }
}

export type ProfileMode = 'studio' | 'public'

/** Sections de l'éditeur du Studio (permet d'ouvrir l'éditeur au bon endroit). */
export type EditorSection = 'identity' | 'presentation' | 'location' | 'specialties' | 'media' | 'socials' | 'career' | 'private'
