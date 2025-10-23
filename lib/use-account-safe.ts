"use client";

import { useAccount } from "wagmi";
import { useSetActiveWallet } from "@privy-io/wagmi";

/**
 * Safe version of useAccount that handles missing WagmiProvider.
 * Used on pages that load before providers are ready (like landing page).
 */
export function useAccountSafe() {
  try {
    return useAccount();
  } catch (error) {
    // WagmiProvider not available yet, return safe defaults
    return {
      address: undefined,
      addresses: [],
      chain: undefined,
      chainId: undefined,
      connector: undefined,
      isConnected: false,
      isConnecting: false,
      isDisconnected: true,
      isReconnecting: false,
      status: "disconnected" as const,
    };
  }
}

/**
 * Safe version of useSetActiveWallet that handles missing WagmiProvider.
 * Used on pages that load before providers are ready (like landing page).
 */
export function useSetActiveWalletSafe() {
  try {
    return useSetActiveWallet();
  } catch (error) {
    // WagmiProvider not available yet, return no-op
    return {
      setActiveWallet: () => Promise.resolve(),
    };
  }
}
