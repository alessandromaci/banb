"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { sdk } from "@farcaster/miniapp-sdk";
import {
  usePrivy,
  useWallets,
  useCreateWallet,
  useLogin,
} from "@privy-io/react-auth";
import { useLoginToMiniApp } from "@privy-io/react-auth/farcaster";
import { useAccountSafe as useAccount } from "@/lib/use-account-safe";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Mail } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { getProfileByAnyWallet } from "@/lib/profile";
import { createProfile } from "@/lib/profile";
import { createAccount } from "@/lib/accounts";

const taglines = [
  "The future of money is stablecoins",
  "The future of money is powered by AI",
  "The future of money is decentralized",
  "The future of money is non-custodial",
  "The future of money is instant",
  "The future of money is borderless",
  "The future of money is secure",
  "The future of money is transparent",
  "The future of money is sustainable",
  "The future of money is inclusive",
];

export function LandingPage() {
  const [currentTagline, setCurrentTagline] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const [revealPercentage, setRevealPercentage] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [phase, setPhase] = useState("pixelReveal"); // pixelReveal -> logoPause -> textReveal -> textPause -> loop
  const [isInsideFarcaster, setIsInsideFarcaster] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [isPrivyLoginLoading, setIsPrivyLoginLoading] = useState(false);
  const [isFarcasterLoggingIn, setIsFarcasterLoggingIn] = useState(false);
  const [isFarcasterCheckingProfile, setIsFarcasterCheckingProfile] =
    useState(false);
  const { ready: privyReady, authenticated, user } = usePrivy();
  const { setProfile } = useUser();
  const { wallets: privyWallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const hasHandledAuthRef = useRef(false);

  const { login } = useLogin({
    onComplete: async ({ user, isNewUser }) => {
      // Prevent duplicate calls - onComplete can fire multiple times
      if (hasHandledAuthRef.current || isRedirecting) return;

      hasHandledAuthRef.current = true;
      setIsPrivyLoginLoading(false);
      setIsRedirecting(true);

      // Check if user has an embedded wallet (smart wallet) - reuse existing logic
      const hasSmartWallet = user?.linkedAccounts?.some(
        (account) =>
          account.type === "smart_wallet" || account.type === "wallet"
      );
      const hasEmbeddedWallet = privyWallets.some(
        (wallet) => wallet.walletClientType === "privy"
      );

      // If user doesn't have a wallet, create one (only once)
      if (!hasSmartWallet && !hasEmbeddedWallet) {
        setIsCreatingWallet(true);
        try {
          await createWallet();
          setIsCreatingWallet(false);
        } catch (error) {
          setIsCreatingWallet(false);
          console.error("Failed to create wallet:", error);
        }
      }

      // Redirect based on whether user is new or existing
      if (isNewUser) {
        router.push("/signup");
        setTimeout(() => {
          if (
            typeof window !== "undefined" &&
            window.location.pathname === "/"
          ) {
            window.location.href = "/signup";
          }
        }, 100);
      } else {
        router.push("/check-profile");
      }
    },
    onError: (error) => {
      console.error("Login failed", error);
      setIsPrivyLoginLoading(false);
      setIsRedirecting(false);
    },
  });

  const { address } = useAccount(); // Safe wrapper handles WagmiProvider not ready
  const { initLoginToMiniApp, loginToMiniApp } = useLoginToMiniApp();
  const router = useRouter();

  // Fast Farcaster detection - check immediately
  useEffect(() => {
    const checkFarcaster = async () => {
      try {
        await sdk.actions.ready();
        const context = await Promise.resolve(sdk.context);

        const hasUserFid =
          context?.user?.fid != null &&
          typeof context.user.fid === "number" &&
          context.user.fid > 0;
        const hasFarcasterClient =
          context?.client?.clientFid != null &&
          typeof context.client.clientFid === "number" &&
          context.client.clientFid > 0;

        if (hasUserFid && hasFarcasterClient) {
          setIsInsideFarcaster(true);
        } else {
          setIsInsideFarcaster(false);
        }
      } catch {
        setIsInsideFarcaster(false);
      }
    };

    checkFarcaster();
  }, []);

  // Auto-login for Farcaster Mini App users
  useEffect(() => {
    if (
      !isInsideFarcaster ||
      !privyReady ||
      authenticated ||
      isFarcasterLoggingIn ||
      isFarcasterCheckingProfile
    ) {
      return;
    }

    const performFarcasterLogin = async () => {
      setIsFarcasterLoggingIn(true);
      try {
        const { nonce } = await initLoginToMiniApp();
        const result = await sdk.actions.signIn({ nonce });
        await loginToMiniApp({
          message: result.message,
          signature: result.signature,
        });
        // After login, user state will update, triggering the profile check effect
      } catch (error) {
        setIsFarcasterLoggingIn(false);
        // Silently fail - user can still use other login methods if needed
      }
    };

    performFarcasterLogin();
  }, [
    isInsideFarcaster,
    privyReady,
    authenticated,
    isFarcasterLoggingIn,
    isFarcasterCheckingProfile,
    initLoginToMiniApp,
    loginToMiniApp,
  ]);

  // Handle profile check/creation after Farcaster login
  useEffect(() => {
    if (
      !isInsideFarcaster ||
      !privyReady ||
      !authenticated ||
      !user ||
      !address ||
      isFarcasterCheckingProfile ||
      isRedirecting
    ) {
      return;
    }

    const handleFarcasterProfile = async () => {
      setIsFarcasterCheckingProfile(true);

      try {
        // Check if profile exists
        const existingProfile = await getProfileByAnyWallet(address);
        if (existingProfile) {
          // Profile exists - redirect to home with "retrieving profile" state
          setProfile(existingProfile);
          setIsFarcasterCheckingProfile(false);
          router.push("/home");
          return;
        }

        // Profile doesn't exist - create it
        // Get Farcaster account info for username
        const farcasterAccount = user.linkedAccounts?.find(
          (account) => account.type === "farcaster"
        ) as { username?: string; fid?: number | string } | undefined;

        let profileName = "user";
        if (farcasterAccount) {
          if (farcasterAccount.username) {
            profileName = farcasterAccount.username;
          } else if (farcasterAccount.fid) {
            profileName = `user${farcasterAccount.fid}`;
          }
        }

        // Create profile
        const newProfile = await createProfile({
          name: profileName,
          wallet_address: address,
        });

        // Create initial spending account
        await createAccount({
          profile_id: newProfile.id,
          name: "Spending Account 1",
          type: "spending",
          address: address,
          network: "base",
          is_primary: true,
        });

        setProfile(newProfile);
        setIsFarcasterCheckingProfile(false);
        router.push("/home?newUser=true");
      } catch (error) {
        setIsFarcasterCheckingProfile(false);
        // Error will be handled by showing the landing page with buttons
      }
    };

    handleFarcasterProfile();
  }, [
    isInsideFarcaster,
    privyReady,
    authenticated,
    user,
    address,
    isFarcasterCheckingProfile,
    isRedirecting,
    setProfile,
    router,
  ]);

  // Pixel reveal animation
  useEffect(() => {
    if (phase === "pixelReveal") {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 0.08 + 0.02;
        if (progress >= 1) {
          progress = 1;
          setRevealPercentage(100);
          setShowLogo(true);
          clearInterval(interval);
          setPhase("logoPause");
        } else {
          setRevealPercentage(Math.min(progress * 100, 100));
        }
      }, 80);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Logo pause before text reveal
  useEffect(() => {
    if (phase === "logoPause") {
      const timer = setTimeout(() => {
        setPhase("textReveal");
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Text typing animation
  useEffect(() => {
    if (phase === "textReveal") {
      let charIndex = 0;
      const text = taglines[currentTagline];
      const typingInterval = setInterval(() => {
        if (charIndex <= text.length) {
          setDisplayedText(text.substring(0, charIndex));
          charIndex++;
        } else {
          clearInterval(typingInterval);
          setPhase("textPause");
        }
      }, 40);
      return () => clearInterval(typingInterval);
    }
  }, [phase, currentTagline]);

  // Text pause before next cycle
  useEffect(() => {
    if (phase === "textPause") {
      const timer = setTimeout(() => {
        setDisplayedText("");
        const nextTagline = (currentTagline + 1) % taglines.length;
        setCurrentTagline(nextTagline);
        if (nextTagline === 0) {
          setShowLogo(false);
          setRevealPercentage(0);
          setPhase("pixelReveal");
        } else {
          setPhase("textReveal");
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [phase, currentTagline]);

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden flex flex-col touch-none text-white">
      {/* Pixel Noise Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id="pixelNoise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="3"
              result="noise"
              seed="2"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.5" />
          </filter>
          <rect
            width="100%"
            height="100%"
            fill="#ffffff"
            opacity="0.01"
            filter="url(#pixelNoise)"
            style={{
              animation: "pixelDrift 8s ease-in-out infinite",
            }}
          />
        </svg>
      </div>

      {/* Pixel Noise Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id="pixelNoiseOverlay">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="4"
              result="noise"
              seed="2"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1" />
          </filter>
          <rect
            width="100%"
            height="100%"
            fill="#ffffff"
            opacity="0.02"
            filter="url(#pixelNoiseOverlay)"
          />
        </svg>
      </div>

      {/* Scan-lines Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.03] to-transparent animate-pulse" />
        <div
          className={`absolute inset-0 transition-all duration-1000 ${
            showLogo ? "opacity-0" : "opacity-100"
          }`}
          style={{
            background:
              "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)",
            animation: showLogo ? "none" : "scanSweep 1.5s ease-out forwards",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo with pixel reveal */}
        <div className="mb-8 h-24 w-24 flex items-center justify-center relative">
          <div
            className="text-center transition-all duration-300"
            style={{
              opacity: showLogo ? 1 : 0.3,
              transform: showLogo ? "scale(1)" : "scale(0.8)",
            }}
          >
            <div
              className="text-5xl font-bold text-white tracking-tighter relative"
              style={{
                fontFamily: "Lexend, monospace",
                textShadow:
                  showLogo && revealPercentage > 80
                    ? "0 0 20px rgba(147, 112, 219, 0.4), 0 0 40px rgba(100, 150, 255, 0.2)"
                    : "none",
                transition: "text-shadow 0.5s ease-out",
              }}
            >
              BANB
              {!showLogo && (
                <div
                  className="absolute inset-0 bg-black"
                  style={{
                    clipPath: `polygon(${revealPercentage}% 0, 100% 0, 100% 100%, ${revealPercentage}% 100%)`,
                    transition: "clip-path 0.1s linear",
                  }}
                />
              )}
            </div>
            <div className="mt-2 text-xs text-white/40 tracking-widest">
              FUTURE OF MONEY
            </div>
          </div>

          {showLogo && revealPercentage > 90 && (
            <div
              className="absolute inset-0 blur-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(147, 112, 219, 0.15) 0%, rgba(100, 150, 255, 0.08) 50%, transparent 70%)",
                animation: "glowPulse 2s ease-in-out infinite",
              }}
            />
          )}
        </div>

        {/* Tagline with typing effect */}
        <div className="h-20 flex items-center justify-center mb-12">
          <div className="text-center transition-all duration-300">
            <h1
              className="text-3xl md:text-4xl font-bold text-white leading-tight text-balance tracking-tight"
              style={{
                fontFamily: "Space Grotesk, monospace",
                minHeight: "1.5em",
                opacity: displayedText ? 1 : 0,
                transition: "opacity 0.2s ease-out",
                letterSpacing: "0.02em",
              }}
            >
              {displayedText}
              {displayedText.length < taglines[currentTagline].length && (
                <span className="inline-block w-0.5 h-8 bg-white/50 ml-1 animate-pulse" />
              )}
            </h1>
          </div>
        </div>

        {/* Decorative Lines */}
        <div className="w-full max-w-xs space-y-2 mb-12">
          <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="relative z-10 space-y-3 pb-12 px-6 max-w-sm mx-auto w-full">
        {/* Show loading state for Farcaster auto-login */}
        {(isFarcasterLoggingIn || isFarcasterCheckingProfile) && (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-white" />
            <div className="space-y-1">
              <p className="text-lg font-semibold text-white">
                {isFarcasterLoggingIn
                  ? "Connecting with Farcaster..."
                  : "Retrieving your profile..."}
              </p>
              <p className="text-sm text-white/60">
                {isFarcasterLoggingIn
                  ? "Please wait while we authenticate"
                  : "Setting up your account"}
              </p>
            </div>
          </div>
        )}

        {/* Hide login button when in Farcaster Mini App */}
        {!isInsideFarcaster &&
          !isFarcasterLoggingIn &&
          !isFarcasterCheckingProfile && (
            <>
              {/* Continue with Privy Login Modal */}
              <Button
                size="lg"
                onClick={() => {
                  setIsPrivyLoginLoading(true);
                  login();
                }}
                disabled={
                  !privyReady ||
                  isPrivyLoginLoading ||
                  isCreatingWallet ||
                  isRedirecting
                }
                className="w-full rounded-full bg-white text-black hover:bg-white/90 h-12 text-base font-semibold transition-all duration-300 relative flex items-center justify-center gap-2"
              >
                {isPrivyLoginLoading || isCreatingWallet ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>
                      {isCreatingWallet
                        ? "Creating wallet..."
                        : "Connecting..."}
                    </span>
                  </>
                ) : (
                  <>
                    <span>Continue with</span>
                    <div className="flex items-center gap-1.5">
                      <Image
                        src="/gmail.svg"
                        alt="Gmail"
                        width={15}
                        height={15}
                      />
                      <Image
                        src="/apple.svg"
                        alt="Apple"
                        width={15}
                        height={15}
                      />
                      <Mail className="w-4 h-4" />
                    </div>
                  </>
                )}
              </Button>
            </>
          )}
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full py-6 px-6">
        <div className="w-full h-px bg-white/20 mb-2"></div>
        <div className="mx-auto max-w-md">
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-white/50 text-center font-sans">
              Project built during
            </p>

            <div className="h-4 w-auto flex items-center justify-center">
              <Link
                href="https://devfolio.co/projects/babblockchain-agent-bank-17b9"
                target="_blank"
              >
                <Image
                  src="/base-batches.svg"
                  alt="base"
                  width={100}
                  height={100}
                  priority
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap");

        @keyframes glowPulse {
          0%,
          100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.25;
          }
        }

        @keyframes pixelDrift {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(2px, -2px);
          }
        }

        @keyframes scanSweep {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(100%);
          }
        }

        @keyframes pixelPulse {
          0%,
          100% {
            opacity: 0.02;
          }
          50% {
            opacity: 0.05;
          }
        }
      `}</style>
    </div>
  );
}
