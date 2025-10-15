"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { getInvestmentOption, type InvestmentOption } from "@/lib/investments";
import { useInvestmentPayment } from "@/lib/investment-payments";
import { useUser } from "@/lib/user-context";

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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60">Missing investment information</p>
          <Link href="/home">
            <Button className="mt-4">Go Back</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
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
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Review Investment</h1>
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="p-6">
          {(error || investmentError) && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error || investmentError}
            </div>
          )}

          <div className="flex-1 flex flex-col justify-center">
            <Card className="bg-[#2A2640] border-0 rounded-3xl p-6 space-y-6">
              <div>
                <div className="text-white/60 text-sm mb-1">Investment</div>
                <div className="text-white text-lg font-medium">
                  {investmentOption.name}
                </div>
                <div className="text-white/50 text-sm">
                  {investmentOption.description}
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div>
                <div className="text-white/60 text-sm mb-1">Amount</div>
                <div className="text-white text-3xl font-light">
                  ${amount} <span className="text-lg text-white/70">USDC</span>
                </div>
                <div className="text-white/50 text-sm mt-1">No fees</div>
              </div>

              <div className="h-px bg-white/10" />

              <div>
                <div className="text-white/60 text-sm mb-1">Expected APR</div>
                <div className="text-white text-2xl font-semibold text-green-400">
                  {investmentOption.apr}%
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div>
                <div className="text-white/60 text-sm mb-1">From</div>
                <div className="text-white flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-xs flex-shrink-0">
                    W
                  </span>
                  <span>Main (USDC)</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="p-6 pt-0">
          <Button
            onClick={handleInvest}
            disabled={isLoading || !profile}
            className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 text-base font-medium disabled:opacity-50"
          >
            {isLoading
              ? "Processing Investment..."
              : !profile
              ? "Please log in"
              : "Invest Now"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function InvestmentReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <InvestmentReviewContent />
    </Suspense>
  );
}
