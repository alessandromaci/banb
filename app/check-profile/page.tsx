"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
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
  const { authenticated, ready: privyReady, logout } = usePrivy();
  const { address } = useAccount();
  const { setProfile } = useUser();
  const [status, setStatus] = useState<"waiting" | "checking" | "error">(
    "waiting"
  );
  const [error, setError] = useState<string | null>(null);
  const hasCheckedRef = useRef(false);
  const isCheckingRef = useRef(false);

  const checkProfile = useCallback(async () => {
    if (!address) return;

    // Prevent multiple simultaneous checks
    if (isCheckingRef.current) {
      console.log("⏸️ Already checking, skipping...");
      return;
    }

    // Prevent re-checking after successful check
    if (hasCheckedRef.current) {
      console.log("⏸️ Already checked, skipping...");
      return;
    }

    isCheckingRef.current = true;
    setStatus("checking");
    setError(null);
    console.log("🔍 Checking profile for:", address);

    try {
      // Check if wallet is primary OR linked to any account
      const profile = await getProfileByAnyWallet(address);

      if (profile) {
        console.log("✅ Profile found:", profile);
        hasCheckedRef.current = true; // Mark as checked
        setProfile(profile);
        console.log("🔄 Redirecting to /home...");
        router.push("/home");
      } else {
        console.log("❌ No profile found, redirecting to signup");
        hasCheckedRef.current = true; // Mark as checked
        router.push("/signup");
      }
    } catch (err) {
      console.error("❌ Error checking profile:", err);
      isCheckingRef.current = false; // Allow retry on error
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to check profile");
    }
  }, [address, setProfile, router]);

  useEffect(() => {
    // Wait for Privy to be ready
    if (!privyReady) {
      console.log("⏳ Waiting for Privy...");
      return;
    }

    // If not authenticated, redirect to landing
    if (!authenticated) {
      console.log("❌ Not authenticated, redirecting to landing");
      router.push("/");
      return;
    }

    // Wait for wagmi to sync the address
    if (!address) {
      console.log("⏳ Waiting for wallet address...");
      setStatus("waiting");

      // Safety timeout: If address doesn't load within 8 seconds, something is wrong
      const timeoutTimer = setTimeout(() => {
        console.error("❌ Wallet address failed to load after 8 seconds");
        setStatus("error");
        setError("Wallet failed to load. Please disconnect and try again.");
      }, 8000);

      return () => {
        clearTimeout(timeoutTimer);
      };
    }

    // Check profile
    checkProfile();
  }, [privyReady, authenticated, address, checkProfile, router]);

  const handleRetry = () => {
    // Reset refs to allow retry
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
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect anyway
      router.push("/");
    }
  };

  // Error state
  if (status === "error") {
    return (
      <div className="h-dvh bg-gradient-to-b from-[#3B1EFF] via-[#5B3FFF] to-[#1A0F3D] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Something Went Wrong</h1>
            <p className="text-white/60 text-sm">
              {error || "We couldn't check your profile. Please try again."}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              className="w-full bg-white text-indigo-600 hover:bg-white/90 rounded-full py-6 font-semibold"
            >
              Try Again
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
          <h2 className="text-xl font-semibold">{"Retrieving Profile"}</h2>
          <p className="text-white/60 text-sm">
            {status === "waiting"
              ? "0x..."
              : `${address?.slice(0, 6)}...${address?.slice(-4)}`}
          </p>
        </div>
      </div>
    </div>
  );
}
