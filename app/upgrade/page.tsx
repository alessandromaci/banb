"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Check, Sparkles, Crown, Zap } from "lucide-react"

export default function UpgradePage() {
  const router = useRouter()
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "forever",
      icon: Zap,
      gradient: "from-gray-600 via-gray-700 to-gray-800",
      features: ["Basic transactions", "Standard support", "Limited AI insights", "Standard gas fees"],
      cta: "Current Plan",
      disabled: true,
    },
    {
      id: "premium",
      name: "Premium",
      price: "$3.99",
      period: "monthly",
      icon: Sparkles,
      gradient: "from-blue-500 via-purple-500 to-pink-500",
      features: [
        "0 gas fees on all transactions",
        "Advanced AI insights",
        "Early access to new features",
        "Premium support",
      ],
      cta: "Subscribe $3.99",
      popular: true,
    },
    {
      id: "ambassador",
      name: "Ambassador",
      price: "$39.99",
      period: "one-time",
      icon: Crown,
      gradient: "from-amber-500 via-orange-500 to-rose-500",
      features: [
        "Lifetime premium benefits",
        "Private Telegram group access",
        "Recognition badge",
        "Priority feature requests",
      ],
      cta: "Join Ambassador",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3B1EFF] via-[#5B3FFF] to-[#1A0F3D] text-white">
      <div className="mx-auto max-w-md px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mb-6 text-white hover:bg-white/10 rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Upgrade Your BANB Experience
          </h1>
          <p className="text-white/70 text-lg">Choose the plan that fits you.</p>
        </div>

        {/* Plans */}
        <div className="space-y-6 mb-24">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isHovered = hoveredPlan === plan.id

            return (
              <Card
                key={plan.id}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`relative bg-gradient-to-br ${plan.gradient} border-0 rounded-3xl p-6 shadow-xl transition-all duration-300 ${
                  isHovered ? "scale-[1.02] shadow-2xl" : ""
                } ${plan.popular ? "ring-2 ring-white/30" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-purple-600 px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                    MOST POPULAR
                  </div>
                )}

                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-6 w-6 text-white" />
                      <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-white/70 text-sm">/ {plan.period}</span>
                    </div>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-white/90 text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  disabled={plan.disabled}
                  className={`w-full rounded-xl font-semibold transition-all duration-300 ${
                    plan.disabled
                      ? "bg-white/20 text-white/50 cursor-not-allowed"
                      : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                  } ${isHovered && !plan.disabled ? "shadow-lg shadow-white/20" : ""}`}
                >
                  {plan.cta}
                </Button>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
