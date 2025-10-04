import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ReviewCard } from "@/components/payments/ReviewCard"
import { friends } from "@/lib/mockFriends"

export default function ReviewPage({ params }: { params: { type: string; recipientId: string } }) {
  // Get recipient details based on type
  let recipientName = "Recipient"
  let recipientDetails = ""

  if (params.type === "friend") {
    const friend = friends.find((f) => f.id.toString() === params.recipientId)
    recipientName = friend?.name || "Friend"
    recipientDetails = friend?.username || ""
  } else if (params.type === "wallet") {
    recipientName = "Crypto Wallet"
    recipientDetails = "0x1234...5678"
  } else if (params.type === "bank") {
    recipientName = "Bank Account"
    recipientDetails = "GB00 0000 0000 0000 00"
  }

  return (
    <div className="min-h-screen bg-[#1E1B3D] text-white flex flex-col">
      <div className="mx-auto max-w-md w-full flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center px-6 py-4">
          <Link href={`/payments/${params.type}/${params.recipientId}/amount`}>
            <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-white/10">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-white ml-4">Review</h1>
        </div>

        {/* Review Card */}
        <ReviewCard recipientName={recipientName} recipientDetails={recipientDetails} type={params.type} />
      </div>
    </div>
  )
}
