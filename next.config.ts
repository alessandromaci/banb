import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude devtools in production
  productionBrowserSourceMaps: false,

  // Optimize development server and production bundles
  experimental: {
    optimizePackageImports: [
      "@privy-io/react-auth",
      "@privy-io/wagmi",
      "wagmi",
      "viem",
      "lucide-react", // Icon library - only import used icons
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "recharts", // Chart library - tree-shake unused components
      "libphonenumber-js", // Phone number validation - tree-shake unused locales
    ],
  },

  images: {
    // Enable image optimization for better performance
    formats: ["image/webp", "image/avif"],
    // Allow images from external domains if needed
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // Ignore React Native dependencies and unused blockchain libraries
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
      // Remove Solana - we only use Base/Ethereum
      "@solana/web3.js": false,
      "@solana/wallet-adapter-base": false,
      "@solana/wallet-adapter-react": false,
    };

    // Fix webpack cache snapshot issues on Windows
    if (dev && !isServer) {
      config.cache = {
        type: "filesystem",
        buildDependencies: {
          config: [__filename],
        },
        // Reduce cache complexity to avoid snapshot errors
        compression: false,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      };
    }

    return config;
  },
};

// Only use bundle analyzer when explicitly requested (npm run build:analyze)
// This prevents warnings when using Turbopack in dev mode
export default process.env.ANALYZE === "true"
  ? require("@next/bundle-analyzer")({ enabled: true })(nextConfig)
  : nextConfig;
