export type PublicSettings = {
  landingBgUrl: string
  loginBgUrl: string
  registerBgUrl: string
  landingLogoUrl: string
  headerLogoUrl: string
}

// Valeurs par défaut vides — les images viennent TOUJOURS de l'API (R2).
// Des URLs hardcodées ici risquent de pointer vers des fichiers supprimés.
export const FALLBACK_PUBLIC_SETTINGS: PublicSettings = {
  landingBgUrl: '',
  loginBgUrl: '',
  registerBgUrl: '',
  landingLogoUrl: '',
  headerLogoUrl: '',
}

export const PUBLIC_IMAGE_BLUR =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 10%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 x2=%221%22%3E%3Cstop stop-color=%22%230c0a14%22/%3E%3Cstop offset=%22.55%22 stop-color=%22%2322163c%22/%3E%3Cstop offset=%221%22 stop-color=%22%230c0a14%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill=%22url(%23g)%22 d=%22M0 0h16v10H0z%22/%3E%3C/svg%3E'
