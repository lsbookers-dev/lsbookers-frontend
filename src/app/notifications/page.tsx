'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

type Notification = {
  id: number
  userId: number
  type: string
  message: string
  read: boolean
  createdAt: string
  offerId?: number
}

export default function NotificationsPage() {
  const { user } = useAuth() as { user: { id: number | string } | null }
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id || !API_BASE) return
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications)
        }
      } catch (err) {
        console.error('Erreur chargement notifications:', err)
      }
    }
    fetchNotifications()
  }, [API_BASE, user?.id])

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
      }
    } catch (err) {
      console.error('Erreur marquage notification:', err)
    }
  }

  return (
    <div className="relative">
      {/* Bouton pour ouvrir/fermer (géré par le header, ici juste un placeholder) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden"
      >
        Ouvrir notifications
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 bg-neutral-900/95 backdrop-blur shadow-xl p-4 z-50 max-h-96 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2">Notifications</h2>
          {notifications.length === 0 ? (
            <p className="text-sm text-neutral-400">Aucune notification.</p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-2 rounded-lg ${notif.read ? 'bg-black/30' : 'bg-black/50'} mb-2`}
              >
                <p className="text-sm">{notif.message}</p>
                <p className="text-xs text-neutral-400">{new Date(notif.createdAt).toLocaleDateString()}</p>
                {!notif.read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="mt-1 text-xs text-pink-600 hover:text-pink-500"
                  >
                    Marquer comme lu
                  </button>
                )}
              </div>
            ))
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full mt-2 text-sm text-white/80 hover:text-white"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  )
}