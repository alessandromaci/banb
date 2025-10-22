"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { useInvestmentMovementStatus } from "@/lib/investment-movement-status";
import type { InvestmentMovementStatus } from "@/lib/investment-movement-status";

export default function InvestmentStatusPage() {
  const router = useRouter();
  const params = useParams();
  const txId = params.txId as string;

  const { movement, isLoading, error, refetch } =
    useInvestmentMovementStatus(txId);
  const [currentStep, setCurrentStep] = useState(0);
  const [copied, setCopied] = useState(false);

  // Auto-refresh every 5 seconds if status is pending
  useEffect(() => {
    if (movement?.status === "pending") {
      const interval = setInterval(() => {
        refetch();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [movement?.status, refetch]);

  const copyTxHash = () => {
    if (movement?.tx_hash) {
      navigator.clipboard.writeText(movement.tx_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openExplorer = () => {
    if (movement?.tx_hash) {
      window.open(`https://basescan.org/tx/${movement.tx_hash}`, "_blank");
    }
  };

  const steps = useMemo(() => [
    { label: "Pending", status: "pending" },
    { label: "Processing", status: "active" },
    { label: "Invested", status: "confirmed" },
  ], []);

  // Update current step based on investment status
  useEffect(() => {
    if (movement) {
      const stepIndex = steps.findIndex(
        (step) => step.status === movement.status
      );
      // If status is "active", show as processing
      // If status is "success", all steps should be complete
      setCurrentStep(stepIndex >= 0 ? stepIndex + 1 : 0);
    }
  }, [movement, steps]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full px-6">
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="text-white/60">Loading investment status...</div>
        </div>
      </div>
    );
  }

  if (error || !movement) {
    return (
      <div className="flex flex-col h-full px-6">
        <div className="flex-1 flex flex-col justify-center items-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <div className="text-red-400 text-center">
            {error || "Transaction not found"}
          </div>
        </div>
        <div className="pb-6 pt-4">
          <Button
            onClick={() => router.push("/home")}
            className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 text-base font-medium"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-md">
        <div className="flex flex-col min-h-screen px-6 py-6">
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
                    <div
                      className={`text-lg font-medium ${
                        index <= currentStep ? "text-white" : "text-white/40"
                      }`}
                    >
                      {step.label}
                    </div>
                    {index === currentStep && movement.status === "confirmed" && (
                      <div className="text-white/60 text-sm">
                        {String(movement.metadata?.investment_name || "Investment")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {movement.status === "confirmed" && (
              <div className="mt-12 text-center">
                <div className="text-2xl font-medium text-white mb-2">
                  Investment complete!
                </div>
                <div className="text-white/60 mb-4">
                  Your funds have been successfully invested in{" "}
                  {String(movement.metadata?.investment_name || "Investment")}
                </div>
                <div className="space-y-3">
                  <div className="text-white/40 text-sm">
                    Amount: ${movement.amount} USDC
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={copyTxHash}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy TX Hash
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={openExplorer}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Explorer
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {movement.status === "failed" && (
              <div className="mt-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <div className="text-2xl font-medium text-red-400 mb-2">
                  Investment failed
                </div>
                <div className="text-white/60">
                  There was an issue processing your investment
                </div>
              </div>
            )}
          </div>

          <div className="pb-6 pt-4">
            <Button
              onClick={() => router.push("/home")}
              disabled={movement.status === "pending"}
              className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 text-base font-medium disabled:opacity-50"
            >
              {movement.status === "confirmed" ? "Done" : "Back to Home"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
