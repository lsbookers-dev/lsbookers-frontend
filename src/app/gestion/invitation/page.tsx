'use client'

/**
 * /gestion/invitation?token=… — lien reçu par e-mail.
 * Profil préparé par une agence : la personne choisit son mot de passe et valide (le profil devient visible).
 * Invitation d'un compte existant : la personne, connectée, accepte ou refuse.
 */

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import SafeImage from '@/components/SafeImage'
import LsIcon from '@/components/ui/LsIcon'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'

type Invite = {
  origin: 'INVITED' | 'CREATED'
  manager: { name: string; avatar: string | null }
  profile: { name: string; role: string }
  signedInAsOwner: boolean
}

const inputCls = 'w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-violet-500/60'

function InvitationContent() {
  const token = useSearchParams().get('token') || ''
  const [invite, setInvite] = useState<Invite | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'invalid' | 'done'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [requireApproval, setRequireApproval] = useState(true)
  const [form, setForm] = useState({ firstName: '', lastName: '', password: '', confirm: '', isAdult: false })

  useEffect(() => {
    if (!token) { setState('invalid'); return }
    apiFetch(apiUrl(`managers/claim/${encodeURIComponent(token)}`), { cache: 'no-store' })
      .then(async r => {
        if (!r.ok) { setState('invalid'); return }
        setInvite(await r.json())
        setState('ready')
      })
      .catch(() => setState('invalid'))
  }, [token])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (invite?.origin === 'CREATED') {
      if (!form.firstName.trim() || !form.lastName.trim()) { setError('Indiquez votre prénom et votre nom.'); return }
      if (form.password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
      if (form.password !== form.confirm) { setError('Les deux mots de passe ne correspondent pas.'); return }
      if (!form.isAdult) { setError('Vous devez certifier être majeur.'); return }
    }
    setSending(true)
    try {
      const res = await apiFetch(apiUrl(`managers/claim/${encodeURIComponent(token)}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invite?.origin === 'CREATED'
          ? { firstName: form.firstName.trim(), lastName: form.lastName.trim(), password: form.password, isAdult: true, requireApproval }
          : { requireApproval }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || data.error || 'Validation impossible pour le moment.')
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation impossible pour le moment.')
    } finally {
      setSending(false)
    }
  }

  if (state === 'loading') return <p className="text-center text-sm text-white/50">Chargement…</p>

  if (state === 'invalid' || !invite) {
    return (
      <div className="text-center">
        <LsIcon name="warning" size={28} tone="gold" />
        <h1 className="mt-3 text-xl font-semibold">Ce lien n’est plus valable</h1>
        <p className="mt-2 text-sm text-white/55">Il a peut-être expiré (14 jours) ou déjà été utilisé. Demandez à la personne qui vous a invité de vous renvoyer une invitation.</p>
        <Link href="/login" className="mt-5 inline-block text-sm text-violet-300 hover:underline">Se connecter</Link>
      </div>
    )
  }

  if (state === 'done') {
    return (
      <div className="text-center">
        <LsIcon name="check" size={28} tone="ok" />
        <h1 className="mt-3 text-xl font-semibold">{invite.origin === 'CREATED' ? 'Votre profil est validé' : 'Invitation acceptée'}</h1>
        <p className="mt-2 text-sm text-white/55">
          {invite.manager.name} peut maintenant gérer votre profil. Vous pouvez retirer cet accès à tout moment dans Réglages › Gestion de mon profil.
        </p>
        <Link href={invite.origin === 'CREATED' ? '/login' : '/settings/management'} className="mt-5 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500">
          {invite.origin === 'CREATED' ? 'Me connecter' : 'Voir mes réglages'}
        </Link>
      </div>
    )
  }

  const needsLogin = invite.origin === 'INVITED' && !invite.signedInAsOwner

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="flex items-center gap-3">
        <SafeImage type="avatar" src={invite.manager.avatar} name={invite.manager.name} size={44} />
        <div className="min-w-0">
          <h1 className="text-lg font-semibold leading-tight">
            {invite.origin === 'CREATED' ? `${invite.manager.name} a préparé votre profil` : `${invite.manager.name} souhaite gérer votre profil`}
          </h1>
          <p className="text-xs text-white/50">Profil « {invite.profile.name} »</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-white/60">
        {invite.manager.name} pourra gérer votre agenda, vos messages, vos publications et vos bookings. L’argent de vos bookings reste toujours versé sur votre compte. Vous pouvez retirer l’accès d’un clic, et vous gardez tout : profil, avis, historique.
      </p>

      {needsLogin ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
          Connectez-vous avec votre compte, puis ouvrez <b className="text-white">Réglages › Gestion de mon profil</b> pour répondre à cette invitation.
          <Link href="/login" className="mt-3 block w-full rounded-xl bg-violet-600 px-4 py-2.5 text-center font-semibold text-white hover:bg-violet-500">Me connecter</Link>
        </div>
      ) : (
        <>
          {invite.origin === 'CREATED' && (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Prénom" aria-label="Prénom" maxLength={50} className={inputCls} />
                <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Nom" aria-label="Nom" maxLength={50} className={inputCls} />
              </div>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mot de passe (8 caractères minimum)" aria-label="Mot de passe" autoComplete="new-password" className={inputCls} />
              <input type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Confirmer le mot de passe" aria-label="Confirmer le mot de passe" autoComplete="new-password" className={inputCls} />
              <label className="flex items-start gap-3 text-sm text-white/70">
                <input type="checkbox" checked={form.isAdult} onChange={e => setForm(f => ({ ...f, isAdult: e.target.checked }))} className="mt-0.5 h-4 w-4 accent-violet-500" />
                Je certifie être majeur et accepte les conditions d’utilisation de LS Bookers.
              </label>
            </div>
          )}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/[0.05] p-3">
            <input type="checkbox" checked={requireApproval} onChange={e => setRequireApproval(e.target.checked)} className="mt-0.5 h-4 w-4 accent-violet-500" />
            <span>
              <span className="block text-sm text-white">Me demander mon accord avant d’accepter un booking</span>
              <span className="block text-xs text-white/45">L’organisateur verra « en attente de confirmation de l’artiste ».</span>
            </span>
          </label>
          {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={sending} className="rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50">
            {sending ? 'Validation…' : invite.origin === 'CREATED' ? 'Valider mon profil' : 'Accepter'}
          </button>
          <p className="text-center text-xs text-white/40">Vous ne connaissez pas {invite.manager.name} ? Fermez simplement cette page : rien ne sera publié.</p>
        </>
      )}
    </form>
  )
}

export default function ManagedInvitationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0a14] p-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-7 shadow-2xl">
        <Suspense fallback={<p className="text-center text-sm text-white/50">Chargement…</p>}>
          <InvitationContent />
        </Suspense>
      </div>
    </div>
  )
}
