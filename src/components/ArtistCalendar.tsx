'use client'

import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import frLocale from '@fullcalendar/core/locales/fr'

interface Event {
  id: number
  title: string
  date: string
}

export default function ArtistCalendar({ userId }: { userId: number }) {
  const [events, setEvents] = useState<Event[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`http://localhost:5001/api/profile/calendar/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Erreur serveur')
        return res.json()
      })
      .then((data) => {
        setEvents(data.events || [])
      })
      .catch((err) => {
        console.error(err)
        setError('Erreur lors du chargement du calendrier.')
      })
  }, [userId])

  if (error) return <p className="text-red-500">{error}</p>
  if (events.length === 0) return <p className="text-gray-400">Aucun événement prévu.</p>

  return (
    <div className="bg-gray-900 rounded p-4 mt-4">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events.map(event => ({ ...event, id: String(event.id) }))}
        locale={frLocale}
        height="auto"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: '',
        }}
        contentHeight="auto"
      />
    </div>
  )
}