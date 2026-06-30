'use client'

import { useRef, useState, useEffect } from 'react'
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react'

interface Props {
  src: string
  aspectRatio: number   // largeur / hauteur  (1 = carré, 3 = bannière)
  displayWidth?: number // largeur de la zone de preview
  shape?: 'circle' | 'rect'
  maxZoom?: number      // zoom maximum (défaut 3)
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

export default function CropModal({
  src,
  aspectRatio,
  displayWidth = 320,
  shape = 'rect',
  maxZoom = 3,
  onConfirm,
  onCancel,
}: Props) {
  const CW = displayWidth
  const CH = Math.round(CW / aspectRatio)

  const [zoom, setZoom]   = useState(1)
  const [tx, setTx]       = useState(0)
  const [ty, setTy]       = useState(0)
  const [natW, setNatW]   = useState(0)
  const [natH, setNatH]   = useState(0)
  const [dragging, setDragging] = useState(false)

  const drag = useRef({ sx: 0, sy: 0, stx: 0, sty: 0 })

  // Échelle de base : l'image couvre exactement la zone de crop
  const base = natW && natH ? Math.max(CW / natW, CH / natH) : 1

  function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v))
  }

  function clampOffset(x: number, y: number, z: number) {
    const mx = Math.max(0, (natW * base * z - CW) / 2)
    const my = Math.max(0, (natH * base * z - CH) / 2)
    return { x: clamp(x, -mx, mx), y: clamp(y, -my, my) }
  }

  // Listeners drag — ré-enregistrés si dragging/zoom/natW/natH changent
  useEffect(() => {
    if (!dragging) return

    const move = (clientX: number, clientY: number) => {
      const { x, y } = clampOffset(
        drag.current.stx + clientX - drag.current.sx,
        drag.current.sty + clientY - drag.current.sy,
        zoom,
      )
      setTx(x)
      setTy(y)
    }

    const onMouse = (e: MouseEvent) => move(e.clientX, e.clientY)
    const onTouch = (e: TouchEvent) => {
      e.preventDefault()
      move(e.touches[0].clientX, e.touches[0].clientY)
    }
    const onUp = () => setDragging(false)

    window.addEventListener('mousemove', onMouse)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onTouch, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchend', onUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, zoom, natW, natH, base])

  const changeZoom = (z: number) => {
    z = clamp(z, 1, maxZoom)
    const { x, y } = clampOffset(tx, ty, z)
    setZoom(z)
    setTx(x)
    setTy(y)
  }

  const handleConfirm = () => {
    if (!natW || !natH) return
    const displayScale = base * zoom
    const centerX = natW / 2 - tx / displayScale
    const centerY = natH / 2 - ty / displayScale
    const srcW = CW / displayScale
    const srcH = CH / displayScale
    const srcX = centerX - srcW / 2
    const srcY = centerY - srcH / 2

    // Résolution de sortie : 400×400 pour avatar, 1200×400 pour bannière
    const outW = aspectRatio >= 2 ? 1200 : 400
    const outH = Math.round(outW / aspectRatio)

    const canvas = document.createElement('canvas')
    canvas.width  = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')!

    const img = new Image()
    img.src = src
    img.onload = () => {
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH)
      canvas.toBlob(blob => { if (blob) onConfirm(blob) }, 'image/jpeg', 0.92)
    }
  }

  const startDrag = (clientX: number, clientY: number) => {
    setDragging(true)
    drag.current = { sx: clientX, sy: clientY, stx: tx, sty: ty }
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    changeZoom(zoom - e.deltaY * 0.001)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#111118] border border-white/10 rounded-2xl w-full max-w-[440px] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">Recadrer l&apos;image</h3>
          <button onClick={onCancel} className="text-white/40 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Zone de crop */}
        <div className="flex justify-center py-5 px-5">
          <div
            style={{
              width: CW,
              height: CH,
              borderRadius: shape === 'circle' ? '50%' : '10px',
              overflow: 'hidden',
              position: 'relative',
              border: '2px solid rgba(16,185,129,0.55)',
              cursor: dragging ? 'grabbing' : 'grab',
              flexShrink: 0,
              touchAction: 'none',
            }}
            onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY) }}
            onTouchStart={e => { startDrag(e.touches[0].clientX, e.touches[0].clientY) }}
            onWheel={handleWheel}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                width:  natW * base * zoom,
                height: natH * base * zoom,
                maxWidth: 'none',
                maxHeight: 'none',
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
              onLoad={e => {
                setNatW(e.currentTarget.naturalWidth)
                setNatH(e.currentTarget.naturalHeight)
              }}
            />
          </div>
        </div>

        {/* Zoom */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => changeZoom(zoom - 0.1)}
              className="text-white/40 hover:text-white transition p-1"
            >
              <ZoomOut size={16} />
            </button>
            <input
              type="range" min={100} max={Math.round(maxZoom * 100)} step={5}
              value={Math.round(zoom * 100)}
              onChange={e => changeZoom(Number(e.target.value) / 100)}
              className="flex-1 accent-emerald-500"
            />
            <button
              onClick={() => changeZoom(zoom + 0.1)}
              className="text-white/40 hover:text-white transition p-1"
            >
              <ZoomIn size={16} />
            </button>
          </div>
          <p className="text-xs text-white/30 text-center mt-2">
            Glisse pour repositionner · Zoom {Math.round(zoom * 100)}&nbsp;%
          </p>
        </div>

        {/* Boutons */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!natW}
            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 px-4 py-2.5 text-sm font-semibold text-white transition flex items-center justify-center gap-1.5"
          >
            <Check size={15} /> Confirmer
          </button>
        </div>

      </div>
    </div>
  )
}
