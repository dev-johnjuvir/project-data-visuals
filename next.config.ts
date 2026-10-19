import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // A stray package-lock.json in the home folder confuses root detection.
  turbopack: { root: __dirname },
  images: {
    // PokeAPI sprites are served from GitHub's raw content host.
    remotePatterns: [
      { protocol: 'https', hostname: 'raw.githubusercontent.com', pathname: '/PokeAPI/sprites/**' },
    ],
  },
};

export default nextConfig;
