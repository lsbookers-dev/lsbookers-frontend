/**
 * Envoi des fichiers directement du navigateur vers le stockage Cloudflare R2 (#275).
 *
 * Le serveur donne une autorisation d'envoi pour ce fichier précis, le navigateur l'envoie lui-même
 * à R2 (avec la progression en %), puis le serveur vérifie le fichier déposé.
 * Secours automatique : si l'envoi direct est impossible (règle CORS de R2 absente, ancien serveur,
 * coupure), le fichier part à l'ancienne, par le serveur — rien ne casse.
 */
import { apiFetch } from '@/utils/auth'
import { API_BASE } from '@/utils/api'

export type UploadPurpose = 'general' | 'message' | 'booking-logistics' | 'booking-media' | 'booking-contract'
export type UploadProgress = (percent: number) => void

type Presigned = { uploadUrl: string; key: string; headers: Record<string, string> }

// Envoi direct indisponible dans cet onglet (ex. règle CORS absente) : on ne réessaie plus
const DIRECT_OFF_KEY = 'lsb-direct-upload-off'

function directOff() {
  try { return sessionStorage.getItem(DIRECT_OFF_KEY) === '1' } catch { return false }
}
function turnDirectOff() {
  try { sessionStorage.setItem(DIRECT_OFF_KEY, '1') } catch { /* stockage indisponible */ }
}

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** Envoi du fichier à R2 avec l'adresse signée ; vrai si R2 l'a accepté */
function putToStorage(file: Blob, presigned: Presigned, onProgress?: UploadProgress): Promise<boolean> {
  return new Promise(resolve => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', presigned.uploadUrl)
    Object.entries(presigned.headers).forEach(([name, value]) => xhr.setRequestHeader(name, value))
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300)
    // Statut 0 : bloqué par le navigateur (règle CORS) ou réseau coupé
    xhr.onerror = () => { turnDirectOff(); resolve(false) }
    xhr.send(file)
  })
}

/**
 * Dépose le fichier sur R2. Renvoie :
 * - { key } : fichier déposé, à confirmer par le serveur ;
 * - { refused } : le serveur refuse ce fichier (format, taille) — inutile de réessayer à l'ancienne ;
 * - null : envoi direct impossible → passer par l'ancienne méthode.
 */
async function sendDirect(
  file: File | Blob,
  { purpose, folder, name, onProgress }: { purpose: UploadPurpose; folder?: string; name?: string; onProgress?: UploadProgress },
): Promise<{ key: string } | { refused: Response } | null> {
  if (directOff()) return null
  let res: Response
  try {
    res = await apiFetch(`${API_BASE}/api/upload/presign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purpose, folder, contentType: file.type, size: file.size, name: name ?? (file as File).name }),
    })
  } catch { return null }
  if (res.status === 400 || res.status === 413 || res.status === 429) return { refused: res }
  if (!res.ok) return null // ancien serveur (404) ou souci passager : secours
  const presigned: Presigned = await res.json()
  const stored = await putToStorage(file, presigned, onProgress)
  return stored ? { key: presigned.key } : null
}

/**
 * Envoi général (publications, albums, photo de profil, bannière, documents) :
 * renvoie la même réponse que l'ancien POST /api/upload → { url, pathname, contentType, size }.
 */
export async function uploadToStorage(
  file: File | Blob,
  { folder, name, onProgress }: { folder: string; name?: string; onProgress?: UploadProgress },
): Promise<Response> {
  const direct = await sendDirect(file, { purpose: 'general', folder, name, onProgress })
  if (direct && 'refused' in direct) return direct.refused
  if (direct) {
    const confirmed = await apiFetch(`${API_BASE}/api/upload/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: direct.key }),
    }).catch(() => jsonResponse(500, { error: 'SERVER_ERROR' }))
    if (confirmed.ok || confirmed.status === 400) return confirmed
  }
  // Ancienne méthode : le fichier passe par le serveur
  const form = new FormData()
  form.append('folder', folder) // avant le fichier : lu par le serveur pour autoriser les PDF
  form.append('file', file, name ?? (file as File).name)
  const res = await apiFetch(`${API_BASE}/api/upload`, { method: 'POST', body: form })
  onProgress?.(100)
  return res
}

/**
 * Requête d'une route qui reçoit un fichier avec d'autres champs (message, booking) :
 * le fichier est déposé sur R2 puis seule sa clé est envoyée (JSON) ; sinon, ancienne méthode (FormData).
 * Renvoie les options à passer à apiFetch, ou la réponse de refus si le fichier est refusé d'emblée.
 */
export async function fileRequest(
  file: File,
  purpose: UploadPurpose,
  fields: Record<string, string | number | null | undefined>,
  onProgress?: UploadProgress,
): Promise<RequestInit | Response> {
  const direct = await sendDirect(file, { purpose, onProgress })
  if (direct && 'refused' in direct) return direct.refused
  if (direct) {
    return {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...fields, fileKey: direct.key, fileName: file.name }),
    }
  }
  const form = new FormData()
  Object.entries(fields).forEach(([k, v]) => { if (v !== null && v !== undefined) form.append(k, String(v)) })
  form.append('file', file)
  return { method: 'POST', body: form }
}
