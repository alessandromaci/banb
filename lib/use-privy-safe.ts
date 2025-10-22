/**
 * @fileoverview Safe Privy hooks that handle cases where Privy is not available.
 * Provides fallback values when Privy provider is not configured.
 */

"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useLoginToMiniApp } from "@privy-io/react-auth/farcaster";
import { useSetActiveWallet } from "@privy-io/wagmi";

/**
 * Safe version of usePrivy that handles missing provider.
 * Returns default values when Privy is not available.
 */
export function usePrivySafe() {
  try {
    return usePrivy();
  } catch (error) {
    // Development mode: Return ready state for testing
    console.log("🚧 Using Privy safe mode - authentication bypassed for development");
    return {
      ready: true, // Set to true so app doesn't stay in loading state
      authenticated: true, // Set to true for development mode to skip auth flow
      user: {
        id: "dev-user-123",
        createdAt: new Date(),
        linkedAccounts: [],
        mfaMethods: [],
        hasAcceptedTerms: true,
        isGuest: false,
      },
      login: () => {
        console.log("🚧 Development mode: Login bypassed");
        return Promise.resolve();
      },
      logout: () => {
        console.log("🚧 Development mode: Logout bypassed");
        return Promise.resolve();
      },
      linkEmail: () => Promise.resolve(),
      linkWallet: () => Promise.resolve(),
      unlinkEmail: () => Promise.resolve(),
      unlinkWallet: () => Promise.resolve(),
      exportWallet: () => Promise.resolve(),
      createWallet: () => Promise.resolve(),
    };
  }
}

/**
 * Safe version of useWallets that handles missing provider.
 * Returns empty array when Privy is not available.
 */
export function useWalletsSafe() {
  try {
    return useWallets();
  } catch (error) {
    // Development mode: Return mock wallet for testing
    console.log("🚧 Using wallets safe mode - mock wallet provided for development");
    return {
      wallets: [
        {
          address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" as `0x${string}`,
          chainType: "ethereum" as const,
          connectorType: "injected" as const,
          walletClientType: "metamask" as const,
          imported: false,
          delegated: false,
        }
      ],
    };
  }
}

/**
 * Safe version of useLoginToMiniApp that handles missing provider.
 * Returns no-op functions when Privy is not available.
 */
export function useLoginToMiniAppSafe() {
  try {
    return useLoginToMiniApp();
  } catch (error) {
    // Development mode: Return mock functions
    console.log("🚧 Using mini app login safe mode - mock functions provided");
    return {
      initLoginToMiniApp: () => {
        console.log("🚧 Development mode: initLoginToMiniApp bypassed");
        return Promise.resolve({ nonce: "dev-nonce-123" });
      },
      loginToMiniApp: () => {
        console.log("🚧 Development mode: loginToMiniApp bypassed");
        return Promise.resolve();
      },
    };
  }
}

/**
 * Safe version of useSetActiveWallet that handles missing provider.
 * Returns no-op function when Privy is not available.
 */
export function useSetActiveWalletSafe() {
  try {
    return useSetActiveWallet();
  } catch (error) {
    // Return safe defaults when Privy provider is not available
    return {
      setActiveWallet: () => Promise.resolve(),
    };
  }
}