"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { sdk } from "@farcaster/miniapp-sdk";
import {
  usePrivy,
  useWallets,
  type ConnectedWallet,
  useLoginWithOAuth,
  useCreateWallet,
} from "@privy-io/react-auth";
import { useLoginToMiniApp } from "@privy-io/react-auth/farcaster";
import {
  useAccountSafe as useAccount,
  useSetActiveWalletSafe as useSetActiveWallet,
} from "@/lib/use-account-safe";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Check, Wallet } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<
    "google" | "apple" | null
  >(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const {
    ready: privyReady,
    authenticated,
    logout,
    connectWallet: privyConnectWallet,
  } = usePrivy();
  const { wallets: privyWallets } = useWallets();
  const { createWallet } = useCreateWallet();

  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth({
    onComplete: async ({ user, isNewUser }) => {
      // Check if user has an embedded wallet (smart wallet)
      const hasSmartWallet = user?.linkedAccounts?.some(
        (account) =>
          account.type === "smart_wallet" || account.type === "wallet"
      );
      const hasEmbeddedWallet = privyWallets.some(
        (wallet) => wallet.walletClientType === "privy"
      );

      // If user doesn't have a wallet, create one
      if (!hasSmartWallet && !hasEmbeddedWallet) {
        setIsCreatingWallet(true);
        try {
          await createWallet();
          setIsCreatingWallet(false);
        } catch (error) {
          setIsCreatingWallet(false);
        }
      }

      setIsRedirecting(true);
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
    onError: () => {
      setIsRedirecting(false);
      setLoadingProvider(null);
    },
  });

  // Detect OAuth callback and restore loadingProvider from URL params
  useEffect(() => {
    if (typeof window !== "undefined" && privyReady) {
      const urlParams = new URLSearchParams(window.location.search);
      const provider = urlParams.get("privy_oauth_provider");
      if (provider === "google" || provider === "apple") {
        // Restore the loading provider when coming back from OAuth
        if (!loadingProvider) {
          setLoadingProvider(provider as "google" | "apple");
        }
      }
    }
  }, [privyReady, loadingProvider]);
  const { wallets } = useWallets();
  const { address } = useAccount(); // Safe wrapper handles WagmiProvider not ready
  const { setActiveWallet } = useSetActiveWallet();
  const { initLoginToMiniApp, loginToMiniApp } = useLoginToMiniApp();
  const router = useRouter();

  // Removed auto-redirect - users should always click sign-in button

  // Initialize Farcaster SDK and detect environment (deferred to not block rendering)
  useEffect(() => {
    // Defer Farcaster SDK initialization to not block initial render
    const timer = setTimeout(() => {
      const initializeSDK = async () => {
        try {
          await sdk.actions.ready();

          // Check if we're inside Farcaster
          const context = await Promise.resolve(sdk.context);

          // More robust check: verify we're actually in a Farcaster environment
          // Check for user.fid AND client.clientFid to confirm it's a real Farcaster client
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

      initializeSDK();
    }, 100); // Defer by 100ms to allow UI to render first

    return () => clearTimeout(timer);
  }, []);

  // Note: We detect Farcaster environment but don't auto-login
  // This keeps the flow simple and user-driven

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

  // Handle wallet switching
  const handleSwitchWallet = async (wallet: ConnectedWallet) => {
    try {
      await setActiveWallet(wallet);
      setShowWalletSelector(false);
      toast({
        title: "Wallet switched",
        description: `Now using ${wallet.address.slice(
          0,
          6
        )}...${wallet.address.slice(-4)}`,
      });
    } catch {
      toast({
        title: "Failed to switch wallet",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  // Handle connecting new wallet
  const handleConnectNewWallet = () => {
    setShowWalletSelector(false);
    privyConnectWallet?.();
  };

  // Helper to format wallet name
  const getWalletDisplayName = (walletClientType: string | undefined) => {
    if (!walletClientType) return "Other Wallet";
    if (walletClientType === "privy") return "Embedded Wallet";
    // Capitalize first letter
    return walletClientType.charAt(0).toUpperCase() + walletClientType.slice(1);
  };

  // Handle email-first login with specific providers - exactly like the example
  const handleLoginWithProvider = async (provider: "google" | "apple") => {
    if (!privyReady || oauthLoading || isRedirecting) return;

    setLoadingProvider(provider);

    try {
      // Inside Farcaster - use proper Mini App authentication
      if (isInsideFarcaster) {
        try {
          const { nonce } = await initLoginToMiniApp();
          const result = await sdk.actions.signIn({ nonce });
          await loginToMiniApp({
            message: result.message,
            signature: result.signature,
          });
        } catch {
          setLoadingProvider(null);
        }
        return;
      }

      // Simple OAuth login - exactly like the Privy example
      // The user will be redirected to OAuth provider's login page
      // onComplete callback handles redirect
      await initOAuth({ provider });
    } catch {
      setLoadingProvider(null);
    }
  };

  // Legacy handler for wallet login (kept for compatibility)
  const handleLogin = async () => {
    await handleLoginWithProvider("google");
  };

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
                fontFamily: "Space Grotesk, monospace",
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
        {/* Sign in with Apple */}
        <Button
          size="lg"
          onClick={() => handleLoginWithProvider("apple")}
          disabled={!privyReady || oauthLoading || isRedirecting}
          className="w-full rounded-full bg-white text-black hover:bg-white/90 h-12 text-base font-semibold transition-all duration-300 relative flex items-center justify-center gap-2"
        >
          {loadingProvider !== null && loadingProvider === "apple" ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>
                {isCreatingWallet ? "Creating wallet..." : "Connecting..."}
              </span>
            </>
          ) : (
            <>
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.08-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span>Continue with Apple</span>
            </>
          )}
        </Button>

        {/* Sign in with Google */}
        <Button
          size="lg"
          onClick={() => handleLoginWithProvider("google")}
          disabled={!privyReady || oauthLoading || isRedirecting}
          className="w-full rounded-full bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 border border-white/10 h-12 text-base font-semibold transition-all duration-300 relative flex items-center justify-center gap-2"
        >
          {loadingProvider !== null && loadingProvider === "google" ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>
                {isCreatingWallet ? "Creating wallet..." : "Connecting..."}
              </span>
            </>
          ) : (
            <>
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </Button>
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

      {/* Wallet Selector Dialog */}
      <Dialog open={showWalletSelector} onOpenChange={setShowWalletSelector}>
        <DialogContent className="bg-black/95 border border-white/10 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Choose Wallet
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Select a wallet to continue or connect a new one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Existing Wallets */}
            {wallets.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white/80">
                  Your Wallets
                </h3>
                <div
                  className={`space-y-2 ${
                    wallets.length > 2
                      ? "max-h-[200px] overflow-y-auto pr-2"
                      : ""
                  }`}
                >
                  {wallets.map((wallet) => (
                    <Card
                      key={wallet.address}
                      onClick={() => handleSwitchWallet(wallet)}
                      className={`p-4 cursor-pointer transition-all hover:bg-white/10 ${
                        wallet.address === address
                          ? "bg-white/10 border-white/30"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {getWalletDisplayName(wallet.walletClientType)}
                            </p>
                            <p className="text-xs text-white/60 font-mono">
                              {wallet.address.slice(0, 6)}...
                              {wallet.address.slice(-4)}
                            </p>
                          </div>
                        </div>
                        {wallet.address === address && (
                          <Check className="w-5 h-5 text-green-400" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Connect New Wallet */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/80">
                Or Connect New
              </h3>
              <Button
                onClick={handleConnectNewWallet}
                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                variant="outline"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect External Wallet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
