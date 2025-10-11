const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
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
    subtitle: "The Blockchain Agentic Neo Bank",
    description:
      "Banb (Blockchain Agent Neo Bank) is a decentralized banking application that merges the fintech neo-bank’s ease of use functionality (payments, deposits, investments) with blockchain-native infrastructure and AI-driven automation.",
    screenshotUrls: [`${ROOT_URL}/bab.png`],
    iconUrl: `${ROOT_URL}/bab.png`,
    splashImageUrl: `${ROOT_URL}/bab.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: ["finance", "banking", "blockchain", "agent", "ai"],
    heroImageUrl: `${ROOT_URL}/bab.png`,
    tagline: "The Blockchain Agentic Neo Bank",
    ogTitle: "The Blockchain Agentic Neo Bank",
    ogDescription: "The Blockchain Agentic Neo Bank",
    ogImageUrl: `${ROOT_URL}/bab.png`,
  },
} as const;
