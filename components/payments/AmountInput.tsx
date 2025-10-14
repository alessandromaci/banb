"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StickyNote } from "lucide-react";
import { useUSDCBalance } from "@/lib/payments";

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
  const [note, setNote] = useState("");
  const [isFocused, setIsFocused] = useState(false);
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
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return "0";

    // Always show commas for numbers >= 1000
    if (numericValue >= 1000) {
      return numericValue.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }

    // For numbers < 1000: raw value while focused, clean when not focused
    return isFocused ? value : numericValue.toFixed(2).replace(/\.?0+$/, "");
  };

  const handleContinue = () => {
    if (amount && Number.parseFloat(amount) > 0 && !hasInsufficientBalance) {
      router.push(
        `/payments/${type}/${recipientId}/review?amount=${amount}&note=${note}`
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center mb-8">
          <div className="text-white/70 text-sm mb-2">{recipientName}</div>
          <div className="flex items-center justify-center gap-2 relative">
            <span className="text-6xl font-light text-white">$</span>
            <div className="text-6xl font-light text-white">
              {formatDisplayValue(amount)}
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const inputValue = !isFocused
                  ? e.target.value.replace(/,/g, "")
                  : e.target.value;
                setAmount(formatNumber(inputValue));
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="0"
              maxLength={8}
              className="absolute opacity-0 pointer-events-auto"
              style={{
                caretColor: "#7B4CFF",
                width: "100%",
                height: "100%",
                fontSize: "3.75rem",
                fontWeight: "600",
                textAlign: "center",
                background: "transparent",
                border: "none",
                outline: "none",
              }}
            />
          </div>
          <div className="text-white/50 text-sm mt-2">No fees</div>
        </div>

        <div className="w-full max-w-sm mx-auto">
          <div className="space-y-2">
            <div className="text-white/70 text-sm mb-2 flex items-center justify-center gap-2">
              <span className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-xs">
                {needsBalanceCheck ? "C" : "B"}
              </span>
              Main ·{" "}
              {!isMounted ? (
                "Loading..."
              ) : needsBalanceCheck ? (
                balanceLoading ? (
                  "Loading..."
                ) : balanceError ? (
                  <span className="text-white/50 text-xs">Balance N/A</span>
                ) : formattedBalance !== undefined ? (
                  `$${formattedBalance} USDC`
                ) : (
                  <span className="text-white/50 text-xs">—</span>
                )
              ) : (
                "Balance"
              )}
            </div>
            {hasInsufficientBalance && (
              <div className="text-red-400 text-xs text-center">
                Insufficient balance.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 space-y-4">
        <div className="relative">
          <StickyNote className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
          <Input
            placeholder="Add note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="pl-12 bg-[#3A3650] border-0 text-white placeholder:text-white/60 h-14 rounded-2xl"
          />
        </div>

        <Button
          onClick={handleContinue}
          disabled={
            !amount || Number.parseFloat(amount) <= 0 || hasInsufficientBalance
          }
          className="w-full h-14 rounded-full bg-white/15 hover:bg-white/25 text-white text-base disabled:opacity-50"
        >
          {hasInsufficientBalance ? "Insufficient Balance" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
