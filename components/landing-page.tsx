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

const slides = [
  {
    title: "ENTER THE FUTURE OF MONEY",
    background: "lightspeed",
  },
  {
    title: "BUILT ON-CHAIN WITH STABLECOINS",
    background: "particles",
  },
  {
    title: "EXPERIENCE YOUR FINANCES WITH AI",
    background: "waves",
  },
  {
    title: "SIMPLICITY AND SECURITY FIRST",
    background: "grid",
  },
];

export function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isInsideFarcaster, setIsInsideFarcaster] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [userInteractionCount, setUserInteractionCount] = useState(0);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const {
    login: privyLogin,
    ready: privyReady,
    authenticated,
    logout,
    connectWallet: privyConnectWallet,
  } = usePrivy();
  const { wallets } = useWallets();
  const { address } = useAccount(); // Safe wrapper handles WagmiProvider not ready
  const { setActiveWallet } = useSetActiveWallet();
  const { initLoginToMiniApp, loginToMiniApp } = useLoginToMiniApp();
  const router = useRouter();

  // Simple redirect: Trust Privy to handle wallet activation
  useEffect(() => {
    if (
      userInteractionCount === 1 &&
      authenticated &&
      privyReady &&
      address // Active wallet from wagmi (Privy's choice)
    ) {
      console.log(
        "✅ User clicked, redirecting to check-profile with:",
        address
      );
      setIsRedirecting(true);

      // Show loading animation for 1s before redirect
      const timer = setTimeout(() => {
        router.push("/check-profile");
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [userInteractionCount, authenticated, privyReady, address, router]);

  // Debug: Log authentication state changes
  useEffect(() => {
    console.log("🔄 Auth state changed:", {
      authenticated,
      walletsCount: wallets.length,
      walletAddresses: wallets.map((w) => w.address),
      activeWagmiAddress: address, // The address wagmi is using
      privyReady,
      userInteractionCount,
    });
  }, [authenticated, wallets, address, privyReady, userInteractionCount]);

  // Initialize Farcaster SDK and detect environment
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        await sdk.actions.ready();

        // Check if we're inside Farcaster
        const context = await Promise.resolve(sdk.context);
        console.log("🎯 Farcaster context:", context);

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
          console.log("✅ Running inside Farcaster mini app", {
            fid: context.user.fid,
            clientFid: context.client.clientFid,
          });
          setIsInsideFarcaster(true);
        } else {
          console.log("❌ Not in Farcaster environment", {
            hasUserFid,
            hasFarcasterClient,
            userFid: context?.user?.fid,
            clientFid: context?.client?.clientFid,
          });
          setIsInsideFarcaster(false);
        }
      } catch (error) {
        console.error("Failed to initialize Farcaster SDK:", error);
        setIsInsideFarcaster(false);
      }
    };

    initializeSDK();
  }, []);

  // Note: We detect Farcaster environment but don't auto-login
  // This keeps the flow simple and user-driven

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Handle wallet switching
  const handleSwitchWallet = async (wallet: ConnectedWallet) => {
    try {
      console.log("🔄 Switching to wallet:", wallet.address);
      await setActiveWallet(wallet);
      setShowWalletSelector(false);
      toast({
        title: "Wallet switched",
        description: `Now using ${wallet.address.slice(
          0,
          6
        )}...${wallet.address.slice(-4)}`,
      });
    } catch (error) {
      console.error("❌ Failed to switch wallet:", error);
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

  const handleLogin = async () => {
    // Increment counter to indicate user clicked
    console.log(
      "🖱️ User clicked button, counter:",
      userInteractionCount,
      "→",
      userInteractionCount + 1
    );
    setUserInteractionCount(1);

    // Debug: Check authentication state
    console.log("🔍 Auth Debug:", {
      authenticated,
      walletsCount: wallets.length,
      walletAddresses: wallets.map((w) => w.address),
      activeWagmiAddress: address,
      privyReady,
    });

    // If already authenticated with wallet, redirect will happen via useEffect
    if (authenticated && address) {
      console.log(
        "✅ Already authenticated with address, will redirect via useEffect"
      );
      return;
    }

    // If authenticated but no address, set counter and wait for address to load
    // (The useEffect with timeout will handle if it doesn't load)
    if (authenticated && !address) {
      console.log("⚠️ Authenticated but no address loaded yet, waiting...");
      // Counter is already incremented, just return and let useEffect handle it
      return;
    }

    console.log("🔐 Connect Wallet clicked");
    console.log("📱 Is inside Farcaster:", isInsideFarcaster);
    console.log("✅ Privy ready:", privyReady);

    // Check if Privy is ready
    if (!privyReady) {
      console.warn("⚠️ Privy not ready yet, waiting...");
      return;
    }

    try {
      // SCENARIO 1: Inside Farcaster - use proper Mini App authentication
      if (isInsideFarcaster) {
        console.log("🔐 Farcaster Mini App login with nonce flow");
        try {
          // Step 1: Get nonce from Privy
          const { nonce } = await initLoginToMiniApp();
          console.log("✅ Got nonce:", nonce);

          // Step 2: Request signature from Farcaster
          const result = await sdk.actions.signIn({ nonce });
          console.log("✅ Got signature from Farcaster");

          // Step 3: Authenticate with Privy
          await loginToMiniApp({
            message: result.message,
            signature: result.signature,
          });
          console.log("✅ Authenticated with Privy");
          // Auto-redirect happens via useEffect
        } catch (loginError) {
          console.error("❌ Farcaster login failed:", loginError);
        }
        return;
      }

      // SCENARIO 2: Outside Farcaster - open standard Privy modal
      console.log("🔌 Opening Privy connect modal");

      try {
        await privyLogin();
        console.log("✅ Wallet connected, will auto-redirect");
        // Auto-redirect happens via useEffect
      } catch (loginError: unknown) {
        const error = loginError as Error;

        // SPECIAL CASE: User is already logged in (session persisted)
        if (error?.message?.includes("already logged in")) {
          console.log("✅ Session already active, redirecting immediately");
          // User is already authenticated, just redirect
          router.push("/check-profile");
          return;
        }

        console.error("❌ Wallet connection error:", {
          message: error?.message,
          name: error?.name,
          cause: error?.cause,
          stack: error?.stack,
          full: loginError,
        });

        // Check if it's just a cancellation
        if (
          error?.message?.includes("abort") ||
          error?.message?.includes("cancel") ||
          error?.name === "AbortError"
        ) {
          console.log("ℹ️ User cancelled or modal closed");
        } else {
          // Log the full error for debugging
          console.error("🔥 Authentication failed:", loginError);

          // Provide specific error hints
          if (
            error?.message?.includes("domain") ||
            error?.message?.includes("Domain")
          ) {
            console.error(
              "💡 HINT: Add 'http://localhost:3000' to your Privy Dashboard → Settings → Domains"
            );
          }
          if (
            error?.message?.includes("chain") ||
            error?.message?.includes("Chain")
          ) {
            console.error(
              "💡 HINT: Make sure your wallet is on Base network (Chain ID: 8453)"
            );
          }
          if (
            error?.message?.includes("400") ||
            error?.message?.includes("Bad Request")
          ) {
            console.error(
              "💡 HINT: Clear your browser cache and restart the dev server"
            );
            console.error(
              "💡 HINT: Verify domains are configured in Privy Dashboard"
            );
          }
        }
      }
    } catch (error) {
      console.error("❌ Unexpected login error:", error);
    }
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black touch-none flex flex-col text-white">
      {/* Animated Backgrounds */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentSlide === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className={`animated-bg ${slide.background}`} />
          </div>
        ))}
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-6">
        {/* Header */}
        <div className="flex items-center gap-2 pt-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
            {/* <span className="font-bold text-white">BANB</span> */}
            <Image
              src="/banb-white-icon.png"
              alt="BANB"
              className="h-4 w-4"
              width={16}
              height={16}
            />
          </div>
          <span className="text-sm text-white/80 font-bold font-sans text-2xl">
            BANB
          </span>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md space-y-8">
            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    currentSlide === index
                      ? "w-8 bg-white"
                      : "w-1.5 bg-white/30"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            <h1 className="text-4xl font-bold leading-tight text-white text-balance text-center">
              {slides[currentSlide].title}
            </h1>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="space-y-3 pb-2">
          <div className="flex justify-center w-full gap-4">
            <div className="w-full">
              <Button
                size="lg"
                variant="ghost"
                onClick={handleLogin}
                disabled={
                  !privyReady || isRedirecting || (authenticated && !address)
                }
                className="w-full rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 h-12 sm:h-14 text-sm sm:text-base font-semibold relative flex items-center justify-center gap-2"
              >
                {isRedirecting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : !privyReady ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : authenticated && !address ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </>
                ) : authenticated && address ? (
                  <>
                    <div className="font-sans font-bold text-base flex items-center gap-2">
                      <div>Log In</div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        <span className="text-xs text-green-300 font-mono">
                          {address.slice(0, 6)}...
                          {address.slice(-3)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </Button>
            </div>
          </div>

          {/* Show wallet selector option when wallet is connected */}
          {authenticated && address && !isRedirecting && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowWalletSelector(true)}
                className="text-xs font-sans text-white/60 hover:text-white/80 underline"
              >
                Use a different wallet
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="w-full py-6 px-6 z-10">
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
        .animated-bg {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
        }

        .lightspeed {
          background: radial-gradient(
            ellipse at center,
            #1a1a2e 0%,
            #000000 100%
          );
          animation: lightspeed 20s linear infinite;
        }

        .lightspeed::before {
          content: "";
          position: absolute;
          top: 30%;
          left: 50%;
          width: 200%;
          height: 200%;
          background: repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(59, 130, 246, 0.1) 2px,
              rgba(59, 130, 246, 0.1) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(34, 197, 94, 0.1) 2px,
              rgba(34, 197, 94, 0.1) 4px
            );
          transform: translate(-50%, -50%) perspective(500px) rotateX(60deg);
          animation: zoom 3s ease-in-out infinite;
        }

        .particles {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          animation: particles 15s ease-in-out infinite;
        }

        .particles::before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: radial-gradient(
              circle at 20% 50%,
              rgba(255, 255, 255, 0.1) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 80% 80%,
              rgba(255, 255, 255, 0.1) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 40% 20%,
              rgba(255, 255, 255, 0.1) 0%,
              transparent 50%
            );
          animation: float 8s ease-in-out infinite;
        }

        .waves {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .waves::before {
          content: "";
          position: absolute;
          width: 200%;
          height: 200%;
          background: repeating-linear-gradient(
            60deg,
            transparent,
            transparent 50px,
            rgba(255, 255, 255, 0.05) 50px,
            rgba(255, 255, 255, 0.05) 100px
          );
          animation: wave 10s linear infinite;
        }

        .grid {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .grid::before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: linear-gradient(
              rgba(255, 255, 255, 0.05) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.05) 1px,
              transparent 1px
            );
          background-size: 50px 50px;
          animation: gridMove 20s linear infinite;
        }

        @keyframes zoom {
          0%,
          100% {
            transform: translate(-50%, -50%) perspective(500px) rotateX(60deg)
              scale(1);
          }
          50% {
            transform: translate(-50%, -50%) perspective(500px) rotateX(60deg)
              scale(1.5);
          }
        }

        @keyframes lightspeed {
          0% {
            filter: hue-rotate(0deg);
          }
          100% {
            filter: hue-rotate(360deg);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes particles {
          0%,
          100% {
            filter: hue-rotate(0deg) brightness(1);
          }
          50% {
            filter: hue-rotate(30deg) brightness(1.2);
          }
        }

        @keyframes wave {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
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
