"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DepositPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [isFocused, setIsFocused] = useState(false);
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

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-white flex flex-col">
      <div className="max-w-md mx-auto px-6 py-8 w-full">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/home")}
            className="text-white hover:bg-white/10 rounded-full -ml-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-xl font-medium">Add money</h1>
            <p className="text-sm text-white/50">
              Balance: {currencySymbol}
              {balance}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center space-y-8 flex-1 min-h-[50vh]">
          <div className="relative inline-flex items-baseline justify-center gap-1">
            <span className="text-6xl font-light text-white">
              {currencySymbol}
            </span>
            <div className="relative">
              <span className="text-6xl font-light text-white min-w-[1ch] inline-block">
                {isFocused && amount
                  ? amount
                  : formatDisplayValue(amount) || "0"}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  const inputValue = e.target.value.replace(/,/g, "");
                  setAmount(formatNumber(inputValue));
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="0"
                maxLength={8}
                className="absolute top-0 left-0 w-full h-full"
                style={{
                  color: "transparent",
                  caretColor: "#FFFFFF",
                  fontSize: "3.75rem",
                  fontWeight: "300",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <button
            onClick={() => router.push("/deposit/method")}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <Smartphone className="w-4 h-4 text-white/70" />
            <span className="text-sm text-white/90 font-medium font-sans">
              {paymentMethod.label}
            </span>
          </button>
        </div>

        <div className="fixed bottom-8 left-0 right-0 px-6 max-w-md mx-auto space-y-4">
          <Button
            disabled={numericAmount <= 0}
            onClick={() => console.log("To continue")}
            className="w-full h-14 rounded-full bg-white hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed text-black font-medium text-base"
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
              <span className="text-sm text-white/90">Continue</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
