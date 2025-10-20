"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberPad } from "@/components/payments/NumberPad";

export default function DepositPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("0.00");
  const [currency, setCurrency] = useState("USD");
  const [paymentMethod, setPaymentMethod] = useState<{
    id: string;
    label: string;
    icon: string | null;
    type: string;
  }>({
    id: "google-pay",
    label: "Google Pay",
    icon: "/google-pay-logo.png",
    type: "image",
  });
  const numericAmount = Number.parseFloat(amount) || 0;

  // Get balance and currency from sessionStorage
  useEffect(() => {
    const depositData = sessionStorage.getItem("depositData");
    if (depositData) {
      const data = JSON.parse(depositData);
      setBalance(data.balance || "0.00");
      setCurrency(data.currency || "USD");
      // Store wallet address for use in method page
      if (data.walletAddress) {
        sessionStorage.setItem("userWalletAddress", data.walletAddress);
      }
    }

    const method = sessionStorage.getItem("selectedPaymentMethod");
    if (method) {
      try {
        const parsedMethod = JSON.parse(method);
        setPaymentMethod(parsedMethod);
      } catch (e) {
        // If it's old format (just string), keep default
        console.error("Error parsing payment method:", e);
      }
    }
  }, []);

  const currencySymbol = currency === "USD" ? "$" : "€";

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

  return (
    <div className="h-screen bg-[#0E0E0F] text-white flex flex-col overflow-hidden">
      <div className="max-w-md mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4 ml-2">
            <div>
              <h1 className="text-xl font-medium">Add money</h1>
              <p className="text-sm text-white/50">
                Balance: {currencySymbol}
                {balance}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/home")}
            className="text-white hover:bg-white/10 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </div>

        {/* Amount display - centered with scroll */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-hide">
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
            <div className="inline-flex items-start justify-center gap-0.5">
              <span className="text-3xl font-normal text-white mt-2 font-sans">
                {currencySymbol}
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

            {/* Payment Method */}
            <div className="mt-8 flex items-center justify-center">
              <button
                onClick={() => router.push("/deposit/method")}
                className="text-white text-base font-medium font-sans break-all ml-4 rounded-full bg-white/10 px-4 py-2 hover:bg-white/15 transition-colors flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4 text-white/70" />
                <span>{paymentMethod.label}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Number Pad */}
        <div className="flex-shrink-0">
          <NumberPad
            onNumberClick={handleNumberClick}
            onBackspace={handleBackspace}
          />
        </div>

        <div className="px-6 pb-6 flex-shrink-0">
          <Button
            disabled={numericAmount <= 0}
            onClick={() => console.log("To continue")}
            className="w-full h-12 sm:h-14 rounded-full bg-white hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed text-black font-medium text-base"
          >
            {paymentMethod.type === "image" && paymentMethod.icon ? (
              <div className="flex items-center justify-center">
                <Image
                  src={paymentMethod.icon}
                  alt={paymentMethod.label}
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
            ) : (
              <span>Continue</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
