import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize development server
  experimental: {
    optimizePackageImports: ['@privy-io/react-auth', '@privy-io/wagmi', 'wagmi', 'viem'],
  },
  
  images: {
    // Enable image optimization for better performance
    formats: ['image/webp', 'image/avif'],
    // Allow images from external domains if needed
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // Ignore React Native dependencies that aren't needed in the browser
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    };

    // Optimize chunk loading in development
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
