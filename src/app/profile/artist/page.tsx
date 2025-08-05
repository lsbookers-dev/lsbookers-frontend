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
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null)
  const [mediaList, setMediaList] = useState<any[]>([])

  const SPECIALTY_OPTIONS = ['DJ', 'Chanteur', 'Danseur', 'Guitariste', 'Saxophoniste']

  useEffect(() => {
    if (!user || user.role !== 'ARTIST') router.push('/home')
    else {
      fetchMedia()
      fetchEvents()
    }
  }, [user, router])

  const fetchMedia = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/user/${user?.id}`)
      const data = await res.json()
      setMediaList(data.media || [])
    } catch (err) {
      console.error('Erreur chargement medias:', err)
    }
  }

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/profile/${user?.profile?.id}`)
      const data = await res.json()
      const formatted = data.events.map((e: any) => ({
        id: String(e.id),
        title: e.title,
        start: e.date,
        end: e.date,
        allDay: true,
        color: '#22c55e'
      }))
      setEvents(formatted)
    } catch (err) {
      console.error('Erreur chargement événements:', err)
    }
  }

  const handleDateSelect = async (selectInfo: DateSelectArg) => {
    const title = prompt("Titre de l'événement :")
    if (!title || !user?.profile?.id) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          date: selectInfo.startStr,
          profileId: user.profile.id
        })
      })
      const data = await res.json()
      setEvents([...events, {
        id: String(data.event.id),
        title: data.event.title,
        start: data.event.date,
        end: data.event.date,
        allDay: true,
        color: '#22c55e'
      }])
    } catch (err) {
      console.error('Erreur création événement:', err)
    }
  }

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.startStr,
      end: clickInfo.event.endStr,
      extendedProps: clickInfo.event.extendedProps
    })
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return

    try {
      const token = localStorage.getItem('token')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${selectedEvent.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      setEvents(events.filter(e => e.id !== selectedEvent.id))
      setSelectedEvent(null)
    } catch (err) {
      console.error('Erreur suppression événement:', err)
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

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const token = localStorage.getItem('token')

    for (const file of files) {
      const fileUrl = URL.createObjectURL(file)
      const fileType = file.type.startsWith('image') ? 'IMAGE' : 'VIDEO'

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ url: fileUrl, type: fileType })
      })
    }
    fetchMedia()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header avatar/bannière et autres sections similaires ici */}
      {/* Le composant FullCalendar est mis à jour ci-dessous */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        selectable
        editable
        select={handleDateSelect}
        eventClick={handleEventClick}
        events={events}
        height="auto"
        dayCellClassNames={() => 'bg-blue-100'}
      />

      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
            <h3 className="text-xl font-bold mb-2">{selectedEvent.title}</h3>
            <p><strong>Date :</strong> {`${selectedEvent.start} → ${selectedEvent.end}`}</p>
            <p><strong>Lieu :</strong> {selectedEvent.extendedProps?.lieu || 'N/A'}</p>
            <p><strong>Type :</strong> {selectedEvent.extendedProps?.type || 'N/A'}</p>
            <div className="flex justify-end mt-4 gap-2">
              <button onClick={() => setSelectedEvent(null)} className="px-4 py-2 bg-gray-700 rounded">Fermer</button>
              <button onClick={handleDeleteEvent} className="px-4 py-2 bg-red-600 rounded">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}