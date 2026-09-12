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
 * Retourne le socket existant s'il est connecté avec le bon token,
 * sinon crée un nouveau socket (déconnecte l'ancien si besoin).
 */
export function getSocket(token: string): Socket {
  if (socket && currentToken === token && socket.connected) {
    return socket
  }

  // Déconnecter l'ancien socket si le token a changé ou si déconnecté
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
