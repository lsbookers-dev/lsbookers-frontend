'use client'

/**
 * Studio profil : mon profil tel que les autres le voient, avec tout ce qu'il faut
 * pour le modifier (photo, bannière, éditeur complet, publications, offres).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Eye, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch, getAuthToken } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { useProfilePublications } from '@/hooks/useProfilePublications'
import CropModal from '@/components/CropModal'
import AddPublicationModal from '@/components/AddPublicationModal'
import PublishOfferModal from '@/components/offers/PublishOfferModal'
import type { Offer } from '@/components/offers/OfferCard'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'
import ProfileHeader from './ProfileHeader'
import ProfileBody from './ProfileBody'
import ProfileEditor from './ProfileEditor'
import { ProfileSkeleton, ProfileUnavailable } from './ProfileStates'
import type { EditorSection, ProfileData, ProfilePublication } from './types'
import { isProfileRole, publicProfileHref, ROLE_TEXT } from './utils'

const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const EDITOR_SECTIONS: EditorSection[] = ['identity', 'presentation', 'location', 'specialties', 'media', 'socials', 'career', 'private']

export default function StudioProfile() {
  const { user } = useAuth()
  const { notify, confirm } = useFeedback()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [offers, setOffers] = useState<Offer[]>([])
  const [editorSection, setEditorSection] = useState<EditorSection | null>(null)
  const [showAddPublication, setShowAddPublication] = useState(false)
  const [showPublishOffer, setShowPublishOffer] = useState(false)
  const [crop, setCrop] = useState<{ src: string; type: 'avatar' | 'banner' } | null>(null)
  const [uploading, setUploading] = useState<'avatar' | 'banner' | null>(null)
  const avatarInput = useRef<HTMLInputElement>(null)
  const bannerInput = useRef<HTMLInputElement>(null)
  const pubs = useProfilePublications<ProfilePublication>(profile?.id)

  const rawRole = profile?.user?.role
  const role = isProfileRole(rawRole) ? rawRole : null

  useEffect(() => {
    if (!user) return
    let cancelled = false
    apiFetch(apiUrl('profile/me'), { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('PROFILE_UNAVAILABLE'))))
      .then(({ profile: p }) => { if (!cancelled) setProfile(p) })
      .catch(() => { if (!cancelled) setFailed(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user])

  // Offres publiées (organisateurs et prestataires)
  useEffect(() => {
    if (!profile?.id || role === 'ARTIST') return
    apiFetch(apiUrl(`offers?organizerId=${profile.id}`), { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : []))
      .then(data => setOffers(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [profile?.id, role])

  // Lien direct vers l'éditeur depuis Mon espace : /studio-profile?edit=location
  useEffect(() => {
    if (!profile) return
    const requested = new URLSearchParams(window.location.search).get('edit') as EditorSection | null
    if (requested && EDITOR_SECTIONS.includes(requested)) {
      setEditorSection(requested)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [profile])

  const saveImage = useCallback(async (blob: Blob, type: 'avatar' | 'banner') => {
    if (!profile) return
    setUploading(type)
    try {
      const form = new FormData()
      form.append('file', new File([blob], `${type}.jpg`, { type: 'image/jpeg' }))
      form.append('folder', type === 'avatar' ? 'avatars' : 'banners')
      const upload = await apiFetch(apiUrl('upload'), { method: 'POST', body: form })
      if (!upload.ok) throw new Error(await apiErrorMessage(upload, 'L’envoi de l’image a échoué.'))
      const { url } = await upload.json()
      const res = await apiFetch(apiUrl(`profile/${profile.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [type]: url }),
      })
      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Impossible d’enregistrer l’image.'))
      setProfile(p => (p ? { ...p, [type]: url } : p))
      notify(type === 'avatar' ? 'Photo de profil mise à jour' : 'Bannière mise à jour')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'L’envoi de l’image a échoué.', 'error')
    } finally {
      setUploading(null)
    }
  }, [notify, profile])

  const pickImage = (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) { notify('L’image dépasse 20 Mo.', 'error'); return }
    const reader = new FileReader()
    reader.onload = () => setCrop({ src: reader.result as string, type })
    reader.readAsDataURL(file)
  }

  const deletePublication = async (id: number) => {
    if (!(await confirm({ title: 'Supprimer cette publication ?', danger: true }))) return
    const res = await apiFetch(apiUrl(`publications/${id}`), { method: 'DELETE' })
    if (!res.ok) { notify(await apiErrorMessage(res, 'Impossible de supprimer la publication.'), 'error'); return }
    pubs.remove(id)
    notify('Publication supprimée')
  }

  const deleteOffer = async (offer: Offer) => {
    if (!(await confirm({ title: 'Supprimer cette offre ?', message: offer.title, danger: true }))) return
    const res = await apiFetch(apiUrl(`offers/${offer.id}`), { method: 'DELETE' })
    if (!res.ok) { notify(await apiErrorMessage(res, 'Impossible de supprimer l’offre.'), 'error'); return }
    setOffers(list => list.filter(item => item.id !== offer.id))
    notify('Offre supprimée')
  }

  if (loading) return <ProfileSkeleton />
  if (failed || !profile || !role) {
    return (
      <ProfileUnavailable
        title="Ton Studio n’a pas pu être chargé"
        message="Réessaie dans quelques instants. Si le problème continue, contacte-nous."
        action={{ href: '/space', label: 'Retour à Mon espace' }}
      />
    )
  }

  const publicHref = publicProfileHref(role, profile.userId)

  return (
    <div className="relative min-h-screen text-white lsb-profile-page lsb-profile-studio">
      <ProfileHeader
        profile={profile}
        mode="studio"
        followersCount={profile.followersCount ?? 0}
        publicationsCount={pubs.total}
        uploading={uploading}
        onPickBanner={() => bannerInput.current?.click()}
        onPickAvatar={() => avatarInput.current?.click()}
        actions={(
          <>
            <button type="button" onClick={() => setEditorSection('identity')} className="flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm text-black">
              <Sparkles size={15} /> Modifier mon profil
            </button>
            {publicHref && (
              <Link href={publicHref} className="flex items-center gap-2 whitespace-nowrap rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 hover:text-white">
                <Eye size={15} /> Voir mon profil public
              </Link>
            )}
          </>
        )}
      />
      <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={e => pickImage(e, 'banner')} />
      <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={e => pickImage(e, 'avatar')} />

      <ProfileBody
        profile={profile}
        role={role}
        mode="studio"
        pubs={pubs}
        offers={offers}
        isOwner
        onEdit={setEditorSection}
        onAddPublication={() => setShowAddPublication(true)}
        onDeletePublication={deletePublication}
        onPublishOffer={role !== 'ARTIST' ? () => setShowPublishOffer(true) : undefined}
        onDeleteOffer={deleteOffer}
      />

      {editorSection && (
        <ProfileEditor
          profile={profile}
          role={role}
          initialSection={editorSection}
          onClose={() => setEditorSection(null)}
          onSaved={setProfile}
        />
      )}

      {crop && (
        <CropModal
          src={crop.src}
          aspectRatio={crop.type === 'banner' ? 16 / 5 : 1}
          onConfirm={blob => { const type = crop.type; setCrop(null); saveImage(blob, type) }}
          onCancel={() => setCrop(null)}
        />
      )}

      {showAddPublication && (
        <AddPublicationModal
          profileId={profile.id}
          token={getAuthToken() ?? ''}
          accent={ROLE_TEXT[role].accent}
          onClose={() => setShowAddPublication(false)}
          onPublished={pubs.add}
        />
      )}

      {showPublishOffer && (
        <PublishOfferModal
          defaultLocation={profile.location}
          defaultCountry={profile.country}
          onClose={() => setShowPublishOffer(false)}
          onPublished={offer => { setOffers(list => [offer, ...list]); setShowPublishOffer(false); notify('Offre publiée') }}
        />
      )}
    </div>
  )
}
