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

  const steps = useMemo(
    () => [
      { label: "Pending", status: "pending" },
      { label: "Processing", status: "active" },
      { label: "Invested", status: "confirmed" },
    ],
    []
  );

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
      <div className="min-h-screen bg-[#0E0E0F] text-white flex flex-col">
        <div className="mx-auto max-w-md w-full flex flex-col h-screen">
          <div className="flex flex-col h-full px-6">
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="text-white/60">Loading investment status...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !movement) {
    return (
      <div className="min-h-screen bg-[#0E0E0F] text-white flex flex-col">
        <div className="mx-auto max-w-md w-full flex flex-col h-screen">
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-white flex flex-col">
      <div className="mx-auto max-w-md w-full flex flex-col h-screen">
        <div className="flex flex-col h-full px-6 py-6">
          {movement.status === "confirmed" ? (
            <>
              {/* Success State */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-center space-y-6">
                  <div className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center mx-auto">
                    <Check className="h-10 w-10 text-white" />
                  </div>

                  <div>
                    <div className="text-2xl font-medium text-white mb-2">
                      Investment successful!
                    </div>
                    <div className="text-white/60">
                      Your funds are now earning{" "}
                      {movement.metadata?.apr
                        ? `${movement.metadata.apr}%`
                        : ""}{" "}
                      APR
                    </div>
                  </div>

                  <div className="bg-[#2A2640] rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">Invested in</span>
                      <span className="text-white">
                        {String(movement.metadata?.investment_name || "Vault")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Amount</span>
                      <span className="text-white">
                        ${movement.amount} USDC
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Expected APR</span>
                      <span className="text-green-400 font-semibold">
                        {movement.metadata?.apr
                          ? `${movement.metadata.apr}%`
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  {movement.tx_hash && (
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
                            Copy TX
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
                        Explorer
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pb-6">
                <Button
                  onClick={() => router.push("/home")}
                  className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 text-base font-medium"
                >
                  Done
                </Button>
              </div>
            </>
          ) : movement.status === "failed" ? (
            <>
              {/* Failed State */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-center space-y-6">
                  <div className="h-20 w-20 rounded-full bg-red-500 flex items-center justify-center mx-auto">
                    <AlertCircle className="h-10 w-10 text-white" />
                  </div>

                  <div>
                    <div className="text-2xl font-medium text-red-400 mb-2">
                      Investment failed
                    </div>
                    <div className="text-white/60">
                      There was an issue processing your investment
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pb-6">
                <Button
                  onClick={() => router.push("/home")}
                  className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 text-base font-medium"
                >
                  Back to Home
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Processing State */}
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
                            index <= currentStep
                              ? "text-white"
                              : "text-white/40"
                          }`}
                        >
                          {step.label}
                        </div>
                        {index === currentStep && (
                          <div className="text-white/60 text-sm">
                            {String(
                              movement.metadata?.investment_name ||
                                "Processing..."
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pb-6 pt-4">
                <Button
                  onClick={() => router.push("/home")}
                  disabled={movement.status === "pending"}
                  className="w-full h-14 rounded-full text-white text-base font-medium disabled:opacity-30 border-0"
                  style={{
                    backgroundColor:
                      movement.status === "pending"
                        ? "rgba(52, 121, 255, 0.3)"
                        : "#3479FF",
                  }}
                >
                  {movement.status === "pending"
                    ? "Processing..."
                    : "Back to Home"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
