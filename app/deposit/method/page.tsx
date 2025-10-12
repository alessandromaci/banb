"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Smartphone, CreditCard, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentMethodButton } from "@/components/deposit-withdraw/payment-method-button";
import { WalletAddressCard } from "@/components/deposit-withdraw/wallet-address-card";

const MOCK_WALLET_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";

export default function DepositMethodPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const paymentMethods = [
    {
      id: "google-pay",
      label: "Google Pay",
      icon: <Smartphone className="w-5 h-5 text-white" />,
    },
    {
      id: "apple-pay",
      label: "Apple Pay",
      icon: <Smartphone className="w-5 h-5 text-white" />,
    },
    {
      id: "paypal",
      label: "PayPal",
      icon: <CreditCard className="w-5 h-5 text-white" />,
    },
    {
      id: "wallet",
      label: "Receive from Wallet",
      icon: <Wallet className="w-5 h-5 text-white" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3B1EFF] via-[#5B3FFF] to-[#1A0F3D] text-white">
      <div className="max-w-md mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Select Payment Method</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <PaymentMethodButton
              key={method.id}
              icon={method.icon}
              label={method.label}
              onClick={() => setSelectedMethod(method.id)}
            />
          ))}
        </div>

        {/* Wallet Address Card (shown when "Receive from Wallet" is selected) */}
        {selectedMethod === "wallet" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <WalletAddressCard address={MOCK_WALLET_ADDRESS} />
          </div>
        )}

        {/* Fee and CTA */}
        <div className="space-y-4 pt-8">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Fees</span>
            <span className="text-green-400 font-semibold">FREE</span>
          </div>

          <Button
            disabled={!selectedMethod}
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
