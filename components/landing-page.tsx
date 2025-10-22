"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { sdk } from "@farcaster/miniapp-sdk";
import { usePrivySafe as usePrivy, useWalletsSafe as useWallets } from "@/lib/use-privy-safe";
import { useLoginToMiniAppSafe as useLoginToMiniApp } from "@/lib/use-privy-safe";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";

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
  const {
    login: privyLogin,
    ready: privyReady,
    authenticated,
    logout,
  } = usePrivy();
  const { wallets } = useWallets();
  const { initLoginToMiniApp, loginToMiniApp } = useLoginToMiniApp();
  const router = useRouter();

  // Only redirect after user clicks button (counter = 1)
  useEffect(() => {
    if (
      userInteractionCount === 1 &&
      authenticated &&
      privyReady &&
      wallets.length > 0
    ) {
      console.log(
        "✅ User clicked, wallet ready, redirecting to check-profile"
      );
      setIsRedirecting(true);

      // Show success animation for 1.5s before redirect
      const timer = setTimeout(() => {
        console.log("🔄 Executing redirect to check-profile");
        router.push("/check-profile");
      }, 1500);

      return () => {
        console.log("🧹 Cleanup: clearing redirect timer");
        clearTimeout(timer);
      };
    }
  }, [userInteractionCount, authenticated, privyReady, wallets.length, router]);

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

  const handleLogin = async () => {
    // Increment counter to indicate user clicked
    console.log(
      "🖱️ User clicked button, counter:",
      userInteractionCount,
      "→",
      userInteractionCount + 1
    );
    setUserInteractionCount(1);

    // If already authenticated with wallet, redirect will happen via useEffect
    if (authenticated && wallets.length > 0) {
      console.log("✅ Already authenticated, will redirect via useEffect");
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
                disabled={!privyReady || isRedirecting}
                className="w-full rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 h-12 sm:h-14 text-sm sm:text-base font-semibold relative flex items-center justify-center gap-2"
              >
                {isRedirecting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : !privyReady ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : authenticated && wallets.length > 0 ? (
                  <>
                    <div className="font-sans font-bold text-base flex items-center gap-2">
                      <div>Log In</div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        <span className="text-xs text-green-300 font-mono">
                          {wallets[0]?.address?.slice(0, 6)}...
                          {wallets[0]?.address?.slice(-3)}
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

          {/* Show disconnect option when wallet is connected */}
          {authenticated && wallets.length > 0 && !isRedirecting && (
            <div className="flex justify-center">
              <button
                onClick={logout}
                className="text-xs font-sans text-white/60 hover:text-white/80 underline"
              >
                I want to use a different wallet
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
    </div>
  );
}
