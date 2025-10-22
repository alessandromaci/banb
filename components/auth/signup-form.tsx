"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProfile, getProfileByWallet } from "@/lib/profile";
import { useUser } from "@/lib/user-context";

export function SignUpForm() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "wallet">("details");
  const [formData, setFormData] = useState({
    name: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [connectingConnectorId, setConnectingConnectorId] = useState<
    string | null
  >(null);
  const [connectedWalletType, setConnectedWalletType] = useState<string | null>(
    null
  );
  const [existingWallet, setExistingWallet] = useState(false);
  const [isCheckingWallet, setIsCheckingWallet] = useState(false);
  const [profileCreated, setProfileCreated] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { setProfile } = useUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (step === "details") {
      if (isConnected && !connectedWalletType) {
        disconnect();
      }
      setExistingWallet(false);
      setStep("wallet");
    }
  };

  const connectWallet = (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId);

    if (connector) {
      setConnectingConnectorId(connectorId);
      connect({ connector });
    } else {
      console.error(
        `Connector "${connectorId}" not found. Available IDs:`,
        connectors.map((c) => c.id)
      );
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setExistingWallet(false);
    setError(null);
    setConnectedWalletType(null);
  };

  useEffect(() => {
    if (isConnected && connectingConnectorId) {
      setConnectedWalletType(connectingConnectorId);
      setConnectingConnectorId(null);
    }
  }, [isConnected, connectingConnectorId]);

  useEffect(() => {
    const checkExistingWallet = async () => {
      if (step === "details" && isConnected && address) {
        try {
          const existingProfile = await getProfileByWallet(address);
          setExistingWallet(!!existingProfile);
        } catch (err) {
          console.error("Error checking wallet:", err);
        }
      } else if (step === "details") {
        setExistingWallet(false);
      }
    };

    checkExistingWallet();
  }, [step, isConnected, address]);

  useEffect(() => {
    const checkWalletAndCreateProfile = async () => {
      if (
        step === "wallet" &&
        isConnected &&
        address &&
        formData.name.trim() &&
        connectedWalletType &&
        !profileCreated
      ) {
        setIsCheckingWallet(true);
        try {
          const existingProfile = await getProfileByWallet(address);
          if (existingProfile) {
            setExistingWallet(true);
          } else {
            setExistingWallet(false);
            setError(null);
            setIsCreatingProfile(true);

            try {
              const profile = await createProfile({
                name: formData.name,
                wallet_address: address,
              });

              setProfileCreated(true);
              setProfile(profile);
              router.push("/home");
            } catch (err) {
              console.error("Failed to create profile:", err);
              setError(
                err instanceof Error ? err.message : "Failed to create profile"
              );
            } finally {
              setIsCreatingProfile(false);
            }
          }
        } catch (err) {
          console.error("Error checking wallet:", err);
        } finally {
          setIsCheckingWallet(false);
        }
      }
    };

    checkWalletAndCreateProfile();
  }, [
    step,
    isConnected,
    address,
    formData.name,
    connectedWalletType,
    profileCreated,
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
            onClick={() => setStep("details")}
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
                  existingWallet || error
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

            <p className="text-center text-sm text-white/60 font-sans">
              {existingWallet ? (
                <>
                  You already have an account.{" "}
                  <Link
                    href="/login"
                    className="text-white underline underline-offset-4"
                  >
                    Log in
                  </Link>
                </>
              ) : (
                <>We&apos;ll create an account if you don&apos;t have one.</>
              )}
            </p>
          </div>
        ) : (
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
              {!isConnected ? (
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
                            Porto — best for new users
                          </span>
                        </div>
                        <p className="text-xs text-white/60 whitespace-normal break-words leading-relaxed">
                          Create a new wallet securely with your email.
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
                        {isConnecting &&
                        connectingConnectorId === "farcaster" ? (
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
                          Connect instantly with your Farcaster profile.
                        </p>
                      </div>
                    </div>
                  </Button>
                </>
              ) : (
                <>
                  {isCheckingWallet ? (
                    <div
                      className={`p-6 rounded-xl border ${
                        connectedWalletType === "farcaster"
                          ? "bg-[#7C65C1]/40 border-[#7C65C1]/50"
                          : "bg-[#3B7FD9]/40 border-[#3B7FD9]/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-white" />
                        <p className="text-semibold text-white font-sans text-lg">
                          Creating your account...
                        </p>
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
                  ) : (
                    <>
                      {isCreatingProfile ? (
                        <div
                          className={`p-6 rounded-xl border relative overflow-hidden ${
                            connectedWalletType === "farcaster"
                              ? "bg-[#7C65C1]/40 border-[#7C65C1]/50"
                              : "bg-[#3B7FD9]/40 border-[#3B7FD9]/50"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-12 w-12 animate-spin text-white" />
                            <div className="text-center">
                              <p className="font-semibold text-white text-lg font-sans">
                                Creating your account...
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : error ? (
                        <>
                          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                            <p className="text-sm text-red-400 mb-3 font-sans">
                              {error}
                            </p>
                            <p className="text-xs text-white/60 font-sans">
                              Something went wrong creating your account. Please
                              try again or contact support if the issue
                              persists.
                            </p>
                          </div>
                          <Button
                            onClick={() => {
                              handleDisconnect();
                              setError(null);
                              setStep("details");
                            }}
                            size="lg"
                            className="w-full rounded-full bg-white text-black hover:bg-white/90 h-14 text-base font-semibold"
                          >
                            Start Again
                          </Button>
                        </>
                      ) : null}
                    </>
                  )}
                </>
              )}
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
