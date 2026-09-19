'use client'

import Image from 'next/image'
import Link from 'next/link'

const sizes = {
  small: 'h-9 w-9 rounded-xl text-sm',
  medium: 'h-11 w-11 rounded-xl text-base',
  large: 'h-12 w-12 rounded-xl text-base',
}

export default function PublicBrand({
  logoUrl,
  size = 'medium',
  showTagline = true,
  hideTextOnMobile = false,
}: {
  logoUrl?: string | null
  size?: keyof typeof sizes
  showTagline?: boolean
  hideTextOnMobile?: boolean
}) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3" aria-label="LSBookers — Accueil">
      <span
        className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-white/10 font-black tracking-widest ring-1 ring-white/15 backdrop-blur transition group-hover:ring-white/30 ${sizes[size]}`}
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt=""
            fill
            priority
            sizes={size === 'large' ? '48px' : size === 'medium' ? '44px' : '36px'}
            className="object-cover"
          />
        ) : (
          'LS'
        )}
      </span>
      <span className={`leading-tight ${hideTextOnMobile ? 'hidden sm:block' : ''}`}>
        <span className={`${size === 'small' ? 'text-base' : 'text-lg'} block font-extrabold tracking-tight`}>
          LSBookers
        </span>
        {showTagline && (
          <span className="block text-[10px] uppercase tracking-widest text-white/50">
            Réseau événementiel
          </span>
        )}
      </span>
    </Link>
  )
}
