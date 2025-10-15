/**
 * @fileoverview Client-side providers for the application.
 * Wraps the app with Wagmi, React Query, and User context providers.
 * Must be used in client components only.
 */

"use client";

import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "./config";
import { UserProvider } from "@/lib/user-context";

/**
 * React Query client instance for server state management.
 * Shared across the application for caching and synchronization.
 * 
 * @constant
 */
const queryClient = new QueryClient();

/**
 * Main providers component that wraps the application.
 * Provides blockchain connectivity (Wagmi), server state management (React Query),
 * and user authentication context.
 * 
 * Provider hierarchy:
 * 1. WagmiProvider - Blockchain wallet connections
 * 2. QueryClientProvider - Server state caching
 * 3. UserProvider - User profile state
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
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <UserProvider>{children}</UserProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
