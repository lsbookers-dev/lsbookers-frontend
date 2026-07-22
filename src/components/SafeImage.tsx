'use client'

/**
 * SafeImage — Image Next.js avec fallback automatique si l'URL est cassée.
 *
 * Usage avatar  : <SafeImage type="avatar" src={url} name="Antho" size={40} />
 * Usage bannière: <SafeImage type="banner" src={url} alt="Bannière" />
 *
 * Si l'image échoue (URL cassée, réseau lent, CORS) :
 *  - avatar  → cercle avec initiale du nom
 *  - bannière → dégradé sombre
 */

import Image from 'next/image'
import { useState } from 'react'

/* ── Avatar ─────────────────────────────────────────────────── */
interface AvatarProps {
  type: 'avatar'
  src: string | null | undefined
  name?: string
  size?: number
  className?: string
}

/* ── Bannière ────────────────────────────────────────────────── */
interface BannerProps {
  type: 'banner'
  src: string | null | undefined
  alt?: string
  className?: string
  priority?: boolean
}

type Props = AvatarProps | BannerProps

export default function SafeImage(props: Props) {
  const [broken, setBroken] = useState(false)

  /* ── AVATAR ─────────────────────────────────────────────── */
  if (props.type === 'avatar') {
    const { src, name = '?', size = 40, className = '' } = props
    const initial = (name || '?')[0]?.toUpperCase() ?? '?'

    if (!src || broken) {
      return (
        <span
          style={{ width: size, height: size, fontSize: size * 0.4 }}
          className={`flex-shrink-0 flex items-center justify-center rounded-full bg-zinc-800 text-white/60 font-bold select-none ${className}`}
        >
          {initial}
        </span>
      )
    }

    return (
      <span
        style={{ width: size, height: size }}
        className={`relative flex-shrink-0 rounded-full overflow-hidden bg-zinc-800 ${className}`}
      >
        <Image
          src={src}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
          unoptimized
          onError={() => setBroken(true)}
        />
      </span>
    )
  }

  /* ── BANNIÈRE ───────────────────────────────────────────── */
  const { src, alt = '', className = '', priority = false } = props as BannerProps

  if (!src || broken) {
    return (
      <div
        className={`absolute inset-0 bg-gradient-to-br from-purple-900/60 via-[#0a0a0f] to-pink-900/40 ${className}`}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      className={`object-cover ${className}`}
      unoptimized
      onError={() => setBroken(true)}
    />
  )
}
