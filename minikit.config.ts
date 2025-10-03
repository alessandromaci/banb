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
    payload: "eyJkb21haW4iOiJiYWItbWluaS1hcHAudmVyY2VsLmFwcCJ9",
    signature:
      "XrW5cerGsTzAjTQFaEe22/0+8Uq3/QCVj3/c+uBpN0ddbuBUdAtNNo4F187FqDeScWGnu1ANI+Fr1ZnD5doEaBw=",
  },
  miniapp: {
    version: "1",
    name: "Bab",
    subtitle: "Your Blockchain Agent Bank",
    description: "Blockchain Agent Bank",
    screenshotUrls: [`${ROOT_URL}/bab.png`],
    iconUrl: `${ROOT_URL}/bab.png`,
    splashImageUrl: `${ROOT_URL}/bab.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: ["finance", "banking", "blockchain", "agent", "ai"],
    heroImageUrl: `${ROOT_URL}/bab.png`,
    tagline: "Your Blockchain Agent Bank",
    ogTitle: "Your Blockchain Agent Bank",
    ogDescription: "Your Blockchain Agent Bank",
    ogImageUrl: `${ROOT_URL}/bab.png`,
  },
} as const;
