'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfileSettings() {
  const router = useRouter()
  const [location, setLocation] = useState('')
  const [soundcloudUrl, setSoundcloudUrl] = useState('')
  const [showSoundcloud, setShowSoundcloud] = useState(false)
  const [notificationScope, setNotificationScope] = useState('INTERNATIONAL') // Par défaut
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [profileId, setProfileId] = useState<number | null>(null)

  useEffect(() => {
    const t = localStorage.getItem('token')
    const uStr = localStorage.getItem('user')
    if (t) setToken(t)
    if (uStr) {
      const u = JSON.parse(uStr)
      const uid = typeof u?.id === 'string' ? parseInt(u.id, 10) : u?.id
      setUserId(uid || null)
      if (u?.profile?.id) setProfileId(u.profile.id)
    }
    // Charger les données actuelles
    const loadProfile = async () => {
      if (!token || !userId) return
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const { profile } = await res.json()
        setLocation(profile.location || '')
        setSoundcloudUrl(profile.soundcloudUrl || '')
        setShowSoundcloud(!!profile.showSoundcloud)
        // Charger les préférences de notification
        const prefs = profile.notificationPreferences
        if (prefs) setNotificationScope(prefs.locationScope)
      }
    }
    loadProfile()
  }, [token, userId])

  const saveSettings = async () => {
    if (!token || !profileId) {
      alert('Connecte-toi pour sauvegarder.')
      return
    }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/${profileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ location, soundcloudUrl, showSoundcloud, notificationPreferences: { locationScope: notificationScope } }),
    })
    if (res.ok) {
      alert('Paramètres mis à jour ✅')
      router.push('/profile/artist')
    } else {
      alert('Échec de la sauvegarde')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-neutral-900/60 border border-white/10 rounded-2xl">
      <h1 className="text-2xl font-bold mb-4">Paramètres du profil</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Localisation</label>
          <input
            className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Lien SoundCloud</label>
          <input
            className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
            value={soundcloudUrl}
            onChange={(e) => setSoundcloudUrl(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showSoundcloud}
            onChange={(e) => setShowSoundcloud(e.target.checked)}
          />
          <label>Afficher le player SoundCloud</label>
        </div>
        {/* Préférences de notification */}
        <div>
          <label className="block text-sm font-medium mb-1">Préférences de notification</label>
          <select
            className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
            value={notificationScope}
            onChange={(e) => setNotificationScope(e.target.value)}
          >
            <option value="REGION">Ma région</option>
            <option value="FRANCE">France</option>
            <option value="INTERNATIONAL">International</option>
          </select>
        </div>
        <button
          onClick={saveSettings}
          className="w-full bg-pink-600 rounded-lg px-4 py-2 hover:bg-pink-500"
        >
          Sauvegarder
        </button>
      </div>
    </div>
  )
}