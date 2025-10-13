"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isAddress } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRecipient, createBankRecipient } from "@/lib/recipients";
import { useUser } from "@/lib/user-context";

interface RecipientFormProps {
  type: "crypto" | "bank";
}

export function RecipientForm({ type }: RecipientFormProps) {
  const router = useRouter();
  const { profile } = useUser();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (type === "crypto") {
        // Validate address before submission
        if (!formData.address || !isAddress(formData.address)) {
          setAddressError("Please enter a valid Ethereum address");
          setIsLoading(false);
          return;
        }

        // Check if user is logged in
        if (!profile?.id) {
          setError("You must be logged in to add recipients");
          setIsLoading(false);
          return;
        }

        // Add recipient to Supabase for crypto payments
        const recipient = await createRecipient({
          profile_id: profile.id, // Owner's profile ID
          name: formData.name,
          external_address: formData.address, // External wallet address
          status: "active",
        });
        router.push(`/payments/crypto/${recipient.id}/amount`);
      } else {
        // For bank payments, create a recipient in the database
        if (!profile?.id) {
          setError("You must be logged in to add recipients");
          setIsLoading(false);
          return;
        }

        // Create bank recipient
        const recipient = await createBankRecipient({
          profile_id: profile.id,
          name: `${formData.firstName} ${formData.lastName}`,
          recipient_type: "bank",
          bank_details: {
            iban: formData.iban,
            country: formData.country,
            currency: formData.currency,
          },
          status: "active",
        });

        router.push(`/payments/crypto/${recipient.id}/amount`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add recipient");
    } finally {
      setIsLoading(false);
    }
  };

  if (type === "crypto") {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white/80 text-sm">
            Recipient name
          </Label>
          <Input
            id="name"
            placeholder="Name"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-[#3A3650] border-0 text-white placeholder:text-white/40 h-14 rounded-2xl"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-white/80 text-sm">
            Wallet address
          </Label>
          <Input
            id="address"
            placeholder="0x..."
            value={formData.address || ""}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({ ...formData, address: value });

              // Validate address on change
              if (value && !isAddress(value)) {
                setAddressError("Invalid Ethereum address");
              } else {
                setAddressError(null);
              }
            }}
            className={`bg-[#3A3650] border text-white placeholder:text-white/40 h-14 rounded-2xl font-mono text-sm ${
              addressError
                ? "border-red-500/50 focus-visible:ring-red-500"
                : "border-transparent"
            }`}
            required
          />
          {addressError && (
            <p className="text-red-400 text-xs mt-1">{addressError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="network" className="text-white/80 text-sm">
            Network
          </Label>
          <div className="bg-[#3A3650] border-0 text-white h-14 rounded-2xl flex items-center px-4">
            <span className="text-white/60">Base</span>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !!addressError}
          className="w-full h-14 rounded-full bg-white/15 hover:bg-white/25 text-white text-base disabled:opacity-50"
        >
          {isLoading ? "Adding recipient..." : "Continue"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="firstName" className="text-white/80 text-sm">
          First name
        </Label>
        <Input
          id="firstName"
          placeholder="First name"
          value={formData.firstName || ""}
          onChange={(e) =>
            setFormData({ ...formData, firstName: e.target.value })
          }
          className="bg-[#3A3650] border-0 text-white placeholder:text-white/40 h-14 rounded-2xl"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName" className="text-white/80 text-sm">
          Last name
        </Label>
        <Input
          id="lastName"
          placeholder="Last name"
          value={formData.lastName || ""}
          onChange={(e) =>
            setFormData({ ...formData, lastName: e.target.value })
          }
          className="bg-[#3A3650] border-0 text-white placeholder:text-white/40 h-14 rounded-2xl"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="country" className="text-white/80 text-sm">
          Country
        </Label>
        <Select
          value={formData.country}
          onValueChange={(value) =>
            setFormData({ ...formData, country: value })
          }
        >
          <SelectTrigger className="bg-[#3A3650] border-0 text-white h-14 rounded-2xl">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent className="bg-[#2A2640] border-white/10 text-white">
            <SelectItem value="uk">United Kingdom</SelectItem>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="de">Germany</SelectItem>
            <SelectItem value="fr">France</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency" className="text-white/80 text-sm">
          Currency
        </Label>
        <Select
          value={formData.currency}
          onValueChange={(value) =>
            setFormData({ ...formData, currency: value })
          }
        >
          <SelectTrigger className="bg-[#3A3650] border-0 text-white h-14 rounded-2xl">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent className="bg-[#2A2640] border-white/10 text-white">
            <SelectItem value="usd">USD</SelectItem>
            <SelectItem value="eur">EUR</SelectItem>
            <SelectItem value="gbp">GBP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="iban" className="text-white/80 text-sm">
          IBAN
        </Label>
        <Input
          id="iban"
          placeholder="GB00 0000 0000 0000 0000 00"
          value={formData.iban || ""}
          onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
          className="bg-[#3A3650] border-0 text-white placeholder:text-white/40 h-14 rounded-2xl font-mono text-sm"
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full h-14 rounded-full bg-white/15 hover:bg-white/25 text-white text-base"
      >
        Continue
      </Button>
    </form>
  );
}
