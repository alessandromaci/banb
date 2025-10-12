"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AmountInput } from "@/components/deposit-withdraw/amount-input";
import { TokenDisplay } from "@/components/deposit-withdraw/token-display";
import { PaymentMethodButton } from "@/components/deposit-withdraw/payment-method-button";

export default function DepositPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const numericAmount = Number.parseFloat(amount) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3B1EFF] via-[#5B3FFF] to-[#1A0F3D] text-white">
      <div className="max-w-md mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Add money</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/home")}
            className="text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Token Display */}
        <div className="flex justify-center">
          <TokenDisplay />
        </div>

        {/* Amount Input */}
        <AmountInput
          value={amount}
          onChange={setAmount}
          presetAmounts={[30, 50, 100, 500]}
        />

        {/* Payment Method Section */}
        <div className="space-y-4 pt-8">
          <h2 className="text-sm text-white/70 font-medium">Payment Method</h2>
          <PaymentMethodButton
            icon={<Wallet className="w-5 h-5 text-white" />}
            label="Pay with Google Pay"
            onClick={() => router.push("/deposit/method")}
          />
        </div>

        {/* Fee and CTA */}
        <div className="space-y-4 pt-8">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Fees</span>
            <span className="text-green-400 font-semibold">FREE</span>
          </div>

          <Button
            disabled={numericAmount <= 0}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#7B4CFF] to-[#3B1EFF] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-lg shadow-lg shadow-purple-500/20"
          >
            Deposit
          </Button>

          <p className="text-center text-xs text-white/50">
            Your payment will be processed instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
