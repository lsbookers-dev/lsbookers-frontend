'use client'

import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core'
import axios from 'axios'

interface Profile {
  id: number
  specialties?: string[]
  location?: string
  radiusKm?: number
  country?: string
}

interface User {
  id: number
  name: string
  role: 'PROVIDER' | 'ARTIST' | 'ORGANIZER' | 'ADMIN'
  profile: Profile
}

const TYPE_OPTIONS = ['Traiteur', 'Photobooth', 'Artificier', 'Photographe', 'Décorateur']

export default function ProviderProfilePage() {
  const { user, setUser } = useAuth() as {
    user: User | null
    setUser: React.Dispatch<React.SetStateAction<User | null>>
  }

  const router = useRouter()
  const [events, setEvents] = useState<EventInput[]>([])
  const [selectedType, setSelectedType] = useState('')
  const [types, setTypes] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [radiusKm, setRadiusKm] = useState('')
  const [country, setCountry] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'PROVIDER') {
      router.push('/home')
    } else {
      setTypes(user.profile?.specialties || [])
      setLocation(user.profile?.location || '')
      setRadiusKm(user.profile?.radiusKm?.toString() || '')
      setCountry(user.profile?.country || '')
    }
  }, [user])

  const handleAddType = async () => {
    if (!selectedType || types.includes(selectedType)) return

    const updated = [...types, selectedType]
    setTypes(updated)

    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/profile/${user!.profile.id}`,
        { specialties: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setUser(prev => ({
        ...prev!,
        profile: {
          ...prev!.profile,
          specialties: updated
        }
      }))
    } catch (error) {
      console.error('Erreur lors de la mise à jour des types', error)
    }
  }

  const handleRemoveType = async (type: string) => {
    const updated = types.filter(t => t !== type)
    setTypes(updated)

    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/profile/${user!.profile.id}`,
        { specialties: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setUser(prev => ({
        ...prev!,
        profile: {
          ...prev!.profile,
          specialties: updated
        }
      }))
    } catch (error) {
      console.error('Erreur lors de la suppression du type', error)
    }
  }

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const title = prompt('Titre de l’événement ou prestation ?')
    const calendarApi = selectInfo.view.calendar
    calendarApi.unselect()

    if (title) {
      const newEvent = {
        id: String(events.length + 1),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
      }
      setEvents([...events, newEvent])
    }
  }

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (confirm(`Supprimer "${clickInfo.event.title}" ?`)) {
      setEvents(events.filter(e => e.id !== clickInfo.event.id))
    }
  }

  const handleLocationUpdate = async () => {
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`)
      const geoData = await geoRes.json()
      const countryName = geoData?.[0]?.address?.country || ''

      const token = localStorage.getItem('token')
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/profile/${user!.profile.id}`,
        {
          location,
          radiusKm: parseInt(radiusKm),
          country: countryName
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setUser(prev => ({
        ...prev!,
        profile: {
          ...prev!.profile,
          location,
          radiusKm: parseInt(radiusKm),
          country: countryName
        }
      }))
    } catch (err) {
      console.error('Erreur mise à jour localisation', err)
    }
  }

  if (!user || user.role !== 'PROVIDER') {
    return <div className="text-white p-10">Chargement...</div>
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <main className="flex-1 p-6 space-y-6">
        {/* Infos profil */}
        <section className="flex flex-col md:flex-row items-center gap-6">
          <img
            src="/default-avatar.png"
            alt="Photo de profil"
            className="w-32 h-32 rounded-full border-2 border-white"
          />
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-sm text-gray-300">
              Prestations : {types.length > 0 ? types.join(', ') : 'Aucune'}
            </p>
            <p className="mt-2 text-gray-400">Description de vos prestations. À compléter.</p>
          </div>
        </section>

        {/* Modifier les types */}
        <section>
          <h2 className="text-xl font-bold mb-2">🛠️ Modifier mes prestations</h2>
          <div className="flex gap-4 mb-4">
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="bg-gray-800 px-4 py-2 rounded text-white"
            >
              <option value="">-- Sélectionner --</option>
              {TYPE_OPTIONS.filter(opt => !types.includes(opt)).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <button
              onClick={handleAddType}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Ajouter
            </button>
          </div>

          {types.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {types.map((type, i) => (
                <span
                  key={i}
                  className="bg-gray-700 px-3 py-1 rounded-full flex items-center gap-2"
                >
                  {type}
                  <button
                    onClick={() => handleRemoveType(type)}
                    className="text-red-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Zone géographique */}
        <section>
          <h2 className="text-xl font-bold mb-2">📍 Zone d’intervention</h2>
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Ville"
              className="bg-gray-800 px-4 py-2 rounded text-white w-1/3"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
            <input
              type="text"
              placeholder="Pays"
              className="bg-gray-800 px-4 py-2 rounded text-white w-1/3"
              value={country}
              onChange={e => setCountry(e.target.value)}
            />
            <input
              type="number"
              placeholder="Rayon (km)"
              className="bg-gray-800 px-4 py-2 rounded text-white w-1/4"
              value={radiusKm}
              onChange={e => setRadiusKm(e.target.value)}
            />
            <button
              onClick={handleLocationUpdate}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Sauvegarder
            </button>
          </div>
        </section>

        {/* Calendrier */}
        <section>
          <h2 className="text-2xl font-bold mb-4">📅 Planning / Disponibilités</h2>
          <div className="bg-white text-black p-4 rounded shadow">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              initialView="dayGridMonth"
              selectable={true}
              editable={true}
              select={handleDateSelect}
              events={events}
              eventClick={handleEventClick}
              height="auto"
            />
          </div>
        </section>
      </main>
    </div>
  )
}