// agenda/EventTabOffers.tsx — Onglet Offres : formulaire gauche + liste droite (Concept B)
'use client'

import { useEffect } from 'react'
import { MapPin, Calendar, Send, Music, Camera, Briefcase, Users, Trash2, Sparkles } from 'lucide-react'
import { EventOffer, EventOfferForm } from './types'
import { getSpecialtiesForOfferType } from '@/constants/specialties'
import CityAutocomplete from '@/components/CityAutocomplete'

interface Props {
  eventStart: string
  eventLieu?: string | null
  eventOffers: EventOffer[]
  showEventOfferForm: boolean; setShowEventOfferForm: (v: boolean) => void
  submittingEventOffer: boolean
  eventOfferError: string | null; setEventOfferError: (v: string | null) => void
  eventOfferForm: EventOfferForm; setEventOfferForm: (fn: (prev: EventOfferForm) => EventOfferForm) => void
  submitEventOffer: (form: EventOfferForm) => Promise<void>
  deleteEventOffer: (offerId: number) => Promise<void>
}

/* ─── helpers ──────────────────────────────────────────────────────────────── */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function OfferTypeIcon({ type }: { type: string }) {
  if (type === 'ARTIST')   return <Music   className="w-3.5 h-3.5" />
  if (type === 'PROVIDER') return <Camera  className="w-3.5 h-3.5" />
  return <Briefcase className="w-3.5 h-3.5" />
}

function offerTypeLabel(type: string): string {
  return type === 'ARTIST' ? 'Artiste' : type === 'PROVIDER' ? 'Prestataire' : 'Tous profils'
}

function offerTypeColor(type: string): string {
  return type === 'ARTIST'   ? 'bg-violet-500/15 text-violet-400 border-violet-500/25'
    : type === 'PROVIDER'    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
    : 'bg-white/8 text-white/50 border-white/10'
}

