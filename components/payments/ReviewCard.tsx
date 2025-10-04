"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ReviewCardProps {
  recipientName: string
  recipientDetails: string
  type: string
}

export function ReviewCard({ recipientName, recipientDetails, type }: ReviewCardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const amount = searchParams.get("amount") || "0"
  const note = searchParams.get("note") || ""

  const handleSend = () => {
    const txId = Date.now().toString()
    router.push(`/payments/status/${txId}`)
  }

  return (
    <div className="flex flex-col h-full px-6">
      <div className="flex-1 flex flex-col justify-center">
        <Card className="bg-[#2A2640] border-0 rounded-3xl p-6 space-y-6">
          <div>
            <div className="text-white/60 text-sm mb-1">To</div>
            <div className="text-white text-lg font-medium">{recipientName}</div>
            <div className="text-white/50 text-sm font-mono">{recipientDetails}</div>
          </div>

          <div className="h-px bg-white/10" />

          <div>
            <div className="text-white/60 text-sm mb-1">Amount</div>
            <div className="text-white text-3xl font-light">€{amount}</div>
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
              <span className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-xs">R</span>
              Main · €2290.73
            </div>
          </div>
        </Card>
      </div>

      <div className="pb-6 pt-4">
        <Button
          onClick={handleSend}
          className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 text-base font-medium"
        >
          SEND
        </Button>
      </div>
    </div>
  )
}
