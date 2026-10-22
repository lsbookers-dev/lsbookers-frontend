/**
 * PDF générés dans le navigateur : export compta de Mon espace, devis et factures.
 * jsPDF est chargé seulement au moment de l'export (pas dans le poids des pages).
 */

import type { jsPDF as JsPDF } from 'jspdf'

const ACCENT: [number, number, number] = [124, 58, 237]
const INK: [number, number, number] = [30, 27, 40]
const MUTED: [number, number, number] = [110, 104, 122]

/** Montant « 1 234,50 € » avec des espaces simples (les polices PDF de base n'ont pas l'espace fine). */
export function money(value: number) {
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[  ]/g, ' ')} €`
}

const frDate = (value?: string | Date | null) =>
  value ? new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

/** Les polices de base des PDF ne connaissent pas l'apostrophe courbe, le tiret long, l'espace fine… */
const plain = (text: string) =>
  text.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[—–]/g, '-').replace(/…/g, '...').replace(/[\u202f\u00a0]/g, ' ')

async function newDoc() {
  const [{ jsPDF }, autoTable] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.setFont('helvetica')
  // Tout le texte écrit (y compris par les tableaux) passe par plain()
  const write = doc.text.bind(doc)
  doc.text = ((text: string | string[], ...rest: unknown[]) =>
    (write as (...args: unknown[]) => JsPDF)(Array.isArray(text) ? text.map(plain) : plain(text), ...rest)) as JsPDF['text']
  return { doc, autoTable: autoTable.default }
}

function footer(doc: JsPDF, text: string) {
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(text, 15, 288)
    doc.text(`${i} / ${pages}`, 195, 288, { align: 'right' })
  }
}

/* ── Export compta (Mon espace) ─────────────────────────────────────────── */

export type FinanceRow = { date: string; title: string; counterpart?: string | null; city?: string | null; amount: number; done: boolean }

export async function exportFinancePdf({ ownerName, kind, periodLabel, rows }: {
  ownerName: string
  kind: 'revenus' | 'dépenses'
  periodLabel: string
  rows: FinanceRow[]
}) {
  const { doc, autoTable } = await newDoc()
  const total = rows.reduce((s, r) => s + r.amount, 0)
  const done = rows.filter(r => r.done).reduce((s, r) => s + r.amount, 0)

  doc.setFillColor(...ACCENT)
  doc.rect(0, 0, 210, 4, 'F')
  doc.setTextColor(...INK)
  doc.setFontSize(18)
  doc.text(`Mes ${kind} — ${periodLabel}`, 15, 20)
  doc.setFontSize(10)
  doc.setTextColor(...MUTED)
  doc.text(`${ownerName} · édité le ${frDate(new Date())}`, 15, 27)

  autoTable(doc, {
    startY: 34,
    head: [['Date', kind === 'revenus' ? 'Prestation' : 'Événement', kind === 'revenus' ? 'Client' : 'Lieu', 'Statut', 'Montant']],
    body: rows.map(r => [frDate(r.date), r.title, (kind === 'revenus' ? r.counterpart : r.city) || '—', r.done ? 'Réalisé' : 'À venir', money(r.amount)]),
    foot: [['', '', '', 'Total', money(total)], ['', '', '', 'dont réalisé', money(done)]],
    theme: 'striped',
    styles: { font: 'helvetica', fontSize: 9, textColor: INK },
    headStyles: { fillColor: ACCENT, textColor: 255 },
    footStyles: { fillColor: [245, 243, 250], textColor: INK, fontStyle: 'bold' },
    columnStyles: { 4: { halign: 'right' } },
  })
  footer(doc, 'Montants saisis dans les bookings et l’agenda LS Bookers — document indicatif, ne remplace pas une facture.')
  doc.save(`ls-bookers-${kind}-${periodLabel.toLowerCase().replace(/\s+/g, '-')}.pdf`)
}

/* ── Devis et factures ──────────────────────────────────────────────────── */

export type InvoiceLine = { label: string; quantity: number; unitPrice: number }
export type InvoiceDoc = {
  kind: 'QUOTE' | 'INVOICE'
  number: string
  title?: string | null
  clientName: string
  clientAddress?: string | null
  serviceDate?: string | null
  issueDate: string
  dueDate?: string | null
  items: InvoiceLine[]
  vatRate: number
  notes?: string | null
  totals: { ht: number; vat: number; ttc: number }
  issuer: { name: string; legalName?: string | null; establishmentName?: string | null; siret?: string | null; address?: string | null } | null
}

async function buildInvoice(inv: InvoiceDoc) {
  const { doc, autoTable } = await newDoc()
  const isQuote = inv.kind === 'QUOTE'
  const issuer = inv.issuer

  doc.setFillColor(...ACCENT)
  doc.rect(0, 0, 210, 4, 'F')

  // Émetteur
  doc.setTextColor(...INK)
  doc.setFontSize(13)
  doc.text(issuer?.establishmentName || issuer?.name || '', 15, 18)
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  const issuerLines = [
    issuer?.legalName && issuer.legalName !== issuer?.name ? issuer.legalName : null,
    issuer?.address,
    issuer?.siret ? `SIRET ${issuer.siret}` : null,
  ].filter(Boolean) as string[]
  issuerLines.forEach((line, i) => doc.text(line, 15, 24 + i * 4.5))

  // Titre
  doc.setTextColor(...ACCENT)
  doc.setFontSize(20)
  doc.text(isQuote ? 'DEVIS' : 'FACTURE', 195, 18, { align: 'right' })
  doc.setTextColor(...INK)
  doc.setFontSize(10)
  doc.text(`N° ${inv.number}`, 195, 25, { align: 'right' })
  doc.setTextColor(...MUTED)
  doc.setFontSize(9)
  const dates = [
    `Date d'émission : ${frDate(inv.issueDate)}`,
    inv.serviceDate ? `Date de la prestation : ${frDate(inv.serviceDate)}` : null,
    !isQuote && inv.dueDate ? `Échéance : ${frDate(inv.dueDate)}` : null,
  ].filter(Boolean) as string[]
  dates.forEach((line, i) => doc.text(line, 195, 31 + i * 4.5, { align: 'right' }))

  // Client
  doc.setDrawColor(225, 222, 232)
  doc.roundedRect(110, 48, 85, 26, 2, 2)
  doc.setFontSize(8)
  doc.text(isQuote ? 'DEVIS ADRESSÉ À' : 'FACTURÉ À', 114, 54)
  doc.setTextColor(...INK)
  doc.setFontSize(11)
  doc.text(inv.clientName, 114, 60)
  if (inv.clientAddress) {
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text(doc.splitTextToSize(inv.clientAddress, 76), 114, 65)
  }

  if (inv.title) {
    doc.setTextColor(...INK)
    doc.setFontSize(10)
    doc.text(`Objet : ${inv.title}`, 15, 84)
  }

  autoTable(doc, {
    startY: inv.title ? 89 : 84,
    head: [['Désignation', 'Qté', 'Prix unitaire HT', 'Total HT']],
    body: inv.items.map(l => [l.label, String(l.quantity), money(l.unitPrice), money(l.quantity * l.unitPrice)]),
    theme: 'striped',
    styles: { font: 'helvetica', fontSize: 9.5, textColor: INK },
    headStyles: { fillColor: ACCENT, textColor: 255 },
    columnStyles: { 1: { halign: 'center', cellWidth: 16 }, 2: { halign: 'right', cellWidth: 36 }, 3: { halign: 'right', cellWidth: 32 } },
  })

  // Totaux
  type WithTable = JsPDF & { lastAutoTable?: { finalY: number } }
  let y = ((doc as WithTable).lastAutoTable?.finalY ?? 120) + 8
  const row = (label: string, value: string, bold = false) => {
    doc.setFontSize(bold ? 11 : 9.5)
    doc.setTextColor(...(bold ? INK : MUTED))
    doc.text(label, 150, y, { align: 'right' })
    doc.text(value, 195, y, { align: 'right' })
    y += bold ? 7 : 5.5
  }
  row('Total HT', money(inv.totals.ht))
  if (inv.vatRate > 0) row(`TVA ${inv.vatRate} %`, money(inv.totals.vat))
  row(isQuote ? 'Total TTC' : 'Net à payer', money(inv.totals.ttc), true)

  y += 4
  doc.setFontSize(8.5)
  doc.setTextColor(...MUTED)
  const mentions = [
    inv.vatRate > 0 ? null : 'TVA non applicable, art. 293 B du CGI.',
    isQuote
      ? 'Devis valable 30 jours. Bon pour accord : date, signature et mention « Bon pour accord ».'
      : 'En cas de retard de paiement : pénalités au taux légal et indemnité forfaitaire de 40 € pour frais de recouvrement (art. L441-10 du Code de commerce). Pas d’escompte pour paiement anticipé.',
    inv.notes || null,
  ].filter(Boolean) as string[]
  for (const text of mentions) {
    const lines = doc.splitTextToSize(text, 180)
    doc.text(lines, 15, y)
    y += lines.length * 4 + 2
  }

  footer(doc, `${isQuote ? 'Devis' : 'Facture'} ${inv.number} · établi avec LS Bookers`)
  return doc
}

