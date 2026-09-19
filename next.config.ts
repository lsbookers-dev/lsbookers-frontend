/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      // Médias servis par ton backend (local & prod)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'api.lsbookers.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'lsbookers.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'lsbookers-backend-production.up.railway.app',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },

      // ✅ Cloudflare R2 (tous les médias — avatars, bannières, publications, messages, logos)
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        pathname: '/**',
      },
    ],
  },
  // ✅ ESLint ignoré pendant le build (warnings <img> non bloquants)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ✅ Next 15 attend un objet vide ici, pas un booléen
  experimental: {
    serverActions: {},
  },
}

export default nextConfig
