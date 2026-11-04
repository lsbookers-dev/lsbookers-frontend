'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import LsIcon from '@/components/ui/LsIcon'

/**
 * « Ce n'était pas moi » : lien de l'e-mail d'alerte de nouvelle connexion, sans être connecté.
 * Rien ne se passe à l'ouverture : il faut cliquer (les logiciels qui ouvrent les liens des e-mails
 * tout seuls ne peuvent donc pas déclencher la sécurisation par erreur).
 */
export default function SecureAccountPage() {
  const [token, setToken] = useState<string | null>(null)
  const [state, setState] = useState<'ask' | 'busy' | 'done' | 'error'>('ask')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token')
    setToken(t)
    if (!t) { setState('error'); setMessage('Lien incomplet. Ouvrez le lien reçu dans l’e-mail « Nouvelle connexion à votre compte ».') }
  }, [])

  const secure = async () => {
    if (!token) return
    setState('busy')
    try {
      const res = await apiFetch(apiUrl('account/secure'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok) setState('done')
      else { setState('error'); setMessage(data?.error || 'Ce lien n’est plus valable.') }
    } catch {
      setState('error')
      setMessage('Impossible de joindre le serveur. Réessayez dans un instant.')
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-7 text-center">
        <LsIcon
          name={state === 'done' ? 'check' : state === 'error' ? 'warning' : 'shield'}
          size={38}
          tone={state === 'done' ? 'ok' : state === 'error' ? 'bad' : 'gold'}
          className="mx-auto mb-4"
        />

        {(state === 'ask' || state === 'busy') && (
          <>
            <h1 className="text-lg font-semibold">Ce n’était pas vous ?</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              En sécurisant votre compte, <strong className="font-semibold text-white/80">tous les appareils seront déconnectés</strong>, y compris celui
              qui vient de se connecter. Vous recevrez ensuite un e-mail pour choisir un nouveau mot de passe.
            </p>
            <button
              type="button"
              onClick={secure}
              disabled={state === 'busy'}
              className="mt-6 w-full rounded-xl bg-accent-strong px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-60"
            >
              {state === 'busy' ? 'Sécurisation…' : 'Sécuriser mon compte'}
            </button>
            <Link href="/" className="mt-3 inline-block text-xs text-white/40 hover:text-white/70">C’était bien moi, ne rien faire</Link>
          </>
        )}

        {state === 'done' && (
          <>
            <h1 className="text-lg font-semibold">Votre compte est sécurisé</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Tous les appareils ont été déconnectés. Nous venons de vous envoyer un e-mail pour choisir un nouveau
              mot de passe (le lien est valable 1 heure). Pensez à vérifier vos courriers indésirables.
            </p>
            <Link href="/forgot-password" className="mt-6 inline-block text-xs text-accent-light hover:text-white">Pas reçu l’e-mail ? Le renvoyer</Link>
          </>
        )}

        {state === 'error' && (
          <>
            <h1 className="text-lg font-semibold">Lien plus valable</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{message}</p>
            <Link href="/forgot-password" className="mt-6 inline-block rounded-xl bg-accent-strong px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent">
              Mot de passe oublié
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
