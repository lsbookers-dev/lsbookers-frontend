// Environnement des tests en navigateur (parcours clés) : tout tourne sur l'ordinateur, jamais en production.
const path = require('path')

const BACKEND = path.resolve(__dirname, '../../backend')
const DB_URL = 'postgresql://antho@localhost:5432/lsb_e2e' // base dédiée, recréée à chaque lancement
const API_PORT = 5055
const SITE_PORT = 3001 // autorisé par le serveur (CORS) comme 3000
const R2_PORT = 9000 // adresse autorisée par la politique de sécurité du site en local

// Comptes créés pour les tests (mot de passe de test, base locale uniquement)
const PASSWORD = 'E2eLocal-2026!'
const ACCOUNTS = {
  artist: { email: 'artiste@e2e.local', pseudo: 'DJ Orbite', role: 'ARTIST', firstName: 'Lina', lastName: 'Orbite' },
  // Un organisateur par taille d'écran : le compte gratuit ne publie qu'une offre à la fois
  organizer: { email: 'orga@e2e.local', pseudo: 'Club Nébuleuse', role: 'ORGANIZER', firstName: 'Marc', lastName: 'Nébuleuse' },
  organizer_telephone: { email: 'orga-tel@e2e.local', pseudo: 'Club Comète', role: 'ORGANIZER', firstName: 'Inès', lastName: 'Comète' },
}

// Variables du serveur local : e-mails coupés, faux stockage, pas de tâches automatiques
const BACKEND_ENV = {
  DATABASE_URL: DB_URL,
  JWT_SECRET: 'e2e-local-secret-only',
  PORT: String(API_PORT),
  NODE_ENV: 'test',
  LSB_DISABLE_EMAILS: '1',
  RESEND_API_KEY: 're_e2e_disabled',
  APP_URL: `http://localhost:${SITE_PORT}`,
  R2_ENDPOINT: `http://localhost:${R2_PORT}`,
  R2_ACCOUNT_ID: 'local',
  R2_ACCESS_KEY_ID: 'local',
  R2_SECRET_ACCESS_KEY: 'local-secret',
  R2_BUCKET_NAME: 'essai',
  R2_PUBLIC_URL: `http://localhost:${R2_PORT}/essai`,
  SENTRY_DSN: '',
  STRIPE_SECRET_KEY: '',
}

/** Refuse toute base qui ne serait pas sur cet ordinateur */
function assertLocal(url) {
  const host = new URL(url).hostname
  if (!['localhost', '127.0.0.1'].includes(host)) throw new Error(`Tests en navigateur : base ${host} refusée (locale uniquement)`)
}

module.exports = { BACKEND, DB_URL, API_PORT, SITE_PORT, R2_PORT, PASSWORD, ACCOUNTS, BACKEND_ENV, assertLocal }
