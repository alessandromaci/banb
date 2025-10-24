"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { getInvestmentOption, type InvestmentOption } from "@/lib/investments";
import { useUSDCBalance } from "@/lib/payments";
import { useAccountSafe as useAccount } from "@/lib/use-account-safe";
import { useUser } from "@/lib/user-context";
import { NumberPad } from "@/components/payments/NumberPad";
import { getAccountsByProfile } from "@/lib/accounts";
import { type Account } from "@/lib/supabase";
import Image from "next/image";

function InvestmentAmountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const optionId = searchParams.get("option");
  const vaultAddress = searchParams.get("vault");
  const vaultName = searchParams.get("name");
  const { address } = useAccount();
  const { formattedBalance: usdcBalance } = useUSDCBalance(address);
  const { profile } = useUser();

  const [amount, setAmount] = useState("");
  const [investmentOption, setInvestmentOption] =
    useState<InvestmentOption | null>(null);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);

  // Load investment option
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

  // Load current account (the one with matching address)
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

  const formatNumber = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, "").replace(/,/g, "");

    // Prevent multiple decimal points
    if ((cleanValue.match(/\./g) || []).length > 1) return amount;

    // Handle empty or decimal-only input
    if (cleanValue === "" || cleanValue === ".") return cleanValue;

    const [integer, decimal] = cleanValue.split(".");

    // Validate length limits (max 4 digits for integer, 2 for decimal)
    if (integer.length > 4 || (decimal && decimal.length > 2)) {
      return amount;
    }

    return cleanValue;
  };

  const formatDisplayValue = (value: string) => {
    if (!value || value === "0") return "0";
    return value;
  };

  // Handle number pad input
  const handleNumberClick = (num: string) => {
    if (num === "." && amount.includes(".")) return; // Prevent multiple decimals

    const newValue = amount + num;
    const formatted = formatNumber(newValue);
    if (formatted !== amount) {
      setAmount(formatted);
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    setAmount(amount.slice(0, -1));
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
    <div className="h-screen bg-[#0E0E0F] text-white flex flex-col overflow-hidden">
      <div className="max-w-md mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-6 flex items-center justify-between flex-shrink-0">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-medium">
              Investment: {investmentOption.name}
            </h1>
            <p className="text-xs text-white/50">
              Balance: ${usdcBalance || "0.00"} USDC
            </p>
          </div>
          <Link href="/invest/select">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </Button>
          </Link>
        </div>

        {/* To Field - Vault Info */}
        <div className="px-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/50">To</span>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full">
              <Image
                src={investmentOption.logo || "/morpho.svg"}
                alt={investmentOption.name}
                width={20}
                height={20}
                className="w-5 h-5"
              />
              <span className="text-sm text-white font-medium">
                {investmentOption.vault_address
                  ? `${investmentOption.vault_address.slice(
                      0,
                      6
                    )}...${investmentOption.vault_address.slice(-4)}`
                  : investmentOption.name}
              </span>
            </div>
          </div>
        </div>

        {/* Amount display - centered with scroll */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-hide">
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
            <div className="inline-flex items-start justify-center gap-0.5">
              <span className="text-3xl font-normal text-white mt-2 font-sans">
                $
              </span>
              <span className="text-7xl font-light text-white min-w-[1ch] inline-block tracking-tight font-sans">
                {formatDisplayValue(amount) || "0"}
              </span>
            </div>

            {/* USDC equivalence display */}
            <div className="flex items-center gap-1 text-sm text-white/50 mt-6 font-sans">
              <span className="text-sm text-white/50">≈</span>
              <Image
                src="/usdc-logo.png"
                alt="USDC"
                width={16}
                height={16}
                className="w-4 h-4 text-white"
              />
              <span>
                {amount && parseFloat(amount) > 0
                  ? formatDisplayValue(amount)
                  : "0.00"}{" "}
              </span>
            </div>

            {hasInsufficientBalance && (
              <div className="mt-4 text-red-400 text-sm">
                Insufficient balance
              </div>
            )}
          </div>
        </div>

        {/* Number Pad */}
        <div className="flex-shrink-0">
          <NumberPad
            onNumberClick={handleNumberClick}
            onBackspace={handleBackspace}
          />
        </div>

        {/* Bottom Button */}
        <div className="px-6 pb-6 flex-shrink-0">
          <Button
            disabled={!isValidAmount}
            onClick={handleContinue}
            className="w-full h-12 sm:h-14 rounded-full disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium text-base border-0"
            style={{
              backgroundColor: isValidAmount
                ? "#3479FF"
                : "rgba(52, 121, 255, 0.3)",
            }}
          >
            {investmentOption.logo ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-white">Continue</span>
              </div>
            ) : (
              <span className="text-white">Continue</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function InvestmentAmountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <InvestmentAmountContent />
    </Suspense>
  );
}
