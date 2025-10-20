"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Check, ArrowLeftRight, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useCryptoPayment } from "@/lib/payments";
import { getRecipient, createRecipient } from "@/lib/recipients";
import { useUser } from "@/lib/user-context";
import type { Recipient } from "@/lib/supabase";
import { useEstimateGas, useGasPrice } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { base } from "wagmi/chains";

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
  const [shouldSaveRecipient, setShouldSaveRecipient] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState("");
  const { executePayment, isLoading, error: paymentError } = useCryptoPayment();
  const { profile } = useUser();

  // Check if this is an unknown address
  const isUnknownAddress = recipientId === "unknown";
  const unknownAddress = isUnknownAddress
    ? sessionStorage.getItem("unknownRecipientAddress")
    : null;

  // Get gas price for fee estimation
  const { data: gasPrice } = useGasPrice({
    chainId: base.id,
  });

  // Estimate gas fee (approximate for USDC transfer)
  const estimatedGasLimit = BigInt(65000); // Typical gas limit for ERC20 transfer
  const gasFeeinWei =
    gasPrice && estimatedGasLimit ? gasPrice * estimatedGasLimit : BigInt(0);
  const gasFeeInEth = gasFeeinWei
    ? parseFloat(formatUnits(gasFeeinWei, 18))
    : 0;
  // Approximate ETH to USD conversion (you could fetch real-time price)
  const ethPriceUSD = 2500; // Approximate, could be dynamic
  const gasFeeInUSD = gasFeeInEth * ethPriceUSD;

  // Fetch recipient data for crypto payments
  useEffect(() => {
    if (type === "crypto" && recipientId && recipientId !== "unknown") {
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

    try {
      let finalRecipientId = recipientId;

      // If unknown address and user wants to save, create recipient first
      if (
        isUnknownAddress &&
        unknownAddress &&
        shouldSaveRecipient &&
        newRecipientName.trim()
      ) {
        const newRecipient = await createRecipient({
          profile_id: profile.id,
          name: newRecipientName.trim(),
          external_address: unknownAddress,
          status: "active",
        });
        finalRecipientId = newRecipient.id;
      }

      if (type === "crypto") {
        // Get wallet address
        let walletAddress: string | null = null;

        if (isUnknownAddress && unknownAddress) {
          walletAddress = unknownAddress;
        } else if (recipient) {
          walletAddress = recipient.external_address;
        } else if (finalRecipientId && finalRecipientId !== "unknown") {
          // Fetch recipient if we just created it
          const fetchedRecipient = await getRecipient(finalRecipientId);
          walletAddress = fetchedRecipient?.external_address || null;
        }

        if (!walletAddress) {
          setError("Recipient wallet address not found");
          return;
        }

        // Use the finalRecipientId or create a temporary one for unknown addresses
        const recipientForTx =
          finalRecipientId && finalRecipientId !== "unknown"
            ? finalRecipientId
            : crypto.randomUUID();

        const result = await executePayment({
          recipientId: recipientForTx,
          amount,
          token: "USDC",
          chain: "base",
          to: walletAddress,
          sender_profile_id: profile.id,
        });

        router.push(`/payments/status/${result.txId}`);
      } else {
        // For non-crypto payments
        router.push(
          `/payments/success?type=${type}&amount=${amount}&recipient=${recipientName}`
        );
      }
    } catch (err) {
      console.error("[ReviewCard] Payment failed", err);
      setError(err instanceof Error ? err.message : "Payment failed");
    }
  };

  // Get display address
  const displayAddress =
    isUnknownAddress && unknownAddress
      ? `${unknownAddress.slice(0, 6)}...${unknownAddress.slice(-4)}`
      : recipientDetails;

  // Determine the recipient display name for "Confirm transaction to"
  const getConfirmationRecipient = () => {
    if (isUnknownAddress && unknownAddress) {
      return `${unknownAddress.slice(0, 6)}...${unknownAddress.slice(-4)}`;
    }
    return recipientName;
  };

  // Format amount to always show .00 for integers
  const formatAmount = (amt: string) => {
    const num = parseFloat(amt);
    if (isNaN(num)) return "0.00";
    return num.toFixed(2);
  };

  return (
    <div className="flex flex-col h-full px-6">
      {(error || paymentError) && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error || paymentError}
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center items-center space-y-8">
        {/* Transfer icon with check badge */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowLeftRight className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center border-2 border-[#0E0E0F]">
            <Lock className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Confirmation text */}
        <div className="text-center">
          <h2 className="text-xl font-medium text-white mb-2">
            Confirm transaction to
          </h2>
          <p className="text-white/70">{getConfirmationRecipient()}</p>
        </div>

        {/* Transaction details */}
        <div className="w-full space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-white/60">Total Value</span>
            <span className="text-white font-medium">
              ${formatAmount(amount)}
            </span>
          </div>

          {type === "crypto" && (
            <div className="flex justify-between items-center">
              <span className="text-white/60">
                Total {type === "crypto" ? "USDC Value" : "USD"}
              </span>
              <div className="flex items-center gap-2">
                <Image
                  src="/usdc-logo.png"
                  alt="USDC"
                  width={16}
                  height={16}
                  className="w-4 h-4"
                />
                <span className="text-white">{formatAmount(amount)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-white/60">From</span>
            <div className="flex items-center gap-2">
              <span className="text-white">
                {profile?.name || "Main Account"}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-white/60">To</span>
            <span className="text-white font-mono text-sm">
              {displayAddress}
            </span>
          </div>

          {/* Network indicator */}
          {type === "crypto" && (
            <div className="flex justify-between items-center ">
              <span className="text-white/60">Network</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span className="text-white">Base</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-white/60">Fee Estimate</span>
            <div className="flex items-center gap-2">
              <span className="text-white">
                ${gasFeeInUSD > 0 ? gasFeeInUSD.toFixed(2) : "~0.01"}
              </span>
            </div>
          </div>
        </div>

        {/* Add recipient option for unknown addresses */}
        {isUnknownAddress && unknownAddress && (
          <div className="w-full space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="save-recipient"
                checked={shouldSaveRecipient}
                onCheckedChange={(checked) =>
                  setShouldSaveRecipient(checked as boolean)
                }
              />
              <label
                htmlFor="save-recipient"
                className="text-sm text-white/90 cursor-pointer"
              >
                Save as contact
              </label>
            </div>
            {shouldSaveRecipient && (
              <Input
                placeholder="Enter contact name"
                value={newRecipientName}
                onChange={(e) => setNewRecipientName(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50 h-12 rounded-xl"
              />
            )}
          </div>
        )}
      </div>

      <div className="pb-8 pt-4">
        <p className="text-xs text-white/50 text-center mb-4">
          Review the above before confirming.
          <br />
          Once made, your transaction is irreversible.
        </p>
        <Button
          onClick={handleSend}
          disabled={
            isLoading ||
            !profile ||
            (type === "crypto" && !recipient && !isUnknownAddress) ||
            (shouldSaveRecipient && !newRecipientName.trim())
          }
          className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 text-base font-medium disabled:opacity-30"
        >
          <span className="flex items-center gap-2 font-medium font-bold text-lg">
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isLoading ? "Sending..." : "Confirm"}
          </span>
        </Button>
      </div>
    </div>
  );
}
