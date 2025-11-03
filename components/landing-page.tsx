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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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

        {/* Main Content - Simplified FOMO Style */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md space-y-6 text-center">
            {/* Logo Elements - Scattered decorative elements */}
            <div className="flex items-center justify-center gap-3 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm opacity-60"
                  style={{
                    transform: `rotate(${i * 22.5}deg) translateY(${
                      i % 2 === 0 ? "10px" : "-10px"
                    })`,
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Buttons - Email-First Flow */}
        <div className="space-y-3 pb-2">
          {/* Sign in with Apple */}
          <Button
            size="lg"
            onClick={() => handleLoginWithProvider("apple")}
            disabled={!privyReady || oauthLoading || isRedirecting}
            className="w-full rounded-xl bg-white text-black hover:bg-gray-100 h-14 text-base font-semibold relative flex items-center justify-center gap-2 transition-all"
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
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
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
            className="w-full rounded-xl bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] h-14 text-base font-semibold relative flex items-center justify-center gap-2 transition-all border border-white/10"
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
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
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

          {/* Legal text */}
          <p className="text-xs text-white/50 text-center px-4 font-sans">
            By continuing, you agree to our{" "}
            <Link href="/" className="underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
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
