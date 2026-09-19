export type PublicSettings = {
  landingBgUrl: string
  loginBgUrl: string
  registerBgUrl: string
  landingLogoUrl: string
  headerLogoUrl: string
}

const R2_BASE = 'https://pub-28115fb1c7084199a44966ca2924104c.r2.dev/lsbookers/media'

export const FALLBACK_PUBLIC_SETTINGS: PublicSettings = {
  landingBgUrl: `${R2_BASE}/1789763713078-Fond_Landing_1.png`,
  loginBgUrl: `${R2_BASE}/1789764013636-Fond_Login.png`,
  registerBgUrl: `${R2_BASE}/1789764020199-Fond_Register.png`,
  landingLogoUrl: `${R2_BASE}/1789816508313-logo.jpg`,
  headerLogoUrl: `${R2_BASE}/1789430276585-logo.jpg`,
}

export const PUBLIC_IMAGE_BLUR =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 10%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 x2=%221%22%3E%3Cstop stop-color=%22%230c0a14%22/%3E%3Cstop offset=%22.55%22 stop-color=%22%2322163c%22/%3E%3Cstop offset=%221%22 stop-color=%22%230c0a14%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill=%22url(%23g)%22 d=%22M0 0h16v10H0z%22/%3E%3C/svg%3E'
