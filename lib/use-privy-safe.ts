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
    // Return safe defaults when Privy provider is not available
    return {
      ready: false,
      authenticated: false,
      user: null,
      login: () => Promise.resolve(),
      logout: () => Promise.resolve(),
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
    // Return safe defaults when Privy provider is not available
    return {
      wallets: [],
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
    // Return safe defaults when Privy provider is not available
    return {
      initLoginToMiniApp: () => Promise.resolve({ nonce: "" }),
      loginToMiniApp: () => Promise.resolve(),
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