'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import PublicationModal from '@/components/PublicationModal'
import AddPublicationModal from '@/components/AddPublicationModal'
import OfferModal from '@/components/OfferModal'
import { getAuthToken, apiFetch } from '@/utils/auth'
import LsIcon, { type LsIconName } from '@/components/ui/LsIcon'
import FeaturedCarousel from '@/components/home/FeaturedCarousel'
import HomeComposer from '@/components/home/HomeComposer'
import FeedList from '@/components/home/FeedList'
import FeedSkeleton from '@/components/home/FeedSkeleton'
import OffersSidebar from '@/components/home/OffersSidebar'
import TrendsCard from '@/components/home/TrendsCard'
import { useFeed } from '@/components/home/useFeed'
import { API_BASE } from '@/components/home/format'
import type { FeaturedProfile, Offer, Post } from '@/components/home/types'

type Tab = 'forYou' | 'nearby' | 'trends'

/** Message central quand un fil est vide (ou à compléter). */
function FeedEmpty({ icon, title, text, action }: { icon: LsIconName; title: string; text: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-8 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10"><LsIcon name={icon} size={28} /></div>
      <div>
        <p className="font-medium text-white/60">{title}</p>
        <p className="mt-1 text-sm text-white/30">{text}</p>
      </div>
      {action && (
        <Link href={action.href} className="rounded-xl bg-accent-strong/80 px-4 py-2 text-sm text-white transition-colors hover:bg-accent">
          {action.label}
        </Link>
      )}
    </div>
  )
}

