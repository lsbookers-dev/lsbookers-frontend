/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
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