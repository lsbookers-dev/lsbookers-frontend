'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import type { FeaturedProfile } from './types'
import { roleLabel } from './format'

/** Carrousel des profils mis en avant (choisis dans Admin › Carrousel). */
export default function FeaturedCarousel({ items }: { items: FeaturedProfile[] }) {
  const [idx, setIdx] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => { setIsMobile(e.matches); setIdx(0) }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Desktop : 1 slide par profil, toujours 2 affiches en circulaire
  // Mobile  : 1 seul profil par slide
  const slidesCount = items.length

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIdx(prev => (prev + 1) % slidesCount)
    }, 4000)
  }, [slidesCount])

  useEffect(() => {
    startTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [startTimer])

  const prev = () => { setIdx(p => (p - 1 + slidesCount) % slidesCount); startTimer() }
  const next = () => { setIdx(p => (p + 1) % slidesCount); startTimer() }

  if (items.length === 0) return null

  // Sur desktop, toujours 2 profils, avec wrap-around circulaire
  const visibleItems = isMobile
    ? [items[idx % items.length]]
    : [items[idx % items.length], items[(idx + 1) % items.length]]

  return (
    <div className="relative mb-8">
<div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {visibleItems.map(p => (
          <Link key={p.id} href={p.profileUrl} className="group relative h-44 md:h-52 rounded-2xl overflow-hidden block border border-white/10">
            {p.banner ? (
              <Image src={p.banner} alt={p.name} fill className="object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-accent-strong/40 via-background to-surface-2" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            {p.isFeatured && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-gold/15 border border-gold/30 text-gold-light text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                <Star className="w-3 h-3 fill-gold text-gold" /> À la une
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0 bg-surface-2">
                {p.avatar ? (
                  <Image src={p.avatar} alt={p.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40 text-lg font-bold">{p.name[0]}</div>
                )}
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{p.name}</p>
                <p className="text-xs text-white/70">
                  {p.profession || roleLabel(p.role)}{p.location && ` · ${p.location}`}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {slidesCount > 1 && (
        <>
          <button onClick={prev} className="absolute -left-3 top-1/2 translate-y-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-full p-1.5 transition-colors">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button onClick={next} className="absolute -right-3 top-1/2 translate-y-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-full p-1.5 transition-colors">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
          <div className="flex justify-center mt-1">
            {Array.from({ length: slidesCount }).map((_, i) => (
              <button key={i} aria-label={`Diapositive ${i + 1}`} onClick={() => { setIdx(i); startTimer() }}
                className={`box-content p-2 bg-clip-content w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-accent-light w-4' : 'bg-white/20'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
