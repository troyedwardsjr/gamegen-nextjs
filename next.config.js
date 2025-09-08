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
  // Static export configuration for Tauri desktop builds
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Disable server-side features for static export
  experimental: {
    esmExternals: true,
  },
  // Configure asset prefix for production builds
  assetPrefix: process.env.NODE_ENV === 'production' && process.env.TAURI_BUILD ? './' : '',
  // Base path configuration for different deployment contexts
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
};

export default nextConfig;
