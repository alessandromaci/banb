"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { getInvestmentOption, type InvestmentOption } from "@/lib/investments";
import { useUSDCBalance } from "@/lib/payments";
import { useAccount } from "wagmi";

function InvestmentAmountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const optionId = searchParams.get("option");
  const vaultAddress = searchParams.get("vault");
  const vaultName = searchParams.get("name");
  const { address } = useAccount();
  const { formattedBalance: usdcBalance } = useUSDCBalance(address);

  const [amount, setAmount] = useState("");
  const [investmentOption, setInvestmentOption] =
    useState<InvestmentOption | null>(null);

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

  const formatNumber = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, "").replace(/,/g, "");

    // Prevent multiple decimal points
    if ((cleanValue.match(/\./g) || []).length > 1) return amount;

    // Handle empty or decimal-only input
    if (cleanValue === "" || cleanValue === ".") return cleanValue;

    const [integer, decimal] = cleanValue.split(".");

    // Validate length limits
    if (integer.length > 4 || (decimal && decimal.length > 2)) {
      return amount;
    }

    return cleanValue;
  };

  const handleAmountChange = (value: string) => {
    setAmount(formatNumber(value));
  };

  const handleContinue = () => {
    if (amount && parseFloat(amount) > 0 && !hasInsufficientBalance) {
      if (optionId) {
        router.push(`/invest/review?option=${optionId}&amount=${amount}`);
      } else if (vaultAddress && vaultName) {
        router.push(
          `/invest/review?vault=${vaultAddress}&name=${encodeURIComponent(
            vaultName
          )}&amount=${amount}`
        );
      }
    }
  };

  const maxBalance = usdcBalance ? parseFloat(usdcBalance) : 0;
  const hasInsufficientBalance = amount && parseFloat(amount) > maxBalance;
  const isValidAmount =
    amount && parseFloat(amount) > 0 && !hasInsufficientBalance;

  if (!investmentOption) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60">Investment option not found</p>
          <Link href="/invest/select">
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
          <Link href="/invest/select">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Investment Amount</h1>
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Investment Option Card */}
          <Card className="bg-white/5 border-white/10 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {investmentOption.name}
                </h3>
                <p className="text-sm text-white/60">
                  {investmentOption.description}
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {investmentOption.apr}% APR
            </div>
          </Card>

          {/* Amount Input */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">
                Move funds from Main Account
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-4xl font-light bg-transparent border-0 outline-none text-white placeholder:text-white/40"
                />
                <div className="text-white/60 text-lg">USDC</div>
              </div>
            </div>

            {/* Balance Info */}
            <div className="text-sm text-white/60">
              Available: {usdcBalance || "0.00"} USDC
            </div>
            {hasInsufficientBalance && (
              <div className="text-red-400 text-sm">Insufficient balance.</div>
            )}

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-3">
              {[25, 50, 100].map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  onClick={() => setAmount(value.toString())}
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  ${value}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="p-6 pt-0">
          <Button
            onClick={handleContinue}
            disabled={!isValidAmount}
            className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {hasInsufficientBalance ? "Insufficient Balance" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function InvestmentAmountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <InvestmentAmountContent />
    </Suspense>
  );
}
