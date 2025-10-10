"use client";

import { useState } from "react";
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

  const { address: userAddress } = useAccount();
  const {
    formattedBalance,
    isLoading: balanceLoading,
    isError: balanceError,
  } = useUSDCBalance(userAddress);

  const isWalletPayment = type === "wallet";

  // Check if user has insufficient balance (only for wallet payments with valid balance)
  const hasInsufficientBalance = Boolean(
    isWalletPayment &&
      formattedBalance !== undefined &&
      amount &&
      parseFloat(amount) > parseFloat(formattedBalance)
  );

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
          <div className="flex items-center justify-center gap-2">
            <span className="text-6xl font-light text-white">$</span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="text-6xl font-light text-white bg-transparent border-0 p-0 h-auto w-auto text-center focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{ width: `${Math.max(amount.length, 1) * 0.6}em` }}
            />
          </div>
          <div className="text-white/50 text-sm mt-2">No fees</div>
        </div>

        <div className="w-full max-w-sm mx-auto">
          {isWalletPayment ? (
            <div className="space-y-2">
              <div className="text-white/70 text-sm mb-2 flex items-center justify-center gap-2">
                <span className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-xs">
                  W
                </span>
                Main ·{" "}
                {balanceLoading ? (
                  "Loading..."
                ) : balanceError ? (
                  <span className="text-white/50 text-xs">Balance N/A</span>
                ) : formattedBalance !== undefined ? (
                  `$${formattedBalance} USDC`
                ) : (
                  <span className="text-white/50 text-xs">—</span>
                )}
              </div>
              {hasInsufficientBalance && (
                <div className="text-red-400 text-xs text-center">
                  Insufficient balance. You need ${amount} but only have $
                  {formattedBalance}
                </div>
              )}
            </div>
          ) : (
            <div className="text-white/70 text-sm mb-2 flex items-center justify-center gap-2">
              <span className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-xs">
                B
              </span>
              Main · Balance
            </div>
          )}
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
