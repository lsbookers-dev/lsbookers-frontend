// Tests des parcours clés dans un vrai navigateur (audit du 18/11/2026).
// Lancement : npm run test:e2e — tout tourne sur l'ordinateur (base lsb_e2e, faux stockage, e-mails coupés).
import { defineConfig, devices } from '@playwright/test'
import path from 'path'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { BACKEND, API_PORT, SITE_PORT, R2_PORT, BACKEND_ENV } = require('./e2e/env.cjs')

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/resultats',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  workers: 1, // les parcours partagent la même base
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${SITE_PORT}`,
    locale: 'fr-FR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'ordinateur', use: { ...devices['Desktop Chrome'] } },
    { name: 'telephone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: `node ${path.join(BACKEND, 'scripts/fake-r2.js')}`,
      port: R2_PORT,
      env: { ORIGIN: `http://localhost:${SITE_PORT}`, PORT: String(R2_PORT) },
      reuseExistingServer: false,
    },
    {
      // Lancé depuis le dossier e2e (sans fichier .env) : aucune variable de production n'est lue ;
      // la base lsb_e2e est recréée juste avant (e2e/start-backend.cjs)
      command: `node ${path.join(__dirname, 'e2e/start-backend.cjs')}`,
      cwd: path.join(__dirname, 'e2e'),
      url: `http://localhost:${API_PORT}/api/health`,
      env: BACKEND_ENV,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      // Version « production » du site, construite à part (.next-e2e) avec l'adresse du serveur de test
      command: `npx next build && npx next start -p ${SITE_PORT}`,
      url: `http://localhost:${SITE_PORT}/login`,
      env: { NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}`, NEXT_DIST_DIR: '.next-e2e', LSB_E2E: '1', NEXT_TELEMETRY_DISABLED: '1' },
      reuseExistingServer: false,
      timeout: 400_000,
    },
  ],
})
