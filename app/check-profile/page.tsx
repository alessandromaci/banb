"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePrivy, useWallets, useCreateWallet } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfileByAnyWallet } from "@/lib/profile";
import { useUser } from "@/lib/user-context";

/**
 * Check Profile Page
 *
 * Simple page that checks if the authenticated wallet has a profile.
 * - If yes → redirect to home
 * - If no → redirect to signup
 * - If error → show retry button
 */
export default function CheckProfilePage() {
  const router = useRouter();
  const { authenticated, ready: privyReady, logout, user } = usePrivy();
  const { wallets: privyWallets } = useWallets();
  const { address: wagmiAddress } = useAccount();
  const { createWallet } = useCreateWallet();

  // Get smart wallet address from Privy user's linkedAccounts
  const smartWallet = user?.linkedAccounts?.find(
    (account) => account.type === "smart_wallet" || account.type === "wallet"
  );
  const smartWalletAddress =
    smartWallet && "address" in smartWallet
      ? (smartWallet.address as string)
      : null;

  // Use smart wallet address if available, otherwise fall back to wagmi address
  const address = smartWalletAddress || wagmiAddress;
  const { setProfile } = useUser();
  const [status, setStatus] = useState<"waiting" | "checking" | "error">(
    "waiting"
  );
  const [error, setError] = useState<string | null>(null);
  const hasCheckedRef = useRef(false);
  const isCheckingRef = useRef(false);

  const checkProfile = useCallback(async () => {
    if (!address) return;

    if (isCheckingRef.current || hasCheckedRef.current) return;

    isCheckingRef.current = true;
    setStatus("checking");
    setError(null);

    try {
      const profile = await getProfileByAnyWallet(address);

      if (profile) {
        hasCheckedRef.current = true;
        setProfile(profile);
        router.push("/home");
      } else {
        hasCheckedRef.current = true;
        router.push("/signup");
      }
    } catch (err) {
      isCheckingRef.current = false;
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to check profile");
    }
  }, [address, setProfile, router]);

  useEffect(() => {
    if (!privyReady) return;

    if (!authenticated) {
      router.push("/");
      return;
    }

    // Wait for wallet address - don't create wallet here, let landing page handle it
    if (!address) {
      setStatus("waiting");

      // Safety timeout - wait for wallet from landing page
      const timeoutTimer = setTimeout(() => {
        setStatus("error");
        setError(
          "Wallet creation is taking longer than expected. Please try refreshing the page."
        );
      }, 30000);

      return () => {
        clearTimeout(timeoutTimer);
      };
    }

    checkProfile();
  }, [
    privyReady,
    authenticated,
    address,
    checkProfile,
    router,
    user,
    privyWallets,
    createWallet,
  ]);

  const handleRetry = () => {
    hasCheckedRef.current = false;
    isCheckingRef.current = false;

    if (address) {
      checkProfile();
    } else {
      router.push("/");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch {
      router.push("/");
    }
  };

  // Error state
  if (status === "error") {
    return (
      <div className="h-dvh bg-gradient-to-b from-[#3B1EFF] via-[#5B3FFF] to-[#1A0F3D] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-white/60 text-sm">
              {error || "We couldn't load your profile. Please try again."}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              className="w-full bg-white text-black hover:bg-gray-100 rounded-full"
            >
              Retry
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full text-white/60 hover:text-white hover:bg-white/10 rounded-full"
            >
              Disconnect Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="h-dvh bg-gradient-to-b from-[#3B1EFF] via-[#5B3FFF] to-[#1A0F3D] text-white flex items-center justify-center">
      <div className="text-center space-y-6">
        <Loader2 className="h-16 w-16 animate-spin mx-auto text-white" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Retrieving Profile...</h2>
        </div>
      </div>
    </div>
  );
}
