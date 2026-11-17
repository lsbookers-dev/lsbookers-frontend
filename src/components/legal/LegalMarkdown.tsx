import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Affiche les textes légaux (src/content/legal.ts), écrits dans un markdown très simple :
 *   ## titre, ### sous-titre, paragraphes séparés par une ligne vide,
 *   listes « - » ou « 1. », tableaux « | a | b | », **gras**, [lien](/adresse).
 * `shift` descend les titres d'un cran (texte rangé sous un grand titre de partie).
 */

const EMAIL = 'contact@lsbookers.com'

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  // **gras**, [texte](lien), ou l'adresse de contact
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)|contact@lsbookers\.com/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const key = `${keyBase}-${i++}`
    if (m[1]) out.push(<strong key={key} className="font-semibold text-white">{inline(m[1], key)}</strong>)
    else if (m[2]) {
      const href = m[3]
      out.push(href.startsWith('/') || href.startsWith('#')
        ? <Link key={key} href={href} className="text-accent-light underline underline-offset-4 hover:text-white">{m[2]}</Link>
        : <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-accent-light underline underline-offset-4 hover:text-white">{m[2]}</a>)
    } else out.push(<a key={key} href={`mailto:${EMAIL}`} className="text-accent-light underline underline-offset-4 hover:text-white">{EMAIL}</a>)
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

const cells = (row: string) => row.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())

export default function LegalMarkdown({ source, shift = 0 }: { source: string; shift?: number }) {
  const blocks = source.trim().split(/\n\s*\n/)
  return (
    <>
      {blocks.map((block, b) => {
        const lines = block.split('\n').map(l => l.trimEnd())
        const key = `b${b}`
        const first = lines[0]

        const heading = first.match(/^(#{2,4}) (.+)$/)
        if (heading && lines.length === 1) {
          const level = heading[1].length + shift
          const cls = level <= 2
            ? 'mt-10 mb-3 text-xl font-semibold text-white'
            : level === 3
              ? 'mt-8 mb-2 text-base font-semibold text-white'
              : 'mt-6 mb-2 text-sm font-semibold uppercase tracking-wide text-white/80'
          const content = inline(heading[2], key)
          if (level <= 2) return <h2 key={key} className={cls}>{content}</h2>
          if (level === 3) return <h3 key={key} className={cls}>{content}</h3>
          return <h4 key={key} className={cls}>{content}</h4>
        }

        if (first.startsWith('|')) {
          const [head, , ...rows] = lines
          return (
            <div key={key} className="my-4 overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                <thead className="bg-white/[0.04] text-white">
                  <tr>{cells(head).map((c, i) => <th key={i} className="px-3 py-2 font-semibold">{inline(c, `${key}h${i}`)}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((r, ri) => (
                    <tr key={ri} className="border-t border-white/[0.06] align-top">
                      {cells(r).map((c, i) => <td key={i} className="px-3 py-2 text-white/70">{inline(c, `${key}r${ri}c${i}`)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        if (/^- /.test(first)) {
          return (
            <ul key={key} className="my-3 list-disc space-y-1.5 pl-5 text-white/70 marker:text-white/30">
              {lines.map((l, i) => <li key={i}>{inline(l.replace(/^- /, ''), `${key}-${i}`)}</li>)}
            </ul>
          )
        }

        if (/^\d+\. /.test(first)) {
          return (
            <ol key={key} className="my-3 list-decimal space-y-1.5 pl-5 text-white/70 marker:text-white/40">
              {lines.map((l, i) => <li key={i}>{inline(l.replace(/^\d+\. /, ''), `${key}-${i}`)}</li>)}
            </ol>
          )
        }

        return <p key={key} className="my-3 leading-relaxed text-white/70">{inline(lines.join(' '), key)}</p>
      })}
    </>
  )
}
