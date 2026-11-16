'use client'

// Admin › Signalements (choix C1 d'Antho, 16/11/2026) : liste à gauche, détail à droite.
// Un contenu signalé plusieurs fois = une seule ligne. Décisions : sans suite, retirer, avertir, suspendre.

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, EyeOff } from 'lucide-react'
import { apiFetch } from '@/utils/auth'
import { useFeedback } from '@/components/ui/Feedback'
import { ADMIN_BADGES_EVENT } from '@/components/admin/AdminSidebar'
import { API, BTN, BTN2, BTN_DANGER, ErrorBox, INPUT, PageHeader, ROLE_LABEL, Spinner, SubTabs, fmtDate, fmtDateTime } from '@/components/admin/ui'
import { publicProfileHref } from '@/components/profile/utils'

type TargetType = 'PROFILE' | 'PUBLICATION' | 'COMMENT' | 'OFFER'
type Action = 'DISMISS' | 'REMOVE' | 'WARN' | 'BAN'
type Snapshot = { title?: string; text?: string; media?: string; mediaType?: string; name?: string; role?: string; avatar?: string | null; location?: string; date?: string; fee?: number | null }
type Item = {
  key: string
  targetType: TargetType
  targetId: number
  count: number
  reason: string
  lastAt: string
  snapshot: Snapshot | null
  state: { exists: boolean; hidden: boolean } | null
  author: { id: number; name: string; email: string; role: string; createdAt: string; warningCount: number; bannedAt: string | null; avatar: string | null; removedCount: number } | null
  reports: { id: number; reporter: string; reason: string; details: string | null; createdAt: string }[]
  status?: string
  resolvedAt?: string
  resolutionNote?: string | null
  resolvedBy?: string | null
}

const WHAT: Record<TargetType, { name: string; remove: string; e: string }> = {
  PROFILE: { name: 'Profil', remove: '', e: '' },
  PUBLICATION: { name: 'Publication', remove: 'Retirer la publication', e: 'e' },
  COMMENT: { name: 'Commentaire', remove: 'Retirer le commentaire', e: '' },
  OFFER: { name: 'Offre', remove: 'Retirer l’offre', e: 'e' },
}
const DECISION: Record<string, string> = { DISMISSED: 'Classé sans suite', REMOVED: 'Contenu retiré', WARNED: 'Membre averti', BANNED: 'Compte suspendu' }
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`
const ago = (date: string) => {
  const min = Math.round((Date.now() - new Date(date).getTime()) / 60000)
  if (min < 60) return `il y a ${Math.max(1, min)} min`
  if (min < 24 * 60) return `il y a ${Math.round(min / 60)} h`
  return fmtDate(date)
}
const itemTitle = (item: Item) => (item.targetType === 'PROFILE'
  ? `Profil « ${item.snapshot?.name || item.author?.name || 'supprimé'} »`
  : `${WHAT[item.targetType].name} de ${item.author?.name || 'compte supprimé'}`)

/* ── Fenêtre de confirmation d'une décision ───────────── */

function DecisionDialog({ item, action, reasons, onClose, onDone }: {
  item: Item
  action: Exclude<Action, 'DISMISS'>
  reasons: Record<string, string>
  onClose: () => void
  onDone: (message: string) => void
}) {
  const [reason, setReason] = useState(item.reason)
  const [note, setNote] = useState('')
  const [warn, setWarn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const name = item.author?.name || 'ce membre'
  const what = WHAT[item.targetType]

  const text = {
    REMOVE: {
      title: `${what.remove} ?`,
      message: `${what.name === 'Offre' ? 'Elle' : what.e ? 'Elle' : 'Il'} disparaît du site pour tout le monde. ${name} est prévenu avec le motif ci-dessous, sans le nom des personnes qui ont signalé.`,
      confirm: what.remove,
      done: `${what.name} retiré${what.e}.`,
    },
    WARN: {
      title: `Avertir ${name} ?`,
      message: 'Il reçoit un avertissement officiel de LS Bookers avec le motif ci-dessous. Le contenu reste en ligne. L’avertissement est compté sur sa fiche.',
      confirm: 'Envoyer l’avertissement',
      done: 'Avertissement envoyé.',
    },
    BAN: {
      title: `Suspendre le compte de ${name} ?`,
      message: 'Il est déconnecté partout et ne peut plus se connecter. Son profil et ses contenus disparaissent du site. Vous pouvez lever la suspension depuis sa fiche.',
      confirm: 'Suspendre le compte',
      done: 'Compte suspendu.',
    },
  }[action]

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await apiFetch(`${API}/api/admin/reports/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: item.targetType, targetId: item.targetId, action, reason, note: note.trim(), warn: action === 'REMOVE' && warn }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data?.error || 'La décision n’a pas pu être enregistrée.'); return }
      onDone(text.done)
    } catch {
      setError('La décision n’a pas pu être enregistrée. Vérifiez votre connexion.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-label={text.title} className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 shadow-2xl sm:max-w-md sm:rounded-3xl">
        <h2 className="text-base font-semibold text-white">{text.title}</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted">{text.message}</p>

        <label className="mt-4 block text-xs text-white/55">
          Motif communiqué au membre
          <select value={reason} onChange={e => setReason(e.target.value)} className={`${INPUT} mt-1`}>
            {Object.entries(reasons).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label className="mt-3 block text-xs text-white/55">
          Message ajouté pour le membre (facultatif)
          <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 500))} rows={3} className={`${INPUT} mt-1 resize-none`} />
        </label>
        {action === 'REMOVE' && item.author && (
          <label className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3 py-2.5 text-sm text-white/80">
            <input type="checkbox" checked={warn} onChange={e => setWarn(e.target.checked)} className="h-4 w-4 accent-violet-500" />
            Compter aussi un avertissement
          </label>
        )}
        {error && <p className="mt-3 text-xs text-red-300">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className={BTN2}>Annuler</button>
          <button type="button" onClick={submit} disabled={busy} className={action === 'BAN' ? BTN_DANGER : BTN}>{busy ? '…' : text.confirm}</button>
        </div>
      </div>
    </div>
  )
}