/* ─── composant ────────────────────────────────────────────────────────────── */
export default function EventTabOffers(p: Props) {

  // Pré-remplir date/lieu depuis l'événement au montage
  useEffect(() => {
    const d = new Date(p.eventStart)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    p.setEventOfferForm(prev => ({
      ...prev,
      date:     prev.date     || dateStr,
      time:     prev.time     || timeStr,
      location: prev.location || p.eventLieu || '',
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalApplicants = p.eventOffers.reduce((acc, o) => acc + (o.applicantCount ?? 0), 0)

  return (
    <div className="flex h-full flex-col gap-3 overflow-visible sm:flex-row sm:gap-0 sm:overflow-hidden">

      {/* ── Colonne gauche : formulaire ─────────────────────────────────────── */}
      <div className="w-full flex-shrink-0 overflow-hidden rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.10] via-indigo-500/[0.055] to-transparent sm:w-[220px] sm:rounded-r-none">

        {/* En-tête */}
        <div className="px-3 pt-3 pb-2.5 border-b border-violet-300/10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl border border-violet-300/20 bg-violet-500/15 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-violet-200" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/85">Publier une offre</p>
            <p className="text-[10px] text-white/40">Trouvez le bon profil.</p>
          </div>
        </div>

        <form
          className="flex-1 overflow-y-visible px-3 py-3 space-y-2.5 sm:overflow-y-auto"
          onSubmit={async e => {
            e.preventDefault()
            await p.submitEventOffer(p.eventOfferForm)
          }}
        >

          {/* Données pré-remplies de l'événement */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-violet-200/65 font-medium mb-1.5">
              Données de l&apos;événement
            </p>
            <div className="flex items-center gap-1.5 bg-[#11101a]/75 border border-white/8 rounded-lg px-2.5 py-2">
              <Calendar className="w-3 h-3 text-violet-200/65 flex-shrink-0" />
              <span className="text-[11px] text-white/55 truncate">
                {formatDate(p.eventStart)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#11101a]/75 border border-white/8 rounded-lg px-2.5 py-2">
              <MapPin className="w-3 h-3 text-cyan-200/65 flex-shrink-0" />
              <span className="text-[11px] text-white/55 truncate">
                {p.eventLieu || '—'}
              </span>
            </div>
          </div>

          <div className="h-px bg-white/6" />

          <p className="text-[9px] uppercase tracking-wider text-white/30 font-medium">
            Contenu
          </p>

          {/* Titre */}
          <input
            required
            value={p.eventOfferForm.title}
            onChange={e => p.setEventOfferForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Titre *"
            className="w-full h-9 px-2.5 rounded-lg bg-[#11101a]/80 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400/40"
          />

          {/* Description */}
          <textarea
            required
            rows={2}
            value={p.eventOfferForm.description}
            onChange={e => p.setEventOfferForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Description *"
            className="w-full px-2.5 py-2 rounded-lg bg-[#11101a]/80 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400/40 resize-none"
          />

          {/* Type + Spécialité */}
          <div className="grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2 sm:grid-cols-1">
            <select
              value={p.eventOfferForm.type}
              onChange={e => p.setEventOfferForm(prev => ({
                ...prev,
                type: e.target.value as EventOfferForm['type'],
                specialty: '',
              }))}
              className="h-9 px-2.5 rounded-lg bg-[#11101a]/80 border border-white/10 text-xs text-white/65 outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400/40"
            >
              <option value="ARTIST">Artiste</option>
              <option value="PROVIDER">Prestataire</option>
              <option value="ALL">Tous</option>
            </select>
            <select
              required
              value={p.eventOfferForm.specialty}
              onChange={e => p.setEventOfferForm(prev => ({ ...prev, specialty: e.target.value }))}
              className="h-9 px-2.5 rounded-lg bg-[#11101a]/80 border border-white/10 text-xs text-white/65 outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400/40"
            >
              <option value="">Spécialité *</option>
              {getSpecialtiesForOfferType(p.eventOfferForm.type).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Date + heure (modifiables) */}
          <div className="grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2 sm:grid-cols-1">
            <input
              required
              type="date"
              value={p.eventOfferForm.date}
              onChange={e => p.setEventOfferForm(prev => ({ ...prev, date: e.target.value }))}
              className="h-9 px-2 rounded-lg bg-[#11101a]/80 border border-white/10 text-[11px] text-white/65 outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400/40"
            />
            <input
              type="time"
              value={p.eventOfferForm.time}
              onChange={e => p.setEventOfferForm(prev => ({ ...prev, time: e.target.value }))}
              className="h-9 px-2 rounded-lg bg-[#11101a]/80 border border-white/10 text-[11px] text-white/65 outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400/40"
            />
          </div>

          {/* Lieu */}
          <CityAutocomplete
            value={p.eventOfferForm.location}
            onChange={v => p.setEventOfferForm(prev => ({ ...prev, location: v }))}
            placeholder="Ville *"
            inputClassName="h-9 px-2.5 rounded-lg bg-[#11101a]/80 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400/40 w-full"
          />
          <input
            required
            value={p.eventOfferForm.country}
            onChange={e => p.setEventOfferForm(prev => ({ ...prev, country: e.target.value }))}
            placeholder="Pays *"
            className="w-full h-9 px-2.5 rounded-lg bg-[#11101a]/80 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400/40"
          />

          {/* Tarif */}
          <div className="flex items-center gap-1.5 bg-emerald-500/[0.055] border border-emerald-400/15 rounded-lg px-2.5 h-9">
            <span className="text-xs font-semibold text-emerald-300/70">€</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={p.eventOfferForm.fee}
              onChange={e => p.setEventOfferForm(prev => ({ ...prev, fee: e.target.value }))}
              placeholder="Tarif proposé"
              className="flex-1 bg-transparent text-xs text-white placeholder-white/25 outline-none min-w-0"
            />
            <span className="text-[9px] text-white/20 flex-shrink-0">optionnel</span>
          </div>

          {p.eventOfferError && (
            <p className="text-[10px] text-red-400">{p.eventOfferError}</p>
          )}

          {/* Bouton submit */}
          <button
            type="submit"
            disabled={p.submittingEventOffer}
            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 disabled:opacity-50 text-white text-xs font-medium py-2.5 rounded-lg transition-colors"
          >
            <Send className="w-3 h-3" />
            {p.submittingEventOffer ? 'Publication…' : 'Publier'}
          </button>
        </form>
      </div>

      {/* ── Colonne droite : liste des offres ───────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-cyan-500/[0.065] via-white/[0.02] to-transparent sm:rounded-l-none sm:border-l-0">

        {/* En-tête liste */}
        <div className="px-3 pt-3 pb-2.5 border-b border-cyan-300/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200"><Briefcase className="h-4 w-4" /></div>
            <div><p className="text-xs font-semibold text-white/85">Offres liées</p><p className="text-[10px] text-white/40">{p.eventOffers.length} offre{p.eventOffers.length > 1 ? 's' : ''} publiée{p.eventOffers.length > 1 ? 's' : ''}</p></div>
          </div>
          {totalApplicants > 0 && (
            <span className="flex items-center gap-1 text-[10px] bg-violet-500/12 border border-violet-500/20 text-violet-200/80 rounded-full px-2 py-1">
              <Users className="w-2.5 h-2.5" />
              {totalApplicants} postulant{totalApplicants > 1 ? 's' : ''} au total
            </span>
          )}
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {p.eventOffers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px] gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-dashed border-white/10 text-white/15"><Send className="w-4 h-4" /></div>
              <p className="text-[11px] text-white/30 text-center">
                Aucune offre publiée pour cet événement
              </p>
            </div>
          ) : (
            p.eventOffers.map(o => (
              <div
                key={o.id}
                className="flex items-start gap-2.5 p-3 bg-[#12111b]/75 border border-white/7 rounded-xl transition hover:border-cyan-400/18 hover:bg-cyan-500/[0.04]"
              >
                {/* Icône type */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${offerTypeColor(o.type)}`}>
                  <OfferTypeIcon type={o.type} />
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/85 truncate mb-0.5">
                    {o.title}
                  </p>
                  <p className="text-[10px] text-white/40 mb-1.5">
                    {formatDate(o.date)} · {o.location}
                  </p>
                  <div className="flex flex-wrap items-center gap-1">
                    <span className={`text-[9px] border rounded px-1.5 py-0.5 ${offerTypeColor(o.type)}`}>
                      {offerTypeLabel(o.type)}
                    </span>
                    {o.specialty && (
                      <span className="text-[9px] bg-white/5 border border-white/8 rounded px-1.5 py-0.5 text-white/40">
                        {o.specialty}
                      </span>
                    )}
                    {o.fee != null && (
                      <span className="text-[9px] bg-emerald-500/8 border border-emerald-500/15 rounded px-1.5 py-0.5 text-emerald-400/70">
                        {Number(o.fee).toLocaleString('fr-FR')} €
                      </span>
                    )}
                  </div>
                </div>

                {/* Postulants + supprimer */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {(o.applicantCount ?? 0) > 0 ? (
                    <div className="flex items-center gap-1 bg-violet-500/15 border border-violet-500/25 rounded-full px-2 py-1">
                      <span className="text-[11px] font-semibold text-violet-400">
                        {o.applicantCount}
                      </span>
                      <span className="text-[9px] text-violet-400/60">
                        postulant{(o.applicantCount ?? 0) > 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[9px] text-white/20">0 postulant</span>
                  )}
                  <button
                    onClick={async () => {
                      if (!confirm('Supprimer cette offre ?')) return
                      await p.deleteEventOffer(o.id)
                    }}
                    className="grid h-6 w-6 place-items-center rounded-lg text-white/20 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
