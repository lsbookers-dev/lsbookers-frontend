'use client'

/** Éléments communs des rubriques de Réglages : carte, ligne de réglage, interrupteur, champ */

export const SETTINGS_INPUT =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-accent/50 [color-scheme:dark]'

export function SettingsTitle({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-5">
      <h1 className="text-xl font-semibold text-white sm:text-2xl">{title}</h1>
      {description && <p className="mt-1 text-sm text-white/45">{description}</p>}
    </header>
  )
}

export function SettingsCard({ title, description, children, tone = 'default' }: {
  title?: string
  description?: string
  children: React.ReactNode
  tone?: 'default' | 'danger'
}) {
  return (
    <section className={`mb-4 rounded-2xl border p-4 sm:p-5 ${tone === 'danger' ? 'border-red-400/20 bg-red-500/[0.03]' : 'border-white/8 bg-surface'}`}>
      {title && <h2 className={`text-sm font-semibold ${tone === 'danger' ? 'text-red-200' : 'text-white'}`}>{title}</h2>}
      {description && <p className="mt-1 text-xs leading-relaxed text-white/45">{description}</p>}
      <div className={title || description ? 'mt-4' : ''}>{children}</div>
    </section>
  )
}

/** Ligne : libellé + explication à gauche, action à droite */
export function SettingRow({ label, description, children }: { label: string; description?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm text-white/90">{label}</p>
        {description && <div className="mt-0.5 text-xs leading-relaxed text-white/45">{description}</div>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  )
}

export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (next: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-accent' : 'bg-white/12'}`}
    >
      <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

export function SettingsButton({ children, onClick, type = 'button', disabled, variant = 'secondary' }: {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const styles = {
    primary: 'bg-accent-strong text-white hover:bg-accent',
    secondary: 'border border-white/12 text-white/80 hover:bg-white/[0.06] hover:text-white',
    danger: 'border border-red-400/30 text-red-300 hover:bg-red-500/10',
  }[variant]
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`rounded-xl px-4 py-2 text-xs font-medium transition disabled:opacity-50 ${styles}`}>
      {children}
    </button>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-white/60">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-white/35">{hint}</span>}
    </label>
  )
}
