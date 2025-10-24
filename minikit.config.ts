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
    payload: "eyJkb21haW4iOiJiYW5iLmZpbmFuY2UifQ",
    signature:
      "wfljF5eZssHQ4Ia+l3C0xANoL85+w7nkgdQnKsBgGbpLK+M6NoCyKU9K4J0VwtU/dYULf43cefZ9+og//e81fRs=",
  },
  miniapp: {
    version: "1",
    name: "BANB",
    subtitle: "Manage Easily Your Stablecoins",
    description:
      "BANB brings the simplicity of a neobank to the onchain world powered by AI.",
    screenshotUrls: [`${ROOT_URL}/banb-logo.png`],
    iconUrl: `${ROOT_URL}/banb-white-icon.png`,
    splashImageUrl: `${ROOT_URL}/banb-white-icon.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: ["finance", "banking", "blockchain", "agent", "ai"],
    heroImageUrl: `${ROOT_URL}/banb-logo.png`,
    tagline: "Blockchain Agentic Neo Bank",
    ogTitle: "Blockchain Agentic Neo Bank",
    ogDescription: "Blockchain Agentic Neo Bank",
    ogImageUrl: `${ROOT_URL}/banb-logo.png`,
  },
} as const;
