import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set explicit turbopack root to silence lockfile warning
  experimental: {
    turbo: {
      root: __dirname,
    },
  } as NextConfig["experimental"] & Record<string, unknown>,
  // Allow CORS for CTO Command Center preview iframe
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-Requested-With, Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
