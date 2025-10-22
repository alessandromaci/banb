"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Check, Wallet, Sparkles, Crown } from "lucide-react";

export default function UpgradePage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<
    "free" | "pro" | "ambassador"
  >("pro");

  const plans = {
    free: {
      id: "free",
      name: "Free",
      price: "Always free",
      icon: Wallet,
      logoStyle: "outline", // white outline
      features: [
        "All the core features included to send, invest, and spend your stablecoins.",
        "Limited number of BANB AI requests per month",
        "Access to one spending and investment account",
      ],
      cta: "You're on this plan",
      disabled: true,
    },
    pro: {
      id: "pro",
      name: "Pro",
      price: "$3.99 / month",
      icon: Sparkles,
      logoStyle: "gradient", // blue→violet gradient
      features: [
        "No gas fees up to 100 transactions per month",
        "Access to more investment opportunities",
        "Extended number of BANB AI requests per month",
        "Access to analytics and tax reports",
        "Priority support",
      ],
      cta: "Upgrade to Pro",
      disabled: false,
    },
    ambassador: {
      id: "ambassador",
      name: "Ambassador",
      price: "$39.99 one-time",
      icon: Crown,
      logoStyle: "metallic", // metallic purple-gold
      features: [
        "Lifetime Pro benefits",
        "Dedicated support line",
        "Access to private Telegram group to shape BANB's roadmap",
        "Early access to future BANB products",
      ],
      cta: "Join as Ambassador",
      disabled: false,
    },
  };

  const currentPlan = plans[selectedPlan];
  const Icon = currentPlan.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-indigo-950 text-white">
      <div className="mx-auto max-w-md px-6 py-8">
        {/* Header */}
        <div className="mb-10 ml-2 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white pl-2">Plans</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/home")}
            className="text-white hover:bg-white/10 rounded-full"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex justify-center gap-3 mb-8">
          {(["free", "pro", "ambassador"] as const).map((planId) => (
            <button
              key={planId}
              onClick={() => setSelectedPlan(planId)}
              className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 ${
                selectedPlan === planId
                  ? "bg-white/20 text-white shadow-lg"
                  : "bg-transparent text-white/50 hover:text-white/80"
              }`}
            >
              {plans[planId].name}
            </button>
          ))}
        </div>

        <div className="mb-8 transition-all duration-500 ease-in-out">
          <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
            {/* Plan Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {currentPlan.name}
                </h2>
                <p className="text-base text-white/70">{currentPlan.price}</p>
              </div>

              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                  currentPlan.logoStyle === "outline"
                    ? "border-2 border-white/40 bg-transparent"
                    : currentPlan.logoStyle === "gradient"
                    ? "bg-gradient-to-br from-[#3B1EFF] to-[#7B4CFF]"
                    : "bg-gradient-to-br from-purple-600 to-amber-500"
                }`}
              >
                <Icon
                  className={`h-10 w-10 ${
                    currentPlan.logoStyle === "outline"
                      ? "text-white/60"
                      : "text-white"
                  }`}
                />
              </div>
            </div>

            {/* Features List */}
            <ul className="space-y-4 mb-8">
              {currentPlan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white/80 text-sm leading-relaxed">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              disabled={currentPlan.disabled}
              className={`w-full rounded-2xl py-6 text-base font-semibold transition-all duration-300 ${
                currentPlan.disabled
                  ? "bg-white/10 text-white/40 cursor-not-allowed"
                  : currentPlan.logoStyle === "gradient"
                  ? "bg-white text-black hover:bg-white/90"
                  : currentPlan.logoStyle === "metallic"
                  ? "bg-gradient-to-r from-purple-600 to-amber-500 text-white hover:opacity-90 shadow-lg shadow-purple-500/30"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {currentPlan.cta}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
