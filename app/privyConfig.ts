import type { PrivyClientConfig } from "@privy-io/react-auth";
import { base } from "viem/chains";

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: "off",
    },
    showWalletUIs: true,
  },
  defaultChain: base, // Required for SIWE authentication
  supportedChains: [base], // Explicitly support Base chain
  loginMethods: ["google", "apple", "email", "farcaster"],
  appearance: {
    walletList: ["metamask", "rainbow", "wallet_connect", "phantom"],
    showWalletLoginFirst: false,
    theme: "dark",
    accentColor: "#3B1EFF",
    walletChainType: "ethereum-only",
  },
};
