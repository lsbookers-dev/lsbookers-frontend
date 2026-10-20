'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import LsIcon from '@/components/ui/LsIcon'

/** Lien reçu par e-mail pour confirmer une nouvelle adresse (Réglages › Connexion et sécurité) */
export default function ConfirmEmailChangePage() {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) { setState('error'); setMessage('Lien incomplet. Ouvrez le lien reçu par e-mail.'); return }
    apiFetch(apiUrl('account/email/confirm'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async res => {
        const data = await res.json().catch(() => null)
        if (res.ok) { setState('ok'); setMessage(`Votre compte utilise désormais l’adresse ${data?.email}.`) }
        else { setState('error'); setMessage(data?.error || 'Lien invalide ou expiré.') }
      })
      .catch(() => { setState('error'); setMessage('Impossible de joindre le serveur. Réessayez.') })
  }, [])

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-8 text-center">
        <LsIcon name={state === 'ok' ? 'check' : state === 'error' ? 'warning' : 'mail'} size={36} tone={state === 'ok' ? 'ok' : state === 'error' ? 'bad' : 'accent'} className="mx-auto mb-4" />
        <h1 className="text-lg font-semibold">
          {state === 'loading' ? 'Confirmation en cours…' : state === 'ok' ? 'Adresse e-mail confirmée' : 'Confirmation impossible'}
        </h1>
        {message && <p className="mt-2 text-sm text-white/55">{message}</p>}
        {state !== 'loading' && (
          <Link href={state === 'ok' ? '/settings/security' : '/login'} className="mt-6 inline-block rounded-xl bg-accent-strong px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent">
            {state === 'ok' ? 'Retour aux réglages' : 'Se connecter'}
          </Link>
        )}
      </div>
    </main>
  )
}
