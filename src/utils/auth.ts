export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

export function getUserId(): number | null {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
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