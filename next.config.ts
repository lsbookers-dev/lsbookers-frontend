/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
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
    ],
  },
  // Facultatif : active les strictes routes middleware (utile si tu as des routes protégées)
  experimental: {
    serverActions: true,
  },
}

export default nextConfig;