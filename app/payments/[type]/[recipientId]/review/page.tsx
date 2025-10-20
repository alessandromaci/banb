import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReviewCard } from "@/components/payments/ReviewCard";
import { getRecipient } from "@/lib/recipients";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ type: string; recipientId: string }>;
}) {
  const resolvedParams = await params;

  // Get recipient details based on type
  let recipientName = "Recipient";
  let recipientDetails = "";

  if (resolvedParams.type === "crypto") {
    // Check if it's an unknown address
    if (resolvedParams.recipientId === "unknown") {
      recipientName = "Unknown Address";
      recipientDetails = "Address from input";
    } else {
      // Fetch actual recipient data from database
      const recipient = await getRecipient(resolvedParams.recipientId);
      if (recipient) {
        recipientName = recipient.name;
        // Get the external wallet address or linked profile
        recipientDetails = recipient.external_address || "0x1234...5678";
      } else {
        recipientName = "Crypto Wallet";
        recipientDetails = "0x1234...5678";
      }
    }
  } else if (resolvedParams.type === "bank") {
    recipientName = "Bank Account";
    recipientDetails = "GB00 0000 0000 0000 00";
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-white flex flex-col">
      <div className="mx-auto max-w-md w-full flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-8">
          <h1 className="text-xl font-medium">Send</h1>
          <Link
            href={`/payments/${resolvedParams.type}/${resolvedParams.recipientId}/amount`}
          >
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10 rounded-full"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
        </div>

        {/* Review Card */}
        <ReviewCard
          recipientName={recipientName}
          recipientDetails={recipientDetails}
          type={resolvedParams.type}
          recipientId={resolvedParams.recipientId}
        />
      </div>
    </div>
  );
}
