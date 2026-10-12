'use client'

/** Formulaire « Publier une offre » (page Opportunités et Studio profil), avec aperçu en direct. */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import { getSpecialtiesForOfferType } from '@/constants/specialties'
import CityAutocomplete from '@/components/CityAutocomplete'
import SpecialtyPicker from '@/components/SpecialtyPicker'
import OfferCard, { type Offer } from './OfferCard'

type OfferForm = {
  title: string; description: string
  type: 'ARTIST' | 'PROVIDER' | 'ALL'; specialty: string
  date: string; time: string; endDate: string; endTime: string; location: string; country: string; fee: string
}

const EMPTY_FORM: OfferForm = {
  title: '', description: '', type: 'ARTIST', specialty: '',
  date: '', time: '', endDate: '', endTime: '', location: '', country: '', fee: '',
}

/* ─── Formulaire de publication (même style que « Nouvel événement » de l'agenda) ── */
const PUB_LABEL = 'mb-1.5 text-[11px] text-white/50'
const PUB_INPUT = 'w-full rounded-xl border border-white/10 bg-[#11101a]/75 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15'
const TYPE_CHIP = {
  ARTIST:   'border-pink-400/50 bg-pink-500/15 text-pink-100',
  PROVIDER: 'border-violet-400/50 bg-violet-500/15 text-violet-100',
  ALL:      'border-indigo-400/50 bg-indigo-500/15 text-indigo-100',
} as const

type Props = {
  onClose: () => void
  onPublished: (offer: Offer) => void
  defaultLocation?: string | null
  defaultCountry?: string | null
}

