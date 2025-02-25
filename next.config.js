/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@tremor/react'],
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
  }
};

module.exports = nextConfig; 