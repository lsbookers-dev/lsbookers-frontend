/**
 * socket.ts — Singleton Socket.io client
 * Un seul socket partagé dans toute l'application.
 * Se reconnecte automatiquement avec le token JWT de l'utilisateur.
 */

import { io, Socket } from 'socket.io-client'
import { API_BASE } from '@/utils/api'
import { isCookieSessionMode, COOKIE_SESSION_MARKER } from '@/utils/auth'

// API_BASE (sans « /api » final) : sinon socket.io croirait à un « namespace » /api
const BACKEND_URL = API_BASE

let socket: Socket | null = null
let currentToken: string | null = null

/**
 * Retourne le socket existant s'il est connecté (ou en cours de connexion) avec le bon token.
 * Évite la race condition où Header + messages/page.tsx créent deux sockets simultanément.
 */
export function getSocket(token: string): Socket {
  // socket.active = true si connecté OU en cours de connexion/reconnexion
  if (socket && currentToken === token && (socket.connected || socket.active)) {
    return socket
  }

  // Token différent ou socket définitivement fermé → recréer
  if (socket) {
    socket.disconnect()
    socket = null
  }

  currentToken = token
  // Mode cookie : le cookie httpOnly est envoyé avec la poignée de main (withCredentials),
  // aucun jeton n'est lu par le JavaScript. Mode transition : jeton explicite.
  const cookieMode = isCookieSessionMode() || token === COOKIE_SESSION_MARKER
  socket = io(BACKEND_URL, {
    ...(cookieMode ? {} : { auth: { token } }),
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  })

  return socket
}

/** Déconnecter le socket (ex: lors du logout) */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
    currentToken = null
  }
}

/** Retourne le socket courant sans en créer un nouveau */
export function getExistingSocket(): Socket | null {
  return socket
}
