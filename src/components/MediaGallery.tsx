'use client'

import { useEffect, useState } from 'react'

interface Media {
  id: number
  fileUrl: string
  fileType: string
  createdAt: string
}

export default function MediaGallery({ userId }: { userId: number }) {
  const [mediaList, setMediaList] = useState<Media[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`http://localhost:5001/api/media/user/${userId}`)
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
          {media.fileType.startsWith('image') ? (
            <img
              src={media.fileUrl}
              alt="media"
              className="w-full h-48 object-cover rounded"
            />
          ) : media.fileType.startsWith('video') ? (
            <video controls className="w-full h-48 object-cover rounded">
              <source src={media.fileUrl} type={media.fileType} />
              Votre navigateur ne supporte pas les vidéos.
            </video>
          ) : (
            <a
              href={media.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              Fichier
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