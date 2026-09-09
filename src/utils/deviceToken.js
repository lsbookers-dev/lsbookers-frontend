const STORAGE_KEY = 'lsb_device_token'
const DEVICE_TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidDeviceToken(value) {
  return typeof value === 'string' && DEVICE_TOKEN_RE.test(value)
}

function getOrCreateDeviceToken() {
  if (typeof window === 'undefined') return null

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (isValidDeviceToken(existing)) return existing

    if (typeof window.crypto?.randomUUID !== 'function') return null
    const created = window.crypto.randomUUID()
    window.localStorage.setItem(STORAGE_KEY, created)
    return window.localStorage.getItem(STORAGE_KEY) === created ? created : null
  } catch {
    // Le cookie httpOnly posé par le backend reste le fallback Safari/PWA.
    return null
  }
}

function persistDeviceToken(value) {
  if (typeof window === 'undefined' || !isValidDeviceToken(value)) return false
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
    return window.localStorage.getItem(STORAGE_KEY) === value
  } catch {
    return false
  }
}

module.exports = {
  STORAGE_KEY,
  isValidDeviceToken,
  getOrCreateDeviceToken,
  persistDeviceToken,
}
