'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Trash2, Search, RefreshCw, Eye, X, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return t ? { Authorization: `Bearer ${t}`, ...extra } : { ...extra }
}

type ListedUser = {
  id: number
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  email: string
  role: string
  emailVerified: boolean
  createdAt: string
  profile?: { id: number; avatar?: string | null } | null
}

type DetailUser = {
  id: number
  email: string
  role: string
  isAdmin: boolean
  createdAt: string
  pseudo?: string | null
  firstName?: string | null
  lastName?: string | null
  dateOfBirth?: string | null
  phone?: string | null
  countryOfResidence?: string | null
  emailVerified: boolean
  isIdentityVerified: boolean
  isPaymentEnabled: boolean
  registrationStep: number
  stripeAccountId?: string | null
  profile?: {
    id: number
    bio?: string | null
    profession?: string | null
    location?: string | null
    country?: string | null
    radiusKm?: number | null
    specialties?: string[]
    styles?: string[]
    typeEtablissement?: string | null
    avatar?: string | null
    availableForBooking?: boolean
    showRealName?: boolean
    legalStatus?: string | null
    siret?: string | null
    organizerType?: string | null
    establishmentName?: string | null
    address?: string | null
    postalCode?: string | null
    city?: string | null
  } | null
}

const ROLE_COLORS: Record<string, string> = {
  ARTIST:    'bg-pink-600/20 text-pink-400 border-pink-600/30',
  ORGANIZER: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  PROVIDER:  'bg-violet-600/20 text-violet-400 border-violet-600/30',
}

const ROLE_LABELS: Record<string, string> = {
  ARTIST: 'Artiste', ORGANIZER: 'Organisateur', PROVIDER: 'Prestataire',
}

const LEGAL_LABELS: Record<string, string> = {
  INDIVIDUAL: 'Particulier',
  AUTO_ENTREPRENEUR: 'Auto-entrepreneur',
  COMPANY: 'Société',
}

const displayName = (u: ListedUser | DetailUser) =>
  u.pseudo || [u.firstName, u.lastName].filter(Boolean).join(' ') || '—'

const LIMIT = 20

