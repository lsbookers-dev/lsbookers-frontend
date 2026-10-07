import type { MetadataRoute } from 'next'

const SITE_URL = 'https://lsbookers.com'

// Seules les pages publiques (sans compte) sont listées pour Google
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/register`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/login`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'yearly', priority: 0.4 },
  ]
}
