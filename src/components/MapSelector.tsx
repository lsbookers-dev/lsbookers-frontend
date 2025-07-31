'use client'

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const markerIcon = new L.Icon({
  iconUrl: '/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: '/marker-shadow.png',
  shadowSize: [41, 41],
})

interface MapSelectorProps {
  latitude: number | null
  longitude: number | null
  onMapClick: (lat: number, lon: number) => void
}

export default function MapSelector({ latitude, longitude, onMapClick }: MapSelectorProps) {
  const [position, setPosition] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude])
    }
  }, [latitude, longitude])

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng
        setPosition([lat, lng])
        onMapClick(lat, lng)
      },
    })

    return position === null ? null : (
      <Marker position={position} icon={markerIcon} />
    )
  }

  return (
    <MapContainer
      center={position || [48.8566, 2.3522]} // par défaut Paris
      zoom={12}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker />
    </MapContainer>
  )
}