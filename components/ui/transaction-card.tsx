"use client";

import { useRouter } from "next/navigation";
import { formatTransactionAmount } from "@/lib/transactions";
import type { Transaction } from "@/lib/supabase";

interface TransactionCardProps {
  transaction: Transaction;
  variant?: "default" | "completed";
  showNegative?: boolean; // Defaults to true for outgoing payments
}

export function TransactionCard({
  transaction,
  variant = "completed",
  showNegative = true,
}: TransactionCardProps) {
  const router = useRouter();

  const getVariantStyles = () => {
    switch (variant) {
      case "completed":
        return {
          container: "bg-purple-500/20",
          icon: "bg-purple-500/20",
          amount: "text-white",
          iconContent: (
            <span className="text-xl">
              {transaction.recipient?.name?.charAt(0).toUpperCase() || "?"}
            </span>
          ),
        };
      default:
        return {
          container: "bg-[#00704A]",
          icon: "bg-[#00704A]",
          amount: "text-white",
          iconContent: (
            <span className="text-md font-semibold text-white">
              {transaction.recipient?.name?.charAt(0).toUpperCase() || "?"}
            </span>
          ),
        };
    }
  };

  const styles = getVariantStyles();
  const amount = showNegative
    ? `-${formatTransactionAmount(transaction.amount, transaction.token)}`
    : formatTransactionAmount(transaction.amount, transaction.token);

  const handleClick = () => {
    router.push(`/payments/status/${transaction.id}`);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-between w-full hover:bg-white/5 p-3 -m-3 rounded-xl transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-full ${styles.icon} flex items-center justify-center`}
        >
          {styles.iconContent}
        </div>
        <div>
          <div className="font-medium text-white">
            {transaction.recipient?.name || "Unknown"}
          </div>
          <div className="text-sm text-white/60">
            {new Date(transaction.created_at).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`font-semibold ${styles.amount}`}>{amount}</div>
      </div>
    </button>
  );
}
