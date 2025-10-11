"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function SignUpForm() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "wallet">("details");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [walletConnected, setWalletConnected] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "details") {
      setStep("wallet");
    } else if (walletConnected) {
      // Mock signup - redirect to home
      router.push("/home");
    }
  };

  const connectWallet = () => {
    // Mock wallet connection
    setWalletConnected(true);
    setTimeout(() => {
      router.push("/home");
    }, 1000);
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
                    Full name
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="h-14 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/40"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white/80">
                    Phone number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+44 7700 900000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="h-14 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/40"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="h-14 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/40"
                    required
                  />
                </div>

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
                  Secure your account with a crypto wallet
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={connectWallet}
                  disabled={walletConnected}
                  className="w-full h-20 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white justify-start px-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">
                        {walletConnected ? "Wallet Connected" : "MetaMask"}
                      </div>
                      <div className="text-sm text-white/60">
                        {walletConnected
                          ? "Successfully connected"
                          : "Connect with MetaMask"}
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => router.push("/home")}
                  className="w-full text-white/60 hover:text-white hover:bg-white/5"
                >
                  Skip for now
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