export default function HomePage() {
  const { user } = useAuth() as { user: { id: number; avatarUrl?: string | null; name?: string; role: string; profile?: { id: number } } | null }

  const [featured, setFeatured]           = useState<FeaturedProfile[]>([])
  const [selectedPost, setSelectedPost]   = useState<Post | null>(null)
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [showAddPubModal, setShowAddPubModal] = useState(false)
  const [composerFiles, setComposerFiles] = useState<File[] | undefined>()
  const [isMuted, setIsMuted]             = useState(true)
  const [activeTab, setActiveTab]         = useState<Tab>('forYou')
  const toggleMute = useCallback(() => setIsMuted(m => !m), [])

  // Chaque fil ne se charge que lorsqu'il est affiché pour la première fois
  const [nearbyOpened, setNearbyOpened] = useState(false)
  useEffect(() => { if (activeTab === 'nearby') setNearbyOpened(true) }, [activeTab])
  const forYou = useFeed(user ? '/api/home/feed' : null)
  const nearby = useFeed(user && nearbyOpened ? '/api/home/nearby' : null)
  const feed = activeTab === 'nearby' ? nearby : forYou

  // L'onglet « Tendances » n'existe que lorsque la colonne de droite est masquée (< 1024 px)
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)')
    const reset = () => { if (wide.matches) setActiveTab(t => (t === 'trends' ? 'forYou' : t)) }
    wide.addEventListener('change', reset)
    return () => wide.removeEventListener('change', reset)
  }, [])

  useEffect(() => {
    apiFetch(`${API_BASE}/api/home/carousel`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setFeatured(d.featured || []) })
      .catch(() => {})
  }, [])

  // Une publication peut être dans les deux fils : on garde les deux à jour
  const updatePost = (id: number, patch: Partial<Post>) => {
    forYou.updatePost(id, patch)
    nearby.updatePost(id, patch)
  }

  // ── J'aime (mise à jour immédiate, retour en arrière si le serveur refuse) ──
  const handleLike = async (post: Post) => {
    if (!user) return
    const { likedByMe: wasLiked, likesCount: prevCount } = post
    updatePost(post.id, { likedByMe: !wasLiked, likesCount: wasLiked ? prevCount - 1 : prevCount + 1 })
    try {
      const response = await apiFetch(`${API_BASE}/api/publications/${post.id}/like`, { method: 'POST' })
      if (!response.ok) throw new Error('Like refusé')
    } catch {
      updatePost(post.id, { likedByMe: wasLiked, likesCount: prevCount })
    }
  }

  const renderFeed = () => {
    if (!user) return null
    if (feed.loading) return <FeedSkeleton />
    if (feed.error) {
      return (
        <div className="py-16 text-center">
          <p className="text-sm text-white/45">Le fil n&apos;a pas pu se charger.</p>
          <button type="button" onClick={feed.reload} className="mt-3 rounded-xl border border-white/10 px-4 py-2 text-xs text-white/70 hover:bg-white/5">Réessayer</button>
        </div>
      )
    }
    if (activeTab === 'nearby' && feed.meta.needsLocation) {
      return <FeedEmpty icon="pin" title="Indiquez votre ville" text="Ajoutez votre ville dans votre profil pour voir les publications des membres de votre région." action={{ href: '/studio-profile', label: 'Compléter mon profil' }} />
    }
    if (feed.posts.length === 0 && feed.adminPosts.length === 0) {
      return activeTab === 'nearby'
        ? <FeedEmpty icon="pin" title="Rien autour de vous pour l'instant" text={`Aucune publication de membres à moins de ${feed.meta.radiusKm ?? 100} km${feed.meta.region ? ` de ${feed.meta.region}` : ''}.`} />
        : <FeedEmpty icon="camera" title="Aucune publication pour l'instant" text="Suivez des artistes et prestataires pour voir leurs publications ici." action={{ href: '/discover', label: 'Découvrir des profils' }} />
    }
    return (
      <>
        {activeTab === 'nearby' && feed.meta.region && (
          <p className="mb-3 flex items-center gap-1.5 text-xs text-white/40">
            <LsIcon name="pin" size={13} tone="muted" /> Publications à moins de {feed.meta.radiusKm ?? 100} km de {feed.meta.region}
          </p>
        )}
        <FeedList
          posts={feed.posts}
          adminPosts={activeTab === 'forYou' ? feed.adminPosts : []}
          hasMore={feed.hasMore}
          loadingMore={feed.loadingMore}
          onLoadMore={feed.loadMore}
          onLike={handleLike}
          onOpen={setSelectedPost}
          currentUserId={user.id}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      </>
    )
  }

  return (
    <main className="lsb-page lsb-home-page text-white">

      {featured.length > 0 && <FeaturedCarousel items={featured} />}

      <div className={`lsb-home-grid ${activeTab === 'trends' ? 'is-trends' : ''}`}>
        <div className="lsb-feed-column">

          <header className="lsb-page-heading lsb-home-heading">
            <div><span>VOTRE RÉSEAU</span><h1>La scène bouge<em>.</em></h1><p>Les nouveautés de votre univers professionnel.</p></div>
          </header>

          <HomeComposer
            firstName={user?.name}
            avatarUrl={user?.avatarUrl}
            onOpen={files => { setComposerFiles(files); setShowAddPubModal(true) }}
          />

          <div className="lsb-feed-tabs" role="tablist" aria-label="Fil d'actualité">
            <button className={activeTab === 'forYou' ? 'is-active' : ''} onClick={() => setActiveTab('forYou')}>Pour vous</button>
            <button className={activeTab === 'nearby' ? 'is-active' : ''} onClick={() => setActiveTab('nearby')}>À proximité</button>
            <button className={`lsb-feed-tab-trends ${activeTab === 'trends' ? 'is-active' : ''}`} onClick={() => setActiveTab('trends')}>Tendances</button>
          </div>

          {activeTab !== 'trends' && renderFeed()}
        </div>

        <aside className="lsb-home-rail">
          <TrendsCard title="Artistes en tendance" role="ARTIST" />
          <TrendsCard title="Prestataires en tendance" role="PROVIDER" />
          <OffersSidebar apiBase={API_BASE} onSelectOffer={setSelectedOffer} />
        </aside>
      </div>

      {/* ── Modale ajouter publication ─────────────────────── */}
      {showAddPubModal && user && (
        <AddPublicationModal
          profileId={user.profile?.id ?? 0}
          token={getAuthToken() ?? ''}
          accent="violet"
          initialFiles={composerFiles}
          onClose={() => setShowAddPubModal(false)}
          onPublished={(pub) => {
            forYou.setPosts(prev => [{
              id: pub.id,
              media: pub.media,
              mediaType: pub.mediaType.toUpperCase(),
              caption: pub.caption ?? null,
              title: pub.title ?? '',
              createdAt: new Date().toISOString(),
              likesCount: 0,
              commentsCount: 0,
              likedByMe: false,
              isFromFollow: false,
              additionalMedia: pub.additionalMedia ?? [],
              author: {
                profileId: user.profile?.id ?? 0,
                userId: Number(user.id),
                name: user.name ?? '',
                avatar: user.avatarUrl ?? null,
                role: user.role,
                profession: null,
                profileUrl: '/studio-profile',
              },
            }, ...prev])
            setActiveTab('forYou')
            setShowAddPubModal(false)
          }}
        />
      )}

      {/* ── Modale offre ───────────────────────────────────── */}
      {selectedOffer && (
        <OfferModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
          isLoggedIn={!!user}
        />
      )}

      {/* ── Modale publication ─────────────────────────────── */}
      {selectedPost && (
        <PublicationModal
          pub={{
            id: selectedPost.id,
            title: selectedPost.title,
            media: selectedPost.media,
            mediaType: selectedPost.mediaType.toLowerCase() as 'image' | 'video',
            caption: selectedPost.caption ?? undefined,
            createdAt: selectedPost.createdAt,
            additionalMedia: selectedPost.additionalMedia ?? [],
            _count: { likes: selectedPost.likesCount, comments: selectedPost.commentsCount ?? 0 },
          }}
          onClose={() => setSelectedPost(null)}
          ownerUserId={selectedPost.author.userId ?? undefined}
          onCountChange={(pubId, likes, comments) => updatePost(pubId, { likesCount: likes, commentsCount: comments })}
          initialLiked={selectedPost.likedByMe}
        />
      )}
    </main>
  )
}
