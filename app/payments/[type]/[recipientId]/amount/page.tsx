import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AmountInput } from "@/components/payments/AmountInput";
import { friends } from "@/lib/mockFriends";
import { getRecipientById } from "@/lib/recipients";

export default async function AmountPage({
  params,
}: {
  params: Promise<{ type: string; recipientId: string }>;
}) {
  const resolvedParams = await params;

  // Get recipient name based on type
  let recipientName = "Recipient";

  if (resolvedParams.type === "crypto") {
    try {
      // Try to get recipient from database first
      const recipient = await getRecipientById(resolvedParams.recipientId);
      if (recipient) {
        recipientName = recipient.name;
      } else {
        // Fallback to mock friends
        const friend = friends.find(
          (f) => f.id.toString() === resolvedParams.recipientId
        );
        recipientName = friend?.name || "Friend";
      }
    } catch (error) {
      console.error("Error fetching recipient:", error);
      // Fallback to mock friends
      const friend = friends.find(
        (f) => f.id.toString() === resolvedParams.recipientId
      );
      recipientName = friend?.name || "Friend";
    }
  } else {
    recipientName = "New recipient";
  }

  return (
    <div className="min-h-screen bg-[#1E1B3D] text-white flex flex-col">
      <div className="mx-auto max-w-md w-full flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center px-6 py-4">
          <Link href="/payments">
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
        </div>

        {/* Amount Input */}
        <AmountInput
          recipientName={recipientName}
          type={resolvedParams.type}
          recipientId={resolvedParams.recipientId}
        />
      </div>
    </div>
  );
}
