/** 9999 km = « National » (choix proposé dans les Paramètres du profil). */
export const NATIONAL_RADIUS_KM = 9999

export function radiusLabel(km?: number | null) {
  if (!km) return ''
  return km >= NATIONAL_RADIUS_KM ? 'Rayon national' : `Rayon ${km} km`
}
