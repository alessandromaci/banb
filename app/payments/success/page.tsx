"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "payment";
  const amount = searchParams.get("amount") || "0";
  const recipient = searchParams.get("recipient") || "Recipient";

  return (
    <div className="min-h-screen bg-[#1E1B3D] text-white flex flex-col">
      <div className="mx-auto max-w-md w-full flex flex-col h-screen">
        {/* Header */}
        <div className="px-6 py-4">
          <h1 className="text-2xl font-semibold text-white">Payment sent</h1>
        </div>

        {/* Success Content */}
        <div className="flex-1 flex flex-col justify-center px-6">
          <div className="text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center mx-auto">
              <Check className="h-10 w-10 text-white" />
            </div>

            <div>
              <div className="text-2xl font-medium text-white mb-2">
                Payment sent successfully!
              </div>
              <div className="text-white/60">
                Your payment has been processed
              </div>
            </div>

            <div className="bg-[#2A2640] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">To</span>
                <span className="text-white">{recipient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Amount</span>
                <span className="text-white">${amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Type</span>
                <span className="text-white capitalize">{type}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="px-6 pb-6">
          <Link href="/payments">
            <Button className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 text-base font-medium">
              Back to Payments
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1E1B3D] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
