import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.gravatar.com',
      }
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Use localhost:5000 for local development (matches npm start in backend)
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
