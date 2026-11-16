'use client'

/**
 * Menu « trois points » (choix A1 d'Antho, 16/11/2026) : Signaler et Bloquer.
 * Présent sur un profil, une publication, un commentaire et une offre.
 * La fenêtre de signalement tient sur un seul écran (choix B1) : motif, mot facultatif, envoyer,
 * puis proposition de bloquer la personne.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Ban, Check, Flag, Loader2, MoreHorizontal, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import { useFeedback } from '@/components/ui/Feedback'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

export type ReportTargetType = 'PROFILE' | 'PUBLICATION' | 'COMMENT' | 'OFFER'

// Mêmes motifs que le serveur (services/moderation.js)
const REASONS: { key: string; label: string }[] = [
  { key: 'SEXUAL', label: 'Contenu sexuel ou choquant' },
  { key: 'HARASSMENT', label: 'Harcèlement ou propos haineux' },
  { key: 'FAKE', label: 'Faux profil ou usurpation d’identité' },
  { key: 'SCAM', label: 'Arnaque ou fraude' },
  { key: 'SPAM', label: 'Spam ou publicité' },
  { key: 'COPYRIGHT', label: 'Contenu volé (droits d’auteur)' },
  { key: 'OTHER', label: 'Autre' },
]

const WORDS: Record<ReportTargetType, { menu: string; title: string }> = {
  PROFILE: { menu: 'Signaler ce profil', title: 'Signaler ce profil' },
  PUBLICATION: { menu: 'Signaler la publication', title: 'Signaler cette publication' },
  COMMENT: { menu: 'Signaler le commentaire', title: 'Signaler ce commentaire' },
  OFFER: { menu: 'Signaler l’offre', title: 'Signaler cette offre' },
}

async function blockUser(userId: number) {
  const res = await apiFetch(`${API_BASE}/api/block/${userId}`, { method: 'POST' })
  return res.ok
}

/* ── Fenêtre de signalement ─────────────────────────────── */

