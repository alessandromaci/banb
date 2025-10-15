"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInvestmentOptions, type InvestmentOption } from "@/lib/investments";

export default function InvestmentSelectPage() {
  const router = useRouter();
  const investmentOptions = getInvestmentOptions();

  const handleSelectInvestment = (option: InvestmentOption) => {
    router.push(`/invest/amount?option=${option.id}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <Link href="/home">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Choose Investment</h1>
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {investmentOptions.map((option) => (
              <Card
                key={option.id}
                className="bg-white/5 border-white/10 p-6 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => handleSelectInvestment(option)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center overflow-hidden">
                        {option.logo ? (
                          <img
                            src={option.logo}
                            alt={option.name}
                            className="h-8 w-8 object-contain"
                          />
                        ) : (
                          <TrendingUp className="h-6 w-6 text-purple-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {option.name}
                        </h3>
                        <p className="text-sm text-white/60">
                          {option.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-green-400">
                        {option.apr}% APR
                      </div>
                      <Button
                        size="sm"
                        className="bg-purple-500 hover:bg-purple-600 text-white rounded-full px-6"
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
