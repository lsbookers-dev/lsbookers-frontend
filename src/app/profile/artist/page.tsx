'use client'

import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { DateSelectArg } from '@fullcalendar/core'

interface Media {
  id: number
  url: string
  type: 'IMAGE' | 'VIDEO'
}

interface Event {
  id: number
  title: string
  start: string
  end: string
  allDay: boolean
  lieu?: string
  type?: string
}

const SPECIALTY_OPTIONS = [
  'DJ', 'Chanteur', 'Saxophoniste', 'Danseur', 'Guitariste',
  'Magicien', 'Beatboxer', 'Violoniste', 'Percussionniste'
]

export default function ArtistProfilePage() {
  const { user, token, setUser } = useAuth()
  const router = useRouter()

  const [avatar, setAvatar] = useState('')
  const [banner, setBanner] = useState('')
  const [bio, setBio] = useState('')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [location, setLocation] = useState('')
  const [country, setCountry] = useState('')
  const [radiusKm, setRadiusKm] = useState('')
  const [mediaList, setMediaList] = useState<Media[]>([])
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    if (!user || user.role !== 'ARTIST') {
      router.push('/home')
    } else {
      preloadProfile()
      fetchMedia()
      fetchEvents()
    }
  }, [user, router])

  const preloadProfile = () => {
    const profile = user?.profile
    if (!profile) return
    setAvatar(profile.avatarUrl || '')
    setBanner(profile.bannerUrl || '')
    setBio(profile.bio || '')
    setSpecialties(profile.specialties || [])
    setLocation(profile.location || '')
    setCountry(profile.country || '')
    setRadiusKm(profile.radiusKm?.toString() || '')
  }

  const updateProfile = async (fields: Partial<typeof user.profile>) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/${user?.profile?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fields),
      })

      if (res.ok) {
        setUser((prev) => {
          if (!prev?.profile) return prev
          return {
            ...prev,
            profile: { ...prev.profile, ...fields },
          }
        })
      }
    } catch (err) {
      console.error('Erreur mise à jour profil :', err)
    }
  }

  const handleSpecialtyAdd = () => {
    if (selectedSpecialty && !specialties.includes(selectedSpecialty)) {
      const updated = [...specialties, selectedSpecialty]
      setSpecialties(updated)
      updateProfile({ specialties: updated })
      setSelectedSpecialty('')
    }
  }

  const fetchMedia = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/user/${user?.id}`)
      const data = await res.json()
      setMediaList(data.media || [])
    } catch (err) {
      console.error('Erreur chargement médias :', err)
    }
  }

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/user/${user?.id}`)
      const data = await res.json()
      setEvents(data.events || [])
    } catch (err) {
      console.error('Erreur chargement événements :', err)
    }
  }

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const title = prompt("Titre de l’événement :") || ''
    if (!title) return
    const lieu = prompt("Lieu :") || ''
    const type = prompt("Type de prestation :") || ''

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
        lieu,
        type,
      }),
    })
      .then(() => fetchEvents())
      .catch((err) => console.error('Erreur création événement :', err))
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">🎤 Profil artiste</h1>

      {/* Avatar + bannière */}
      <div className="flex gap-6 items-center mb-8">
        <Image src={avatar || '/default-avatar.png'} alt="avatar" width={80} height={80} className="rounded-full" />
        <button className="bg-gray-700 px-4 py-2 rounded">Changer bannière</button>
      </div>

      {/* Bio */}
      <div className="mb-6">
        <label className="block mb-1 font-semibold">📝 Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          onBlur={() => updateProfile({ bio })}
          className="w-full bg-gray-800 text-white p-2 rounded"
        />
      </div>

      {/* Spécialités */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">🎵 Spécialités</label>
        <div className="flex gap-4 mb-2">
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="text-black px-2 py-1 rounded"
          >
            <option value="">Ajouter une spécialité</option>
            {SPECIALTY_OPTIONS.filter(opt => !specialties.includes(opt)).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <button onClick={handleSpecialtyAdd} className="bg-green-600 px-3 py-1 rounded">Ajouter</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {specialties.map(spec => (
            <span key={spec} className="bg-yellow-500 text-black px-2 py-1 rounded text-sm">{spec}</span>
          ))}
        </div>
      </div>

      {/* Localisation */}
      <div className="mb-6">
        <label className="block mb-1 font-semibold">🌍 Ville</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onBlur={() => updateProfile({ location })}
          className="bg-gray-800 text-white px-4 py-2 rounded w-full"
        />
        <label className="block mt-2 mb-1 font-semibold">🇫🇷 Pays</label>
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          onBlur={() => updateProfile({ country })}
          className="bg-gray-800 text-white px-4 py-2 rounded w-full"
        />
        <label className="block mt-2 mb-1 font-semibold">📏 Rayon (km)</label>
        <input
          type="number"
          value={radiusKm}
          onChange={(e) => setRadiusKm(e.target.value)}
          onBlur={() => updateProfile({ radiusKm: Number(radiusKm) })}
          className="bg-gray-800 text-white px-4 py-2 rounded w-full"
        />
      </div>

      {/* Galerie média */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-2">🖼️ Galerie média</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {mediaList.map(media => (
            <div key={media.id} className="rounded overflow-hidden">
              {media.type === 'IMAGE' ? (
                <Image src={media.url} alt="media" width={300} height={200} className="rounded" />
              ) : (
                <video src={media.url} controls className="w-full h-auto rounded" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Calendrier */}
      <div className="mb-20">
        <h2 className="text-xl font-bold mb-2">📅 Disponibilités</h2>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          selectable={true}
          select={handleDateSelect}
          events={events}
          height="auto"
        />
      </div>
    </div>
  )
}