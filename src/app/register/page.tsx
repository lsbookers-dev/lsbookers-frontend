'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'ARTIST' | 'ORGANIZER'>('ARTIST')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      console.log('🟡 Tentative d’inscription...')
      await register({ email, password, role, name })
    } catch (err) {
      console.error('❌ Erreur d’inscription', err)
      setError('Échec de l’inscription. Vérifie les champs ou l’email.')
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
          className="w-full px-4 py-2 mb-4 text-black"
          required
        />

        <label className="block mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-2 mb-4 text-black"
          required
        />

        <label className="block mb-2">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-4 text-black"
          required
        />

        <label className="block mb-2">Type de compte</label>
        <select
          value={role}
          onChange={e => setRole(e.target.value as 'ARTIST' | 'ORGANIZER')}
          className="w-full px-4 py-2 mb-6 text-black"
        >
          <option value="ARTIST">Artiste</option>
          <option value="ORGANIZER">Organisateur</option>
        </select>

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded"
        >
          S’inscrire
        </button>
      </form>
    </div>
  )
}