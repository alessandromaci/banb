"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Check,
  AlertCircle,
  Copy,
  ExternalLink,
  ArrowLeftRight,
  Loader2,
} from "lucide-react";
import { useTransactionStatus } from "@/lib/payments";
import type { Transaction } from "@/lib/supabase";

export function StatusIndicator() {
  const router = useRouter();
  const params = useParams();
  const txId = params.txId as string;

  const { transaction, isLoading, error } = useTransactionStatus(txId);
  const [currentStep, setCurrentStep] = useState(0);
  const [copied, setCopied] = useState(false);

  const copyTxHash = () => {
    if (transaction?.tx_hash) {
      navigator.clipboard.writeText(transaction.tx_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openExplorer = () => {
    if (transaction?.tx_hash) {
      window.open(`https://basescan.org/tx/${transaction.tx_hash}`, "_blank");
    }
  };

  const steps = [
    { label: "Pending", status: "pending" },
    { label: "Sent", status: "sent" },
    { label: "Confirmed", status: "success" },
  ];

  // Update current step based on transaction status
  useEffect(() => {
    if (transaction) {
      const stepIndex = steps.findIndex(
        (step) => step.status === transaction.status
      );
      // If status is "success", all steps should be complete
      setCurrentStep(stepIndex >= 0 ? stepIndex + 1 : 0);
    }
  }, [transaction, steps]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full px-6">
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="text-white/60">Loading transaction status...</div>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
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
            onClick={() => router.push("/")}
            className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 text-base font-medium"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const isComplete = transaction.status === "success";
  const isFailed = transaction.status === "failed";

  return (
    <div className="flex flex-col h-full px-6">
      <div className="flex-1 flex flex-col justify-center items-center space-y-8">
        {/* Transfer icon with status badge */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
            {isFailed ? (
              <AlertCircle className="w-8 h-8 text-red-400" />
            ) : (
              <ArrowLeftRight className="w-8 h-8 text-white" />
            )}
          </div>
          {!isFailed && (
            <div
              className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#0E0E0F] ${
                isComplete ? "bg-green-500" : "bg-blue-500"
              }`}
            >
              {isComplete ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              )}
            </div>
          )}
        </div>

        {/* Status text */}
        <div className="text-center">
          <h2 className="text-xl font-medium text-white mb-2">
            {isFailed
              ? "Payment failed"
              : isComplete
              ? "Payment complete!"
              : "Processing payment"}
          </h2>
          <p className="text-white/70 text-sm">
            {isFailed
              ? "There was an issue processing your payment"
              : isComplete
              ? "Your payment has been successfully sent"
              : "Please wait while we process your transaction"}
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

          {/* Transaction hash with inline buttons */}
          {transaction.tx_hash && (
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
                {transaction.tx_hash}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pb-8 pt-4">
        <Button
          onClick={() => router.push("/home")}
          disabled={
            transaction.status === "pending" || transaction.status === "sent"
          }
          className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 text-base font-medium disabled:opacity-50"
        >
          {isComplete ? "Close" : "Processing..."}
        </Button>
      </div>
    </div>
  );
}
