/**
 * socket.ts — Singleton Socket.io client
 * Un seul socket partagé dans toute l'application.
 * Se reconnecte automatiquement avec le token JWT de l'utilisateur.
 */

import { io, Socket } from 'socket.io-client'

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001').replace(/\/$/, '')

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
  socket = io(BACKEND_URL, {
    auth: { token },
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
