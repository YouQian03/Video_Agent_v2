/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/assets/**',
      },
      {
        protocol: 'https',
        hostname: 'g3videoagent-production.up.railway.app',
        pathname: '/assets/**',
      },
    ],
  },
}

export default nextConfig
