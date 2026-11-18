import { expect, type Page } from '@playwright/test'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ACCOUNTS, PASSWORD } = require('./env.cjs')

export type Who = 'artist' | 'organizer' | 'organizer_telephone'

/** Organisateur de test propre à la taille d'écran (ordinateur / téléphone) */
export const organizerFor = (project: string): Who => (project === 'telephone' ? 'organizer_telephone' : 'organizer')
export const account = (who: Who) => ACCOUNTS[who] as { email: string; pseudo: string; role: string }

/** Connexion par le formulaire du site, jusqu'à l'accueil des membres */
export async function login(page: Page, who: Who) {
  await page.goto('/login')
  await page.getByPlaceholder('nom@domaine.com').fill(account(who).email)
  await page.getByPlaceholder('••••••••').fill(PASSWORD)
  await page.getByRole('button', { name: /Se connecter/ }).click()
  await expect(page).toHaveURL(/\/home/)
}

/** Image PNG unie (largeur × hauteur), fabriquée sans fichier */
export function pngImage(width = 400, height = 500): Buffer {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const zlib = require('zlib') as typeof import('zlib')
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
  const crc = (buf: Buffer) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const body = Buffer.concat([Buffer.from(type), data])
    const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body))
    return Buffer.concat([len, body, sum])
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4)
  header[8] = 8; header[9] = 2 // 8 bits, couleurs RVB
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3, 0)])
  for (let x = 0; x < width; x++) row.set([124, 58, 237], 1 + x * 3) // violet LS Bookers
  const pixels = zlib.deflateSync(Buffer.concat(Array.from({ length: height }, () => row)))
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', header), chunk('IDAT', pixels), chunk('IEND', Buffer.alloc(0))])
}
