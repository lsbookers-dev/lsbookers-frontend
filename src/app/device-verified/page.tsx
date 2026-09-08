'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

// trust  → GET  /api/auth/device-verify?action=trust  (atomique, safe pour scanners)
// reject → POST /api/auth/device-verify-reject        (POST seulement, scanners ne peuvent pas déclencher ça)
type Status = 'loading' | 'trust_ok' | 'reject_confirm' | 'reject_loading' | 'reject_ok' | 'error'

export default function DeviceVerifiedPage() {
  const params  = useSearchParams()
  const [status, setStatus] = useState<Status>('loading')
  const [detail, setDetail] = useState('')
  const [token,  setToken]  = useState('')

  useEffect(() => {
    const t      = params.get('token')  ?? ''
    const action = params.get('action') ?? ''

    if (!t || !['trust', 'reject'].includes(action)) {
      setStatus('error')
      setDetail('Lien invalide.')
      return
    }

    setToken(t)

    if (action === 'trust') {
      // Trust → GET atomique (safe, le backend protège contre les doubles appels)
      fetch(`${API_BASE}/api/auth/device-verify?token=${t}&action=trust`)
        .then(async (res) => {
          const data = await res.json()
          if (!res.ok) {
            setStatus('error')
            setDetail(data.error || 'Une erreur est survenue.')
          } else {
            setStatus('trust_ok')
            setDetail(data.deviceName || '')
          }
        })
        .catch(() => {
          setStatus('error')
          setDetail('Impossible de joindre le serveur.')
        })
    } else {
      // Reject → NE PAS appeler l'API automatiquement.
      // On affiche d'abord une page de confirmation : l'utilisateur doit cliquer
      // un bouton qui déclenche un POST. Les scanners d'email (GET uniquement)
      // ne peuvent pas déclencher cette action destructive.
      setStatus('reject_confirm')
    }
  }, [params])

  const handleConfirmReject = async () => {
    setStatus('reject_loading')
    try {
      const res = await fetch(`${API_BASE}/api/auth/device-verify-reject`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setDetail(data.error || 'Une erreur est survenue.')
      } else {
        setStatus('reject_ok')
      }
    } catch {
      setStatus('error')
      setDetail('Impossible de joindre le serveur.')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#111118] border border-white/10 rounded-2xl p-8 text-center">

        {/* Logo */}
        <div className="inline-block bg-gradient-to-br from-[#7c3aed] to-[#a855f7] rounded-xl px-5 py-2 mb-8">
          <span className="font-black text-lg tracking-widest text-white">LS Bookers</span>
        </div>

        {/* ── Trust en cours ── */}
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Vérification en cours…</p>
          </>
        )}

        {/* ── Trust OK ── */}
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

        {/* ── Confirmation avant reject ── */}
        {(status === 'reject_confirm' || status === 'reject_loading') && (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-2">Ce n&apos;était pas vous ?</h1>
            <p className="text-gray-400 mb-2">
              En confirmant, toutes vos sessions seront fermées et vos appareils de confiance supprimés.
            </p>
            <p className="text-amber-400 text-sm mb-6">
              Changez votre mot de passe immédiatement après.
            </p>
            <button
              onClick={handleConfirmReject}
              disabled={status === 'reject_loading'}
              className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition mb-3"
            >
              {status === 'reject_loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sécurisation…
                </span>
              ) : '🔒 Oui, sécuriser mon compte'}
            </button>
            <Link
              href="/login"
              className="block text-sm text-white/40 hover:text-white/60 transition"
            >
              Annuler — c&apos;était bien moi
            </Link>
          </>
        )}

        {/* ── Reject OK ── */}
        {status === 'reject_ok' && (
          <>
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-white mb-2">Compte sécurisé</h1>
            <p className="text-gray-400 mb-2">
              Toutes vos sessions ont été fermées et vos appareils de confiance supprimés.
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

        {/* ── Erreur ── */}
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
