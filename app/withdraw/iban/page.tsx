"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function WithdrawIbanPage() {
  const router = useRouter();
  const [iban, setIban] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [bankName, setBankName] = useState("");

  // Basic IBAN validation (starts with 2 letters followed by digits)
  const isValidIban = /^[A-Z]{2}[0-9]{2,}/.test(iban.toUpperCase());
  const isFormValid = isValidIban && accountHolder.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3B1EFF] via-[#5B3FFF] to-[#1A0F3D] text-white">
      <div className="max-w-md mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Enter IBAN</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* IBAN Input */}
          <div className="space-y-2">
            <Label htmlFor="iban" className="text-white/70">
              IBAN
            </Label>
            <Input
              id="iban"
              type="text"
              placeholder="GB29 NWBK 6016 1331 9268 19"
              value={iban}
              onChange={(e) => setIban(e.target.value.toUpperCase())}
              className="h-12 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:ring-0"
            />
            {iban && !isValidIban && (
              <p className="text-xs text-red-400">Please enter a valid IBAN</p>
            )}
          </div>

          {/* Account Holder Name */}
          <div className="space-y-2">
            <Label htmlFor="holder" className="text-white/70">
              Account Holder Name
            </Label>
            <Input
              id="holder"
              type="text"
              placeholder="John Doe"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              className="h-12 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:ring-0"
            />
          </div>

          {/* Bank Name (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="bank" className="text-white/70">
              Bank Name <span className="text-white/40">(optional)</span>
            </Label>
            <Input
              id="bank"
              type="text"
              placeholder="Bank of America"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="h-12 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:ring-0"
            />
          </div>
        </div>

        {/* Confirmation Summary */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <p className="text-sm text-white/70">
            Funds will be converted from USDC and sent to your IBAN via SEPA
            transfer.
          </p>
        </div>

        {/* Fee and CTA */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Fees</span>
            <span className="text-green-400 font-semibold">FREE</span>
          </div>

          <Button
            disabled={!isFormValid}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#7B4CFF] to-[#3B1EFF] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-lg shadow-lg shadow-purple-500/20"
          >
            Withdraw
          </Button>
        </div>
      </div>
    </div>
  );
}
