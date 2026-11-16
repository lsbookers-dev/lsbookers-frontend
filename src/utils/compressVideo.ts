/**
 * Compression automatique des vidéos avant l'envoi (16/11/2026, Q9 d'Antho).
 *
 * Comme Instagram ou Facebook, la vidéo est réencodée en MP4 (H.264 + AAC) :
 * - côté le plus long ramené à 1920 px (Full HD) si elle est plus grande (4K → 1080p) ;
 * - débit visé ~4 Mb/s (1080p) ou ~2,5 Mb/s (720p et moins) : une vidéo de téléphone de 1 Go tombe vers 100 Mo.
 * Tout se fait dans le navigateur (WebCodecs, via la bibliothèque mediabunny) : rien n'est envoyé avant.
 * En cas d'échec ou de navigateur trop ancien, on garde la vidéo d'origine (jamais bloquant).
 */

const MAX_LONG_SIDE = 1920
/** En dessous de cette taille, la vidéo est déjà assez légère : on ne touche à rien. */
const SKIP_BELOW = 25 * 1024 * 1024

export type CompressResult = { file: File; compressed: boolean }

export async function compressVideo(file: File, onProgress?: (percent: number) => void): Promise<CompressResult> {
  if (file.size < SKIP_BELOW || typeof window === 'undefined' || typeof VideoEncoder === 'undefined') {
    return { file, compressed: false }
  }
  let input: { dispose(): void } | null = null
  try {
    const mb = await import('mediabunny')
    const src = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS })
    input = src
    const track = await src.getPrimaryVideoTrack()
    if (!track) return { file, compressed: false }
    const w = track.displayWidth, h = track.displayHeight
    const long = Math.max(w, h)
    const scale = long > MAX_LONG_SIDE ? MAX_LONG_SIDE / long : 1
    // Dimensions paires (exigé par l'encodeur H.264)
    const even = (n: number) => Math.max(2, Math.round(n / 2) * 2)
    const outW = even(w * scale), outH = even(h * scale)
    const bitrate = Math.max(outW, outH) > 1280 ? 4_000_000 : 2_500_000

    if (!(await mb.canEncodeVideo('avc', { width: outW, height: outH, bitrate }))) return { file, compressed: false }

    const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }), target: new mb.BufferTarget() })
    const conversion = await mb.Conversion.init({
      input: src,
      output,
      video: { width: outW, height: outH, fit: 'contain', codec: 'avc', quality: new mb.Quality({ bitrate }), forceTranscode: true },
      audio: { codec: 'aac', quality: new mb.Quality({ bitrate: 128_000 }) },
      showWarnings: false,
    })
    if (!conversion.isValid) return { file, compressed: false }
    conversion.onProgress = p => onProgress?.(Math.round(p * 100))
    await conversion.execute()
    const buffer = (output.target as InstanceType<typeof mb.BufferTarget>).buffer
    // On ne garde la version compressée que si elle est vraiment plus légère
    if (!buffer || buffer.byteLength >= file.size * 0.9) return { file, compressed: false }
    const name = file.name.replace(/\.[^.]+$/, '') + '.mp4'
    return { file: new File([buffer], name, { type: 'video/mp4' }), compressed: true }
  } catch (err) {
    console.warn('Compression vidéo impossible, envoi de l’original', err)
    return { file, compressed: false }
  } finally {
    try { input?.dispose() } catch { /* rien */ }
  }
}
