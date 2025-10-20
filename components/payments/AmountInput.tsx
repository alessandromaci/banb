"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useUSDCBalance } from "@/lib/payments";
import { NumberPad } from "./NumberPad";

interface AmountInputProps {
  recipientName: string;
  type: string;
  recipientId: string;
}

export function AmountInput({
  recipientName,
  type,
  recipientId,
}: AmountInputProps) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const { address: userAddress } = useAccount();
  const {
    formattedBalance,
    isLoading: balanceLoading,
    isError: balanceError,
  } = useUSDCBalance(userAddress);

  const needsBalanceCheck = type === "crypto";
  const hasInsufficientBalance = Boolean(
    needsBalanceCheck &&
      formattedBalance !== undefined &&
      amount &&
      parseFloat(amount) > parseFloat(formattedBalance)
  );

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    if (amount && Number.parseFloat(amount) > 0 && !hasInsufficientBalance) {
      router.push(`/payments/${type}/${recipientId}/review?amount=${amount}`);
    }
  };

  // Get recipient display info
  const getRecipientDisplay = () => {
    // Check if it's an unknown address
    if (recipientId === "unknown") {
      const address = sessionStorage.getItem("unknownRecipientAddress") || "";
      if (address.length > 20) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
      }
      return address;
    }
    return recipientName;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* To field - positioned at top left */}
      <div className="px-6 mb-4 flex ml-4 items-center flex-shrink-0">
        <div className="text-sm text-white/50">To</div>
        <div className="text-white text-base font-medium font-sans break-all ml-4 rounded-full bg-white/10 px-4 py-2">
          {getRecipientDisplay()}
        </div>
      </div>

      {/* Amount display - centered with scroll */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
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

          {/* Error message for insufficient balance */}
          {hasInsufficientBalance && (
            <div className="text-sm text-red-400 mt-4">
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

      <div className="px-6 pb-8 flex-shrink-0">
        <Button
          onClick={handleContinue}
          disabled={
            !amount || Number.parseFloat(amount) <= 0 || hasInsufficientBalance
          }
          className="w-full h-14 rounded-full bg-white hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed text-black font-medium text-base"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
