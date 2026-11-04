'use client'

// Admin › Membres (choix C1 d'Antho, 31/10/2026) : liste avec filtres, fiche qui s'ouvre à droite
// avec toutes les informations du compte (bouton « œil ») et toutes les actions au même endroit.
// Les membres « à surveiller » (annulations tardives répétées) et les suspendus sont ici aussi.

/* eslint-disable @next/next/no-img-element */
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, Search, X, ExternalLink, RefreshCw } from 'lucide-react'
import { apiFetch } from '@/utils/auth'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'
import { ADMIN_BADGES_EVENT } from '@/components/admin/AdminSidebar'
import { ADMIN_LOG_LABELS } from '@/components/admin/logLabels'
import {
  API, BTN, BTN2, BTN_DANGER, CARD, INPUT, ROLE_LABEL, Empty, ErrorBox, PageHeader, PlanTag, Spinner,
  fmtDate, fmtDateTime, money,
} from '@/components/admin/ui'

type Plan = 'FREE' | 'PRO' | 'BUSINESS'
type ListedUser = {
  id: number; pseudo: string | null; firstName: string | null; lastName: string | null; email: string; role: string
  emailVerified: boolean; canManageProfiles: boolean; bannedAt: string | null; pausedAt: string | null
  createdAt: string; lastActiveAt: string | null; plan: Plan; planSource: string | null
  profile: { id: number; avatar: string | null; city: string | null; location: string | null } | null
}
type Json = Record<string, unknown>
type Detail = {
  user: Json & {
    id: number; email: string; role: string; plan: Plan; canManageProfiles: boolean; bannedAt: string | null; banReason: string | null
    profile: (Json & { id: number; avatar: string | null; _count: Record<string, number>; managers: { status: string; manager: Json }[] }) | null
    subscription: (Json & { status: string; source: string; interval: string; priceCents: number; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; endDate: string | null }) | null
    agencySubscription: (Json & { status: string; interval: string; priceCents: number; currentPeriodEnd: string | null; extraProfiles: number }) | null
    managedProfiles: { id: number; status: string; profile: { id: number; user: Json } }[]
    sessions: { name: string; createdAt: string; lastUsedAt: string; revokedAt: string | null }[]
    extraOrders: { id: number; label: string; status: string; amountCents: number; paidAt: string | null; createdAt: string }[]
    promoRedemptions: { createdAt: string; code: { code: string; kind: string } }[]
    _count: Record<string, number>
  }
  lateCancellations: { count: number; cancellations: { id: number; startDate: string; cancelledAt: string }[]; warnedAt: string | null } | null
  adminLogs: { id: number; action: string; createdAt: string; details: Json | null }[]
}
type WatchReport = {
  alerts: { userId: number; name: string; email: string; role: string; count: number; cancellations: { id: number; startDate: string; cancelledAt: string }[]; warnedAt: string | null; bannedAt: string | null; needsDecision: boolean }[]
  rules: { warnAt: number; alertAt: number; windowDays: number }
}

const LIMIT = 30
const displayName = (u: { pseudo?: unknown; firstName?: unknown; lastName?: unknown; email?: unknown }) =>
  String(u.pseudo || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '—')

const FILTERS: { group: string; items: { key: string; label: string; param: Record<string, string> }[] }[] = [
  { group: 'Type', items: [
    { key: 'all', label: 'Tous', param: {} },
    { key: 'ARTIST', label: 'Artistes', param: { role: 'ARTIST' } },
    { key: 'ORGANIZER', label: 'Organisateurs', param: { role: 'ORGANIZER' } },
    { key: 'PROVIDER', label: 'Prestataires', param: { role: 'PROVIDER' } },
  ] },
  { group: 'Formule', items: [
    { key: 'free', label: 'Gratuit', param: { plan: 'free' } },
    { key: 'pro', label: 'Pro', param: { plan: 'pro' } },
    { key: 'business', label: 'Business', param: { plan: 'business' } },
  ] },
  { group: 'État', items: [
    { key: 'watch', label: 'À surveiller', param: { status: 'watch' } },
    { key: 'banned', label: 'Suspendus', param: { status: 'banned' } },
    { key: 'unverified', label: 'E-mail non confirmé', param: { status: 'unverified' } },
  ] },
]
const ALL_FILTERS = FILTERS.flatMap(g => g.items)

