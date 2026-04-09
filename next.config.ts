import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mc-heads.net',
        port: '',
        pathname: '/avatar/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  serverExternalPackages: ["discord.js"],
  webpack: (config) => {

    // Also try aliasing to prevent resolution attempts if externals isn't enough
    config.externals.push({
      "zlib-sync": "commonjs zlib-sync",
      "bufferutil": "commonjs bufferutil",
      "utf-8-validate": "commonjs utf-8-validate",
    });
    // Alias to false to ensure resolution doesn't fail
    config.resolve.alias = {
      ...config.resolve.alias,
      "zlib-sync": false,
      "bufferutil": false,
      "utf-8-validate": false,
    };
    return config;
  },
};

export default nextConfig;
