"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { getProfileByAnyWallet } from "@/lib/profile";
import { useUser } from "@/lib/user-context";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [connectingConnectorId, setConnectingConnectorId] = useState<
    string | null
  >(null);
  const [isMounted, setIsMounted] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { setProfile } = useUser();

  // Mount check to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset connecting state when connection completes
  useEffect(() => {
    if (isConnected && connectingConnectorId) {
      setConnectingConnectorId(null);
    }
  }, [isConnected, connectingConnectorId]);

  // Check for existing profile when wallet connects
  useEffect(() => {
    let isMounted = true;

    const checkProfile = async () => {
      if (!isConnected || !address || isLoggingIn) {
        return;
      }

      setIsLoggingIn(true);
      setError(null);

      try {
        // Check both primary wallet and linked accounts
        const profile = await getProfileByAnyWallet(address);

        if (profile) {
          // Save profile to context
          setProfile(profile);
          // Redirect to home
          router.push("/home");
        } else {
          if (isMounted) {
            setError("No account found for this wallet.");
            setIsLoggingIn(false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to login");
          setIsLoggingIn(false);
        }
      }
    };

    checkProfile();

    return () => {
      isMounted = false;
    };
  }, [isConnected, address, router, setProfile, isLoggingIn]);

  const connectWallet = (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId);

    if (connector) {
      setConnectingConnectorId(connectorId);
      setError(null);
      connect({ connector });
    } else {
      console.error(
        `Connector "${connectorId}" not found. Available IDs:`,
        connectors.map((c) => c.id)
      );
    }
  };

  return (
    <div className="h-dvh bg-black text-white flex flex-col relative overflow-hidden touch-none">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
          <span className="font-bold">B</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 overflow-y-auto">
        <div className="mx-auto max-w-md space-y-6 w-full">
          <div className="flex items-center justify-center">
            <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center p-2">
              <Wallet className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-sans text-center">
              Choose Wallet
            </h1>
            <p className="text-white/60 text-center text-sm font-sans px-4">
              Choose wallet to connect your account.
            </p>
          </div>

          <div className="space-y-4">
            {!isMounted ? (
              // Show loading state during hydration
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-white" />
                  <div>
                    <p className="text-semibold text-white font-sans text-lg">
                      Loading...
                    </p>
                  </div>
                </div>
              </div>
            ) : !isConnected ? (
              <>
                <Button
                  onClick={() => connectWallet("xyz.ithaca.porto")}
                  disabled={isConnecting}
                  className="w-full min-h-[5rem] h-auto py-4 rounded-xl bg-[#3B7FD9]/40 border border-[#3B7FD9]/50 hover:bg-[#3B7FD9]/80 text-white justify-start px-6 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 bottom-0 w-40 overflow-hidden opacity-0 group-hover:opacity-30 pointer-events-none transition-opacity duration-300">
                    <div className="absolute right-2 top-4 scale-[0.5] group-hover:scale-[3] transition-all duration-700 ease-out origin-top-right">
                      <Image
                        src="/porto-logo.svg"
                        alt=""
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-4 relative z-10 w-full">
                    <div className="flex h-12 w-12 items-center justify-center transition-all duration-300 relative flex-shrink-0">
                      {isConnecting &&
                      connectingConnectorId === "xyz.ithaca.porto" ? (
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      ) : (
                        <Image
                          src="/porto-logo.png"
                          alt="Porto"
                          width={40}
                          height={40}
                          className="object-contain"
                        />
                      )}
                    </div>
                    <div className="text-left flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-semibold text-sm sm:text-base whitespace-normal">
                          Porto Wallet
                        </span>
                      </div>
                      <p className="text-xs text-white/60 whitespace-normal break-words leading-relaxed">
                        Connect instantly with Porto.
                      </p>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => connectWallet("farcaster")}
                  disabled={isConnecting}
                  className="w-full min-h-[5rem] h-auto py-4 rounded-xl bg-[#7C65C1]/40 border border-[#7C65C1]/50 hover:bg-[#7C65C1]/80 text-white justify-start px-6 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 bottom-0 w-40 overflow-hidden opacity-0 group-hover:opacity-30 pointer-events-none transition-opacity duration-300">
                    <div className="absolute right-2 top-4 scale-[0.5] group-hover:scale-[3] transition-all duration-700 ease-out origin-top-right">
                      <Image
                        src="/farcaster-logo.svg"
                        alt=""
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-4 relative z-10 w-full">
                    <div className="flex h-12 w-12 items-center justify-center transition-all duration-300 relative flex-shrink-0">
                      {isConnecting && connectingConnectorId === "farcaster" ? (
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      ) : (
                        <Image
                          src="/farcaster-logo.png"
                          alt="Farcaster"
                          width={40}
                          height={40}
                          className="object-contain"
                        />
                      )}
                    </div>
                    <div className="text-left flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-semibold text-sm sm:text-base whitespace-normal">
                          Farcaster Wallet
                        </span>
                      </div>
                      <p className="text-xs text-white/60 whitespace-normal break-words leading-relaxed">
                        Connect with your Farcaster profile.
                      </p>
                    </div>
                  </div>
                </Button>

                <div className="text-center space-y-4">
                  <p className="text-sm text-white/60 font-sans">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/signup"
                      className="text-white underline underline-offset-4"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              <>
                {isLoggingIn ? (
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-white" />
                      <div>
                        <p className="text-semibold text-white font-sans text-lg">
                          {address?.slice(0, 6)}...{address?.slice(-4)}
                        </p>
                        <p className="text-xs text-white/60 font-sans">
                          Loading your profile...
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-10 w-10 text-green-400" />
                      <div>
                        <p className="text-semibold text-white font-sans text-lg">
                          {address?.slice(0, 6)}...{address?.slice(-4)}
                        </p>
                        <p className="text-xs text-white/60 font-sans">
                          Wallet connected
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="p-2 text-white/60 font-sans text-center">
                <p className="text-sm">
                  {error}{" "}
                  <Link href="/signup" className="underline underline-offset-4">
                    Sign up.
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
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
                  priority
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
