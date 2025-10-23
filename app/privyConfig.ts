import type { PrivyClientConfig } from "@privy-io/react-auth";
import { base } from "viem/chains";

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets", // Create embedded wallet for email/social logins
    },
    showWalletUIs: true,
  },
  defaultChain: base, // Required for SIWE authentication
  supportedChains: [base], // Explicitly support Base chain
  loginMethods: ["wallet", "email", "farcaster"],
  appearance: {
    showWalletLoginFirst: true,
    theme: "dark",
    accentColor: "#3B1EFF",
    logo: "/banb-logo-white.svg",
    walletChainType: "ethereum-only",
  },
};
