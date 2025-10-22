/**
 * @fileoverview Client-side providers for the application.
 * Wraps the app with Wagmi, React Query, and User context providers.
 * Must be used in client components only.
 */

"use client";

import { ReactNode } from "react";
import { WagmiProvider } from "@privy-io/wagmi";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "./wagmiConfig";
import { privyConfig } from "./privyConfig";
import { UserProvider } from "@/lib/user-context";

/**
 * Get or create QueryClient singleton instance.
 * Prevents multiple QueryClient instances during hot reloads.
 *
 * @returns {QueryClient} React Query client instance
 */
const queryClient = new QueryClient();

/**
 * Main providers component that wraps the application.
 * Provides authentication, blockchain connectivity, server state management,
 * and user context.
 *
 * Provider hierarchy (correct order for Privy + wagmi):
 * 1. PrivyProvider - Authentication and multi-wallet management
 * 2. QueryClientProvider - Server state caching (required by @privy-io/wagmi)
 * 3. WagmiProvider - Blockchain wallet connections (from @privy-io/wagmi)
 * 4. UserProvider - User profile state
 *
 * @component
 * @param {Object} props
 * @param {ReactNode} props.children - Child components to wrap
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * import { Providers } from './providers';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <Providers>
 *           {children}
 *         </Providers>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <UserProvider>{children}</UserProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
