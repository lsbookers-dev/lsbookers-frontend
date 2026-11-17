import type { Metadata } from 'next'
import LegalPage from '@/components/legal/LegalPage'
import LegalMarkdown from '@/components/legal/LegalMarkdown'
import { CONDITIONS_PARTS } from '@/content/legal'

export const metadata: Metadata = { title: 'Conditions et confidentialité' }

/** CGU, conditions des abonnements et paiements, politique de confidentialité et charte des données, à la suite */
export default function ConditionsPage() {
  return (
    <LegalPage
      title="Conditions et confidentialité"
      aside={
        <nav className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4" aria-label="Sommaire">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[.16em] text-white/40">Sommaire</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm marker:text-white/35">
            {CONDITIONS_PARTS.map(p => (
              <li key={p.id}><a href={`#${p.id}`} className="text-accent-light hover:text-white">{p.title}</a></li>
            ))}
          </ol>
        </nav>
      }
    >
      {CONDITIONS_PARTS.map((part, i) => (
        <section key={part.id} id={part.id} className="scroll-mt-24 border-t border-white/10 pt-8 first:border-t-0 first:pt-2 [&+section]:mt-14">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">Partie {i + 1}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">{part.title}</h2>
          <LegalMarkdown source={part.source} shift={1} />
        </section>
      ))}
    </LegalPage>
  )
}
