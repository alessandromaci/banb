"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currency?: "USD" | "EUR";
  presetAmounts?: number[];
}

export function AmountInput({
  value,
  onChange,
  currency = "USD",
  presetAmounts = [30, 50, 100, 500],
}: AmountInputProps) {
  const symbol = currency === "USD" ? "$" : "€";
  const numericValue = Number.parseFloat(value) || 0;
  const [isFocused, setIsFocused] = useState(false);

  const handlePresetClick = (amount: number) => {
    onChange(amount.toString());
  };

  const formatNumber = (value: string) => {
    // Remove all non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, "").replace(/,/g, "");

    // Prevent multiple decimal points
    const decimalCount = (cleanValue.match(/\./g) || []).length;
    if (decimalCount > 1) {
      return value; // Don't update if multiple decimals
    }

    // Limit to 7 characters total
    if (cleanValue.length > 7) {
      return value; // Don't update if too long
    }

    // If there's a decimal point, limit to 2 decimal places
    if (cleanValue.includes(".")) {
      const [integer, decimal] = cleanValue.split(".");
      if (decimal && decimal.length > 2) {
        return value; // Don't update if too many decimal places
      }
    }

    return cleanValue;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;

    // If we're showing formatted value, we need to clean it first
    if (!isFocused) {
      // Remove commas and other formatting
      inputValue = inputValue.replace(/,/g, "");
    }

    const formattedValue = formatNumber(inputValue);
    onChange(formattedValue);
  };

  const formatDisplayValue = (value: string) => {
    if (!value || value === "0") return "0";

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return "0";

    // Only add commas for numbers >= 1000
    if (numericValue >= 1000) {
      return numericValue.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    } else {
      // For numbers < 1000, just show with up to 2 decimal places
      return numericValue.toFixed(2).replace(/\.?0+$/, "");
    }
  };

  // Show formatted value in a display overlay when not focused
  const displayValue = isFocused ? value : formatDisplayValue(value);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Main Amount Display */}
      <div className="flex flex-col items-center gap-2 w-full">
        <div className="flex items-center justify-center w-full max-w-md relative">
          <div className="text-6xl font-bold text-white">
            {symbol}
            {formatDisplayValue(value)}
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="0"
            maxLength={7}
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

        {/* USDC Equivalent */}
        <p className="text-sm text-white/50">
          ≈ {numericValue.toFixed(2)} USDC
        </p>
      </div>

      {/* Preset Amount Buttons */}
      <div className="flex gap-3 flex-wrap justify-center">
        {presetAmounts.map((amount) => (
          <Button
            key={amount}
            variant="outline"
            onClick={() => handlePresetClick(amount)}
            className="rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 px-6 py-2"
          >
            {symbol}
            {amount}
          </Button>
        ))}
      </div>
    </div>
  );
}
