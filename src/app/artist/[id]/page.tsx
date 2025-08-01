'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })
const MediaGallery = dynamic(() => import('@/components/MediaGallery'), { ssr: false })
const Calendar = dynamic(() => import('@/components/ArtistCalendar'), { ssr: false })

interface Profile {
  id: number
  bio?: string
  profession?: string
  location?: string
  latitude?: number
  longitude?: number
  radiusKm?: number
  specialties?: string[]
  user: {
    id: number
    name: string
    email: string
    role: string
  }
}

export default function ArtistPublicProfile() {
  const { id } = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    fetch(`http://localhost:5001/api/profile/user/${id}`)
      .then(res => res.json())
      .then(data => setProfile(data.profile))
      .catch(err => {
        console.error(err)
        setError("Erreur lors du chargement du profil.")
      })
  }, [id])

  if (error) return <p className="text-red-500">{error}</p>
  if (!profile) return <p className="text-gray-400">Chargement du profil...</p>

  const {
    user,
    bio,
    profession,
    location,
    radiusKm = 50,
    latitude = 48.8566,
    longitude = 2.3522,
    specialties
  } = profile

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto text-white">
      <h1 className="text-2xl font-bold">Profil de {user.name}</h1>

      <div className="bg-gray-900 p-4 rounded shadow space-y-2">
        <p><strong>Email :</strong> {user.email}</p>
        <p><strong>Rôle :</strong> {user.role}</p>
        {bio && <p><strong>Bio :</strong> {bio}</p>}
        {profession && <p><strong>Profession :</strong> {profession}</p>}
        {location && <p><strong>Localisation :</strong> {location}</p>}
        {radiusKm && (
          <p><strong>Rayon de déplacement :</strong> {radiusKm} km</p>
        )}
        {Array.isArray(specialties) && specialties.length > 0 && (
          <p><strong>Spécialités :</strong> {specialties.join(', ')}</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Zone d’intervention</h2>
        <Map center={[latitude, longitude]} radius={radiusKm} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Galerie Média</h2>
        <MediaGallery userId={user.id} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Calendrier</h2>
        <Calendar userId={user.id} />
      </div>
    </div>
  )
}