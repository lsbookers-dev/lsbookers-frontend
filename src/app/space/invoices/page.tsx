'use client'

/**
 * Devis et factures : création (souvent à partir d'un booking), PDF, envoi au client
 * par la messagerie, suivi (envoyé, accepté, payé). Un document envoyé n'est plus modifiable.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/utils/auth'
import { apiUrl } from '@/utils/api'
import LsIcon from '@/components/ui/LsIcon'
import { apiErrorMessage, useFeedback } from '@/components/ui/Feedback'
import InvoiceEditor, { type BookingSource, type Invoice, type InvoiceKind } from '@/components/space/InvoiceEditor'
import { euro } from '@/components/space/ui'
import { usePlan } from '@/lib/plan'

const STATUS: Record<Invoice['status'], { label: string; className: string }> = {
  DRAFT: { label: 'Brouillon', className: 'bg-white/10 text-white/70' },
  SENT: { label: 'Envoyé', className: 'bg-accent/15 text-accent-light' },
  ACCEPTED: { label: 'Accepté', className: 'bg-emerald-400/10 text-emerald-400' },
  PAID: { label: 'Payée', className: 'bg-emerald-400/10 text-emerald-400' },
  CANCELLED: { label: 'Annulé', className: 'bg-red-400/10 text-red-300' },
}

function InvoicesContent() {
  const { user } = useAuth()
  const { notify, confirm } = useFeedback()
  const [kind, setKind] = useState<InvoiceKind>('QUOTE')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [sources, setSources] = useState<BookingSource[]>([])
  const [issuerReady, setIssuerReady] = useState(true)
  const [editing, setEditing] = useState<Invoice | 'new' | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(apiUrl('invoices'), { cache: 'no-store' })
      if (res.ok) setInvoices((await res.json()).invoices || [])
    } catch { /* liste vide */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (!user) return
    load()
    const year = new Date().getFullYear()
    Promise.all([year, year - 1].map(y => apiFetch(apiUrl(`space/finances?period=year&year=${y}`), { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null)))
      .then(results => setSources(results.flatMap(r => r?.items || []).map((i: BookingSource & { counterpart: { profileId: number; name: string } | null }) => ({
        bookingId: i.bookingId ?? null, date: i.date, title: i.title, amount: i.amount, counterpart: i.counterpart ?? null,
      })).sort((a, b) => +new Date(b.date) - +new Date(a.date))))
    apiFetch(apiUrl('profile/me'), { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => setIssuerReady(Boolean(d?.profile?.siret && (d.profile.address || d.profile.city))))
      .catch(() => {})
  }, [user, load])

  const replace = (inv: Invoice) => setInvoices(list => (list.some(i => i.id === inv.id) ? list.map(i => (i.id === inv.id ? inv : i)) : [inv, ...list]))

  const act = async (inv: Invoice, run: () => Promise<Response>, success: string, fallback: string) => {
    setBusyId(inv.id)
    try {
      const res = await run()
      if (!res.ok) throw new Error(await apiErrorMessage(res, fallback))
      const data = await res.json()
      if (data.invoice) replace(data.invoice)
      notify(success)
      return data
    } catch (err) {
      notify(err instanceof Error ? err.message : fallback, 'error')
      return null
    } finally {
      setBusyId(null)
    }
  }

  const setStatus = (inv: Invoice, status: Invoice['status'], success: string) =>
    act(inv, () => apiFetch(apiUrl(`invoices/${inv.id}/status`), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }), success, 'Impossible de changer le statut.')

  const download = async (inv: Invoice) => {
    const { downloadInvoicePdf } = await import('@/lib/pdf')
    await downloadInvoicePdf(inv)
  }

  const sendToClient = async (inv: Invoice) => {
    if (!inv.client?.userId) return
    if (!(await confirm({ title: `Envoyer ${inv.number} à ${inv.client.name} ?`, message: 'Le PDF sera envoyé dans votre conversation, et le document ne sera plus modifiable.', confirmLabel: 'Envoyer' }))) return
    setBusyId(inv.id)
    try {
      const start = await apiFetch(apiUrl('messages/start'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipientId: inv.client.userId }) })
      if (!start.ok) throw new Error(await apiErrorMessage(start, 'Impossible d’ouvrir la conversation.'))
      const { conversationId } = await start.json()
      const { invoicePdfFile } = await import('@/lib/pdf')
      const form = new FormData()
      form.append('conversationId', String(conversationId))
      form.append('content', `${inv.kind === 'QUOTE' ? 'Voici mon devis' : 'Voici ma facture'} ${inv.number}${inv.title ? ` — ${inv.title}` : ''}.`)
      form.append('file', await invoicePdfFile(inv))
      const sent = await apiFetch(apiUrl('messages/send-file'), { method: 'POST', body: form })
      if (!sent.ok) throw new Error(await apiErrorMessage(sent, 'L’envoi du PDF a échoué.'))
    } catch (err) {
      setBusyId(null)
      notify(err instanceof Error ? err.message : 'L’envoi a échoué.', 'error')
      return
    }
    setBusyId(null)
    if (inv.status === 'DRAFT') await setStatus(inv, 'SENT', 'Envoyé dans la messagerie')
    else notify('Envoyé dans la messagerie')
  }

  const convert = (inv: Invoice) =>
    act(inv, () => apiFetch(apiUrl(`invoices/${inv.id}/convert`), { method: 'POST' }), 'Facture créée à partir du devis', 'Impossible de créer la facture.')
      .then(data => { if (data?.invoice) { setKind('INVOICE'); load() } })

  const remove = async (inv: Invoice) => {
    if (!(await confirm({ title: `Supprimer le brouillon ${inv.number} ?`, danger: true }))) return
    setBusyId(inv.id)
    try {
      const res = await apiFetch(apiUrl(`invoices/${inv.id}`), { method: 'DELETE' })
      if (!res.ok) throw new Error(await apiErrorMessage(res, 'Suppression impossible.'))
      setInvoices(list => list.filter(i => i.id !== inv.id))
      notify('Brouillon supprimé')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Suppression impossible.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const cancel = async (inv: Invoice) => {
    if (!(await confirm({ title: `Annuler ${inv.number} ?`, message: 'Le document reste dans votre historique avec le statut « Annulé ».', danger: true, confirmLabel: 'Annuler le document' }))) return
    setStatus(inv, 'CANCELLED', 'Document annulé')
  }

  const list = invoices.filter(i => i.kind === kind)
  const btn = 'inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/75 transition hover:text-white disabled:opacity-40'

  return (
    <div className="lsb-page grid max-w-4xl gap-4">
      <Link href="/space" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white"><ArrowLeft size={15} /> Mon espace</Link>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[.2em] text-violet-400">Finances</span>
          <h1 className="mt-1 text-[clamp(1.7rem,3.6vw,2.3rem)] font-semibold">Devis et factures</h1>
          <p className="mt-1 text-sm text-muted">Créés en quelques clics à partir de vos bookings, envoyés en PDF dans la messagerie.</p>
        </div>
        <button type="button" onClick={() => setEditing('new')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong">
          <LsIcon name="plus" size={16} tone="inherit" />{kind === 'QUOTE' ? 'Nouveau devis' : 'Nouvelle facture'}
        </button>
      </header>

      {!issuerReady && (
        <Link href="/studio-profile?edit=private" className="flex items-center gap-2.5 rounded-xl border border-gold/35 bg-gold/10 px-4 py-3 text-sm text-gold-light">
          <LsIcon name="warning" size={18} tone="inherit" />
          <span>Ajoutez votre SIRET et votre adresse (Studio profil → Infos privées) pour que vos devis et factures soient complets.</span>
        </Link>
      )}

      <div className="inline-flex justify-self-start rounded-[10px] border border-line bg-surface-2 p-[3px]" role="tablist">
        {(['QUOTE', 'INVOICE'] as const).map(k => (
          <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)}
            className={`rounded-[7px] px-4 py-1.5 text-sm font-semibold transition ${kind === k ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}>
            {k === 'QUOTE' ? 'Devis' : 'Factures'} <span className="tabular-nums opacity-70">({invoices.filter(i => i.kind === k).length})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-[18px] bg-white/[0.04]" />
      ) : list.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-[18px] border border-dashed border-line px-6 py-12 text-center">
          <LsIcon name="document" size={30} />
          <p className="text-sm text-white/80">{kind === 'QUOTE' ? 'Aucun devis pour l’instant.' : 'Aucune facture pour l’instant.'}</p>
          <p className="max-w-sm text-xs text-muted">Choisissez un de vos bookings : client, date et cachet sont remplis automatiquement.</p>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {list.map(inv => {
            const s = STATUS[inv.status]
            const busy = busyId === inv.id
            return (
              <article key={inv.id} className="grid gap-3 rounded-[16px] border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-sm tabular-nums text-white">{inv.number}</b>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.className}`}>{s.label}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-white/85">{inv.clientName}{inv.title ? ` · ${inv.title}` : ''}</p>
                    <p className="text-xs text-muted">
                      Émis le {new Date(inv.issueDate).toLocaleDateString('fr-FR')}
                      {inv.serviceDate ? ` · prestation du ${new Date(inv.serviceDate).toLocaleDateString('fr-FR')}` : ''}
                      {inv.kind === 'INVOICE' && inv.dueDate && inv.status !== 'PAID' ? ` · échéance ${new Date(inv.dueDate).toLocaleDateString('fr-FR')}` : ''}
                    </p>
                  </div>
                  <b className="text-lg tabular-nums text-gold-light">{euro(inv.totals.ttc)}</b>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => download(inv)} className={btn}><LsIcon name="document" size={14} tone="inherit" />PDF</button>
                  {inv.client?.userId && inv.status !== 'CANCELLED' && (
                    <button type="button" disabled={busy} onClick={() => sendToClient(inv)} className={btn}><LsIcon name="message" size={14} tone="inherit" />Envoyer au client</button>
                  )}
                  {inv.status === 'DRAFT' && (
                    <>
                      <button type="button" disabled={busy} onClick={() => setEditing(inv)} className={btn}>Modifier</button>
                      <button type="button" disabled={busy} onClick={() => setStatus(inv, 'SENT', 'Marqué comme envoyé')} className={btn}>Marquer envoyé</button>
                      <button type="button" disabled={busy} onClick={() => remove(inv)} className={`${btn} hover:text-red-300`}>Supprimer</button>
                    </>
                  )}
                  {inv.kind === 'QUOTE' && inv.status === 'SENT' && (
                    <button type="button" disabled={busy} onClick={() => setStatus(inv, 'ACCEPTED', 'Devis accepté')} className={btn}>Marquer accepté</button>
                  )}
                  {inv.kind === 'QUOTE' && ['SENT', 'ACCEPTED'].includes(inv.status) && (
                    <button type="button" disabled={busy} onClick={() => convert(inv)} className={`${btn} border-gold/35 text-gold-light`}>Transformer en facture</button>
                  )}
                  {inv.kind === 'INVOICE' && inv.status === 'SENT' && (
                    <button type="button" disabled={busy} onClick={() => setStatus(inv, 'PAID', 'Facture marquée payée')} className={`${btn} border-emerald-400/30 text-emerald-300`}>Marquer payée</button>
                  )}
                  {['SENT', 'ACCEPTED'].includes(inv.status) && (
                    <button type="button" disabled={busy} onClick={() => cancel(inv)} className={`${btn} hover:text-red-300`}>Annuler</button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {editing && (
        <InvoiceEditor
          kind={editing === 'new' ? kind : editing.kind}
          invoice={editing === 'new' ? null : editing}
          sources={sources}
          onClose={() => setEditing(null)}
          onSaved={inv => { replace(inv); setEditing(null); notify(editing === 'new' ? `${inv.number} créé` : 'Brouillon enregistré') }}
        />
      )}
    </div>
  )
}

/** Devis et factures : version Pro uniquement */
export default function InvoicesPage() {
  const { isPro, loading } = usePlan()
  if (loading) return <div className="lsb-state-screen">Chargement…</div>
  if (isPro) return <InvoicesContent />
  return (
    <div className="lsb-page min-h-screen text-white">
      <Link href="/space" className="mb-6 inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white"><ArrowLeft size={14} />Mon espace</Link>
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-surface p-8 text-center">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-gold/30 bg-gold/10"><LsIcon name="lock" tone="gold" size={20} /></span>
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-gold">Finances</p>
        <h1 className="mt-1 text-xl font-semibold">Devis et factures</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">Créez vos devis et factures en quelques clics, envoyez-les par la messagerie et suivez leur paiement. Disponible avec la version Pro.</p>
        <Link href="/subscriptions" className="mt-6 inline-block rounded-xl bg-accent-strong px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent">Passer en Pro</Link>
      </div>
    </div>
  )
}
