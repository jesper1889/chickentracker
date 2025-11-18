import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

  // Optimize images for production
  images: {
    unoptimized: process.env.NODE_ENV === 'production',
  },

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@prisma/client'],
  },
};

export default nextConfig;
