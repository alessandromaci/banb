/**
 * @fileoverview Wagmi configuration for blockchain connectivity.
 * Configures Base chain connection with Farcaster MiniApp connector.
 * Uses localStorage for wallet connection persistence.
 */

import { http, createStorage } from "wagmi";
import { createConfig } from "@privy-io/wagmi";
import { base } from "viem/chains";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";

/**
 * Wagmi configuration for the application.
 * Supports Base chain with HTTP transport.
 *
 * Configuration includes:
 * - Chain: Base mainnet
 * - Connectors: Farcaster MiniApp (Privy handles other wallets)
 * - Storage: Browser localStorage for connection persistence
 *
 * @constant
 * @type {Config}
 *
 * @example
 * ```tsx
 * import { config } from './config';
 * import { WagmiProvider } from 'wagmi';
 *
 * function App() {
 *   return (
 *     <WagmiProvider config={config}>
 *       <YourApp />
 *     </WagmiProvider>
 *   );
 * }
 * ```
 */
export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [miniAppConnector()],
  storage: createStorage({
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  }),
});
