/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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

      // ✅ Cloudinary (bannières/avatars/publications uploadées)
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: true,
  },
}

export default nextConfig