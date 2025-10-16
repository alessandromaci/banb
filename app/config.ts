/**
 * @fileoverview Wagmi configuration for blockchain connectivity.
 * Configures Base chain connection with Farcaster MiniApp and Porto connectors.
 * Uses localStorage for wallet connection persistence.
 */

import { http, createConfig, createStorage } from "wagmi";
import { base } from "wagmi/chains";
import { porto } from "wagmi/connectors";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";

/**
 * Wagmi configuration for the application.
 * Supports Base chain with HTTP transport and multiple wallet connectors.
 * 
 * Configuration includes:
 * - Chain: Base mainnet
 * - Connectors: Farcaster MiniApp, Porto
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
  connectors: [miniAppConnector(), porto()],
  storage: createStorage({
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  }),
});
