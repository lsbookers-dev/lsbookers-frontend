// agenda/EventTabOffers.tsx — Onglet "Offres" (organisateur uniquement)

import { EventOffer, EventOfferForm } from './types'
import { getSpecialtiesForOfferType } from '@/constants/specialties'

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

export default function EventTabOffers(p: Props) {
  const toggleForm = () => {
    if (!p.showEventOfferForm) {
      const d = new Date(p.eventStart)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      p.setEventOfferForm(prev => ({
        ...prev,
        date: dateStr,
        time: timeStr,
        location: p.eventLieu || prev.location,
      }))
    }
    p.setShowEventOfferForm(!p.showEventOfferForm)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40">Offres liées à cet événement</p>
        <button onClick={toggleForm}
          className="flex items-center gap-1 text-[11px] bg-violet-600 hover:bg-violet-500 text-white px-2.5 py-1 rounded-full transition-colors">
          + Publier une offre
        </button>
      </div>

      {p.showEventOfferForm && (
        <form
          onSubmit={async e => {
            e.preventDefault()
            await p.submitEventOffer(p.eventOfferForm)
          }}
          className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 space-y-2"
        >
          <input required value={p.eventOfferForm.title}
            onChange={e => p.setEventOfferForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Titre de l'offre *"
            className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40"
          />
          <textarea required rows={2} value={p.eventOfferForm.description}
            onChange={e => p.setEventOfferForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Description *"
            className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40 resize-none"
          />
          <div className="grid grid-cols-2 gap-1.5">
            <select value={p.eventOfferForm.type}
              onChange={e => p.setEventOfferForm(prev => ({
                ...prev,
                type: e.target.value as EventOfferForm['type'],
                specialty: '',
              }))}
              className="h-8 px-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none">
              <option value="ARTIST">Artiste</option>
              <option value="PROVIDER">Prestataire</option>
              <option value="ALL">Tous profils</option>
            </select>
            <select required value={p.eventOfferForm.specialty}
              onChange={e => p.setEventOfferForm(prev => ({ ...prev, specialty: e.target.value }))}
              className="h-8 px-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none">
              <option value="">Spécialité *</option>
              {getSpecialtiesForOfferType(p.eventOfferForm.type).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <input required type="date" value={p.eventOfferForm.date}
              onChange={e => p.setEventOfferForm(prev => ({ ...prev, date: e.target.value }))}
              className="h-8 px-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none"
            />
            <input type="time" value={p.eventOfferForm.time}
              onChange={e => p.setEventOfferForm(prev => ({ ...prev, time: e.target.value }))}
              className="h-8 px-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none"
            />
            <input required value={p.eventOfferForm.location}
              onChange={e => p.setEventOfferForm(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Ville *"
              className="h-8 px-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none"
            />
            <input required value={p.eventOfferForm.country}
              onChange={e => p.setEventOfferForm(prev => ({ ...prev, country: e.target.value }))}
              placeholder="Pays *"
              className="h-8 px-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none"
            />
          </div>
          <input type="number" min="0" step="0.01" value={p.eventOfferForm.fee}
            onChange={e => p.setEventOfferForm(prev => ({ ...prev, fee: e.target.value }))}
            placeholder="Tarif proposé (optionnel)"
            className="h-8 w-full px-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/25 outline-none"
          />
          {p.eventOfferError && <p className="text-xs text-red-400">{p.eventOfferError}</p>}
          <button type="submit" disabled={p.submittingEventOffer}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
            {p.submittingEventOffer ? 'Publication…' : 'Publier'}
          </button>
        </form>
      )}

      {p.eventOffers.length === 0 ? (
        <p className="text-xs text-white/25 italic text-center py-3">Aucune offre publiée pour cet événement</p>
      ) : (
        <div className="space-y-2">
          {p.eventOffers.map(o => (
            <div key={o.id} className="bg-white/5 rounded-xl p-3 border border-white/8">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{o.title}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    {new Date(o.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}{o.location}
                    {o.fee != null ? ` · ${Number(o.fee).toLocaleString('fr-FR')} €` : ''}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm('Supprimer cette offre ?')) return
                    await p.deleteEventOffer(o.id)
                  }}
                  className="text-white/20 hover:text-red-400 transition text-xs flex-shrink-0">✕</button>
              </div>
              <p className="text-[10px] text-white/50 mt-1 line-clamp-2">{o.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
