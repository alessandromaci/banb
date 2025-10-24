"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { getInvestmentOption, type InvestmentOption } from "@/lib/investments";
import { useInvestmentPayment } from "@/lib/investment-payments";
import { useUser } from "@/lib/user-context";
import { useAccountSafe as useAccount } from "@/lib/use-account-safe";
import { getAccountsByProfile } from "@/lib/accounts";
import { type Account } from "@/lib/supabase";
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
    pendingStep,
  } = useInvestmentPayment(profile?.id);

  const [investmentOption, setInvestmentOption] =
    useState<InvestmentOption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const { address } = useAccount();

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

  // Load current account
  useEffect(() => {
    const loadCurrentAccount = async () => {
      if (!profile?.id || !address) return;

      try {
        const accounts = await getAccountsByProfile(profile.id);
        const account = accounts.find(
          (acc) => acc.address.toLowerCase() === address.toLowerCase()
        );
        setCurrentAccount(account || null);
      } catch (error) {
        console.error("Failed to load account:", error);
      }
    };

    loadCurrentAccount();
  }, [profile?.id, address]);

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

          <div className="flex-1 flex flex-col justify-center items-center space-y-6">
            {/* Investment icon with check badge */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center border-2 border-[#0E0E0F]">
                <Lock className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Confirmation text */}
            <div className="text-center">
              <h2 className="text-base font-normal text-white/60 mb-2">
                Confirm transaction to
              </h2>
              <p className="text-white font-medium text-lg">
                {investmentOption.vault_address
                  ? `${investmentOption.vault_address.slice(
                      0,
                      6
                    )}...${investmentOption.vault_address.slice(-4)}`
                  : investmentOption.name}
              </p>
            </div>

            {/* Transaction details */}
            <div className="w-full space-y-3 font-sans">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Total Value</span>
                <span className="text-white">${amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Total USDC Value</span>
                <div className="flex items-center gap-1">
                  <Image
                    src="/usdc-logo.png"
                    alt="USDC"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                  <span className="text-white">{amount}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">From</span>
                <span className="text-white">
                  {currentAccount?.name || profile?.name || "Main"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">To</span>
                <span className="text-white font-mono text-xs">
                  {investmentOption.vault_address
                    ? `${investmentOption.vault_address.slice(
                        0,
                        6
                      )}...${investmentOption.vault_address.slice(-4)}`
                    : "Vault"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Network</span>
                <div className="flex items-center gap-1">
                  <Image
                    src="/usdc-logo.png"
                    alt="Base"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Base</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Fee Estimate</span>
                <span className="text-white">$0.01</span>
              </div>
            </div>
          </div>

          {/* Warning message */}
          <div className="text-center text-xs text-white/40 px-6 pb-4">
            Review the above before confirming.
            <br />
            Once sent, your transaction is irreversible.
          </div>

          {/* Action Button */}
          <div className="px-6 pb-6">
            <Button
              onClick={handleInvest}
              disabled={isLoading || !profile}
              className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 text-base font-medium disabled:opacity-30"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{pendingStep || "Processing..."}</span>
                </div>
              ) : !profile ? (
                "Please log in"
              ) : (
                "Confirm"
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
