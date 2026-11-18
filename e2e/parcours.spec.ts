// Parcours clés du site, joués dans un vrai navigateur (audit du 18/11/2026)
import { test, expect } from '@playwright/test'
import { login, pngImage, organizerFor, account } from './helpers'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { R2_PORT } = require('./env.cjs')

test('connexion : un mauvais mot de passe est refusé, le bon ouvre l’accueil', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('nom@domaine.com').fill('orga@e2e.local')
  await page.getByPlaceholder('••••••••').fill('mauvais-mot-de-passe')
  await page.getByRole('button', { name: /Se connecter/ }).click()
  await expect(page.getByText(/incorrect/i)).toBeVisible()
  await login(page, 'organizer')
})

test('recherche → profil → message → booking proposé par l’organisateur et accepté par l’artiste', async ({ browser }, testInfo) => {
  const tag = testInfo.project.name // textes uniques : ordinateur et téléphone partagent la même base
  const orgaWho = organizerFor(tag)
  const orgaName = account(orgaWho).pseudo
  const orgaCtx = await browser.newContext()
  const artistCtx = await browser.newContext()
  const orga = await orgaCtx.newPage()
  const artist = await artistCtx.newPage()

  // L'organisateur trouve l'artiste dans la recherche et ouvre son profil
  await login(orga, orgaWho)
  await orga.goto('/search')
  await orga.getByText('DJ Orbite').first().click()
  await expect(orga).toHaveURL(/\/artist\/\d+/)

  // Il lui écrit
  await orga.getByRole('link', { name: 'Contacter' }).click()
  await expect(orga).toHaveURL(/\/messages/)
  const composer = orga.getByPlaceholder('Écrire un message…')
  await composer.fill(`Bonjour, êtes-vous libre pour notre soirée ? (${tag})`)
  await composer.press('Enter')
  await expect(orga.getByText(`Bonjour, êtes-vous libre pour notre soirée ? (${tag})`)).toBeVisible()

  // Puis propose un booking dans la conversation
  await orga.getByTitle('Proposer un booking').click()
  const date = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  await orga.locator('input[type="date"]').first().fill(date)
  await orga.getByPlaceholder('Ex : 500').fill('450')
  await orga.getByRole('button', { name: 'Envoyer la proposition' }).click()
  await expect(orga.getByText('En attente de la réponse du destinataire')).toBeVisible()

  // L'artiste reçoit le message et la proposition, et accepte
  await login(artist, 'artist')
  await artist.goto('/messages')
  await artist.getByText(orgaName).first().click()
  await expect(artist.getByText(`Bonjour, êtes-vous libre pour notre soirée ? (${tag})`)).toBeVisible()
  await artist.getByRole('button', { name: 'Accepter' }).click()
  await expect(artist.getByText('Accepté', { exact: true }).last()).toBeVisible()

  // L'organisateur voit le booking confirmé
  await orga.reload()
  await expect(orga.getByText('Accepté', { exact: true }).last()).toBeVisible()
  await expect(orga.getByText('En attente de la réponse du destinataire')).toHaveCount(0)

  await orgaCtx.close()
  await artistCtx.close()
})

test('publication avec photo : envoyée directement au stockage, vérifiée, puis visible dans le fil', async ({ page }, testInfo) => {
  await login(page, 'artist')
  await page.getByRole('button', { name: 'Publier', exact: true }).first().click()
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'affiche.png', mimeType: 'image/png', buffer: pngImage() })
  await page.getByRole('button', { name: 'Confirmer' }).click()
  await page.locator('#publication-title').fill(`Set au Club Nébuleuse samedi (${testInfo.project.name})`)
  await page.locator('#publication-caption').fill('Merci pour cette soirée !')
  const dialog = page.getByRole('dialog').filter({ has: page.locator('#publication-title') })
  await dialog.getByRole('button', { name: 'Publier', exact: true }).click()
  await expect(page.locator('#publication-title')).toHaveCount(0)
  await page.reload()
  await expect(page.getByText(`Set au Club Nébuleuse samedi (${testInfo.project.name})`).first()).toBeVisible()

  // Le fichier est passé par l'adresse signée (envoi direct du navigateur), pas par le serveur
  const log = await (await fetch(`http://localhost:${R2_PORT}/__log`)).json() as { log: string[] }
  assert(log.log.some(l => l.startsWith('PUT') && l.includes('/lsbookers/media/') && l.includes('via adresse signée')), `envoi direct attendu : ${log.log.join(' | ')}`)
})

test('offre : l’organisateur publie, l’artiste postule, la candidature arrive dans la messagerie', async ({ browser }, testInfo) => {
  const tag = testInfo.project.name // textes uniques : ordinateur et téléphone partagent la même base
  const orgaWho = organizerFor(tag)
  const orgaName = account(orgaWho).pseudo
  const orgaCtx = await browser.newContext()
  const artistCtx = await browser.newContext()
  const orga = await orgaCtx.newPage()
  const artist = await artistCtx.newPage()

  await login(orga, orgaWho)
  await orga.goto('/offers')
  await orga.getByRole('button', { name: /Publier une offre/ }).first().click()
  await orga.getByPlaceholder('DJ pour soirée d\'entreprise').fill(`DJ house pour la réouverture (${tag})`)
  await orga.getByPlaceholder('Ambiance, durée du set, matériel fourni…').fill('Set de 3 heures, platines fournies, public de 300 personnes.')
  await orga.getByRole('button', { name: 'Artiste', exact: true }).click()
  await orga.getByRole('button', { name: 'Choisir une spécialité' }).click()
  await orga.getByPlaceholder('Rechercher (DJ, photographe…)').fill('DJ')
  await orga.getByRole('option', { name: 'DJ', exact: true }).click()
  const date = new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  await orga.locator('[role="dialog"] input[type="date"], form input[type="date"]').first().fill(date)
  await orga.getByPlaceholder('Lyon').fill('Marseille')
  await orga.getByPlaceholder('France').fill('France')
  await orga.getByPlaceholder('400').fill('600')
  await orga.getByRole('button', { name: 'Publier l’offre' }).click()
  await expect(orga.getByRole('button', { name: 'Publier l’offre' })).toHaveCount(0) // fenêtre fermée : offre publiée
  await expect(orga.getByText(`DJ house pour la réouverture (${tag})`).first()).toBeVisible()

  // L'artiste voit l'offre et postule : il arrive dans la conversation avec l'organisateur
  await login(artist, 'artist')
  await artist.goto('/offers')
  const card = artist.locator('article, div').filter({ hasText: `DJ house pour la réouverture (${tag})` }).filter({ has: artist.getByRole('button', { name: 'Postuler' }) }).last()
  await card.getByRole('button', { name: 'Postuler' }).click()
  await expect(artist).toHaveURL(/\/messages/)
  await expect(artist.getByText('Votre candidature')).toBeVisible()

  // L'organisateur reçoit la candidature et peut proposer un booking depuis elle
  await orga.goto('/messages')
  await orga.getByText('DJ Orbite').first().click()
  await expect(orga.getByText('Candidature à votre offre')).toBeVisible()
  await expect(orga.getByRole('button').filter({ hasText: 'Proposer un booking' })).toBeVisible()

  await orgaCtx.close()
  await artistCtx.close()
})

function assert(ok: boolean, message: string) { if (!ok) throw new Error(message) }
