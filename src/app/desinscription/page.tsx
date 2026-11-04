'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import LsIcon from '@/components/ui/LsIcon'

/**
 * Lien « Ne plus recevoir ces e-mails » des e-mails de notification (04/11/2026), sans être connecté.
 * Rien ne change à l'ouverture : il faut confirmer (les logiciels qui ouvrent tout seuls les liens
 * des e-mails ne peuvent donc pas désinscrire par erreur).
 */
export default function UnsubscribePage() {
  const [token, setToken] = useState<string | null>(null)
  const [labels, setLabels] = useState<string[]>([])
  const [state, setState] = useState<'loading' | 'ask' | 'busy' | 'done' | 'error'>('loading')

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token')
    setToken(t)
    if (!t) { setState('error'); return }
    apiFetch(apiUrl(`email/unsubscribe/info?token=${encodeURIComponent(t)}`))
      .then(async res => {
        if (!res.ok) throw new Error()
        const data = await res.json()
        setLabels((data.categories || []).map((c: { label: string }) => c.label))
        setState('ask')
      })
      .catch(() => setState('error'))
  }, [])

  const confirm = async () => {
    if (!token) return
    setState('busy')
    try {
      const res = await apiFetch(apiUrl(`email/unsubscribe?token=${encodeURIComponent(token)}`), { method: 'POST' })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  const list = labels.map(l => `« ${l} »`).join(', ')

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-7 text-center">
        <LsIcon name={state === 'done' ? 'check' : state === 'error' ? 'warning' : 'mail'} size={38} tone={state === 'done' ? 'ok' : state === 'error' ? 'bad' : 'accent'} className="mx-auto mb-4" />

        {state === 'loading' && <p className="text-sm text-white/50">Chargement…</p>}

        {(state === 'ask' || state === 'busy') && (
          <>
            <h1 className="text-lg font-semibold">Ne plus recevoir ces e-mails ?</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Vous ne recevrez plus d’e-mails pour {labels.length > 1 ? 'les sujets' : 'le sujet'} {list}. Les notifications
              restent visibles dans la cloche sur LS Bookers, et les e-mails de sécurité continuent d’arriver.
            </p>
            <button type="button" onClick={confirm} disabled={state === 'busy'} className="mt-6 w-full rounded-xl bg-accent-strong px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-60">
              {state === 'busy' ? 'Enregistrement…' : 'Ne plus recevoir ces e-mails'}
            </button>
            <Link href="/" className="mt-3 inline-block text-xs text-white/40 hover:text-white/70">Garder les e-mails</Link>
          </>
        )}

        {state === 'done' && (
          <>
            <h1 className="text-lg font-semibold">C’est noté</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Vous ne recevrez plus d’e-mails pour {list}. Vous pouvez changer d’avis à tout moment dans Réglages › Notifications et e-mails.
            </p>
            <Link href="/settings/notifications" className="mt-6 inline-block text-xs text-accent-light hover:text-white">Choisir mes e-mails</Link>
          </>
        )}

        {state === 'error' && (
          <>
            <h1 className="text-lg font-semibold">Ce lien n’est pas valable</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Choisissez les e-mails que vous recevez dans Réglages › Notifications et e-mails, une fois connecté.
            </p>
            <Link href="/settings/notifications" className="mt-6 inline-block text-xs text-accent-light hover:text-white">Choisir mes e-mails</Link>
          </>
        )}
      </div>
    </main>
  )
}
