"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCryptoPayment } from "@/lib/payments";
import { getRecipient } from "@/lib/recipients";
import { useUser } from "@/lib/user-context";
import type { Recipient } from "@/lib/supabase";

interface ReviewCardProps {
  recipientName: string;
  recipientDetails: string;
  type: string;
  recipientId?: string;
}

export function ReviewCard({
  recipientName,
  recipientDetails,
  type,
  recipientId,
}: ReviewCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount") || "0";
  const note = searchParams.get("note") || "";

  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { executePayment, isLoading, error: paymentError } = useCryptoPayment();
  const { profile } = useUser();

  // Fetch recipient data for crypto payments
  useEffect(() => {
    if (type === "wallet" && recipientId) {
      getRecipient(recipientId)
        .then(setRecipient)
        .catch((err) => setError(err.message));
    }
  }, [type, recipientId]);

  const handleSend = async () => {
    if (!profile) {
      setError("Please log in to send payments");
      return;
    }

    if (type === "wallet" && recipient && recipientId) {
      try {
        // Get external wallet address
        const walletAddress = recipient.external_address;
        if (!walletAddress) {
          setError("Recipient wallet address not found");
          return;
        }

        console.log("[ReviewCard] Initiating payment", {
          senderProfileId: profile.id,
          recipientId,
          amount,
          walletAddress,
          network: "base",
        });

        const result = await executePayment({
          recipientId,
          amount,
          token: "USDC", // Using USDC for stablecoin transfers
          chain: "base", // App only supports Base network
          to: walletAddress,
          sender_profile_id: profile.id, // Pass current user's profile ID
        });

        console.log("[ReviewCard] Payment successful", result);
        router.push(`/payments/status/${result.txId}`);
      } catch (err) {
        console.error("[ReviewCard] Payment failed", err);
        setError(err instanceof Error ? err.message : "Payment failed");
      }
    } else {
      // For non-crypto payments, use existing flow
      const txId = Date.now().toString();
      router.push(`/payments/status/${txId}`);
    }
  };

  return (
    <div className="flex flex-col h-full px-6">
      {(error || paymentError) && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error || paymentError}
        </div>
      )}
      <div className="flex-1 flex flex-col justify-center">
        <Card className="bg-[#2A2640] border-0 rounded-3xl p-6 space-y-6">
          <div>
            <div className="text-white/60 text-sm mb-1">To</div>
            <div className="text-white text-lg font-medium">
              {recipientName}
            </div>
            <div className="text-white/50 text-sm font-mono">
              {recipientDetails}
            </div>
          </div>

          <div className="h-px bg-white/10" />

          <div>
            <div className="text-white/60 text-sm mb-1">Amount</div>
            <div className="text-white text-3xl font-light">
              ${amount}{" "}
              {type === "wallet" && (
                <span className="text-lg text-white/70">USDC</span>
              )}
            </div>
            <div className="text-white/50 text-sm mt-1">No fees</div>
          </div>

          {note && (
            <>
              <div className="h-px bg-white/10" />
              <div>
                <div className="text-white/60 text-sm mb-1">Note</div>
                <div className="text-white">{note}</div>
              </div>
            </>
          )}

          <div className="h-px bg-white/10" />

          <div>
            <div className="text-white/60 text-sm mb-1">From</div>
            <div className="text-white flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-xs flex-shrink-0">
                W
              </span>
              <span>Main Wallet</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="pb-6 pt-4">
        <Button
          onClick={handleSend}
          disabled={isLoading || !profile || (type === "wallet" && !recipient)}
          className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 text-base font-medium disabled:opacity-50"
        >
          {isLoading ? "Sending..." : !profile ? "Please log in" : "SEND"}
        </Button>
      </div>
    </div>
  );
}
