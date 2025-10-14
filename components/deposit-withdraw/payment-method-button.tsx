"use client"

import type React from "react"

import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaymentMethodButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

export function PaymentMethodButton({ icon, label, onClick }: PaymentMethodButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="w-full h-auto p-4 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 flex items-center justify-between group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">{icon}</div>
        <span className="text-white font-medium">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white/80 transition-colors" />
    </Button>
  )
}
