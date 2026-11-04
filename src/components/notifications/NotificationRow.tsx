'use client'

/**
 * Une notification (ou un groupe) : avatar avec le picto du type, texte avec le nom en gras,
 * heure, point « nouveau », bouton d'action. Commune à la cloche (compact) et à la page.
 */

import Link from 'next/link'
import LsIcon from '@/components/ui/LsIcon'
import { NotificationIcon, notificationType } from '@/lib/notificationTypes'
import { notificationTarget } from '@/utils/notificationLinks'
import { primaryAction, shortTime, splitActor, type FeedItem } from '@/lib/notificationFeed'

type Props = {
  item: FeedItem
  compact?: boolean
  /** Fenêtre d'une publication (J'aime, commentaire, identification) */
  onOpenPublication: (publicationId: number) => void
  /** Après un clic qui change de page (pour refermer la cloche) */
  onNavigate?: () => void
  onStaffRespond?: (notifId: number, staffId: number, eventId: number, response: 'ACCEPT' | 'REFUSE') => void
  responding?: boolean
  /** Supprimer la notification (ou tout le groupe) */
  onDelete?: (ids: number[]) => void
}

const BUTTON = 'inline-flex items-center rounded-lg border px-2.5 py-1 font-medium transition'

export default function NotificationRow({ item, compact = false, onOpenPublication, onNavigate, onStaffRespond, responding, onDelete }: Props) {
  const n = item.lead
  const cfg = notificationType(n.type)
  const target = notificationTarget(n)
  const action = primaryAction(n.type)
  const [name, rest] = splitActor(item.text, n.actor?.name)
  const avatar = compact ? 32 : 40
  const textSize = compact ? 'text-xs' : 'text-sm'
  const small = compact ? 'text-[11px]' : 'text-xs'
  const staffPending = n.type === 'STAFF_INVITATION' && n.staffId && n.eventId && !['BOOKED', 'CANCELLED'].includes(n.staffStatus || '')

  const body = (
    <div className={`flex items-start gap-3 rounded-xl transition ${compact ? 'px-3 py-2.5' : 'px-4 py-3.5'} ${onDelete ? (compact ? 'pr-9' : 'pr-11') : ''} ${item.read ? 'hover:bg-white/[0.04]' : 'bg-accent/[0.08] hover:bg-accent/[0.12]'}`}>
      {/* Avatar de la personne + picto du type ; sans personne, le picto seul */}
      <span className="relative mt-0.5 shrink-0" style={{ width: avatar, height: avatar }}>
        {n.actor?.avatar ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={n.actor.avatar} alt="" className="h-full w-full rounded-full object-cover" />
            <span className="absolute -bottom-1 -right-1 grid h-[18px] w-[18px] place-items-center rounded-full border-2 border-surface bg-surface-2">
              <LsIcon name={cfg.icon} tone={cfg.tone} size={10} />
            </span>
          </>
        ) : (
          <NotificationIcon type={n.type} box={avatar} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className={`block leading-relaxed text-white/80 ${textSize} ${compact ? 'line-clamp-3' : ''}`}>
          {name && <strong className="font-semibold text-white">{name}</strong>}{rest}
        </span>
        <span className={`mt-0.5 block text-white/40 ${small}`}>
          {shortTime(n.createdAt)}{!compact && <> · {cfg.label}</>}
        </span>

        {/* Invitation dans l'équipe d'un événement : répondre sans quitter la liste */}
        {n.type === 'STAFF_INVITATION' && n.staffId && n.eventId && (
          n.staffStatus === 'BOOKED' ? (
            <span className={`mt-1.5 flex items-center gap-1 text-emerald-400 ${small}`}><LsIcon name="check" tone="inherit" size={13} />Invitation acceptée</span>
          ) : n.staffStatus === 'CANCELLED' ? (
            <span className={`mt-1.5 flex items-center gap-1 text-red-400 ${small}`}><LsIcon name="close" tone="inherit" size={13} />Invitation refusée</span>
          ) : (
            <span className="mt-2 flex gap-1.5">
              <button type="button" disabled={responding} onClick={e => { e.preventDefault(); e.stopPropagation(); onStaffRespond?.(n.id, n.staffId!, n.eventId!, 'ACCEPT') }}
                className={`${BUTTON} ${small} border-accent bg-accent text-white hover:bg-accent-strong disabled:opacity-40`}>
                {responding ? '…' : 'Accepter'}
              </button>
              <button type="button" disabled={responding} onClick={e => { e.preventDefault(); e.stopPropagation(); onStaffRespond?.(n.id, n.staffId!, n.eventId!, 'REFUSE') }}
                className={`${BUTTON} ${small} border-white/15 text-white/75 hover:bg-white/[0.06] disabled:opacity-40`}>
                Refuser
              </button>
            </span>
          )
        )}

        {/* Action principale : même destination que la ligne, mise en avant */}
        {action && target && (
          <span className={`mt-2 ${BUTTON} ${small} ${item.read ? 'border-white/15 text-white/75' : 'border-accent bg-accent text-white'}`}>{action}</span>
        )}
      </span>

      {!item.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-light" aria-label="Nouvelle" />}
    </div>
  )

  // Une invitation en attente garde ses boutons : pas de lien autour (pas de bouton dans un lien)
  const main = staffPending || !target
    ? <div>{body}</div>
    : 'publicationId' in target
      ? <button type="button" className="block w-full text-left" onClick={() => onOpenPublication(target.publicationId)}>{body}</button>
      : <Link href={target.href} onClick={onNavigate} className="block">{body}</Link>

  if (!onDelete) return main
  return (
    <div className="group relative">
      {main}
      {/* Supprimer : visible au survol sur ordinateur, toujours discret sur téléphone */}
      <button
        type="button"
        onClick={() => onDelete(item.ids)}
        aria-label={item.count > 1 ? 'Supprimer ces notifications' : 'Supprimer la notification'}
        title="Supprimer"
        className={`absolute grid place-items-center rounded-full text-white/35 transition hover:bg-white/10 hover:text-white md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100 ${compact ? 'right-1.5 top-2 h-7 w-7' : 'right-2.5 top-3 h-8 w-8'}`}
      >
        <LsIcon name="close" tone="inherit" size={compact ? 13 : 15} />
      </button>
    </div>
  )
}
