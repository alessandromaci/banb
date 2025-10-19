"use client"

import type React from "react"
import { Button } from "@/components/ui/button"

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  currency?: "USD" | "EUR"
  presetAmounts?: number[]
}

export function AmountInput({
  value,
  onChange,
  currency = "USD",
  presetAmounts = [30, 50, 100, 500],
}: AmountInputProps) {
  const symbol = currency === "USD" ? "$" : "€"
  const numericValue = Number.parseFloat(value) || 0

  const handlePresetClick = (amount: number) => {
    onChange(amount.toString())
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^0-9.]/g, "")
    // Prevent multiple decimal points
    if ((newValue.match(/\./g) || []).length <= 1) {
      onChange(newValue)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Main Amount Display */}
      <div className="flex flex-col items-center gap-2 w-full">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleInputChange}
            placeholder="0"
            className="w-full bg-transparent text-6xl font-semibold text-white text-center outline-none border-none focus:outline-none focus:ring-0"
            style={{ caretColor: "#7B4CFF" }}
          />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-semibold text-white/30 pointer-events-none">
            {symbol}
          </span>
        </div>

        {/* USDC Equivalent */}
        <p className="text-sm text-white/50">≈ {numericValue.toFixed(2)} USDC</p>
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
  )
}
