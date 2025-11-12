/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  experimental: {
    // Enable server components
    serverComponents: true,
    // Enable new Next.js features
    newNextLinkBehavior: true,
  },
  // Add base path if your app is not served from the root
  // basePath: '/frontend',
  // Add asset prefix if needed
  // assetPrefix: '/frontend',
  // Enable static export if needed
  // output: 'export',
  // Add any other Next.js config options here
}

module.exports = nextConfig
