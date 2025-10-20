"use client";

import { ArrowLeft, X } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { AmountInput } from "@/components/payments/AmountInput";
import { getRecipientById } from "@/lib/recipients";
import { useUSDCBalance } from "@/lib/payments";
import { useEffect, useState } from "react";

export default function AmountPage() {
  const router = useRouter();
  const params = useParams();
  const { address: userAddress } = useAccount();
  const { formattedBalance } = useUSDCBalance(userAddress);
  const [recipientName, setRecipientName] = useState("Recipient");

  const type = params.type as string;
  const recipientId = params.recipientId as string;

  useEffect(() => {
    async function fetchRecipient() {
      if (type === "crypto") {
        // Skip fetching if it's an unknown address
        if (recipientId === "unknown") {
          const unknownAddress = sessionStorage.getItem(
            "unknownRecipientAddress"
          );
          setRecipientName(
            unknownAddress
              ? `${unknownAddress.slice(0, 6)}...${unknownAddress.slice(-4)}`
              : "Unknown Address"
          );
        } else {
          try {
            // Try to get recipient from database first
            const recipient = await getRecipientById(recipientId);
            if (recipient) {
              setRecipientName(recipient.name);
            }
          } catch (error) {
            console.error("Error fetching recipient:", error);
          }
        }
      } else {
        setRecipientName("New recipient");
      }
    }

    fetchRecipient();
  }, [type, recipientId]);

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-white flex flex-col">
      <div className="mx-auto max-w-md w-full flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-8">
          <div className="flex items-center gap-4 ml-2">
            <div>
              <h1 className="text-xl font-medium ">Send</h1>
              {type === "crypto" && (
                <p className="text-sm text-white/50">
                  Balance: ${formattedBalance || "0.00"} USDC
                </p>
              )}
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => router.push("/payments")}
            className="text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Amount Input */}
        <AmountInput
          recipientName={recipientName}
          type={type}
          recipientId={recipientId}
        />
      </div>
    </div>
  );
}
