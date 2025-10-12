"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WalletAddressCardProps {
  address: string
}

export function WalletAddressCard({ address }: WalletAddressCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-white/70">Your Wallet Address</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-white font-mono text-sm break-all">{address}</code>
          <Button onClick={handleCopy} size="sm" variant="ghost" className="shrink-0 text-white hover:bg-white/10">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
        <p className="text-xs text-amber-200">
          <strong>Important:</strong> Send USDC on Base chain only. Transfers sent to other networks will be lost.
        </p>
      </div>
    </div>
  )
}
