import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReviewCard } from "@/components/payments/ReviewCard";
import { friends } from "@/lib/mockFriends";
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

  if (resolvedParams.type === "friend") {
    const friend = friends.find(
      (f) => f.id.toString() === resolvedParams.recipientId
    );
    recipientName = friend?.name || "Friend";
    recipientDetails = friend?.username || "";
  } else if (resolvedParams.type === "wallet") {
    // Fetch actual recipient data from database
    const recipient = await getRecipient(resolvedParams.recipientId);
    if (recipient) {
      recipientName = recipient.name;
      // Get the first wallet address (assuming single wallet per recipient for now)
      recipientDetails = recipient.wallets[0]?.address || "0x1234...5678";
    } else {
      recipientName = "Crypto Wallet";
      recipientDetails = "0x1234...5678";
    }
  } else if (resolvedParams.type === "bank") {
    recipientName = "Bank Account";
    recipientDetails = "GB00 0000 0000 0000 00";
  }

  return (
    <div className="min-h-screen bg-[#1E1B3D] text-white flex flex-col">
      <div className="mx-auto max-w-md w-full flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center px-6 py-4">
          <Link
            href={`/payments/${resolvedParams.type}/${resolvedParams.recipientId}/amount`}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-white ml-4">Review</h1>
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
