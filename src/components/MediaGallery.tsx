'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface Media {
  id: number
  url: string         // ✅ correspond à la colonne 'url' en BDD
  type: 'IMAGE' | 'VIDEO'
  createdAt: string
}

export default function MediaGallery({ userId }: { userId: number }) {
  const [mediaList, setMediaList] = useState<Media[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/user/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Erreur serveur')
        return res.json()
      })
      .then((data) => {
        setMediaList(data.media || [])
      })
      .catch((err) => {
        console.error(err)
        setError('Erreur de chargement des médias')
      })
  }, [userId])

  if (error) return <p className="text-red-500">{error}</p>
  if (mediaList.length === 0) return <p className="text-gray-400">Aucune publication pour le moment.</p>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {mediaList.map((media) => (
        <div key={media.id} className="bg-gray-800 p-2 rounded shadow">
          {media.type === 'IMAGE' ? (
            <Image
              src={media.url}
              alt="media"
              width={400}
              height={300}
              className="w-full h-48 object-cover rounded"
              unoptimized
            />
          ) : media.type === 'VIDEO' ? (
            <video controls className="w-full h-48 object-cover rounded">
              <source src={media.url} type="video/mp4" />
              Votre navigateur ne supporte pas les vidéos.
            </video>
          ) : (
            <a
              href={media.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              Voir le fichier
            </a>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {new Date(media.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}