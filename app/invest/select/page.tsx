"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInvestmentOptions, type InvestmentOption } from "@/lib/investments";
import Image from "next/image";

export default function InvestmentSelectPage() {
  const router = useRouter();
  const investmentOptions = getInvestmentOptions();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSelectOption = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleConfirmSelection = (option: InvestmentOption) => {
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
          <div className="space-y-3">
            {investmentOptions.map((option) => {
              const isSelected = selectedOption === option.id;

              return (
                <div
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  className={`w-full px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white/10 ring-2 ring-purple-500/50"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {/* Header Line: Logo - Name - APR */}
                  <div className="flex items-center gap-3 mb-2">
                    {/* Logo */}
                    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {option.logo ? (
                        <Image
                          src={option.logo}
                          alt={option.name}
                          width={28}
                          height={28}
                          className="w-6 h-6 object-contain"
                        />
                      ) : (
                        <TrendingUp className="rounded-full bg-purple-500/20 w-5 h-5 text-purple-400" />
                      )}
                    </div>

                    {/* Vault Name */}
                    <h3 className="text-base font-semibold text-white flex-1 text-left">
                      {option.name}
                    </h3>

                    {/* APR */}
                    <span className="text-sm font-bold text-white">
                      {option.apr}% APR
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-white/50 text-left pl-2">
                    {option.description}
                  </p>

                  {/* Select Button - Only show when selected */}
                  {isSelected && (
                    <div className="mt-6 w-full flex items-center justify-center">
                      <Button
                        size="sm"
                        className="bg-purple-500 hover:bg-purple-600 text-white border-0 rounded-full px-6 py-2 text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmSelection(option);
                        }}
                      >
                        Select
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