export async function downloadInvoicePdf(inv: InvoiceDoc) {
  const doc = await buildInvoice(inv)
  doc.save(`${inv.kind === 'QUOTE' ? 'devis' : 'facture'}-${inv.number}.pdf`)
}

export async function invoicePdfFile(inv: InvoiceDoc) {
  const doc = await buildInvoice(inv)
  const blob = doc.output('blob')
  return new File([blob], `${inv.kind === 'QUOTE' ? 'Devis' : 'Facture'} ${inv.number}.pdf`, { type: 'application/pdf' })
}

/* ── Attestation de paiement d'un booking (pas une facture) ─────────────── */

export type PaymentAttestation = {
  reference: string
  bookingId: number
  date: string
  paidAt: string
  payer: string
  payee: string
  amountCents: number
  commissionCents?: number
  commissionPct?: number
  transferredCents?: number
  refundedCents: number
  status: string
}

export async function downloadPaymentAttestation(att: PaymentAttestation) {
  const { doc, autoTable } = await newDoc()
  doc.setFillColor(...ACCENT)
  doc.rect(0, 0, 210, 6, 'F')
  doc.setTextColor(...INK)
  doc.setFontSize(20)
  doc.text('Attestation de paiement', 15, 26)
  doc.setFontSize(10)
  doc.setTextColor(...MUTED)
  doc.text(`Référence ${att.reference} · émise le ${frDate(new Date())}`, 15, 33)

  doc.setTextColor(...INK)
  doc.setFontSize(10.5)
  const lines = doc.splitTextToSize(
    `LS Bookers atteste que ${att.payer} a réglé en ligne, le ${frDate(att.paidAt)}, le booking de ${att.payee} prévu le ${frDate(att.date)}, pour un montant de ${money(att.amountCents / 100)}.`,
    180,
  )
  doc.text(lines, 15, 46)

  const rows: string[][] = [['Montant payé par l\'organisateur', money(att.amountCents / 100)]]
  if (att.commissionCents != null) rows.push([`Commission LS Bookers (${String(att.commissionPct).replace('.', ',')} %)`, `- ${money(att.commissionCents / 100)}`])
  if (att.transferredCents != null && att.transferredCents > 0) rows.push(['Versé à la personne bookée', money(att.transferredCents / 100)])
  if (att.refundedCents > 0) rows.push(['Remboursé à l\'organisateur', money(att.refundedCents / 100)])
  autoTable(doc, {
    startY: 46 + lines.length * 5 + 6,
    body: rows,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3, textColor: INK },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  })

  const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
  doc.setFontSize(8.5)
  doc.setTextColor(...MUTED)
  doc.text(doc.splitTextToSize(
    "Ce document n'est pas une facture. LS Bookers met en relation les deux parties et n'est pas partie au contrat de prestation : la facture de la prestation est établie directement par la personne bookée à l'organisateur. La commission LS Bookers fait l'objet d'une facture séparée.",
    180,
  ), 15, y)
  footer(doc, 'LS Bookers · lsbookers.com')
  doc.save(`attestation-paiement-${att.reference}.pdf`)
}

