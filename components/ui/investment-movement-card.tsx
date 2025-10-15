"use client";

import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

/**
 * Investment movement data structure.
 */
interface InvestmentMovement {
  id: string;
  movement_type: "deposit" | "withdrawal" | "reward" | "fee";
  amount: string;
  token: string;
  created_at: string;
  tx_hash?: string;
  status: "pending" | "confirmed" | "failed";
}

/**
 * Props for the InvestmentMovementCard component.
 */
interface InvestmentMovementCardProps {
  movement: InvestmentMovement;
}

/**
 * Investment movement card component displaying individual investment transactions.
 * Shows movement type, amount, timestamp, and status with appropriate icons and colors.
 *
 * @param {InvestmentMovementCardProps} props - Component props
 * @returns {JSX.Element} Investment movement card component
 */
export function InvestmentMovementCard({
  movement,
}: InvestmentMovementCardProps) {
  const isPositive =
    movement.movement_type === "deposit" || movement.movement_type === "reward";
  const isNegative =
    movement.movement_type === "withdrawal" || movement.movement_type === "fee";

  const getIcon = () => {
    switch (movement.movement_type) {
      case "deposit":
        return <ArrowDownLeft className="h-5 w-5 text-green-400" />;
      case "withdrawal":
        return <ArrowUpRight className="h-5 w-5 text-red-400" />;
      case "reward":
        return <TrendingUp className="h-5 w-5 text-green-400" />;
      case "fee":
        return <TrendingDown className="h-5 w-5 text-red-400" />;
      default:
        return <TrendingUp className="h-5 w-5 text-white/60" />;
    }
  };

  const getLabel = () => {
    switch (movement.movement_type) {
      case "deposit":
        return "Deposit";
      case "withdrawal":
        return "Withdrawal";
      case "reward":
        return "Reward";
      case "fee":
        return "Fee";
      default:
        return "Movement";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
          {getIcon()}
        </div>
        <div>
          <div className="font-medium text-white">{getLabel()}</div>
          <div className="text-sm text-white/60">
            {new Date(movement.created_at).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`font-semibold text-white`}>
          {isPositive ? "+" : isNegative ? "-" : ""}
          {formatCurrency(parseFloat(movement.amount), "USD")}
        </div>
      </div>
    </div>
  );
}
