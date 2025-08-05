'use client'

import { useAuth } from '@/context/AuthContext'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core'
import axios from 'axios'
import Image from 'next/image'

export default function ArtistProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [banner, setBanner] = useState('/default-banner.jpg')
  const [avatar, setAvatar] = useState('/default-avatar.png')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [location, setLocation] = useState('')
  const [country, setCountry] = useState('')
  const [radiusKm, setRadiusKm] = useState('')
  const [bio, setBio] = useState('')
  const [events, setEvents] = useState<EventInput[]>([])

  const SPECIALTY_OPTIONS = ['DJ', 'Chanteur', 'Danseur', 'Guitariste', 'Saxophoniste']

  useEffect(() => {
    if (!user || user.role !== 'ARTIST') router.push('/home')
  }, [user, router])

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const title = prompt("Titre de l'événement :")
    if (!title) return

    const lieu = prompt('Lieu :') || ''
    const type = prompt('Type de prestation :') || ''
    const start = prompt('Heure de début (ex : 18:00) :') || '00:00'
    const end = prompt('Heure de fin (ex : 22:00) :') || '23:59'

    const newEvent = {
      id: String(events.length + 1),
      title: `${title}${lieu ? ' @ ' + lieu : ''}${type ? ' [' + type + ']' : ''}`,
      start: selectInfo.startStr + 'T' + start,
      end: selectInfo.startStr + 'T' + end,
      backgroundColor: 'green',
      borderColor: 'green'
    }
    setEvents([...events, newEvent])
  }

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (confirm(`Supprimer l’événement "${clickInfo.event.title}" ?`)) {
      setEvents(events.filter(e => e.id !== clickInfo.event.id))
    }
  }

  const handleAddSpecialty = () => {
    if (selectedSpecialty && !specialties.includes(selectedSpecialty)) {
      setSpecialties([...specialties, selectedSpecialty])
    }
  }

  const handleRemoveSpecialty = (s: string) => {
    setSpecialties(specialties.filter(sp => sp !== s))
  }

  const handleLocationSave = async () => {
    const token = localStorage.getItem('token')
    if (!user?.profile?.id) return
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/profile/${user.profile.id}`, {
        location,
        country,
        radiusKm: parseInt(radiusKm)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Localisation sauvegardée ✅')
    } catch (err) {
      console.error('Erreur localisation', err)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Bannière */}
      <div className="relative w-full h-64 bg-gray-800">
        <Image src={banner} alt="Bannière" layout="fill" objectFit="cover" className="opacity-70" />
        <input type="file" ref={bannerInputRef} hidden onChange={(e) => {
          if (e.target.files?.[0]) setBanner(URL.createObjectURL(e.target.files[0]))
        }} />
        <div className="absolute top-2 right-2 bg-white text-black px-2 py-1 rounded cursor-pointer text-sm" onClick={() => bannerInputRef.current?.click()}>
          Modifier la bannière
        </div>
      </div>

      {/* Avatar */}
      <div className="relative -mt-12 ml-6 w-max cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
        <Image src={avatar} alt="Avatar" width={100} height={100} className="rounded-full border-4 border-white" />
        <input type="file" ref={avatarInputRef} hidden onChange={(e) => {
          if (e.target.files?.[0]) setAvatar(URL.createObjectURL(e.target.files[0]))
        }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">
        {/* Colonne gauche */}
        <div className="md:col-span-2 space-y-6">
          {/* Spécialités + localisation */}
          <section>
            <h2 className="text-xl font-semibold mb-2">🎭 Spécialités & Localisation</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {specialties.map((s, i) => (
                <span key={i} className="bg-gray-700 px-3 py-1 rounded-full">
                  {s}
                  <button onClick={() => handleRemoveSpecialty(s)} className="ml-2 text-red-400">✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-3 items-center">
              <select value={selectedSpecialty} onChange={e => setSelectedSpecialty(e.target.value)} className="bg-gray-800 px-3 py-2 rounded">
                <option value="">-- Ajouter --</option>
                {SPECIALTY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <button onClick={handleAddSpecialty} className="bg-blue-600 px-4 py-2 rounded">Ajouter</button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <input type="text" placeholder="Ville" value={location} onChange={e => setLocation(e.target.value)} className="bg-gray-800 px-3 py-2 rounded w-full" />
              <input type="text" placeholder="Pays" value={country} onChange={e => setCountry(e.target.value)} className="bg-gray-800 px-3 py-2 rounded w-full" />
              <input type="number" placeholder="Rayon (km)" value={radiusKm} onChange={e => setRadiusKm(e.target.value)} className="bg-gray-800 px-3 py-2 rounded w-full" />
            </div>
            <button onClick={handleLocationSave} className="mt-3 bg-green-600 px-4 py-2 rounded">Sauvegarder la localisation</button>
          </section>

          {/* Bio */}
          <section>
            <h2 className="text-xl font-semibold mb-2">📝 Biographie</h2>
            <textarea
              placeholder="Parle de toi, ton style, ton parcours..."
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={5}
              className="bg-gray-800 w-full p-4 rounded"
            />
          </section>

          {/* Galerie médias */}
          <section>
            <h2 className="text-xl font-semibold mb-2">🎬 Galerie médias</h2>
            <input type="file" multiple className="bg-gray-900 p-3 rounded" />
          </section>
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">📅 Disponibilités</h2>
            <div className="bg-white text-black rounded overflow-hidden">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                selectable
                editable
                select={handleDateSelect}
                eventClick={handleEventClick}
                events={events}
                dayCellClassNames={() => 'bg-blue-100'}
                height="auto"
              />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">🎧 Écouter mes titres</h2>
            <iframe
              className="w-full rounded"
              height="160"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src="https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator"
            ></iframe>
          </section>
        </div>
      </div>
    </div>
  )
}