export default function PublishOfferModal({ onClose, onPublished, defaultLocation, defaultCountry }: Props) {
  const { user } = useAuth()
  const [pubForm, setPubForm] = useState<OfferForm>({ ...EMPTY_FORM, location: defaultLocation || '', country: defaultCountry || '' })
  const [pubSubmitting, setPubSubmitting] = useState(false)
  const [pubError, setPubError] = useState<string | null>(null)
  const [pubWithEnd, setPubWithEnd] = useState(false)

  // Aperçu en direct : l'offre telle qu'elle apparaîtra dans la liste
  const previewDate = pubForm.date
    ? `${pubForm.date}T${pubForm.time || '00:00'}:00`
    : new Date().toISOString()
  const previewOffer: Offer = {
    id: 0,
    title: pubForm.title.trim() || 'Titre de votre offre',
    description: pubForm.description.trim() || 'La description de votre offre apparaîtra ici.',
    type: pubForm.type,
    specialty: pubForm.specialty || null,
    date: previewDate,
    endDate: null,
    location: pubForm.location.trim() || 'Ville',
    country: pubForm.country.trim() || 'Pays',
    fee: pubForm.fee !== '' && !Number.isNaN(Number(pubForm.fee)) ? Number(pubForm.fee) : null,
    createdAt: new Date().toISOString(),
    organizerId: 0,
    applicantCount: 0,
    organizer: { id: 0, userId: Number(user?.id) || 0, avatar: user?.avatarUrl || null, name: user?.name || 'Vous', role: user?.role ?? null },
  }

  const submitPublish = async () => {
    if (!pubForm.title.trim() || !pubForm.description.trim() || !pubForm.date || !pubForm.location.trim() || !pubForm.country.trim()) {
      setPubError('Veuillez remplir tous les champs obligatoires.')
      return
    }
    if (!pubForm.specialty) {
      setPubError('Veuillez sélectionner une spécialité.')
      return
    }
    if (pubWithEnd && pubForm.endDate && pubForm.endDate < pubForm.date) {
      setPubError('La date de fin doit être après la date de début.')
      return
    }
    setPubError(null)
    setPubSubmitting(true)
    try {
      const dateTime = pubForm.time ? `${pubForm.date}T${pubForm.time}:00` : `${pubForm.date}T00:00:00`
      const res = await apiFetch(apiUrl('offers'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pubForm.title.trim(), description: pubForm.description.trim(),
          type: pubForm.type, specialty: pubForm.specialty || null,
          date: dateTime,
          endDate: pubForm.endDate ? (pubForm.endTime ? pubForm.endDate + 'T' + pubForm.endTime + ':00' : pubForm.endDate + 'T23:59:00') : null,
          location: pubForm.location.trim(),
          country: pubForm.country.trim(), fee: pubForm.fee ? parseFloat(pubForm.fee) : null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        setPubError(err?.message || err?.error || 'Échec de la publication. Réessayez.')
        return
      }
      const saved = await res.json()
      onPublished(saved)
    } catch {
      setPubError('Échec de la publication. Réessayez.')
    } finally {
      setPubSubmitting(false)
    }
  }
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => onClose()}>
      <div
        role="dialog" aria-modal="true" aria-labelledby="publish-offer-title"
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-violet-400/20 bg-[#0d0c13] shadow-[0_30px_90px_-40px_rgba(139,92,246,0.8)] sm:rounded-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3.5 sm:px-5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-violet-300/20 bg-violet-500/20 text-violet-200">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id="publish-offer-title" className="text-sm font-bold text-white">Publier une offre</h3>
            <p className="text-[11px] text-white/45">L&apos;aperçu se met à jour pendant la saisie.</p>
          </div>
          <button onClick={() => onClose()} aria-label="Fermer" className="grid h-10 w-10 place-items-center rounded-xl text-white/45 transition hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 gap-5 overflow-y-auto p-4 sm:p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* ── Formulaire ── */}
          <div className="space-y-3">
            <div>
              <p className={PUB_LABEL}>Titre <span className="text-violet-300">*</span></p>
              <input value={pubForm.title} onChange={e => setPubForm(p => ({ ...p, title: e.target.value }))}
                placeholder="DJ pour soirée d'entreprise" maxLength={150} className={PUB_INPUT} />
            </div>
            <div>
              <p className={PUB_LABEL}>Description <span className="text-violet-300">*</span></p>
              <textarea rows={3} value={pubForm.description} onChange={e => setPubForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Ambiance, durée du set, matériel fourni…" maxLength={2000} className={`${PUB_INPUT} resize-none`} />
            </div>
            <div>
              <p className={PUB_LABEL}>Profil recherché</p>
              <div className="flex flex-wrap gap-1.5">
                {(['ARTIST', 'PROVIDER', 'ALL'] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => setPubForm(p => ({ ...p, type: t, specialty: '' }))}
                    aria-pressed={pubForm.type === t}
                    className={`min-h-9 rounded-full border px-3.5 text-xs font-medium transition ${pubForm.type === t ? TYPE_CHIP[t] : 'border-white/12 text-white/55 hover:border-white/25 hover:text-white/80'}`}>
                    {t === 'ARTIST' ? 'Artiste' : t === 'PROVIDER' ? 'Prestataire' : 'Tous profils'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className={PUB_LABEL}>Spécialité <span className="text-violet-300">*</span></p>
              <SpecialtyPicker
                value={pubForm.specialty}
                options={getSpecialtiesForOfferType(pubForm.type)}
                onChange={v => setPubForm(p => ({ ...p, specialty: v }))}
                className={PUB_INPUT}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className={PUB_LABEL}>Date <span className="text-violet-300">*</span></p>
                <input type="date" value={pubForm.date} onChange={e => setPubForm(p => ({ ...p, date: e.target.value }))} className={PUB_INPUT} />
              </div>
              <div>
                <p className={PUB_LABEL}>Heure</p>
                <input type="time" value={pubForm.time} onChange={e => setPubForm(p => ({ ...p, time: e.target.value }))} className={PUB_INPUT} />
              </div>
            </div>

            {/* Date de fin : seulement si la case est cochée */}
            <label className="group flex w-fit cursor-pointer items-center gap-2">
              <input type="checkbox" checked={pubWithEnd}
                onChange={e => {
                  setPubWithEnd(e.target.checked)
                  if (!e.target.checked) setPubForm(p => ({ ...p, endDate: '', endTime: '' }))
                }}
                className="h-3.5 w-3.5 cursor-pointer rounded accent-violet-500" />
              <span className="select-none text-xs text-white/50 transition group-hover:text-white/75">Ajouter une date de fin</span>
            </label>
            {pubWithEnd && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className={PUB_LABEL}>Date de fin</p>
                  <input type="date" value={pubForm.endDate} min={pubForm.date || undefined} onChange={e => setPubForm(p => ({ ...p, endDate: e.target.value }))} className={PUB_INPUT} />
                </div>
                <div>
                  <p className={PUB_LABEL}>Heure de fin</p>
                  <input type="time" value={pubForm.endTime} onChange={e => setPubForm(p => ({ ...p, endTime: e.target.value }))} className={PUB_INPUT} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className={PUB_LABEL}>Ville <span className="text-violet-300">*</span></p>
                <CityAutocomplete
                  value={pubForm.location}
                  onChange={v => setPubForm(p => ({ ...p, location: v }))}
                  placeholder="Lyon"
                  inputClassName={PUB_INPUT}
                />
              </div>
              <div>
                <p className={PUB_LABEL}>Pays <span className="text-violet-300">*</span></p>
                <input value={pubForm.country} onChange={e => setPubForm(p => ({ ...p, country: e.target.value }))} placeholder="France" className={PUB_INPUT} />
              </div>
            </div>
            <div>
              <p className={PUB_LABEL}>Cachet proposé <span className="text-white/30">(optionnel)</span></p>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/35">€</span>
                <input type="number" min="0" step="1" inputMode="decimal" value={pubForm.fee} onChange={e => setPubForm(p => ({ ...p, fee: e.target.value }))}
                  placeholder="400" className={`${PUB_INPUT} pl-7`} />
              </div>
            </div>
          </div>

          {/* ── Aperçu : la vraie carte de la page Opportunités ── */}
          <div className="lg:sticky lg:top-0 lg:self-start">
            <p className={PUB_LABEL}>Aperçu dans Opportunités</p>
            <div className="pointer-events-none select-none" aria-hidden="true" inert>
              <OfferCard offer={previewOffer} isLoggedIn isOwner={false} applying={false} onApply={() => {}} onShare={() => {}} />
            </div>
          </div>
        </div>

        {/* Pied : erreurs + actions */}
        <div className="border-t border-white/[0.07] px-4 py-3 sm:px-5">
          {pubError && <p className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{pubError}</p>}
          <div className="flex gap-2">
            <button onClick={() => onClose()}
              className="min-h-11 flex-1 rounded-xl border border-white/12 text-sm text-white/60 transition hover:bg-white/5 hover:text-white">
              Annuler
            </button>
            <button onClick={submitPublish} disabled={pubSubmitting}
              className="min-h-11 flex-[2] rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-sm font-semibold text-white shadow-[0_12px_30px_-14px_rgba(139,92,246,0.9)] transition hover:from-violet-500 hover:to-indigo-400 disabled:opacity-50">
              {pubSubmitting ? 'Publication…' : 'Publier l’offre'}
            </button>
          </div>
        </div>
      </div>
    </div>
  ,
    document.body,
  )
}
