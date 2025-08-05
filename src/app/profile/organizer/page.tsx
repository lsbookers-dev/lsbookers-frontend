'use client'

import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'

const typeOptions = ['Club', 'Bar', 'Rooftop', 'Soirée privée', 'Autre']
const MapOrganizerLocation = dynamic(() => import('@/components/MapSelector'), { ssr: false })

type ProfileUpdateFields = Partial<{
  typeEtablissement: string
  latitude: number
  longitude: number
  location: string
  country: string
}>

export default function OrganizerProfilePage() {
  const { user, token, setUser } = useAuth()
  const router = useRouter()

  const [typeEtablissement, setTypeEtablissement] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [location, setLocation] = useState('')
  const [country, setCountry] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'ORGANIZER') {
      router.push('/home')
    } else if (user?.profile) {
      setTypeEtablissement(user.profile.typeEtablissement || '')
      setLatitude(user.profile.latitude || null)
      setLongitude(user.profile.longitude || null)
      setLocation(user.profile.location || '')
      setCountry(user.profile.country || '')
    }
  }, [user, router])

  const updateProfile = async (fields: ProfileUpdateFields) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/${user?.profile?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(fields)
      })

      if (res.ok) {
        setUser(prev => {
          if (!prev || !prev.profile) return prev
          return {
            ...prev,
            profile: {
              ...prev.profile,
              ...fields
            }
          }
        })
      } else {
        console.error('❌ Erreur lors de la mise à jour du profil')
      }
    } catch (err) {
      console.error('❌ Erreur serveur :', err)
    }
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setTypeEtablissement(value)
    updateProfile({ typeEtablissement: value })
  }

  const handleMapClick = async (lat: number, lon: number) => {
    setLatitude(lat)
    setLongitude(lon)

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      const data = await res.json()

      const city = data?.address?.city || data?.address?.town || data?.address?.village || 'Localisation inconnue'
      const countryName = data?.address?.country || ''

      setLocation(city)
      setCountry(countryName)

      updateProfile({
        latitude: lat,
        longitude: lon,
        location: city,
        country: countryName
      })
    } catch (err) {
      console.error('❌ Erreur reverse geocoding', err)
      updateProfile({ latitude: lat, longitude: lon })
    }
  }

  const handleManualLocationSave = () => {
    updateProfile({ location, country })
  }

  if (!user || user.role !== 'ORGANIZER') {
    return <div className="text-white p-10">Chargement...</div>
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <main className="flex-1 p-6 space-y-6">
        {/* Infos organisateur */}
        <section className="flex flex-col md:flex-row items-center gap-6">
          <Image
            src="/default-avatar.png"
            alt="Logo établissement"
            width={128}
            height={128}
            className="rounded-full border-2 border-white"
          />
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-sm text-gray-300 mb-1">Type d’établissement :</p>
            <select
              value={typeEtablissement}
              onChange={handleTypeChange}
              className="text-black px-2 py-1 rounded"
            >
              <option value="">Choisir un type</option>
              {typeOptions.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Localisation manuelle */}
        <section>
          <h2 className="text-xl font-bold mb-2">🏙️ Ville de l’établissement</h2>
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Ville"
              className="bg-gray-800 px-4 py-2 rounded text-white w-1/2"
            />
            <input
              type="text"
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="Pays"
              className="bg-gray-800 px-4 py-2 rounded text-white w-1/3"
            />
            <button
              onClick={handleManualLocationSave}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Sauvegarder
            </button>
          </div>
        </section>

        {/* Carte */}
        <section>
          <h2 className="text-2xl font-bold mb-2">📍 Localisation sur la carte</h2>
          <div className="rounded overflow-hidden">
            <MapOrganizerLocation
              latitude={latitude}
              longitude={longitude}
              onMapClick={handleMapClick}
            />
          </div>
        </section>

        {/* Publications des événements */}
        <section>
          <h2 className="text-2xl font-bold mb-2">🎉 Événements publiés</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded">Soirée Afrobeat - 20/08</div>
            <div className="bg-gray-800 p-4 rounded">Concert Live - 25/08</div>
          </div>
        </section>

        {/* Réseaux sociaux */}
        <section>
          <h2 className="text-2xl font-bold mb-2">🔗 Réseaux sociaux</h2>
          <div className="text-gray-300 space-y-1">
            <p>Instagram : @toncompte</p>
            <p>Facebook : facebook.com/ta-page</p>
            <p>Site Web : www.etablissement.com</p>
          </div>
        </section>
      </main>
    </div>
  )
}