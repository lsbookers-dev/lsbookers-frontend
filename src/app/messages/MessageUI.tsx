// messages/MessageUI.tsx — Composants UI réutilisables (Avatar, Lightbox, AttachmentBubble)

import { useEffect } from 'react'
import Image from 'next/image'
import { FileText, ZoomIn, Download } from 'lucide-react'
import { toAbs } from "./_helpers"
import type { Message } from './types'

/* ── Avatar ──────────────────────────────────────────────── */
export function Avatar({ src, alt, size = 40 }: { src: string; alt: string; size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="w-full h-full rounded-full overflow-hidden ring-1 ring-white/10">
        <Image src={toAbs(src)} alt={alt} fill className="object-cover" unoptimized />
      </div>
    </div>
  )
}

/* ── Lightbox ────────────────────────────────────────────── */
export function Lightbox({ url, name, onClose }: { url: string; name?: string | null; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        <Image
          src={url}
          alt={name || 'image'}
          width={1200}
          height={900}
          className="max-w-full max-h-[80vh] rounded-xl object-contain"
          style={{ maxHeight: '80vh', width: 'auto' }}
          unoptimized
        />
      </div>
      <div className="flex items-center gap-3 mt-4">
        <a
          href={url}
          download={name || 'image'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Télécharger
        </a>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/15 transition text-sm text-white/60"
        >
          Fermer
        </button>
      </div>
    </div>
  )
}

/* ── Pièce jointe dans bulle ────────────────────────────── */
export function AttachmentBubble({ msg, onImageClick }: {
  msg: Message
  onImageClick: (url: string, name?: string | null) => void
}) {
  if (!msg.attachmentUrl) return null
  const url = toAbs(msg.attachmentUrl)

  if (msg.attachmentType === 'IMAGE') {
    return (
      <button
        onClick={() => onImageClick(url, msg.attachmentName)}
        className="block mt-1 relative group rounded-xl overflow-hidden"
      >
        <div className="relative w-52 h-40">
          <Image src={url} alt={msg.attachmentName || 'image'} fill className="object-cover" unoptimized />
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition" />
        </div>
      </button>
    )
  }
  if (msg.attachmentType === 'VIDEO') {
    return (
      <video
        src={url}
        controls
        preload="metadata"
        playsInline
        onLoadedMetadata={(e) => { e.currentTarget.currentTime = 0.1 }}
        className="mt-1 w-52 rounded-xl bg-black max-w-full"
      />
    )
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 hover:bg-white/10 transition max-w-xs">
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-white/60" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate text-white">{msg.attachmentName || 'Document'}</p>
        <p className="text-xs text-white/40">Télécharger</p>
      </div>
    </a>
  )
}
