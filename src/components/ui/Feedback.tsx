'use client'

/**
 * Messages et confirmations au style du site (remplacent alert() / confirm()).
 *   const { notify, confirm } = useFeedback()
 *   notify('Profil enregistré')                       // succès
 *   notify('Impossible d’enregistrer', 'error')
 *   if (!(await confirm({ title: 'Supprimer cette offre ?', danger: true }))) return
 */

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'

type Tone = 'success' | 'error'
type Toast = { id: number; message: string; tone: Tone }
type ConfirmOptions = { title: string; message?: string; confirmLabel?: string; danger?: boolean }
type PendingConfirm = ConfirmOptions & { resolve: (ok: boolean) => void }

type FeedbackContextValue = {
  notify: (message: string, tone?: Tone) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null)

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const nextId = useRef(0)

  const notify = useCallback((message: string, tone: Tone = 'success') => {
    const id = ++nextId.current
    setToasts(list => [...list, { id, message, tone }])
    setTimeout(() => setToasts(list => list.filter(toast => toast.id !== id)), 4000)
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>(resolve => {
    setPending({ ...options, resolve })
  }), [])

  const close = (ok: boolean) => {
    pending?.resolve(ok)
    setPending(null)
  }

  return (
    <FeedbackContext.Provider value={{ notify, confirm }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
        {toasts.map(toast => (
          <div key={toast.id} role="status" className={`pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ${toast.tone === 'error' ? 'border-red-400/30 bg-[#2a1014]/95 text-red-100' : 'border-emerald-400/25 bg-[#0e1f18]/95 text-emerald-50'}`}>
            {toast.tone === 'error' ? <CircleAlert size={16} className="shrink-0 text-red-300" /> : <CheckCircle2 size={16} className="shrink-0 text-emerald-300" />}
            <span>{toast.message}</span>
            <button type="button" aria-label="Fermer" onClick={() => setToasts(list => list.filter(item => item.id !== toast.id))} className="ml-1 text-white/40 hover:text-white"><X size={14} /></button>
          </div>
        ))}
      </div>

      {pending && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={e => { if (e.target === e.currentTarget) close(false) }}>
          <section role="alertdialog" aria-modal="true" aria-label={pending.title} className="w-full max-w-sm rounded-t-2xl border border-white/10 bg-[#0f0e13] p-5 text-white shadow-2xl sm:rounded-2xl">
            <h2 className="text-base font-semibold">{pending.title}</h2>
            {pending.message && <p className="mt-2 text-sm leading-relaxed text-white/55">{pending.message}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => close(false)} className="rounded-xl px-4 py-2 text-sm text-white/55 hover:text-white">Annuler</button>
              <button type="button" autoFocus onClick={() => close(true)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${pending.danger ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-white text-black'}`}>
                {pending.confirmLabel || (pending.danger ? 'Supprimer' : 'Confirmer')}
              </button>
            </div>
          </section>
        </div>
      )}
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (!context) throw new Error('useFeedback doit être utilisé dans <FeedbackProvider>')
  return context
}

/** Lit le message d'erreur renvoyé par l'API (champ message ou error). */
export async function apiErrorMessage(res: Response, fallback: string) {
  const data = await res.json().catch(() => null)
  return (data?.message || data?.error || fallback) as string
}
