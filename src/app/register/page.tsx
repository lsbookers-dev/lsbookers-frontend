'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Rôles autorisés
type UserRole = 'ARTIST' | 'ORGANIZER' | 'PROVIDER'

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('ARTIST')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
      if (!API) throw new Error('NEXT_PUBLIC_API_URL manquant')

      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ok même si le backend ne pose pas de cookie
        body: JSON.stringify({ name, email, password, role }),
      })

      if (!res.ok) {
        // Tentative d’explication selon le status
        let msg = "Échec de l'inscription. Réessaie."
        if (res.status === 409) msg = 'Un compte existe déjà avec cet email.'
        else if (res.status === 400) msg = 'Données invalides (email ou mot de passe).'
        else if (res.status === 404) msg = 'Endpoint introuvable (vérifie NEXT_PUBLIC_API_URL).'

        // Récupération éventuelle du message backend
        try {
          const data = await res.json()
          if (data?.message) msg = data.message
          if (data?.error) msg = data.error
        } catch {
          // ignore si pas de JSON
        }
        throw new Error(msg)
      }

      // Succès -> on redirige vers la page de connexion
      router.push('/login')
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Échec de l'inscription. Réessaie."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Créer un compte</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <label className="block mb-2">Nom / Pseudo</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-2 mb-4 text-black rounded"
          required
        />

        <label className="block mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-2 mb-4 text-black rounded"
          required
        />

        <label className="block mb-2">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-4 text-black rounded"
          required
        />

        <label className="block mb-2">Type de compte</label>
        <select
          value={role}
          onChange={e => setRole(e.target.value as UserRole)}
          className="w-full px-4 py-2 mb-6 text-black rounded"
        >
          <option value="ARTIST">Artistes</option>
          <option value="ORGANIZER">Organisateurs/Etablissements</option>
          <option value="PROVIDER">Prestataires</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-2 rounded"
        >
          {loading ? 'Création…' : "S'inscrire"}
        </button>

        <p className="mt-4 text-sm text-center">
          Déjà un compte ?{' '}
          <a href="/login" className="text-blue-400 underline">
            Se connecter
          </a>
        </p>
      </form>
    </div>
  )
}