"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Building2, Bitcoin } from "lucide-react";

export function PaymentOptions() {
  const router = useRouter();

  const options = [
    {
      icon: Bitcoin,
      label: "Crypto",
      onClick: () => router.push("/payments/add-crypto"),
    },
    {
      icon: Building2,
      label: "Bank",
      onClick: () => router.push("/payments/bank"),
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {options.map((option) => (
        <div key={option.label} className="flex flex-col items-center gap-2">
          <Button
            size="icon"
            onClick={option.onClick}
            className="h-16 w-16 rounded-2xl bg-[#3A3650] hover:bg-[#4A4660] text-white border-0"
          >
            <option.icon className="h-7 w-7" />
          </Button>
          <span className="text-xs text-white/90">{option.label}</span>
        </div>
      ))}
    </div>
  );
}
