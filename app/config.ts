import { http, createConfig, createStorage } from "wagmi";
import { base } from "wagmi/chains";
import { porto } from "wagmi/connectors";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";

/**
 * Wagmi configuration for Web3 wallet connections and blockchain interactions.
 * Configures the app to work with Base blockchain and multiple wallet connectors.
 *
 * @constant
 * @type {Config}
 *
 * Configuration includes:
 * - Chains: Base blockchain network
 * - Transports: HTTP transport for blockchain RPC calls
 * - Connectors: Farcaster MiniApp connector and Porto wallet connector
 * - Storage: Browser localStorage for persisting connection state
 *
 * @example
 * // Use in a React component with wagmi hooks
 * import { useAccount } from 'wagmi';
 * const { address, isConnected } = useAccount();
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
