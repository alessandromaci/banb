"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProfile, getProfileByWallet } from "@/lib/profile";
import { useUser } from "@/lib/user-context";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";

export function SignUpForm() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "wallet">("details");
  const [formData, setFormData] = useState({
    name: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [existingWallet, setExistingWallet] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isCheckingWallet, setIsCheckingWallet] = useState(false);
  const [shouldCreateProfile, setShouldCreateProfile] = useState(false);

  const { setProfile } = useUser();
  const { login: privyLogin, ready: privyReady } = usePrivy();
  const { wallets: privyWallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  // Sync Privy wallet with wagmi when wallet connects
  // Prefer external wallets (MetaMask, Phantom) over embedded wallets
  useEffect(() => {
    const syncWallet = async () => {
      if (privyWallets.length > 0 && setActiveWallet) {
        console.log(
          "👛 All wallets in signup:",
          privyWallets.map((w) => ({
            address: w.address,
            type: w.walletClientType,
            connectorType: w.connectorType,
          }))
        );

        // Find first external wallet (not embedded)
        const externalWallet = privyWallets.find(
          (w) => w.walletClientType !== "privy"
        );

        // Use external wallet if found, otherwise use first wallet
        const walletToUse = externalWallet || privyWallets[0];

        console.log("🎯 Using wallet for signup:", {
          address: walletToUse.address,
          type: walletToUse.walletClientType,
        });

        await setActiveWallet(walletToUse);
      }
    };
    syncWallet();
  }, [privyWallets, setActiveWallet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (step === "details") {
      // If wallet is already connected, move to wallet step
      if (privyWallets.length > 0) {
        console.log("✅ Wallet already connected, moving to wallet step");
        setExistingWallet(false);
        setStep("wallet");
        setShouldCreateProfile(true);
      } else {
        // No wallet, open Privy modal
        console.log("🔌 No wallet, opening Privy modal");

        if (!privyReady) {
          setError("Authentication system not ready. Please wait a moment.");
          return;
        }

        try {
          await new Promise((resolve) => setTimeout(resolve, 100));
          await privyLogin();
          console.log("✅ Wallet connected");
          setStep("wallet");
          setShouldCreateProfile(true);
        } catch (loginError: any) {
          console.error("❌ Wallet connection error:", loginError);
          if (
            !loginError?.message?.includes("abort") &&
            !loginError?.message?.includes("cancel") &&
            loginError?.name !== "AbortError"
          ) {
            setError("Failed to connect wallet. Please try again.");
          }
        }
      }
    }
  };

  // Check for existing wallet on details page
  useEffect(() => {
    const checkExistingWallet = async () => {
      if (step === "details" && privyWallets.length > 0) {
        const primaryWallet = privyWallets[0];
        if (primaryWallet?.address) {
          try {
            const existingProfile = await getProfileByWallet(
              primaryWallet.address
            );
            setExistingWallet(!!existingProfile);
          } catch (err) {
            console.error("Error checking wallet:", err);
          }
        }
      } else if (step === "details") {
        setExistingWallet(false);
      }
    };

    checkExistingWallet();
  }, [step, privyWallets]);

  // Create profile ONLY when explicitly requested
  useEffect(() => {
    const createProfileWithWallet = async () => {
      // Only run if we explicitly set shouldCreateProfile flag
      if (!shouldCreateProfile || isCreatingProfile) {
        return;
      }

      if (step !== "wallet" || !privyWallets.length || !formData.name.trim()) {
        return;
      }

      // Prefer external wallet over embedded wallet
      const externalWallet = privyWallets.find(
        (w) => w.walletClientType !== "privy"
      );
      const primaryWallet = externalWallet || privyWallets[0];

      if (!primaryWallet?.address) {
        return;
      }

      console.log("👛 Wallet detected, creating profile with:", {
        address: primaryWallet.address,
        type: primaryWallet.walletClientType,
        connectorType: primaryWallet.connectorType,
        totalWallets: privyWallets.length,
        preferredExternal: !!externalWallet,
      });
      setIsCheckingWallet(true);
      setIsCreatingProfile(true);

      try {
        // Check if wallet already has a profile
        const existingProfile = await getProfileByWallet(primaryWallet.address);

        if (existingProfile) {
          console.log("⚠️ Profile already exists for this wallet");
          setExistingWallet(true);
          setIsCreatingProfile(false);
          setIsCheckingWallet(false);
          setShouldCreateProfile(false);
          return;
        }

        // Create new profile
        console.log("📝 Creating new profile...");
        const profile = await createProfile({
          name: formData.name,
          wallet_address: primaryWallet.address,
        });

        console.log("✅ Profile created successfully");
        setProfile(profile);
        router.push("/home");
      } catch (err) {
        console.error("❌ Failed to create profile:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create profile"
        );
        setIsCreatingProfile(false);
        setIsCheckingWallet(false);
        setShouldCreateProfile(false);
      }
    };

    createProfileWithWallet();
  }, [
    shouldCreateProfile,
    step,
    privyWallets,
    formData.name,
    isCreatingProfile,
    router,
    setProfile,
  ]);

  return (
    <div className="h-dvh bg-black text-white flex flex-col relative overflow-hidden touch-none">
      {step === "wallet" && (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setStep("details");
              setShouldCreateProfile(false);
              setIsCreatingProfile(false);
              setIsCheckingWallet(false);
              setExistingWallet(false);
              setError(null);
            }}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
            <span className="font-bold">B</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 overflow-y-auto">
        {step === "details" ? (
          // Step 1: Name input
          <div className="mx-auto max-w-md space-y-6 w-full">
            <div className="flex items-center justify-center">
              <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center p-2">
                <Image
                  src="/banb-white-icon.png"
                  alt="BANB"
                  className="h-full w-full object-contain"
                  width={32}
                  height={32}
                />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-sans text-center">
                Create your account
              </h1>
              <p className="text-white/60 text-center text-xs sm:text-sm font-sans px-4">
                to enter the future of money with{" "}
                <span className="font-bold text-white">BANB</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`h-14 rounded-xl bg-white/15 text-white placeholder:text-white/40 transition-colors font-sans font-medium ${
                  error
                    ? "border-red-500/50 focus-visible:ring-red-500/50"
                    : "border-white/10"
                }`}
                required
              />

              <Button
                type="submit"
                size="lg"
                disabled={!formData.name.trim() || existingWallet}
                className="w-full rounded-full h-14 text-base font-semibold mt-6 transition-all duration-200 disabled:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed bg-white text-black hover:bg-gray-100 hover:scale-[1.02]"
              >
                Continue
              </Button>
            </form>
          </div>
        ) : (
          // Step 2: Wallet step (checking or creating)
          <div className="mx-auto max-w-md space-y-6 w-full">
            <div className="flex items-center justify-center">
              <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center p-2">
                <Wallet className="h-8 w-8" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-sans text-center">
                Get Started
              </h1>
              <p className="text-white/60 text-center text-xs sm:text-sm font-sans px-4">
                Connect your wallet, or create one instantly.
              </p>
            </div>

            <div className="space-y-4">
              {isCheckingWallet || isCreatingProfile ? (
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-white" />
                    <div>
                      <p className="text-semibold text-white font-sans text-lg">
                        {formData.name}
                      </p>
                      <p className="text-xs text-white/60 font-sans">
                        {"Creating your profile..."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : existingWallet ? (
                <div className="text-center space-y-4">
                  <p className="text-sm text-white/60 font-sans">
                    You already have an account.{" "}
                    <Link
                      href="/login"
                      className="text-white underline underline-offset-4"
                    >
                      Log in
                    </Link>
                  </p>
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                  <p className="text-sm text-white/80 font-sans">{error}</p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <div className="w-full py-6 px-6">
        <div className="w-full h-px bg-white/20 mb-4"></div>
        <div className="mx-auto max-w-md">
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-white/50 text-center font-sans">
              Project built during
            </p>

            <div className="h-6 w-auto flex items-center justify-center">
              <Link
                href="https://devfolio.co/projects/babblockchain-agent-bank-17b9"
                target="_blank"
              >
                <Image
                  src="/base-batches.svg"
                  alt="base"
                  width={100}
                  height={100}
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
