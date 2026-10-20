'use client'

import { apiFetch } from '@/utils/auth'
import { useEffect, useState } from 'react'
import { Mail, MessageSquare, User, AtSign, Tag, Send, CheckCircle, ChevronLeft } from 'lucide-react'
import LsIcon from '@/components/ui/LsIcon'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

const SUBJECTS = [
  'Signaler un problème technique',
  'Question sur mon compte',
  'Demande de partenariat',
  'Signaler un abus',
  'Question sur mes données personnelles',
  'Autre',
]

export default function ContactPage() {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // Sujet choisi d'avance depuis Réglages › Aide (?sujet=probleme | compte | abus | donnees)
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get('sujet')
    const subject = { probleme: SUBJECTS[0], compte: SUBJECTS[1], abus: SUBJECTS[3], donnees: 'Question sur mes données personnelles' }[key || '']
    if (subject) setForm(f => ({ ...f, subject }))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Merci de remplir tous les champs obligatoires.')
      return
    }
    setSending(true)
    setError(null)
    try {
      const res = await apiFetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erreur lors de l\'envoi.')
      }
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {!user && (
        <div className="absolute left-0 right-0 top-0 z-10 mx-auto flex max-w-5xl items-center px-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3.5 py-2 text-sm text-white/70 backdrop-blur transition hover:text-white">
            <ChevronLeft size={16} /> Retour au site
          </Link>
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-strong/15 via-black to-black pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 pt-24 pb-16 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 mb-6">
            <Mail size={26} className="text-accent-light" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Contactez-nous
          </h1>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            Une question, un problème, une suggestion ? On vous répond dès que possible.
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-5xl mx-auto px-4 pb-24 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">

        {/* Formulaire */}
        <div>
          {sent ? (
            <div className="flex flex-col items-center justify-center text-center py-20 gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                <CheckCircle size={32} className="text-accent-light" />
              </div>
              <h2 className="text-2xl font-semibold">Message envoyé !</h2>
              <p className="text-white/50 max-w-sm">
                Merci de nous avoir contactés. Nous reviendrons vers vous par email si nécessaire.
              </p>
              <button
                onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                className="mt-4 px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm transition"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">

              {/* Nom */}
              <div className="space-y-1.5">
                <label className="text-sm text-white/60 flex items-center gap-1.5">
                  <User size={13} /> Nom complet <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Jean Dupont"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm text-white/60 flex items-center gap-1.5">
                  <AtSign size={13} /> Adresse email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="jean@exemple.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition"
                />
              </div>

              {/* Sujet */}
              <div className="space-y-1.5">
                <label className="text-sm text-white/60 flex items-center gap-1.5">
                  <Tag size={13} /> Sujet
                </label>
                <select
                  value={form.subject}
                  onChange={e => set('subject', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition appearance-none cursor-pointer"
                >
                  <option value="">Choisir un sujet (optionnel)</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-sm text-white/60 flex items-center gap-1.5">
                  <MessageSquare size={13} /> Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                  placeholder="Décrivez votre demande en détail…"
                  rows={7}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition resize-none"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-600/10 border border-red-600/20 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-strong hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition"
              >
                <Send size={15} />
                {sending ? 'Envoi en cours…' : 'Envoyer le message'}
              </button>
            </form>
          )}
        </div>

        {/* Infos complémentaires */}
        <aside className="space-y-4 lg:pt-2">
          {[
            {
              icon: 'clock' as const,
              title: 'Délai de réponse',
              desc: 'Nous lisons tous les messages et répondons par email sous 24 à 48h.',
            },
            {
              icon: 'shield' as const,
              title: 'Vos données sont protégées',
              desc: 'Vos informations ne sont jamais partagées avec des tiers.',
            },
            {
              icon: 'bug' as const,
              title: 'Signaler un bug',
              desc: 'Décrivez précisément le problème et les étapes pour le reproduire.',
            },
          ].map(card => (
            <div key={card.title} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <LsIcon name={card.icon} size={24} className="mb-2" />
              <h3 className="font-semibold text-sm mb-1">{card.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </aside>
      </div>
    </main>
  )
}
