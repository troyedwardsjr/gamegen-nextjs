/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow production builds to successfully complete even if there are ESLint warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to successfully complete even if there are TypeScript errors
    ignoreBuildErrors: false,
  },
  // Static export configuration only for Tauri desktop builds
  ...(process.env.TAURI_BUILD && {
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
    // Configure asset prefix for Tauri builds
    assetPrefix: './',
  }),
  // Disable server-side features for static export
  experimental: {
    esmExternals: true,
  },
  // Base path configuration for different deployment contexts
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
};

export default nextConfig;
