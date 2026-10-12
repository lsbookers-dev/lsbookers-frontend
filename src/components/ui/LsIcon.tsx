/**
 * Pictos LS Bookers (style A « Trait », choisi le 13/10/2026) — remplacent les emojis du site.
 * Grille 24 × 24, trait 1,7, bouts arrondis, une seule couleur (currentColor).
 * Couleur selon le sens : violet clair par défaut, or pour la valeur (avis, paiement),
 * vert / rouge uniquement pour « validé » / « refusé » → prop `tone`.
 *
 *   <LsIcon name="booking" />          <LsIcon name="star" tone="gold" size={16} />
 *   <LsBullet />                        (puce qui remplace les ✦)
 */

const PATHS = {
  message: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V16H6.5A2.5 2.5 0 0 1 4 13.5z" /><circle cx="17.8" cy="5.2" r="2" className="ls-dot" /></>,
  booking: <><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4M9 14.5l2 2 4-4" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /><circle cx="15.5" cy="15" r="1.6" className="ls-dot" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="M8 12.3l2.7 2.7L16 9.6" /></>,
  close: <><circle cx="12" cy="12" r="8.5" /><path d="M9 9l6 6M15 9l-6 6" /></>,
  cancel: <><circle cx="12" cy="12" r="8.5" /><path d="M6 6l12 12" /></>,
  warning: <><path d="M10.3 4.5a2 2 0 0 1 3.4 0l7 12A2 2 0 0 1 19 19.5H5a2 2 0 0 1-1.7-3z" /><path d="M12 9.5v4" /><circle cx="12" cy="16.4" r="1.1" className="ls-dot" /></>,
  payment: <><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10.5h18M7 15h4" /></>,
  offer: <><rect x="3.5" y="7.5" width="17" height="12" rx="2.5" /><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17" /><circle cx="12" cy="12.5" r="1.6" className="ls-dot" /></>,
  follow: <><circle cx="10" cy="8.5" r="3.5" /><path d="M3.5 19.5c.8-3.3 3.4-5 6.5-5s5.7 1.7 6.5 5M18.5 8v5M16 10.5h5" /></>,
  user: <><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c.9-3.6 3.8-5.5 7.5-5.5s6.6 1.9 7.5 5.5" /></>,
  comment: <><path d="M12 4c4.7 0 8.5 3.1 8.5 7s-3.8 7-8.5 7c-1 0-2-.1-2.9-.4L4.5 20l1.2-3.6C4.6 15 3.5 13.1 3.5 11c0-3.9 3.8-7 8.5-7z" /><circle cx="8.5" cy="11" r="1.1" className="ls-dot" /><circle cx="12" cy="11" r="1.1" className="ls-dot" /><circle cx="15.5" cy="11" r="1.1" className="ls-dot" /></>,
  reply: <path d="M9.5 6L4 11.5 9.5 17M4.5 11.5H14a6 6 0 0 1 6 6V19" />,
  heart: <path d="M12 19.5s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 6.8a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10-7.5 10z" />,
  star: <path d="M12 3.8l2.5 5.2 5.6.8-4.1 3.9 1 5.6L12 16.6l-5 2.7 1-5.6-4.1-3.9 5.6-.8z" />,
  attach: <path d="M19 11.5l-6.8 6.8a4.5 4.5 0 0 1-6.4-6.4l7.2-7.2a3 3 0 0 1 4.2 4.2l-7 7a1.5 1.5 0 0 1-2.1-2.1l6.3-6.3" />,
  shield: <><path d="M12 3.5l7 2.8v5.2c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6.3z" /><path d="M9 12l2.2 2.2L15 10.4" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="9.5" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /><circle cx="12" cy="15.2" r="1.4" className="ls-dot" /></>,
  stage: <path d="M4 19.5h16l-1.5-6h-13zM8 13.5V9M16 13.5V9M5.5 9L12 4l6.5 5" />,
  mic: <><rect x="9" y="3.5" width="6" height="10" rx="3" /><path d="M6 11a6 6 0 0 0 12 0M12 17v3.5M9 20.5h6" /></>,
  tools: <path d="M14.5 4.5a4 4 0 0 0-4.8 5.3L4 15.5 6.5 18l5.7-5.7a4 4 0 0 0 5.3-4.8l-2.3 2.3-2.4-.6-.6-2.4z" />,
  venue: <path d="M4 20V10l8-5.5L20 10v10zM2.5 20h19M10 20v-5h4v5" />,
  bell: <><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 20.5a2 2 0 0 0 4 0" /><circle cx="17.5" cy="5.5" r="2" className="ls-dot" /></>,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="M4 7l8 6 8-6" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  hourglass: <path d="M6 4h12M6 20h12M7 4c0 4 5 5.5 5 8s-5 4-5 8M17 4c0 4-5 5.5-5 8s5 4 5 8" />,
  bug: <><rect x="7" y="8" width="10" height="12" rx="5" /><path d="M9 8a3 3 0 0 1 6 0M12 12v8M3.5 13H7M17 13h3.5M4.5 8.5L7.5 10M19.5 8.5L16.5 10M4.5 18.5l3-1.5M19.5 18.5l-3-1.5" /></>,
  share: <path d="M7 10H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1M12 14V3.5M8.5 7L12 3.5 15.5 7" />,
  plus: <><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M12 8.5v7M8.5 12h7" /></>,
  document: <path d="M6.5 3.5h7l4.5 4.5v10.5a2 2 0 0 1-2 2h-9.5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2zM13.5 3.5V8H18M8.5 12.5h7M8.5 16h5" />,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><path d="M3.5 16.5l5-5 4 4 2.5-2.5 5.5 5" /><circle cx="15.5" cy="9" r="1.6" className="ls-dot" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2.5" /><path d="M16 10.5l5-3v9l-5-3" /></>,
  pin: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.2" className="ls-dot" /></>,
  camera: <><path d="M4 8.5A2 2 0 0 1 6 6.5h2l1.5-2h5l1.5 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="3.5" /></>,
  // Ajouts pour la page d'accueil
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5z" /></>,
  phone: <><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></>,
  bolt: <path d="M13 3L5 13.5h6L10.5 21 19 10.5h-6z" />,
  offline: <path d="M3.5 9a13 13 0 0 1 4-2.3M10.5 5.6A13 13 0 0 1 20.5 9M6.5 12.5a8 8 0 0 1 3-1.8M14.5 11.2a8 8 0 0 1 3 1.3M9.5 16a4 4 0 0 1 5 0M4 4l16 16" />,
  home: <path d="M4 10.5L12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15V15h-6v5.5H5.5A1.5 1.5 0 0 1 4 19z" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
} as const

