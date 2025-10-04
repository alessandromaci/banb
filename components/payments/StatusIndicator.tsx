"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export function StatusIndicator() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { label: "Sent", completed: false },
    { label: "In transit", completed: false },
    { label: "Received", completed: false },
  ]

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(1), 2000)
    const timer2 = setTimeout(() => setCurrentStep(2), 4000)
    const timer3 = setTimeout(() => setCurrentStep(3), 6000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])

  return (
    <div className="flex flex-col h-full px-6">
      <div className="flex-1 flex flex-col justify-center">
        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center gap-4">
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                  index < currentStep
                    ? "bg-green-500"
                    : index === currentStep
                      ? "bg-blue-500 animate-pulse"
                      : "bg-white/10"
                }`}
              >
                {index < currentStep ? (
                  <Check className="h-6 w-6 text-white" />
                ) : (
                  <div className="h-3 w-3 rounded-full bg-white/50" />
                )}
              </div>
              <div>
                <div className={`text-lg font-medium ${index <= currentStep ? "text-white" : "text-white/40"}`}>
                  {step.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {currentStep >= 3 && (
          <div className="mt-12 text-center">
            <div className="text-2xl font-medium text-white mb-2">Payment complete!</div>
            <div className="text-white/60">Your payment has been successfully sent</div>
          </div>
        )}
      </div>

      <div className="pb-6 pt-4">
        <Button
          onClick={() => router.push("/")}
          disabled={currentStep < 3}
          className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 text-base font-medium disabled:opacity-50"
        >
          Done
        </Button>
      </div>
    </div>
  )
}