/* ── Libellés de la fiche ─────────────────────────────── */

const LABELS: Record<string, string> = {
  id: 'Numéro du compte', email: 'E-mail', pseudo: 'Pseudo', firstName: 'Prénom', lastName: 'Nom', dateOfBirth: 'Date de naissance',
  phone: 'Téléphone', countryOfResidence: 'Pays de résidence', createdAt: 'Inscrit le', lastActiveAt: 'Dernière activité',
  emailVerified: 'E-mail confirmé', requiresPasswordReset: 'Doit changer son mot de passe', isIdentityVerified: 'Identité vérifiée',
  isPaymentEnabled: 'Paiements activés', stripeAccountId: 'Compte Stripe (versements)', stripeCustomerId: 'Client Stripe (abonnements)',
  signupPlan: 'Formule choisie à l’inscription', payoutMode: 'Mode de versement', registrationStep: 'Étape d’inscription',
  pausedAt: 'Compte en pause depuis', bannedAt: 'Suspendu le', banReason: 'Motif de suspension', lateCancelWarnedAt: 'Averti (annulations) le',
  newsletterOptIn: 'Accepte la newsletter', newsletterOptInAt: 'Newsletter acceptée le', loginAlerts: 'Alertes de connexion',
  passwordChangedAt: 'Mot de passe changé le', pendingEmail: 'Nouvel e-mail en attente', pendingEmailExpiresAt: 'Nouvel e-mail valable jusqu’au',
  canManageProfiles: 'Business offert par l’admin', isAdmin: 'Ancien drapeau admin', role: 'Type de compte', notifPrefs: 'Préférences de notification',
  bio: 'Bio', profession: 'Métier', location: 'Localisation', country: 'Pays', latitude: 'Latitude', longitude: 'Longitude', radiusKm: 'Rayon de déplacement (km)',
  specialties: 'Spécialités', styles: 'Styles', typeEtablissement: 'Type d’établissement', avatar: 'Photo', banner: 'Bannière',
  soundcloudUrl: 'SoundCloud', youtubeUrl: 'YouTube', instagramUrl: 'Instagram', facebookUrl: 'Facebook', tiktokUrl: 'TikTok', twitterUrl: 'X (Twitter)',
  linkedinUrl: 'LinkedIn', websiteUrl: 'Site web', showRealName: 'Affiche son vrai nom', legalStatus: 'Statut juridique', siret: 'SIRET',
  organizerType: 'Type d’organisateur', establishmentName: 'Établissement', address: 'Adresse', postalCode: 'Code postal', city: 'Ville',
  hiddenFromSearch: 'Caché de la recherche', userId: 'Numéro du compte', updatedAt: 'Modifié le', lastWeeklyRecapAt: 'Dernier récap hebdo',
}
const LEGAL: Record<string, string> = { INDIVIDUAL: 'Particulier', AUTO_ENTREPRENEUR: 'Auto-entrepreneur', COMPANY: 'Société', INTERMITTENT: 'Intermittent du spectacle' }
const SUB_STATUS: Record<string, string> = { TRIAL: 'Essai', ACTIVE: 'Actif', PAST_DUE: 'Paiement en retard', CANCELLED: 'Résilié', EXPIRED: 'Terminé' }
const SOURCE: Record<string, string> = { STRIPE: 'payant', FOUNDER: 'offert', ADMIN: 'offert' }
const COUNT_LABELS: Record<string, string> = {
  publications: 'Publications', events: 'Événements', offers: 'Offres', albums: 'Albums', bookingRequestsSent: 'Bookings envoyés',
  bookingRequestsReceived: 'Bookings reçus', reviewsGiven: 'Avis donnés', reviewsReceived: 'Avis reçus', applicationsSubmitted: 'Candidatures',
  followers: 'Abonnés', following: 'Abonnements', messages: 'Messages envoyés', loginEvents: 'Connexions',
}
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T/

