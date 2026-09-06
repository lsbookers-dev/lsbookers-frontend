export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('token')
    } catch {
      return null
    }
  }
  return null
}

export function getUserId(): number | null {
  if (typeof window !== 'undefined') {
    let token: string | null = null
    try {
      token = localStorage.getItem('token')
    } catch {
      return null
    }
    if (!token) return null

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.id
    } catch (error) {
      console.error('Erreur lors du décodage du token :', error)
      return null
    }
  }
  return null
}
