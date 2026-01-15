import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10gb', // Support up to 10GB files
    },
    // CRITICAL: This is the key setting to allow large file uploads through proxy/middleware
    proxyClientMaxBodySize: '10gb', // 10GB limit for proxy
  },
  // This is required for API routes to accept large files
  serverExternalPackages: ['busboy', 'formidable', 'fluent-ffmpeg', '@ffmpeg-installer/ffmpeg', '@ffprobe-installer/ffprobe'],

  // Disable static optimization for public folder to allow large files
  staticPageGenerationTimeout: 180,

  // CRITICAL: Set max body size for API routes and middleware
  // This prevents Next.js from truncating request bodies
  async headers() {
    return [
      {
        source: '/api/upload',
        headers: [
          {
            key: 'x-body-size-limit',
            value: '10737418240', // 10GB in bytes
          },
        ],
      },
      {
        source: '/api/upload-large',
        headers: [
          {
            key: 'x-body-size-limit',
            value: '10737418240', // 10GB in bytes
          },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