function showValue(key: string, value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (Array.isArray(value)) return value.length ? value.join(', ') : null
  if (key === 'legalStatus') return LEGAL[String(value)] || String(value)
  if (key === 'role') return ROLE_LABEL[String(value)] || String(value)
  if (typeof value === 'string' && ISO_DATE.test(value)) return key === 'dateOfBirth' ? fmtDate(value) : fmtDateTime(value)
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2 text-xs last:border-0">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="break-all text-right text-white/90">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted">{title}</h3>
      {children}
    </section>
  )
}

/** Champs listés un à un, dans l'ordre donné */
function Fields({ obj, keys }: { obj: Json | null | undefined; keys: string[] }) {
  if (!obj) return null
  return <>{keys.map(k => <Row key={k} label={LABELS[k] || k} value={showValue(k, obj[k])} />)}</>
}

const USER_SHOWN = ['id', 'email', 'pseudo', 'firstName', 'lastName', 'dateOfBirth', 'phone', 'countryOfResidence', 'role', 'createdAt', 'lastActiveAt',
  'emailVerified', 'registrationStep', 'pausedAt', 'bannedAt', 'banReason', 'isIdentityVerified', 'isPaymentEnabled', 'payoutMode', 'stripeAccountId',
  'stripeCustomerId', 'signupPlan', 'canManageProfiles']
const PROFILE_SHOWN = ['legalStatus', 'siret', 'organizerType', 'establishmentName', 'address', 'postalCode', 'city', 'profession', 'location', 'country',
  'radiusKm', 'specialties', 'styles', 'typeEtablissement', 'bio', 'instagramUrl', 'facebookUrl', 'tiktokUrl', 'soundcloudUrl', 'youtubeUrl',
  'twitterUrl', 'linkedinUrl', 'websiteUrl', 'showRealName', 'hiddenFromSearch']
const NESTED = new Set(['profile', 'subscription', 'agencySubscription', 'managedProfiles', 'sessions', 'extraOrders', 'promoRedemptions', '_count', 'plan', 'managers'])

/* ── Fiche du membre ──────────────────────────────────── */

