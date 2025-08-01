'use client'

import { MapContainer, TileLayer, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

type MapProps = {
  center: [number, number]
  radius: number // en km
}

export default function Map({ center, radius }: MapProps) {
  return (
    <MapContainer center={center} zoom={10} style={{ height: '300px', width: '100%' }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
      />
      <Circle center={center} radius={radius * 1000} />
    </MapContainer>
  )
}