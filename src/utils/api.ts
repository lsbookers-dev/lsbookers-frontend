const configuredApi = process.env.NEXT_PUBLIC_API_URL ||
  'https://lsbookers-backend-production.up.railway.app'

export const API_BASE = configuredApi
  .replace(/\/+$/, '')
  .replace(/\/api$/, '')

export function apiUrl(path: string) {
  return `${API_BASE}/api/${path.replace(/^\/+/, '')}`
}