export type LsIconName = keyof typeof PATHS
export type LsIconTone = 'accent' | 'gold' | 'ok' | 'bad' | 'muted' | 'inherit'

const TONE_CLASS: Record<LsIconTone, string> = {
  accent: 'text-accent-light',
  gold: 'text-gold',
  ok: 'text-emerald-400',
  bad: 'text-red-400',
  muted: 'text-white/40',
  inherit: '',
}

export default function LsIcon({ name, size = 20, tone = 'accent', className = '', title }: {
  name: LsIconName
  size?: number
  tone?: LsIconTone
  className?: string
  /** Texte lu par les lecteurs d'écran ; sans titre, le picto est décoratif */
  title?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={`ls-icon inline-block shrink-0 ${TONE_CLASS[tone]} ${className}`}
    >
      {PATHS[name]}
    </svg>
  )
}

/** Puce LS : petit losange violet à cœur doré (remplace les ✦ des listes). */
export function LsBullet({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} aria-hidden className={`inline-block shrink-0 ${className}`}>
      <path d="M7 1.2L12.8 7 7 12.8 1.2 7z" fill="rgba(139,92,246,.22)" stroke="var(--lsb-accent)" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M7 4.6L9.4 7 7 9.4 4.6 7z" fill="var(--lsb-gold)" />
    </svg>
  )
}

/** Retire les emojis en tête d'un texte (anciens messages automatiques enregistrés avec un emoji). */
export function stripLeadingEmoji(value: string) {
  return value.replace(/^[\p{Extended_Pictographic}️‍\s]+/u, '').trim()
}