function InfoRow({ label, value }: { label: string; value?: string | null | boolean | number }) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center justify-between py-2 border-b border-white/5">
        <span className="text-xs text-white/40">{label}</span>
        {value
          ? <CheckCircle size={15} className="text-emerald-400" />
          : <XCircle size={15} className="text-red-400" />}
      </div>
    )
  }
  return (
    <div className="flex items-start justify-between py-2 border-b border-white/5 gap-4">
      <span className="text-xs text-white/40 flex-shrink-0">{label}</span>
      <span className="text-xs text-white text-right break-all">{String(value)}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">{title}</h3>
      <div>{children}</div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [q, setQ]         = useState('')
  const [users, setUsers]  = useState<ListedUser[]>([])
  const [total, setTotal]  = useState(0)
  const [page, setPage]    = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]  = useState<string | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [changingRole, setChangingRole] = useState<number | null>(null)

  const [detailUser, setDetailUser] = useState<DetailUser | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const load = useCallback(async (pageIndex: number, search: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(pageIndex * LIMIT) })
      if (search.trim()) params.set('q', search.trim())

      const res = await fetch(`${API}/api/admin/users?${params}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch {
      setError('Impossible de charger les utilisateurs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(page, q) }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const search = () => { setPage(0); load(0, q) }

  const openDetail = async (id: number) => {
    setDetailLoading(true)
    setDetailUser(null)
    try {
      const res = await fetch(`${API}/api/admin/users/${id}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDetailUser(data.user)
    } catch {
      alert('Impossible de charger les détails.')
    } finally {
      setDetailLoading(false)
    }
  }

  const changeRole = async (u: ListedUser, newRole: string) => {
    if (newRole === u.role) return
    if (!confirm(`Changer le rôle de ${displayName(u)} de ${ROLE_LABELS[u.role] || u.role} vers ${ROLE_LABELS[newRole] || newRole} ?`)) return
    setChangingRole(u.id)
    try {
      const res = await fetch(`${API}/api/admin/users/${u.id}/role`, {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error()
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x))
    } catch {
      alert('Échec du changement de rôle.')
    } finally {
      setChangingRole(null)
    }
  }

  const deleteUser = async (u: ListedUser) => {
    if (!confirm(`Supprimer le compte de ${displayName(u)} (${u.email}) ? Cette action est irréversible.`)) return
    setDeleting(u.id)
    try {
      const res = await fetch(`${API}/api/admin/users/${u.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error()
      setUsers(prev => prev.filter(x => x.id !== u.id))
      setTotal(prev => prev - 1)
      if (detailUser?.id === u.id) setDetailUser(null)
    } catch {
      alert('Échec de la suppression.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="text-sm text-white/40 mt-0.5">{total} compte{total !== 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={() => load(page, q)}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
          title="Rafraîchir"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Recherche */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Rechercher par pseudo, nom, email…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
        <button
          onClick={search}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
        >
          Rechercher
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {loading && <p className="text-white/50 text-sm mb-4">Chargement…</p>}

      {!loading && users.length === 0 && (
        <p className="text-white/40 text-sm">Aucun utilisateur trouvé.</p>
      )}

      <div className="space-y-2">
        {users.map(u => (
          <div
            key={u.id}
            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
          >
            {/* Avatar */}
            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-neutral-700 flex-shrink-0">
              {u.profile?.avatar ? (
                <Image src={u.profile.avatar} alt={displayName(u)} fill className="object-cover" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white/60">
                  {displayName(u).charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm truncate">{displayName(u)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[u.role] || 'bg-white/10 text-white/50 border-white/10'}`}>
                  {ROLE_LABELS[u.role] || u.role}
                </span>
                {!u.emailVerified && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-600/20 text-yellow-400 border border-yellow-600/30">
                    Email non vérifié
                  </span>
                )}
              </div>
              <p className="text-xs text-white/40 truncate mt-0.5">
                {u.email} · #{u.id} · Inscrit le {new Date(u.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>

            {/* Voir le détail */}
            <button
              onClick={() => openDetail(u.id)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/50 hover:text-white flex-shrink-0"
              title="Voir la fiche complète"
            >
              <Eye size={16} />
            </button>

            {/* Changer le rôle */}
            <select
              value={u.role}
              onChange={e => changeRole(u, e.target.value)}
              disabled={changingRole === u.id}
              className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white disabled:opacity-40 flex-shrink-0 cursor-pointer"
              title="Changer le rôle"
            >
              <option value="ARTIST">Artiste</option>
              <option value="ORGANIZER">Organisateur</option>
              <option value="PROVIDER">Prestataire</option>
            </select>

            {/* Supprimer */}
            <button
              onClick={() => deleteUser(u)}
              disabled={deleting === u.id}
              className="p-2 rounded-lg bg-red-600/10 hover:bg-red-600/30 text-red-400 disabled:opacity-40 flex-shrink-0"
              title="Supprimer ce compte"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center gap-3 justify-center">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-sm"
          >
            ← Précédent
          </button>
          <span className="text-sm text-white/50">Page {page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page + 1 >= totalPages}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-sm"
          >
            Suivant →
          </button>
        </div>
      )}

      {/* ── Panneau détail utilisateur ── */}
      {(detailUser || detailLoading) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDetailUser(null)}
          />

          {/* Panneau */}
          <div className="relative z-10 w-full max-w-md bg-neutral-900 border-l border-white/10 h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur border-b border-white/10 px-5 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-base">Fiche utilisateur</h2>
              <button
                onClick={() => setDetailUser(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {detailLoading && (
              <div className="flex items-center justify-center h-48 text-white/40 text-sm">
                Chargement…
              </div>
            )}

            {detailUser && (
              <div className="px-5 py-5">

                {/* En-tête */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative h-14 w-14 rounded-full overflow-hidden bg-neutral-700 flex-shrink-0">
                    {detailUser.profile?.avatar ? (
                      <Image src={detailUser.profile.avatar} alt={displayName(detailUser)} fill className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white/60">
                        {displayName(detailUser).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{displayName(detailUser)}</p>
                    <p className="text-xs text-white/40">{detailUser.email}</p>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[detailUser.role] || 'bg-white/10 text-white/50 border-white/10'}`}>
                      {ROLE_LABELS[detailUser.role] || detailUser.role}
                    </span>
                  </div>
                </div>

                {/* Identité */}
                <Section title="Identité">
                  <InfoRow label="Prénom" value={detailUser.firstName} />
                  <InfoRow label="Nom" value={detailUser.lastName} />
                  <InfoRow label="Pseudo" value={detailUser.pseudo} />
                  <InfoRow label="Date de naissance" value={detailUser.dateOfBirth ? new Date(detailUser.dateOfBirth).toLocaleDateString('fr-FR') : null} />
                  <InfoRow label="Téléphone" value={detailUser.phone} />
                  <InfoRow label="Pays de résidence" value={detailUser.countryOfResidence} />
                </Section>

                {/* Compte */}
                <Section title="Compte">
                  <InfoRow label="ID" value={`#${detailUser.id}`} />
                  <InfoRow label="Inscrit le" value={new Date(detailUser.createdAt).toLocaleDateString('fr-FR')} />
                  <InfoRow label="Email vérifié" value={detailUser.emailVerified} />
                  <InfoRow label="Étape d'inscription" value={`${detailUser.registrationStep} / 4`} />
                  <InfoRow label="Identité vérifiée" value={detailUser.isIdentityVerified} />
                  <InfoRow label="Paiement activé" value={detailUser.isPaymentEnabled} />
                  {detailUser.stripeAccountId && (
                    <InfoRow label="Compte Stripe" value={detailUser.stripeAccountId} />
                  )}
                </Section>

                {/* Informations légales */}
                <Section title="Informations légales">
                  <InfoRow label="Statut juridique" value={detailUser.profile?.legalStatus ? LEGAL_LABELS[detailUser.profile.legalStatus] || detailUser.profile.legalStatus : null} />
                  <InfoRow label="SIRET / KBIS" value={detailUser.profile?.siret} />
                  <InfoRow label="Nom de l'établissement" value={detailUser.profile?.establishmentName} />
                  <InfoRow label="Type organisateur" value={
                    detailUser.profile?.organizerType === 'INDIVIDUAL' ? 'Particulier' :
                    detailUser.profile?.organizerType === 'PROFESSIONAL' ? 'Professionnel' : null
                  } />
                  <InfoRow label="Adresse" value={detailUser.profile?.address} />
                  <InfoRow label="Code postal" value={detailUser.profile?.postalCode} />
                  <InfoRow label="Ville" value={detailUser.profile?.city} />
                </Section>

                {/* Profil public */}
                <Section title="Profil public">
                  <InfoRow label="Profession" value={detailUser.profile?.profession} />
                  <InfoRow label="Localisation" value={detailUser.profile?.location} />
                  <InfoRow label="Pays" value={detailUser.profile?.country} />
                  <InfoRow label="Rayon (km)" value={detailUser.profile?.radiusKm} />
                  <InfoRow label="Disponible au booking" value={detailUser.profile?.availableForBooking} />
                  {detailUser.profile?.specialties?.length ? (
                    <InfoRow label="Spécialités" value={detailUser.profile.specialties.join(', ')} />
                  ) : null}
                  {detailUser.profile?.styles?.length ? (
                    <InfoRow label="Styles" value={detailUser.profile.styles.join(', ')} />
                  ) : null}
                  {detailUser.profile?.bio && (
                    <div className="py-2 border-b border-white/5">
                      <p className="text-xs text-white/40 mb-1">Bio</p>
                      <p className="text-xs text-white leading-relaxed">{detailUser.profile.bio}</p>
                    </div>
                  )}
                </Section>

                {/* Alerte infos manquantes */}
                {(!detailUser.profile?.legalStatus && !detailUser.profile?.siret) && (
                  <div className="flex items-start gap-2 bg-yellow-600/10 border border-yellow-600/20 rounded-xl p-3 text-xs text-yellow-400">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>Aucune information légale renseignée pour ce compte.</span>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