function MemberPanel({ id, onClose, onChanged }: { id: number; onClose: () => void; onChanged: () => void }) {
  const { notify, confirm } = useFeedback()
  const [data, setData] = useState<Detail | null>(null)
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [showBan, setShowBan] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`${API}/api/admin/users/${id}`, { cache: 'no-store' })
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch { setError(true) }
  }, [id])
  useEffect(() => { setData(null); setError(false); setShowBan(false); setShowAll(false); load() }, [load])

  const act = async (url: string, method: string, body: unknown, done: string) => {
    setBusy(true)
    try {
      const res = await apiFetch(`${API}${url}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
      if (!res.ok) { notify(await apiErrorMessage(res, 'Action impossible.'), 'error'); return false }
      notify(done)
      await load()
      onChanged()
      window.dispatchEvent(new CustomEvent(ADMIN_BADGES_EVENT))
      return true
    } finally { setBusy(false) }
  }

  if (error) return <div className="p-5"><ErrorBox text="La fiche n'a pas pu être chargée." /></div>
  if (!data) return <Spinner />

  const u = data.user
  const name = displayName(u)
  const p = u.profile
  const sub = u.subscription
  const agency = u.agencySubscription
  const proGifted = sub && (sub.source === 'ADMIN' || sub.source === 'FOUNDER') && u.plan !== 'FREE' && !sub.endDate
  const publicHref = p ? `/${String(u.role).toLowerCase()}/${u.id}` : null
  const otherUser = Object.entries(u).filter(([k]) => !USER_SHOWN.includes(k) && !NESTED.has(k))
  const otherProfile = p ? Object.entries(p).filter(([k]) => !PROFILE_SHOWN.includes(k) && !NESTED.has(k) && k !== 'id' && k !== 'avatar' && k !== 'banner' && k !== '_count') : []
  const counts = { ...(p?._count || {}), ...u._count }

  return (
    <div className="px-5 pb-8 pt-5">
      {/* En-tête */}
      <div className="mb-4 flex items-center gap-3">
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-accent/15">
          {p?.avatar
            ? <img src={p.avatar} alt="" className="h-full w-full object-cover" />
            : <span className="flex h-full items-center justify-center text-lg font-semibold text-accent-light">{name[0]?.toUpperCase()}</span>}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{name}</p>
          <p className="truncate text-xs text-muted">{u.email}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-white/8 px-2 py-0.5 text-[11px] text-white/70">{ROLE_LABEL[u.role] || u.role}</span>
            <PlanTag plan={u.plan} source={u.canManageProfiles && u.plan === 'BUSINESS' ? 'ADMIN' : sub?.source} />
            {u.bannedAt && <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-[11px] text-red-300">Suspendu</span>}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={`${CARD} mb-5 space-y-3 p-4`}>
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-widest text-muted">Abonnement</p>
          <div className="grid grid-cols-2 gap-2">
            {u.plan === 'PRO' && !proGifted
              ? <span className={`${BTN2} text-center opacity-60`}>Déjà Pro (payant)</span>
              : proGifted
              ? <button type="button" disabled={busy} className={BTN2} onClick={async () => {
                  if (await confirm({ title: `Retirer le Pro offert à ${name} ?`, confirmLabel: 'Retirer', danger: true })) act(`/api/admin/billing/users/${u.id}/gift-pro`, 'DELETE', null, 'Pro retiré.')
                }}>Retirer le Pro offert</button>
              : <button type="button" disabled={busy} className={BTN2} onClick={async () => {
                  if (await confirm({ title: `Offrir le Pro à ${name} ?`, message: 'Sans limite de durée, sans carte bancaire. Vous pourrez le retirer à tout moment.', confirmLabel: 'Offrir le Pro' })) act(`/api/admin/billing/users/${u.id}/gift-pro`, 'POST', {}, 'Pro offert.')
                }}>Offrir le Pro</button>}
            <button type="button" disabled={busy} className={BTN2} onClick={async () => {
              const enabled = !u.canManageProfiles
              if (await confirm({ title: enabled ? `Offrir la formule Business à ${name} ?` : `Retirer la formule Business offerte à ${name} ?`, confirmLabel: enabled ? 'Offrir Business' : 'Retirer', danger: !enabled }))
                act(`/api/admin/users/${u.id}/manage-profiles`, 'PATCH', { enabled }, enabled ? 'Business offert.' : 'Business retiré.')
            }}>{u.canManageProfiles ? 'Retirer Business offert' : 'Offrir Business'}</button>
          </div>
        </div>
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-widest text-muted">Compte</p>
          <div className="grid grid-cols-2 gap-2">
            {publicHref
              ? <Link href={publicHref} target="_blank" className={`${BTN2} flex items-center justify-center gap-1.5`}>Voir le profil <ExternalLink className="h-3 w-3" /></Link>
              : <span className={`${BTN2} text-center opacity-40`}>Pas de profil</span>}
            {u.bannedAt
              ? <button type="button" disabled={busy} className={BTN2} onClick={async () => {
                  if (await confirm({ title: `Réactiver le compte de ${name} ?`, confirmLabel: 'Réactiver' })) act(`/api/admin/billing/users/${u.id}/unban`, 'POST', null, 'Compte réactivé.')
                }}>Réactiver</button>
              : <button type="button" disabled={busy} className={BTN_DANGER} onClick={() => setShowBan(v => !v)}>Suspendre</button>}
          </div>
          {showBan && !u.bannedAt && (
            <div className="mt-3 space-y-2">
              <input value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Motif (gardé dans l'historique)" className={INPUT} />
              <button type="button" disabled={busy || !banReason.trim()} className={`${BTN} w-full`} onClick={async () => {
                if (await act(`/api/admin/billing/users/${u.id}/ban`, 'POST', { reason: banReason.trim() }, 'Compte suspendu : le membre est déconnecté partout.')) { setShowBan(false); setBanReason('') }
              }}>Confirmer la suspension</button>
            </div>
          )}
        </div>
      </div>

      {u.bannedAt && (
        <p className="mb-5 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          Suspendu le {fmtDate(u.bannedAt)}{u.banReason ? ` · ${u.banReason}` : ''}
        </p>
      )}

      <Section title="Identité et compte"><Fields obj={u} keys={USER_SHOWN} /></Section>

      <Section title="Abonnement">
        {!sub && !agency && !u.canManageProfiles && <p className="py-2 text-xs text-muted">Compte gratuit, aucun abonnement.</p>}
        {sub && (
          <>
            <Row label="Pro" value={`${SUB_STATUS[sub.status] || sub.status} · ${SOURCE[sub.source] || sub.source}`} />
            {sub.source === 'STRIPE' && <Row label="Prix" value={`${money(sub.priceCents)} / ${sub.interval === 'YEAR' ? 'an' : 'mois'}`} />}
            <Row label="Échéance" value={sub.currentPeriodEnd ? fmtDate(sub.currentPeriodEnd) : null} />
            <Row label="Résiliation prévue" value={sub.cancelAtPeriodEnd ? 'Oui, à l’échéance' : null} />
            <Row label="Fin" value={sub.endDate ? fmtDate(sub.endDate) : null} />
          </>
        )}
        {agency && (
          <>
            <Row label="Business" value={`${SUB_STATUS[agency.status] || agency.status} · ${money(agency.priceCents)} / ${agency.interval === 'YEAR' ? 'an' : 'mois'}`} />
            <Row label="Profils en plus" value={agency.extraProfiles ? String(agency.extraProfiles) : null} />
            <Row label="Échéance" value={agency.currentPeriodEnd ? fmtDate(agency.currentPeriodEnd) : null} />
          </>
        )}
        {u.promoRedemptions.map((r, i) => <Row key={i} label="Code utilisé" value={`${r.code.code} le ${fmtDate(r.createdAt)}`} />)}
      </Section>

      <Section title="Activité">
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(counts).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white/[0.03] px-3 py-2">
              <p className="text-base font-semibold">{v}</p>
              <p className="text-[11px] text-muted">{COUNT_LABELS[k] || k}</p>
            </div>
          ))}
        </div>
      </Section>

      {p && <Section title="Profil et informations légales"><Fields obj={p} keys={PROFILE_SHOWN} /></Section>}

      {(u.managedProfiles.length > 0 || (p?.managers.length ?? 0) > 0) && (
        <Section title="Profils gérés">
          {u.managedProfiles.map(m => <Row key={m.id} label={m.status === 'ACTIVE' ? 'Gère' : 'Invitation envoyée à'} value={displayName(m.profile.user)} />)}
          {p?.managers.map((m, i) => <Row key={i} label={m.status === 'ACTIVE' ? 'Géré par' : 'Invité par'} value={displayName(m.manager)} />)}
        </Section>
      )}

      {data.lateCancellations && (
        <Section title="Annulations tardives">
          <Row label="Nombre" value={String(data.lateCancellations.count)} />
          <Row label="Averti le" value={data.lateCancellations.warnedAt ? fmtDate(data.lateCancellations.warnedAt) : null} />
          {data.lateCancellations.cancellations.map(c => <Row key={c.id} label={`Booking du ${fmtDate(c.startDate)}`} value={`annulé le ${fmtDate(c.cancelledAt)}`} />)}
        </Section>
      )}

      {u.extraOrders.length > 0 && (
        <Section title="Services achetés">
          {u.extraOrders.map(o => <Row key={o.id} label={o.label} value={`${money(o.amountCents)} · ${fmtDate(o.paidAt || o.createdAt)}`} />)}
        </Section>
      )}

      <Section title="Appareils connectés">
        {u.sessions.length === 0 && <p className="py-2 text-xs text-muted">Aucun.</p>}
        {u.sessions.map((s, i) => <Row key={i} label={s.name} value={s.revokedAt ? `déconnecté le ${fmtDate(s.revokedAt)}` : `actif le ${fmtDateTime(s.lastUsedAt)}`} />)}
      </Section>

      <Section title="Actions de l'admin sur ce compte">
        {data.adminLogs.length === 0 && <p className="py-2 text-xs text-muted">Aucune.</p>}
        {data.adminLogs.map(l => <Row key={l.id} label={fmtDateTime(l.createdAt)} value={ADMIN_LOG_LABELS[l.action] || l.action} />)}
        {data.adminLogs.length > 0 && <Link href="/admin/historique" className="mt-1 inline-block text-xs text-accent-light hover:underline">Voir l&apos;historique complet</Link>}
      </Section>

      <Section title="Toutes les autres informations">
        <button type="button" onClick={() => setShowAll(v => !v)} className="text-xs text-accent-light hover:underline">
          {showAll ? 'Masquer' : `Afficher les ${otherUser.length + otherProfile.length} autres champs`}
        </button>
        {showAll && (
          <div className="mt-2">
            {otherUser.map(([k, v]) => <Row key={`u-${k}`} label={LABELS[k] || k} value={showValue(k, v) ?? '—'} />)}
            {otherProfile.map(([k, v]) => <Row key={`p-${k}`} label={`Profil · ${LABELS[k] || k}`} value={showValue(k, v) ?? '—'} />)}
          </div>
        )}
      </Section>

      <button type="button" disabled={busy} className={`${BTN_DANGER} mt-2 w-full py-2.5`} onClick={async () => {
        if (!(await confirm({ title: `Supprimer le compte de ${name} ?`, message: `${u.email} — toutes ses données et ses fichiers sont effacés. Son abonnement s'arrête à la fin de la période payée, sans remboursement. Irréversible.`, confirmLabel: 'Supprimer définitivement', danger: true }))) return
        setBusy(true)
        try {
          const res = await apiFetch(`${API}/api/admin/users/${u.id}`, { method: 'DELETE' })
          if (!res.ok) { notify(await apiErrorMessage(res, 'Suppression impossible.'), 'error'); return }
          notify('Compte supprimé.')
          onChanged()
          onClose()
        } finally { setBusy(false) }
      }}>Supprimer le compte</button>
    </div>
  )
}

