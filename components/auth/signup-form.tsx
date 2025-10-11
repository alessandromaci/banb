"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Wallet, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { createProfile, getHandlePreview } from "@/lib/profile";
import { useUser } from "@/lib/user-context";

export function SignUpForm() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "wallet">("details");
  const [formData, setFormData] = useState({
    name: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { setProfile } = useUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (step === "details") {
      setStep("wallet");
    }
  };

  const handleCreateProfile = async () => {
    if (!address || !isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    if (!formData.name.trim()) {
      setError("Please enter your name");
      return;
    }

    setError(null);
    setIsCreatingProfile(true);

    try {
      const profile = await createProfile({
        name: formData.name,
        wallet_address: address,
      });

      // Save profile to context
      setProfile(profile);

      // Redirect to home
      router.push("/home");
    } catch (err) {
      console.error("Failed to create profile:", err);
      setError(err instanceof Error ? err.message : "Failed to create profile");
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const connectWallet = () => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
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
          {step === "details" ? (
            <div className="mx-auto max-w-md space-y-8">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Create your account</h1>
                <p className="text-white/60">
                  Join millions managing their money better
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white/80">
                    Your name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="h-14 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/40"
                    required
                  />
                  <p className="text-xs text-white/50">
                    Your handle will be: {getHandlePreview(formData.name)}
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full bg-white text-black hover:bg-white/90 h-14 text-base font-semibold mt-6"
                >
                  Continue
                </Button>
              </form>

              <p className="text-center text-sm text-white/60">
                Already have an account?{" "}
                <Link href="/login" className="text-white underline">
                  Log in
                </Link>
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-md space-y-8">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Connect your wallet</h1>
                <p className="text-white/60">
                  Connect your Farcaster wallet to create your profile
                </p>
              </div>

              <div className="space-y-4">
                {!isConnected ? (
                  <Button
                    onClick={() => connect({ connector: connectors[0] })}
                    disabled={isConnecting}
                    className="w-full h-20 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white justify-start px-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                        {isConnecting ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <Wallet className="h-6 w-6" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">
                          {isConnecting ? "Connecting..." : "Farcaster Wallet"}
                        </div>
                        <div className="text-sm text-white/60">
                          {isConnecting
                            ? "Please approve in your wallet"
                            : "Connect with Farcaster"}
                        </div>
                      </div>
                    </div>
                  </Button>
                ) : (
                  <>
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

                    {error && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-sm text-red-400">{error}</p>
                      </div>
                    )}

                    <Button
                      onClick={handleCreateProfile}
                      disabled={isCreatingProfile}
                      size="lg"
                      className="w-full rounded-full bg-white text-black hover:bg-white/90 h-14 text-base font-semibold"
                    >
                      {isCreatingProfile ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Creating Profile...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </>
                )}

                <Button
                  variant="ghost"
                  onClick={() => setStep("details")}
                  className="w-full text-white/60 hover:text-white hover:bg-white/5"
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
