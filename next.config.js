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
};

export default nextConfig;
