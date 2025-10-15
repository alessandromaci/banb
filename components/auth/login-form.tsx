"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { getProfileByWallet } from "@/lib/profile";
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
        const profile = await getProfileByWallet(address);

        if (profile) {
          // Save profile to context
          setProfile(profile);
          // Redirect to home
          router.push("/home");
        } else {
          if (isMounted) {
            setError("No account found for this wallet. Please sign up first.");
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
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
            <span className="font-bold">B</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-8">
          <div className="mx-auto max-w-md space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Welcome back</h1>
              <p className="text-white/60">Connect your wallet to log in</p>
            </div>

            <div className="space-y-4">
              {!isMounted ? (
                // Show loading state during hydration
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                    <div>
                      <p className="font-semibold text-white">Loading...</p>
                      <p className="text-sm text-white/60">Please wait</p>
                    </div>
                  </div>
                </div>
              ) : !isConnected ? (
                <>
                  {/* Farcaster Wallet Option */}
                  <Button
                    onClick={() => connectWallet("farcaster")}
                    disabled={isConnecting}
                    className="w-full h-20 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white justify-start px-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                        {isConnecting &&
                        connectingConnectorId === "farcaster" ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <Wallet className="h-6 w-6" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Farcaster Wallet</div>
                        <div className="text-sm text-white/60">
                          For Farcaster users
                        </div>
                      </div>
                    </div>
                  </Button>

                  {/* Porto Wallet Option */}
                  <Button
                    onClick={() => connectWallet("xyz.ithaca.porto")}
                    disabled={isConnecting}
                    className="w-full h-20 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white justify-start px-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                        {isConnecting &&
                        connectingConnectorId === "xyz.ithaca.porto" ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <Wallet className="h-6 w-6" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Porto Wallet</div>
                        <div className="text-sm text-white/60">
                          Use your email wallet
                        </div>
                      </div>
                    </div>
                  </Button>
                </>
              ) : (
                <>
                  {isLoggingIn ? (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                        <div>
                          <p className="font-semibold text-white">
                            Loading your profile...
                          </p>
                          <p className="text-sm text-white/60">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-6 w-6 text-green-400" />
                        <div>
                          <p className="font-semibold text-white">
                            Wallet Connected
                          </p>
                          <p className="text-sm text-white/60">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                  {error.includes("No account found") && (
                    <Link
                      href="/signup"
                      className="text-sm text-white underline mt-2 inline-block"
                    >
                      Create an account instead
                    </Link>
                  )}
                </div>
              )}
            </div>

            <p className="text-center text-sm text-white/60">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-white underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