/* ── Détail d'un contenu signalé ──────────────────────── */

function Detail({ item, reasons, onBack, onAct, busy }: {
  item: Item
  reasons: Record<string, string>
  onBack: () => void
  onAct: (action: Action) => void
  busy: boolean
}) {
  const s = item.snapshot || {}
  const what = WHAT[item.targetType]
  const pending = !item.status
  const gone = pending && item.state && !item.state.exists
  const profileHref = item.author ? publicProfileHref(item.author.role, item.author.id) : null

  return (
    <div className="rounded-2xl border border-line bg-white/[0.04] p-5">
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-white lg:hidden">
        <ArrowLeft size={14} /> Retour à la liste
      </button>

      <h2 className="text-lg font-semibold text-white">{what.name} signalé{what.e} {item.count > 1 ? `${item.count} fois` : 'une fois'}</h2>
      {pending && item.state?.hidden && (
        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-gold"><EyeOff size={13} /> Masqué{what.e} automatiquement en attendant votre décision</p>
      )}
      {gone && <p className="mt-1 text-xs text-muted">Ce contenu n’est plus en ligne (supprimé par son auteur ou déjà retiré).</p>}
      {!pending && (
        <p className="mt-1 text-xs text-muted">
          <span className="font-semibold text-white">{DECISION[item.status || ''] || item.status}</span> le {fmtDateTime(item.resolvedAt)}{item.resolvedBy ? ` par ${item.resolvedBy}` : ''}
          {item.resolutionNote ? ` · « ${item.resolutionNote} »` : ''}
        </p>
      )}

      {/* Le contenu, tel qu'il était au moment du signalement */}
      <div className="mt-4 flex flex-col gap-4 rounded-xl bg-surface p-4 sm:flex-row">
        {s.media && pending && !gone && (
          <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-lg bg-black sm:h-32 sm:w-32">
            {String(s.mediaType).toLowerCase() === 'video'
              ? <video src={s.media} controls preload="metadata" className="h-full w-full object-cover" />
              : <Image src={s.media} alt="" fill unoptimized className="object-cover" />}
          </div>
        )}
        {item.targetType === 'PROFILE' && s.avatar && (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black">
            <Image src={s.avatar} alt="" fill unoptimized className="object-cover" />
          </div>
        )}
        <div className="min-w-0 text-sm">
          {(s.title || s.name) && <p className="font-semibold text-white">{s.title || s.name}</p>}
          {item.targetType === 'PROFILE' && <p className="text-xs text-muted">{ROLE_LABEL[s.role || ''] || s.role}</p>}
          {s.text && <p className="mt-1 whitespace-pre-wrap break-words text-white/75">{s.text}</p>}
          {item.targetType === 'OFFER' && (
            <p className="mt-2 text-xs text-muted">{[s.location, s.date ? fmtDate(s.date) : null, s.fee ? `${s.fee} €` : null].filter(Boolean).join(' · ')}</p>
          )}
          {!s.title && !s.text && !s.name && <p className="text-muted">Aucun texte.</p>}
        </div>
      </div>

      {/* L'auteur et son passé */}
      {item.author ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-white/[0.05] p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{item.author.name}</p>
            <p className="truncate text-xs text-muted">{ROLE_LABEL[item.author.role] || item.author.role} · inscrit le {fmtDate(item.author.createdAt)} · {item.author.email}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className={`rounded-md border px-2 py-0.5 ${item.author.warningCount ? 'border-gold/40 text-gold' : 'border-line text-muted'}`}>{plural(item.author.warningCount, 'avertissement')}</span>
            <span className={`rounded-md border px-2 py-0.5 ${item.author.removedCount ? 'border-gold/40 text-gold' : 'border-line text-muted'}`}>{item.author.removedCount} déjà retiré{item.author.removedCount > 1 ? 's' : ''}</span>
            {item.author.bannedAt && <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-red-300">Suspendu</span>}
            <Link href={`/admin/users?open=${item.author.id}`} className="rounded-md border border-line px-2 py-0.5 text-accent-light hover:bg-white/[0.06]">Voir la fiche</Link>
            {profileHref && !item.author.bannedAt && <Link href={profileHref} target="_blank" className="rounded-md border border-line px-2 py-0.5 text-accent-light hover:bg-white/[0.06]">Voir le profil</Link>}
          </div>
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-white/[0.05] p-4 text-sm text-muted">Le compte concerné a été supprimé.</p>
      )}

      {/* Qui a signalé, et pourquoi */}
      <div className="mt-4">
        <p className="mb-1 text-xs font-semibold text-white/70">{plural(item.reports.length, 'signalement')}</p>
        {item.reports.map(r => (
          <div key={r.id} className="grid gap-x-3 gap-y-0.5 border-t border-line py-2 text-xs sm:grid-cols-[130px_170px_1fr]">
            <span className="truncate text-white/85">{r.reporter}</span>
            <span className="text-accent-light">{reasons[r.reason] || r.reason}</span>
            <span className="break-words text-muted">{r.details ? `« ${r.details} »` : 'Sans commentaire'} · {ago(r.createdAt)}</span>
          </div>
        ))}
      </div>

      {pending && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <button type="button" disabled={busy} onClick={() => onAct('DISMISS')} className={BTN2}>Classer sans suite</button>
          {what.remove && !gone && <button type="button" disabled={busy} onClick={() => onAct('REMOVE')} className={BTN}>{what.remove}</button>}
          {item.author && <button type="button" disabled={busy} onClick={() => onAct('WARN')} className={BTN2}>Avertir le membre</button>}
          {item.author && !item.author.bannedAt && <button type="button" disabled={busy} onClick={() => onAct('BAN')} className={BTN_DANGER}>Suspendre le compte</button>}
        </div>
      )}
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────── */

export default function AdminReportsPage() {
  const { notify, confirm } = useFeedback()
  const [tab, setTab] = useState<'pending' | 'done'>('pending')
  const [items, setItems] = useState<Item[] | null>(null)
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [dialog, setDialog] = useState<Exclude<Action, 'DISMISS'> | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async (which: 'pending' | 'done') => {
    setError(false)
    try {
      const res = await apiFetch(`${API}/api/admin/reports?status=${which}`, { cache: 'no-store' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems(data.items)
      setReasons(data.reasons || {})
      if (which === 'pending') setPendingCount(data.items.length)
      // Sur ordinateur, le premier de la liste est ouvert d'office
      setSelected(prev => (data.items.some((i: Item) => i.key === prev) ? prev : (window.innerWidth >= 1024 ? data.items[0]?.key ?? null : null)))
    } catch {
      setError(true)
    }
  }, [])

  useEffect(() => { setItems(null); load(tab) }, [tab, load])

  const current = items?.find(i => i.key === selected) || null

  const afterDecision = (message: string) => {
    setDialog(null)
    notify(message)
    window.dispatchEvent(new Event(ADMIN_BADGES_EVENT))
    load('pending')
  }

  const act = async (action: Action) => {
    if (!current) return
    if (action !== 'DISMISS') { setDialog(action); return }
    const ok = await confirm({
      title: 'Classer sans suite ?',
      message: `Le contenu reste en ligne${current.state?.hidden ? ' et redevient visible' : ''}. Son auteur n’est pas prévenu. Les personnes qui ont signalé sont informées que rien ne va à l’encontre des règles.`,
      confirmLabel: 'Classer sans suite',
    })
    if (!ok) return
    setBusy(true)
    try {
      const res = await apiFetch(`${API}/api/admin/reports/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: current.targetType, targetId: current.targetId, action }),
      })
      if (!res.ok) { notify((await res.json().catch(() => ({})))?.error || 'La décision n’a pas pu être enregistrée.', 'error'); return }
      afterDecision('Signalement classé sans suite.')
    } catch {
      notify('La décision n’a pas pu être enregistrée.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const total = items?.reduce((sum, i) => sum + i.count, 0) ?? 0

  return (
    <div>
      <PageHeader
        title="Signalements"
        subtitle={tab === 'pending'
          ? (items ? (items.length ? `${plural(items.length, 'contenu')} à examiner · ${plural(total, 'signalement')}` : 'Rien à examiner') : 'Chargement…')
          : 'Les décisions déjà prises'}
      />
      <SubTabs
        tabs={[{ key: 'pending', label: 'À traiter', badge: pendingCount }, { key: 'done', label: 'Traités' }]}
        value={tab}
        onChange={setTab}
      />

      {error && <ErrorBox text="Les signalements n'ont pas pu être chargés." />}
      {!error && !items && <Spinner />}
      {!error && items && items.length === 0 && (
        <p className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-5 py-6 text-sm text-muted">
          <CheckCircle2 className="h-4 w-4 text-accent-light" />
          {tab === 'pending' ? 'Aucun signalement à traiter.' : 'Aucune décision pour l’instant.'}
        </p>
      )}

      {!error && items && items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
          <div className={`space-y-2 ${current ? 'hidden lg:block' : ''}`}>
            {items.map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelected(item.key)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${selected === item.key ? 'border-accent bg-accent/15' : 'border-line bg-surface hover:bg-white/[0.04]'}`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-white">{itemTitle(item)}</span>
                  <span className="shrink-0 text-xs text-white/30">{ago(item.status ? item.resolvedAt || item.lastAt : item.lastAt)}</span>
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${item.count > 1 ? 'bg-red-500/15 text-red-300' : 'bg-gold/15 text-gold'}`}>{plural(item.count, 'signalement')}</span>
                  {reasons[item.reason] || item.reason}
                </span>
                {item.status && <span className="mt-1 block text-[11px] text-white/60">{DECISION[item.status] || item.status}</span>}
                {!item.status && item.state?.hidden && <span className="mt-1 block text-[11px] text-gold">Masqué{WHAT[item.targetType].e} en attendant</span>}
              </button>
            ))}
          </div>

          {current
            ? <Detail item={current} reasons={reasons} onBack={() => setSelected(null)} onAct={act} busy={busy} />
            : <div className="hidden items-center justify-center rounded-2xl border border-white/5 text-sm text-white/20 lg:flex">Choisissez un signalement</div>}
        </div>
      )}

      {dialog && current && (
        <DecisionDialog item={current} action={dialog} reasons={reasons} onClose={() => setDialog(null)} onDone={afterDecision} />
      )}
    </div>
  )
}
