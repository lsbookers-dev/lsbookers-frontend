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

interface Media {
  id: number
  url: string
  type: 'IMAGE' | 'VIDEO'
  createdAt: string
}

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
  const [mediaList, setMediaList] = useState<Media[]>([])

  useEffect(() => {
    if (!user || user.role !== 'ARTIST') router.push('/home')
    else fetchMedia()
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

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const title = prompt("Titre de l'événement :")
    if (!title) return
    const lieu = prompt('Lieu :') || ''
    const type = prompt('Type de prestation :') || ''

    const newEvent = {
      id: String(events.length + 1),
      title,
      extendedProps: { lieu, type },
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
      color: '#22c55e'
    }
    setEvents([...events, newEvent])
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

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      setEvents(events.filter(e => e.id !== selectedEvent.id))
      setSelectedEvent(null)
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
      <div className="relative w-full h-64 bg-gray-800">
        <Image src={banner} alt="Bannière" layout="fill" objectFit="cover" className="opacity-70" />
        <input type="file" ref={bannerInputRef} hidden onChange={(e) => {
          if (e.target.files?.[0]) setBanner(URL.createObjectURL(e.target.files[0]))
        }} />
        <input type="file" ref={avatarInputRef} hidden onChange={(e) => {
          if (e.target.files?.[0]) setAvatar(URL.createObjectURL(e.target.files[0]))
        }} />
        <div className="absolute bottom-4 left-6 flex items-center gap-4">
          <div onClick={() => avatarInputRef.current?.click()} className="cursor-pointer">
            <Image src={avatar} alt="Avatar" width={100} height={100} className="rounded-full border-4 border-white" />
          </div>
          <button onClick={() => bannerInputRef.current?.click()} className="bg-gray-700 px-3 py-1 rounded text-sm">Changer bannière</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">🎬 Galerie médias</h2>
            <input type="file" multiple onChange={handleMediaChange} className="bg-gray-900 p-3 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              {mediaList.map((media) => (
                <div key={media.id} className="bg-gray-800 p-2 rounded shadow">
                  {media.type === 'IMAGE' ? (
                    <Image src={media.url} alt="media" width={400} height={300} className="w-full h-48 object-cover rounded" unoptimized />
                  ) : (
                    <video controls className="w-full h-48 object-cover rounded">
                      <source src={media.url} type="video/mp4" />
                    </video>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

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
                height="auto"
                dayCellClassNames={() => 'bg-blue-100'}
              />
            </div>
          </section>
        </div>
      </div>

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