export function ReportDialog({ targetType, targetId, onClose, onBlocked }: {
  targetType: ReportTargetType
  targetId: number
  onClose: () => void
  /** Appelé si le membre bloque la personne après son signalement */
  onBlocked?: () => void
}) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState<{ already: boolean; author: { id: number; name: string } | null } | null>(null)
  const [blockState, setBlockState] = useState<'idle' | 'busy' | 'done'>('idle')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const needsDetails = reason === 'OTHER'
  const canSend = !!reason && (!needsDetails || details.trim().length > 0) && !sending

  const send = async () => {
    if (!canSend) return
    setSending(true)
    setError('')
    try {
      const res = await apiFetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reason, details: details.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data?.error || 'Le signalement n’a pas pu être envoyé. Réessayez.'); return }
      setSent({ already: !!data.already, author: data.author || null })
    } catch {
      setError('Le signalement n’a pas pu être envoyé. Vérifiez votre connexion.')
    } finally {
      setSending(false)
    }
  }

  const block = async () => {
    if (!sent?.author || blockState !== 'idle') return
    setBlockState('busy')
    const ok = await blockUser(sent.author.id).catch(() => false)
    setBlockState(ok ? 'done' : 'idle')
    if (ok) onBlocked?.()
    else setError('Le blocage n’a pas fonctionné. Réessayez.')
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={e => { e.stopPropagation(); if (e.target === e.currentTarget) onClose() }}
      onClick={e => e.stopPropagation()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={WORDS[targetType].title}
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-2xl sm:max-w-md sm:rounded-3xl sm:pb-5"
      >
        <button type="button" onClick={onClose} aria-label="Fermer" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-white/[0.06] hover:text-white">
          <X size={17} />
        </button>

        {sent ? (
          <div className="flex flex-col items-center gap-3 pt-3 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-accent/15 text-accent-light"><Check size={22} /></span>
            <h2 className="text-base font-semibold text-white">{sent.already ? 'Vous l’aviez déjà signalé' : 'Merci, signalement envoyé'}</h2>
            <p className="max-w-xs text-xs leading-relaxed text-muted">
              L&apos;équipe LS Bookers va l&apos;examiner. Vous serez prévenu de la décision dans vos notifications.
            </p>
            {error && <p className="text-xs text-red-300">{error}</p>}
            <div className="mt-2 flex w-full flex-col gap-2">
              {sent.author && blockState !== 'done' && (
                <button type="button" onClick={block} disabled={blockState === 'busy'} className="inline-flex items-center justify-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50">
                  {blockState === 'busy' ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />}
                  Bloquer aussi {sent.author.name}
                </button>
              )}
              {blockState === 'done' && sent.author && (
                <p className="rounded-full bg-white/[0.05] px-4 py-2.5 text-sm text-white/70">{sent.author.name} est bloqué.</p>
              )}
              <button type="button" onClick={onClose} className="rounded-full border border-line px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.06]">Fermer</button>
            </div>
            {sent.author && blockState !== 'done' && (
              <p className="text-[11px] leading-relaxed text-muted">Bloquer : cette personne ne pourra plus vous écrire ni voir vos publications.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="pr-8">
              <h2 className="text-base font-semibold text-white">{WORDS[targetType].title}</h2>
              <p className="mt-1 text-xs text-muted">Pourquoi le signalez-vous ?</p>
            </div>
            <div role="radiogroup" aria-label="Motif" className="flex flex-col gap-2">
              {REASONS.map(r => {
                const selected = reason === r.key
                return (
                  <button
                    key={r.key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setReason(r.key)}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${selected ? 'border-accent bg-accent/15 text-white' : 'border-line text-white/80 hover:bg-white/[0.04]'}`}
                  >
                    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${selected ? 'border-accent-light' : 'border-white/30'}`}>
                      {selected && <span className="h-2 w-2 rounded-full bg-accent-light" />}
                    </span>
                    {r.label}
                  </button>
                )
              })}
            </div>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value.slice(0, 500))}
              rows={2}
              placeholder={needsDetails ? 'Expliquez le problème en quelques mots' : 'Un détail à ajouter ? (facultatif)'}
              aria-label="Détail du signalement"
              className="w-full resize-none rounded-xl border border-line bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-accent/50 focus:outline-none"
            />
            {error && <p className="text-xs text-red-300">{error}</p>}
            <button type="button" onClick={send} disabled={!canSend} className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-strong px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-40">
              {sending && <Loader2 size={15} className="animate-spin" />}
              Envoyer le signalement
            </button>
            <p className="text-center text-[11px] leading-relaxed text-muted">Votre nom n&apos;est jamais communiqué à la personne signalée.</p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

/* ── Bouton « trois points » et son menu ─────────────────── */

const BUTTON_STYLE = {
  // Rond sombre, posé sur une image (publication)
  round: 'grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/55 text-white/80 backdrop-blur-md transition hover:bg-white/10',
  // Petit rond, en haut d'une carte (offre)
  small: 'grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-black/35 text-white/75 backdrop-blur transition hover:bg-black/55 hover:text-white',
  // Discret, dans une ligne de texte (commentaire)
  ghost: 'grid h-6 w-6 place-items-center rounded-lg text-white/25 transition hover:bg-white/[0.06] hover:text-white/80',
}

export default function ReportMenu({ targetType, targetId, ownerUserId, ownerName, variant = 'round', className = '', onBlocked }: {
  targetType: ReportTargetType
  targetId: number
  /** Auteur du contenu : le menu n'apparaît pas sur son propre contenu */
  ownerUserId?: number | null
  /** Avec le nom de l'auteur, le menu propose aussi « Bloquer … » */
  ownerName?: string | null
  variant?: keyof typeof BUTTON_STYLE
  className?: string
  onBlocked?: () => void
}) {
  const { user } = useAuth()
  const { notify, confirm } = useFeedback()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menu, setMenu] = useState<{ top?: number; bottom?: number; right: number } | null>(null)
  const [dialog, setDialog] = useState(false)

  const close = useCallback(() => setMenu(null), [])

  useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [menu, close])

  if (!user || String(user.role || '').toUpperCase() === 'ADMIN') return null
  if (ownerUserId != null && Number(user.id) === Number(ownerUserId)) return null

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (menu) { close(); return }
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const right = Math.max(8, window.innerWidth - rect.right)
    // S'ouvre vers le bas, ou vers le haut s'il n'y a pas la place
    setMenu(window.innerHeight - rect.bottom > 130 ? { top: rect.bottom + 6, right } : { bottom: window.innerHeight - rect.top + 6, right })
  }

  const block = async () => {
    close()
    if (!ownerUserId || !ownerName) return
    const ok = await confirm({
      title: `Bloquer ${ownerName} ?`,
      message: 'Cette personne ne pourra plus vous écrire ni voir vos publications. Vous pourrez la débloquer depuis son profil.',
      confirmLabel: 'Bloquer',
      danger: true,
    })
    if (!ok) return
    if (await blockUser(Number(ownerUserId)).catch(() => false)) {
      notify(`${ownerName} est bloqué.`)
      onBlocked?.()
    } else {
      notify('Le blocage n’a pas fonctionné. Réessayez.', 'error')
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label="Plus d’options"
        aria-haspopup="menu"
        aria-expanded={!!menu}
        title="Plus d’options"
        className={`${BUTTON_STYLE[variant]} ${className}`}
      >
        <MoreHorizontal size={variant === 'round' ? 17 : 14} />
      </button>

      {menu && createPortal(
        <div className="fixed inset-0 z-[115]" onMouseDown={e => { e.stopPropagation(); close() }} onClick={e => e.stopPropagation()}>
          <div
            role="menu"
            style={{ top: menu.top, bottom: menu.bottom, right: menu.right }}
            className="absolute min-w-[220px] max-w-[calc(100vw-16px)] overflow-hidden rounded-xl border border-white/10 bg-[#111118] py-1 shadow-2xl"
            onMouseDown={e => e.stopPropagation()}
          >
            <button type="button" role="menuitem" onClick={() => { close(); setDialog(true) }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-white/85 transition hover:bg-white/5">
              <Flag size={15} className="shrink-0" /> {WORDS[targetType].menu}
            </button>
            {ownerUserId && ownerName && (
              <button type="button" role="menuitem" onClick={block} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-400 transition hover:bg-white/5">
                <Ban size={15} className="shrink-0" /> <span className="truncate">Bloquer {ownerName}</span>
              </button>
            )}
          </div>
        </div>,
        document.body,
      )}

      {dialog && <ReportDialog targetType={targetType} targetId={targetId} onClose={() => setDialog(false)} onBlocked={onBlocked} />}
    </>
  )
}
