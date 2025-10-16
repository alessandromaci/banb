"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle, Copy, ExternalLink } from "lucide-react";
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
                <div
                  className={`text-lg font-medium ${
                    index <= currentStep ? "text-white" : "text-white/40"
                  }`}
                >
                  {step.label}
                </div>
                {index === currentStep &&
                  transaction.status === "sent" &&
                  transaction.tx_hash && (
                    <div className="text-white/60 text-sm font-mono">
                      {transaction.tx_hash.slice(0, 10)}...
                      {transaction.tx_hash.slice(-8)}
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>

        {transaction.status === "success" && (
          <div className="mt-12 text-center">
            <div className="text-2xl font-medium text-white mb-2">
              Payment complete!
            </div>
            <div className="text-white/60 mb-4">
              Your payment has been successfully sent
            </div>
            {transaction.tx_hash && (
              <div className="space-y-3">
                <div className="text-white/40 text-sm font-mono">
                  TX: {transaction.tx_hash.slice(0, 10)}...
                  {transaction.tx_hash.slice(-8)}
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
                        Copy Hash
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
            )}
          </div>
        )}

        {transaction.status === "failed" && (
          <div className="mt-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <div className="text-2xl font-medium text-red-400 mb-2">
              Payment failed
            </div>
            <div className="text-white/60">
              There was an issue processing your payment
            </div>
          </div>
        )}
      </div>

      <div className="pb-6 pt-4">
        <Button
          onClick={() => router.push("/home")}
          disabled={
            transaction.status === "pending" || transaction.status === "sent"
          }
          className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 text-base font-medium disabled:opacity-50"
        >
          {transaction.status === "success" ? "Done" : "Back to Home"}
        </Button>
      </div>
    </div>
  );
}
