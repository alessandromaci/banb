import type { PrivyClientConfig } from "@privy-io/react-auth";
import { base } from "viem/chains";

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: "off", // Disabled - we manually create wallets for OAuth users
    },
    showWalletUIs: true,
  },
  defaultChain: base, // Required for SIWE authentication
  supportedChains: [base], // Explicitly support Base chain
  loginMethods: ["google", "apple", "email", "farcaster", "wallet"],
  appearance: {
    walletList: ["metamask", "rainbow", "wallet_connect", "phantom"],
    showWalletLoginFirst: true,
    theme: "dark",
    accentColor: "#3B1EFF",
    logo: "/banb-logo-white.svg",
    walletChainType: "ethereum-only",
  },
};
