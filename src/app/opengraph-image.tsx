import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

// Image d'aperçu affichée quand un lien lsbookers.com est partagé (WhatsApp, réseaux sociaux…)
export const alt = 'LS Bookers — La plateforme événementielle'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), 'public/icons/icon-512.png'))
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '0 80px',
          gap: 64,
          background: 'linear-gradient(120deg, #0a0614 0%, #1a0b3d 55%, #5b21b6 100%)',
          color: 'white',
        }}
      >
        <img src={logoSrc} width={400} height={400} alt="" style={{ borderRadius: 32 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>La plateforme événementielle</div>
          <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.75)', lineHeight: 1.35 }}>
            Artistes, organisateurs et prestataires réunis au même endroit.
          </div>
          <div style={{ fontSize: 26, color: '#c4b5fd' }}>lsbookers.com</div>
        </div>
      </div>
    ),
    size,
  )
}
