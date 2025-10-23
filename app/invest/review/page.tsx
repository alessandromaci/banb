"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { getInvestmentOption, type InvestmentOption } from "@/lib/investments";
import { useInvestmentPayment } from "@/lib/investment-payments";
import { useUser } from "@/lib/user-context";
import Image from "next/image";

function InvestmentReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const optionId = searchParams.get("option");
  const vaultAddress = searchParams.get("vault");
  const vaultName = searchParams.get("name");
  const amount = searchParams.get("amount");
  const { profile } = useUser();
  const {
    executeInvestment,
    isLoading,
    error: investmentError,
  } = useInvestmentPayment(profile?.id);

  const [investmentOption, setInvestmentOption] =
    useState<InvestmentOption | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (optionId) {
      const option = getInvestmentOption(optionId);
      setInvestmentOption(option || null);
    } else if (vaultAddress && vaultName) {
      // Create option for existing vault using real data
      setInvestmentOption({
        id: "existing-vault",
        name: decodeURIComponent(vaultName),
        description: "Add more funds to your existing investment",
        apr: 6.55, // Will be updated from database
        logo: "/morpho.svg",
        vault_address: vaultAddress,
        type: "morpho_vault",
      });
    }
  }, [optionId, vaultAddress, vaultName]);

  const handleInvest = async () => {
    if (!profile || !investmentOption || !amount) {
      setError("Missing required information");
      return;
    }

    try {
      const result = await executeInvestment({
        investment_name: investmentOption.name,
        investment_type: investmentOption.type,
        amount,
        vault_address:
          investmentOption.vault_address ||
          "0x0000000000000000000000000000000000000000",
        sender_profile_id: profile.id,
        apr: investmentOption.apr,
      });

      if (result.success) {
        // Redirect to investment status page using movement ID
        if (result.movementId) {
          router.push(`/invest/status/${result.movementId}`);
        } else {
          // Fallback to investment ID if movement ID not available
          router.push(`/invest/status/${result.investmentId}`);
        }
      } else {
        // Show error message for failed/cancelled transactions
        setError(result.error || "Investment failed");
      }
    } catch (err) {
      console.error("Investment failed:", err);
      setError(err instanceof Error ? err.message : "Investment failed");
    }
  };

  if (!investmentOption || !amount) {
    return (
      <div className="min-h-screen bg-[#0E0E0F] text-white flex flex-col">
        <div className="mx-auto max-w-md w-full flex flex-col h-screen">
          <div className="flex flex-col h-full px-6">
            <div className="flex-1 flex flex-col justify-center items-center">
              <p className="text-white/60 mb-4">
                Missing investment information
              </p>
              <Link href="/home">
                <Button className="bg-white text-black hover:bg-white/90">
                  Go Back
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-white flex flex-col">
      <div className="mx-auto max-w-md w-full flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-8">
          <h1 className="text-xl font-medium">Invest</h1>
          <Link
            href={
              optionId
                ? `/invest/amount?option=${optionId}`
                : `/invest/amount?vault=${vaultAddress}&name=${encodeURIComponent(
                    vaultName || ""
                  )}`
            }
          >
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10 rounded-full"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full px-6">
          {(error || investmentError) && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error || investmentError}
            </div>
          )}

          <div className="flex-1 flex flex-col justify-center items-center space-y-8">
            {/* Investment icon with check badge */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                {investmentOption.logo ? (
                  <Image
                    src={investmentOption.logo}
                    alt={investmentOption.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <TrendingUp className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center border-2 border-[#0E0E0F]">
                <Lock className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Confirmation text */}
            <div className="text-center">
              <h2 className="text-lg font-medium text-white/50 mb-2">
                Confirm investment in
              </h2>
              <p className="text-white font-sans font-medium font-bold text-2xl">
                {investmentOption.name}
              </p>
            </div>

            {/* Transaction details */}
            <div className="w-full space-y-4 font-sans">
              <div className="bg-[#2A2640] rounded-2xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Amount</span>
                  <span className="text-white">${amount} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Expected APR</span>
                  <span className="text-white font-semibold">
                    {investmentOption.apr}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Fees</span>
                  <span className="text-white">No fees</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pb-6">
            <Button
              onClick={handleInvest}
              disabled={isLoading || !profile}
              className="w-full h-14 rounded-full text-white text-base font-medium disabled:opacity-30 border-0"
              style={{
                backgroundColor:
                  !isLoading && profile ? "#3479FF" : "rgba(52, 121, 255, 0.3)",
              }}
            >
              {isLoading ? (
                "Processing Investment..."
              ) : !profile ? (
                "Please log in"
              ) : (
                <div className="flex items-center justify-center gap-2">
                  {investmentOption.logo && (
                    <Image
                      src="/morpho-logo-no-background.svg"
                      alt={investmentOption.name}
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain"
                    />
                  )}
                  <span>Confirm</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvestmentReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0E0E0F] flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <InvestmentReviewContent />
    </Suspense>
  );
}
