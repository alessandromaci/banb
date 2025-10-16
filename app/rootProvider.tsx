/**
 * @fileoverview Root provider for Coinbase OnchainKit integration.
 * Configures OnchainKit with Base chain, wallet modal, and MiniKit support.
 * Must be used in client components only.
 */

"use client";
import { ReactNode } from "react";
import { base } from "wagmi/chains";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import "@coinbase/onchainkit/styles.css";

/**
 * Root provider component for Coinbase OnchainKit.
 * Provides blockchain UI components and wallet connection functionality.
 * 
 * Configuration:
 * - Chain: Base mainnet
 * - Appearance: Auto theme (follows system preference)
 * - Wallet: Modal display with all wallet options
 * - MiniKit: Enabled with auto-connect for Farcaster integration
 * 
 * @component
 * @param {Object} props
 * @param {ReactNode} props.children - Child components to wrap
 * 
 * @example
 * ```tsx
 * // In root layout
 * import { RootProvider } from './rootProvider';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <RootProvider>
 *           <Providers>
 *             {children}
 *           </Providers>
 *         </RootProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
      config={{
        appearance: {
          mode: "auto",
        },
        wallet: {
          display: "modal",
          preference: "all",
        },
      }}
      miniKit={{
        enabled: true,
        autoConnect: true,
        notificationProxyUrl: undefined,
      }}
    >
      {children}
    </OnchainKitProvider>
  );
}
