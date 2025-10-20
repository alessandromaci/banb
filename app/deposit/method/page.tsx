"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletAddressCard } from "@/components/deposit-withdraw/wallet-address-card";

const paymentMethods: Array<{
  id: string;
  label: string;
  icon: string | null;
  type: string;
  description?: string;
}> = [
  {
    id: "google-pay",
    label: "Google Pay",
    icon: "/google-pay-logo.png",
    type: "image",
  },
  {
    id: "apple-pay",
    label: "Apple Pay",
    icon: "/apple-pay-logo.png",
    type: "image",
  },
  {
    id: "crypto",
    label: "USDC on Base",
    icon: "/usdc-logo.png",
    type: "image",
  },
];

export default function DepositMethodPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState("");

  // Get wallet address from sessionStorage
  useEffect(() => {
    const address = sessionStorage.getItem("userWalletAddress");
    console.log("Wallet address from storage:", address);
    if (address) {
      setWalletAddress(address);
    } else {
      // If no address in storage, check depositData directly
      const depositData = sessionStorage.getItem("depositData");
      if (depositData) {
        try {
          const data = JSON.parse(depositData);
          console.log("Deposit data:", data);
          if (data.walletAddress) {
            setWalletAddress(data.walletAddress);
            sessionStorage.setItem("userWalletAddress", data.walletAddress);
          }
        } catch (e) {
          console.error("Error parsing deposit data:", e);
        }
      }
    }
  }, []);

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);

    // For crypto, show the wallet card but don't navigate yet
    if (methodId === "crypto") {
      return;
    }

    // Find the full method details and save to sessionStorage
    const method = paymentMethods.find((m) => m.id === methodId);
    if (method) {
      sessionStorage.setItem(
        "selectedPaymentMethod",
        JSON.stringify({
          id: method.id,
          label: method.label,
          icon: method.icon,
          type: method.type,
        })
      );
    }
    router.push("/deposit");
  };

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-white">
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10 rounded-full -ml-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-medium">Select payment method</h1>
        </div>

        <div className="space-y-2">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              className="w-full flex items-center justify-between px-4 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                {method.type === "image" && method.icon ? (
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <img
                      src={method.icon || "/placeholder.svg"}
                      alt={method.label}
                      className="w-5 h-5 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-white/70" />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-base font-medium text-white">
                    {method.label}
                  </p>
                  {method.description && (
                    <p className="text-xs text-white/50 mt-0.5">
                      {method.description}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/50 transition-colors" />
            </button>
          ))}
        </div>

        {selectedMethod === "crypto" && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {walletAddress ? (
              <WalletAddressCard address={walletAddress} />
            ) : (
              <div className="bg-white/5 rounded-2xl p-6 text-center">
                <p className="text-white text-base mb-2">
                  Send USDC to your wallet
                </p>
                <p className="text-white/50 text-sm">
                  Connect your wallet to see your address
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
