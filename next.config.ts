import type { NextConfig } from "next";

/**
 * Next.js configuration object.
 * Customizes webpack bundling to handle blockchain and React Native dependencies.
 *
 * @type {NextConfig}
 * @property {Function} webpack - Custom webpack configuration function
 *
 * Webpack customizations:
 * - Externalizes server-side only packages (pino-pretty, lokijs, encoding)
 * - Aliases React Native dependencies to false to prevent browser bundling issues
 * - Ensures compatibility with Web3 libraries and Farcaster SDK
 */
const nextConfig: NextConfig = {
  webpack: (config) => {
    // Externalize packages that should not be bundled for the browser
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // Ignore React Native dependencies that aren't needed in the browser
    // This prevents bundling errors when using libraries that have RN dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    };

    return config;
  },
};

export default nextConfig;
