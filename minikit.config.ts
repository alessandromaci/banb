/**
 * Root URL for the application.
 * Priority order:
 * 1. NEXT_PUBLIC_URL environment variable
 * 2. Vercel production URL (if deployed on Vercel)
 * 3. Local development URL (http://localhost:3000)
 *
 * @constant {string}
 */
const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/**
 * MiniApp configuration object for Farcaster integration.
 * This configuration defines the app's metadata, branding, and integration settings
 * required for publishing to the Farcaster MiniApp ecosystem.
 *
 * @constant
 * @type {Object}
 * @property {Object} accountAssociation - Account association credentials for Farcaster authentication
 * @property {string} accountAssociation.header - Base64 encoded authentication header containing FID and key
 * @property {string} accountAssociation.payload - Base64 encoded domain payload
 * @property {string} accountAssociation.signature - Cryptographic signature for verification
 * @property {Object} miniapp - MiniApp metadata and configuration
 * @property {string} miniapp.version - App version number
 * @property {string} miniapp.name - Display name of the application
 * @property {string} miniapp.subtitle - Short subtitle describing the app
 * @property {string} miniapp.description - Detailed description of app features and functionality
 * @property {string[]} miniapp.screenshotUrls - Array of screenshot URLs for app store listing
 * @property {string} miniapp.iconUrl - URL to app icon image
 * @property {string} miniapp.splashImageUrl - URL to splash screen image
 * @property {string} miniapp.splashBackgroundColor - Hex color code for splash screen background
 * @property {string} miniapp.homeUrl - Main entry point URL for the app
 * @property {string} miniapp.webhookUrl - Webhook endpoint for receiving Farcaster events
 * @property {string} miniapp.primaryCategory - Primary app category (e.g., "finance")
 * @property {string[]} miniapp.tags - Array of tags for app discovery and categorization
 * @property {string} miniapp.heroImageUrl - URL to hero/banner image
 * @property {string} miniapp.tagline - Short tagline for marketing
 * @property {string} miniapp.ogTitle - Open Graph title for social sharing
 * @property {string} miniapp.ogDescription - Open Graph description for social sharing
 * @property {string} miniapp.ogImageUrl - Open Graph image URL for social sharing
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing} Farcaster MiniApp Publishing Guide
 */
export const minikitConfig = {
  accountAssociation: {
    header:
      "eyJmaWQiOjE5NDM0MiwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDliRDljRkQxMzA5RDE1NTkzNzUyM0U2RkRmNTE2ZDQ0OTYxNDZFQjAifQ",
    payload: "eyJkb21haW4iOiJiYW5iLnZlcmNlbC5hcHAifQ",
    signature:
      "30mnx5iCRscvE/pPD1Ko6Y3336YOTFrJBxaA8yKo/eEJ9VWQNA4mhW6u6k0z8M7UfxnQ1Ukd5hZT/wsdk3UFdBs=",
  },
  miniapp: {
    version: "1",
    name: "Banb",
    subtitle: "Blockchain Agent Neo Bank",
    description:
      "Decentralized banking with blockchain infrastructure and AI automation. Send payments, manage deposits, and invest—all powered by Web3 and smart agents.",
    screenshotUrls: [`${ROOT_URL}/bab.png`],
    iconUrl: `${ROOT_URL}/bab.png`,
    splashImageUrl: `${ROOT_URL}/bab.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: ["finance", "banking", "blockchain", "agent", "ai"],
    heroImageUrl: `${ROOT_URL}/bab.png`,
    tagline: "Blockchain Agent Neo Bank",
    ogTitle: "Blockchain Agent Neo Bank",
    ogDescription: "Blockchain Agent Neo Bank",
    ogImageUrl: `${ROOT_URL}/bab.png`,
  },
} as const;
