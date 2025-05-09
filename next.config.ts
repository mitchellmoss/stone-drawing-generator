import { NextConfig } from 'next'

/**
 * Next.js configuration
 * 
 * Note: This project requires Node.js 18.17.0 or later
 */
const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Specify Node.js version requirement
  experimental: {
    serverMinNodeVersion: '18.17.0',
  },
}

export default nextConfig