/* ── Proposition tarifaire (offre) : détail de la prestation, pas un devis légal ── */

export type ProposalDoc = {
  offerTitle: string
  offerDate?: string | null
  offerLocation?: string | null
  from: string
  to: string
  details: string
  lines: { label: string; amount: number }[]
  conditions?: string
}

export async function proposalPdfFile(p: ProposalDoc) {
  const { doc, autoTable } = await newDoc()
  doc.setFillColor(...ACCENT)
  doc.rect(0, 0, 210, 6, 'F')
  doc.setTextColor(...INK)
  doc.setFontSize(20)
  doc.text('Proposition tarifaire', 15, 26)
  doc.setFontSize(10)
  doc.setTextColor(...MUTED)
  doc.text(`De ${p.from} pour ${p.to} · ${frDate(new Date())}`, 15, 33)
  doc.setTextColor(...INK)
  doc.setFontSize(11)
  doc.text(`Offre : ${p.offerTitle}`, 15, 44)
  doc.setFontSize(9.5)
  doc.setTextColor(...MUTED)
  const meta = [p.offerDate ? `Date : ${frDate(p.offerDate)}` : '', p.offerLocation ? `Lieu : ${p.offerLocation}` : ''].filter(Boolean).join('   ·   ')
  if (meta) doc.text(meta, 15, 50)

  let y = 60
  if (p.details.trim()) {
    doc.setTextColor(...INK)
    doc.setFontSize(10.5)
    doc.text('Détail de la prestation', 15, y)
    doc.setFontSize(10)
    doc.setTextColor(60, 56, 70)
    const lines = doc.splitTextToSize(p.details.trim(), 180)
    doc.text(lines, 15, y + 6)
    y += 10 + lines.length * 4.6
  }

  const total = p.lines.reduce((s, l) => s + (Number(l.amount) || 0), 0)
  autoTable(doc, {
    startY: y + 2,
    head: [['Prestation', 'Tarif']],
    body: [...p.lines.map(l => [l.label, money(Number(l.amount) || 0)]), ['Total proposé', money(total)]],
    theme: 'striped',
    headStyles: { fillColor: ACCENT, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 3, textColor: INK },
    columnStyles: { 1: { halign: 'right', cellWidth: 40 } },
    didParseCell: (data: { row: { index: number }; cell: { styles: { fontStyle: string } } }) => {
      if (data.row.index === p.lines.length) data.cell.styles.fontStyle = 'bold'
    },
  })
  type WithTable = JsPDF & { lastAutoTable?: { finalY: number } }
  let after = ((doc as WithTable).lastAutoTable?.finalY ?? y + 30) + 8
  if (p.conditions?.trim()) {
    doc.setFontSize(10.5)
    doc.setTextColor(...INK)
    doc.text('Conditions', 15, after)
    doc.setFontSize(10)
    doc.setTextColor(60, 56, 70)
    const c = doc.splitTextToSize(p.conditions.trim(), 180)
    doc.text(c, 15, after + 6)
    after += 10 + c.length * 4.6
  }
  doc.setFontSize(8.5)
  doc.setTextColor(...MUTED)
  doc.text(doc.splitTextToSize("Proposition indicative envoyée via LS Bookers. Ce document n'est pas un devis : un devis peut être demandé directement au prestataire.", 180), 15, after + 4)
  footer(doc, 'LS Bookers · lsbookers.com')
  const safe = p.offerTitle.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 40) || 'offre'
  return new File([doc.output('blob')], `proposition-${safe}.pdf`, { type: 'application/pdf' })
}