/* ── Membres à surveiller ─────────────────────────────── */

function WatchPanel({ onOpen }: { onOpen: (id: number) => void }) {
  const [report, setReport] = useState<WatchReport | null>(null)
  useEffect(() => {
    apiFetch(`${API}/api/admin/billing/late-cancellations`, { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(setReport).catch(() => {})
  }, [])
  if (!report) return null
  return (
    <div className="mb-5 rounded-2xl border border-gold/25 bg-gold/[0.06] px-5 py-4 text-sm">
      <p className="text-white/80">
        Annulations faites par la personne bookée à moins de 7 jours de la date, sur {report.rules.windowDays} jours.
        Avertissement automatique à {report.rules.warnAt}, alerte ici à {report.rules.alertAt} : c&apos;est vous qui décidez de suspendre
        (maladie, accident… restent des cas à part). Ouvrez la fiche pour suspendre.
      </p>
      {report.alerts.filter(a => a.needsDecision).map(a => (
        <button key={a.userId} type="button" onClick={() => onOpen(a.userId)} className="mt-2 flex w-full items-center gap-2 text-left text-gold hover:underline">
          {a.name} · {a.count} annulations tardives · à décider
        </button>
      ))}
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────── */

function MembersContent() {
  const params = useSearchParams()
  const router = useRouter()
  const initial = ALL_FILTERS.find(f => Object.entries(f.param).every(([k, v]) => params.get(k) === v) && Object.keys(f.param).length)?.key || 'all'
  const [filter, setFilter] = useState(initial)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [users, setUsers] = useState<ListedUser[] | null>(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setError(false)
    try {
      const qs = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT), ...(ALL_FILTERS.find(f => f.key === filter)?.param || {}) })
      if (search) qs.set('q', search)
      const res = await apiFetch(`${API}/api/admin/users?${qs}`, { cache: 'no-store' })
      if (!res.ok) throw new Error()
      const d = await res.json()
      setUsers(d.users)
      setTotal(d.total)
    } catch { setError(true) }
  }, [filter, page, search])
  useEffect(() => { load() }, [load])

  const choose = (key: string) => {
    setFilter(key)
    setPage(0)
    const param = ALL_FILTERS.find(f => f.key === key)?.param || {}
    router.replace(`/admin/users${Object.keys(param).length ? `?${new URLSearchParams(param)}` : ''}`)
  }
  const pages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div>
      <PageHeader
        title="Membres"
        subtitle={`${total.toLocaleString('fr-FR')} compte${total > 1 ? 's' : ''}${filter !== 'all' ? ' avec ce filtre' : ''}`}
        action={<button type="button" onClick={load} className={`${BTN2} flex items-center gap-2`}><RefreshCw className="h-3.5 w-3.5" /> Actualiser</button>}
      />

      <form onSubmit={e => { e.preventDefault(); setPage(0); setSearch(q.trim()) }} className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input value={q} onChange={e => setQ(e.target.value)} onBlur={() => { setPage(0); setSearch(q.trim()) }}
          placeholder="Pseudo, nom ou e-mail…" className={`${INPUT} py-2.5 pl-10`} />
      </form>

      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        {FILTERS.map(g => (
          <div key={g.group} className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] uppercase tracking-widest text-muted">{g.group}</span>
            {g.items.map(f => (
              <button key={f.key} type="button" onClick={() => choose(f.key)}
                className={`rounded-full px-3 py-1.5 text-xs transition ${filter === f.key ? 'bg-accent text-white' : 'border border-line text-muted hover:text-white'}`}>
                {f.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {filter === 'watch' && <WatchPanel onOpen={setOpenId} />}
      {error && <ErrorBox text="La liste des membres n'a pas pu être chargée." />}
      {!users && !error && <Spinner />}
      {users && users.length === 0 && <Empty text="Aucun membre ne correspond." />}

      {users && users.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {users.map(u => {
            const name = displayName(u)
            return (
              <li key={u.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenId(u.id)}
                  onKeyDown={e => { if (e.key === 'Enter') setOpenId(u.id) }}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03] ${openId === u.id ? 'bg-accent/10' : ''}`}
                >
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-accent/15">
                    {u.profile?.avatar
                      ? <img src={u.profile.avatar} alt="" className="h-full w-full object-cover" />
                      : <span className="flex h-full items-center justify-center text-sm font-semibold text-accent-light">{name[0]?.toUpperCase()}</span>}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="truncate text-xs text-muted">
                      {ROLE_LABEL[u.role] || u.role}{u.profile?.city || u.profile?.location ? ` · ${u.profile.city || u.profile.location}` : ''} · {u.email} · inscrit le {fmtDate(u.createdAt)}
                    </p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                    {!u.emailVerified && <span className="rounded-md bg-white/8 px-2 py-0.5 text-[11px] text-white/60">E-mail non confirmé</span>}
                    {u.bannedAt && <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-[11px] text-red-300">Suspendu</span>}
                    <PlanTag plan={u.plan} source={u.planSource} />
                  </div>
                  <span className="shrink-0 rounded-lg p-2 text-muted hover:bg-white/10 hover:text-white" title="Toutes les informations du compte">
                    <Eye className="h-4 w-4" />
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button type="button" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className={BTN2}>← Précédent</button>
          <span className="text-sm text-muted">Page {page + 1} / {pages}</span>
          <button type="button" onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page + 1 >= pages} className={BTN2}>Suivant →</button>
        </div>
      )}

      {/* Fiche à droite */}
      {openId !== null && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button type="button" aria-label="Fermer la fiche" onClick={() => setOpenId(null)} className="absolute inset-0 bg-black/50" />
          <div className="relative h-full w-full max-w-md overflow-y-auto border-l border-line bg-[#100e17] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-[#100e17]/95 px-5 py-3.5 backdrop-blur">
              <h2 className="text-sm font-semibold">Fiche du membre</h2>
              <button type="button" onClick={() => setOpenId(null)} aria-label="Fermer" className="rounded-lg p-1.5 text-muted hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <MemberPanel id={openId} onClose={() => setOpenId(null)} onChanged={load} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminMembersPage() {
  return (
    <Suspense fallback={null}>
      <MembersContent />
    </Suspense>
  )
}

