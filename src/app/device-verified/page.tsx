'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

type Status = 'loading' | 'trust_ok' | 'reject_ok' | 'error'

export default function DeviceVerifiedPage() {
  const params   = useSearchParams()
  const router   = useRouter()
  const [status, setStatus] = useState<Status>('loading')
  const [detail, setDetail] = useState('')

  useEffect(() => {
    const token  = params.get('token')
    const action = params.get('action')

    if (!token || !['trust', 'reject'].includes(action ?? '')) {
      setStatus('error')
      setDetail('Lien invalide.')
      return
    }

    fetch(`${API_BASE}/api/auth/device-verify?token=${token}&action=${action}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          setStatus('error')
          setDetail(data.error || 'Une erreur est survenue.')
        } else if (action === 'trust') {
          setStatus('trust_ok')
          setDetail(data.deviceName || '')
        } else {
          setStatus('reject_ok')
        }
      })
      .catch(() => {
        setStatus('error')
        setDetail('Impossible de joindre le serveur.')
      })
  }, [params])

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#111118] border border-white/10 rounded-2xl p-8 text-center">

        {/* Logo */}
        <div className="inline-block bg-gradient-to-br from-[#7c3aed] to-[#a855f7] rounded-xl px-5 py-2 mb-8">
          <span className="font-black text-lg tracking-widest text-white">LS Bookers</span>
        </div>

        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Vérification en cours…</p>
          </>
        )}

        {status === 'trust_ok' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-white mb-2">Appareil confirmé</h1>
            <p className="text-gray-400 mb-6">
              <strong className="text-white">{detail || 'Cet appareil'}</strong> a été ajouté à vos appareils de confiance. Vous ne recevrez plus d&apos;alerte pour cet appareil.
            </p>
            <Link
              href="/login"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              Se connecter
            </Link>
          </>
        )}

        {status === 'reject_ok' && (
          <>
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-white mb-2">Compte sécurisé</h1>
            <p className="text-gray-400 mb-2">
              Toutes vos sessions ont été fermées et vos appareils de confiance ont été supprimés.
            </p>
            <p className="text-amber-400 text-sm mb-6">
              ⚠️ Changez votre mot de passe dès que possible depuis les paramètres.
            </p>
            <Link
              href="/login"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              Se connecter et changer le mot de passe
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-white mb-2">Lien invalide</h1>
            <p className="text-gray-400 mb-6">{detail}</p>
            <Link
              href="/login"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              Retour à la connexion
            </Link>
          </>
        )}

      </div>
    </div>
  )
}
