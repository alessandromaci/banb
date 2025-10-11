"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AudioLines,
  ArrowDown,
  BarChart3,
  Menu,
  Plus,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sdk } from "@farcaster/miniapp-sdk";
import { useAccount } from "wagmi";
import { useUSDCBalance } from "@/lib/payments";
import { useUser } from "@/lib/user-context";

export function BankingHome() {
  const [, setActiveTab] = useState("home");
  const router = useRouter();
  const { address } = useAccount();
  const { formattedBalance, isLoading: balanceLoading } =
    useUSDCBalance(address);
  const { profile, isLoading: profileLoading } = useUser();

  useEffect(() => {
    // Call sdk.actions.ready() to hide the splash screen
    const initializeSDK = async () => {
      try {
        await sdk.actions.ready();
        console.log("Farcaster SDK ready - splash screen hidden");
      } catch (error) {
        console.error("Failed to initialize Farcaster SDK:", error);
      }
    };

    initializeSDK();
  }, []);

  // Redirect to login if no profile
  useEffect(() => {
    if (!profileLoading && !profile) {
      router.push("/login");
    }
  }, [profile, profileLoading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#5B4FE8] via-[#4A3FD8] to-[#1E1B3D] text-white">
      {/* Mobile Container */}
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="pt-3 px-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white/20">
                <AvatarFallback className="bg-white/10 text-white">
                  {profile?.name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="font-semibold">
                  {profile?.name || "Loading..."}
                </div>
                <div className="text-xs text-white/60">@{profile?.handle}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Balance Section */}
          <div className="text-center mb-2">
            <div className="text-sm text-white/70 mb-2">Balance</div>
            <div className="text-5xl font-bold mb-2">
              {balanceLoading
                ? "$..."
                : formattedBalance !== undefined
                ? `$${formattedBalance}`
                : "$0.00"}
            </div>
            {address && (
              <div className="text-xs text-white/50">
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            )}
          </div>

          <div className="h-6" />

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="flex flex-col items-center gap-2">
              <Button
                size="icon"
                disabled
                className="h-14 w-14 rounded-full bg-white/5 text-white/30 border-0 cursor-not-allowed"
              >
                <Plus className="h-6 w-6" />
              </Button>
              <span className="text-xs text-white/40">Add money</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button
                size="icon"
                disabled
                className="h-14 w-14 rounded-full bg-white/5 text-white/30 border-0 cursor-not-allowed"
              >
                <ArrowDown className="h-6 w-6" />
              </Button>
              <span className="text-xs text-white/40">Withdraw</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={() => {
                  setActiveTab("payments");
                  router.push("/payments");
                }}
                size="icon"
                className="h-14 w-14 rounded-full bg-white/15 hover:bg-white/25 text-white border-0"
              >
                <Send className="h-6 w-6" />
              </Button>
              <span className="text-xs text-white/90">Send money</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button
                size="icon"
                className="h-14 w-14 rounded-full bg-white/15 hover:bg-white/25 text-white border-0"
              >
                <MoreHorizontal className="h-6 w-6" />
              </Button>
              <span className="text-xs text-white/90">More</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-8">
            <Input
              placeholder="Ask anything"
              className="pl-4 bg-white/10 border-white/20 text-white placeholder:text-white/60 h-12 rounded-2xl"
            />
            <AudioLines className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
          </div>

          {/* Transactions Card */}
          <Card className="bg-[#2A2640] border-0 rounded-3xl p-4 mb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-[#00704A] flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                      <div className="h-6 w-6 rounded-full bg-[#00704A]" />
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-white">Starbucks</div>
                    <div className="text-sm text-white/60">16:30</div>
                  </div>
                </div>
                <div className="font-medium text-white">-£3.25</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-[#FF5A5F] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="white" className="h-6 w-6">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm6.5 16.5c-.3.5-.9.7-1.4.4-3.8-2.3-8.6-2.8-14.2-1.5-.5.1-1.1-.2-1.2-.7-.1-.5.2-1.1.7-1.2 6.1-1.4 11.4-.8 15.6 1.7.5.3.7.9.5 1.3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-white">AirBnB</div>
                    <div className="text-sm text-white/60">16:30</div>
                  </div>
                </div>
                <div className="font-medium text-white">-£3.25</div>
              </div>

              <Button
                variant="ghost"
                className="w-full text-white/80 hover:text-white hover:bg-white/5"
              >
                See all
              </Button>
            </div>
          </Card>
        </div>

        {/* Bottom Spacer for Navigation */}
        <div className="h-20" />
      </div>
    </div>
  );
}
