"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Check,
  AlertCircle,
  Copy,
  ExternalLink,
  TrendingUp,
  Loader2,
} from "lucide-react";
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
      { label: "Sending", status: "pending" },
      { label: "Confirming", status: "confirming" },
      { label: "Invested", status: "confirmed" },
    ],
    []
  );

  // Update current step based on investment status
  useEffect(() => {
    if (movement) {
      if (movement.status === "pending") {
        // Pending: tx is being sent/mined
        setCurrentStep(1);
      } else if (movement.status === "confirmed") {
        // Confirmed: all steps complete
        setCurrentStep(3);
      } else if (movement.status === "failed") {
        // Failed: show error state
        setCurrentStep(0);
      }
    }
  }, [movement]);

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
        <div className="flex flex-col h-full px-6">
          {movement.status === "confirmed" ? (
            <>
              {/* Success State */}
              <div className="flex-1 flex flex-col justify-center items-center space-y-8">
                {/* Icon with badge */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center border-2 border-[#0E0E0F]">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Status text */}
                <div className="text-center">
                  <h2 className="text-xl font-medium text-white mb-2">
                    Investment complete!
                  </h2>
                  <p className="text-white/60 text-sm">
                    Your funds are now earning{" "}
                    {movement.metadata?.apr ? `${movement.metadata.apr}%` : ""}{" "}
                    APR
                  </p>
                </div>

                {/* Transaction steps */}
                <div className="w-full space-y-4">
                  {steps.map((step, index) => {
                    const isActive = index < steps.length;

                    return (
                      <div
                        key={step.label}
                        className="flex justify-between items-center"
                      >
                        <span className="text-base text-white">
                          {step.label}
                        </span>
                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-green-500">
                          <Check className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    );
                  })}

                  {/* Transaction hash with inline buttons */}
                  {movement.tx_hash && (
                    <div className="pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white text-sm">TX Hash</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={copyTxHash}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            title="Copy hash"
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4 text-white/60" />
                            )}
                          </button>
                          <button
                            onClick={openExplorer}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            title="View on explorer"
                          >
                            <ExternalLink className="h-4 w-4 text-white/60" />
                          </button>
                        </div>
                      </div>
                      <div className="text-white/90 text-sm font-mono break-all bg-white/5 px-3 py-2 rounded-lg">
                        {movement.tx_hash}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pb-8 pt-4">
                <Button
                  onClick={() => router.push("/home")}
                  className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 text-base font-medium"
                >
                  Close
                </Button>
              </div>
            </>
          ) : movement.status === "failed" ? (
            <>
              {/* Failed State */}
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center border-2 border-[#0E0E0F]">
                      <AlertCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xl font-medium text-white mb-2">
                      Investment failed
                    </div>
                    <div className="text-white/60 text-sm">
                      There was an issue processing your investment
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pb-8 pt-4">
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
              <div className="flex-1 flex flex-col justify-center items-center space-y-8">
                {/* Icon with badge */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center border-2 border-[#0E0E0F]">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                </div>

                {/* Status text */}
                <div className="text-center">
                  <h2 className="text-xl font-medium text-white mb-2">
                    Processing investment
                  </h2>
                  <p className="text-white/60 text-sm">
                    Please wait while we process your transaction
                  </p>
                </div>

                {/* Transaction steps */}
                <div className="w-full space-y-4">
                  {steps.map((step, index) => {
                    const isActive = index < currentStep;
                    const isCurrent = index === currentStep - 1;

                    return (
                      <div
                        key={step.label}
                        className="flex justify-between items-center"
                      >
                        <span
                          className={`text-base ${
                            isActive ? "text-white" : "text-white/40"
                          }`}
                        >
                          {step.label}
                        </span>
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                            isActive
                              ? "bg-green-500"
                              : isCurrent
                              ? "bg-blue-500"
                              : "bg-white/10"
                          }`}
                        >
                          {isActive ? (
                            <Check className="h-5 w-5 text-white" />
                          ) : isCurrent ? (
                            <Loader2 className="h-4 w-4 text-white animate-spin" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-white/50" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <div className="pb-8 pt-4">
                <Button
                  onClick={() => router.push("/home")}
                  disabled={movement.status === "pending"}
                  className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 text-base font-medium disabled:opacity-30"
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
