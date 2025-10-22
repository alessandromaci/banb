import type { PrivyClientConfig } from "@privy-io/react-auth";
import { base } from "viem/chains";

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: "off", // Don't auto-create - users connect external wallets
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
