"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react";
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
  const router = useRouter();
  const isPositive =
    movement.movement_type === "deposit" || movement.movement_type === "reward";
  const isNegative =
    movement.movement_type === "withdrawal" || movement.movement_type === "fee";

  const getIcon = () => {
    switch (movement.movement_type) {
      case "deposit":
        return <ArrowUp className="h-5 w-5 text-green-400" />;
      case "withdrawal":
        return <ArrowDown className="h-5 w-5 text-red-400" />;
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);

    // Format time
    const time = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Get day and ordinal suffix
    const day = date.getDate();
    const getOrdinalSuffix = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    };

    const month = date.toLocaleString("en-US", { month: "short" });

    return {
      time,
      day: day.toString(),
      ordinal: getOrdinalSuffix(day),
      month,
    };
  };

  const handleClick = () => {
    router.push(`/invest/status/${movement.id}`);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-between w-full hover:bg-white/5 p-3 -m-3 rounded-xl transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
          {getIcon()}
        </div>
        <div>
          <div className="font-medium text-white text-left">{getLabel()}</div>
          <div className="text-sm text-white/60 text-left">
            {(() => {
              const { time, day, ordinal, month } = formatDateTime(
                movement.created_at
              );
              return (
                <>
                  {time}, {day}
                  <sup className="text-[0.65em]">{ordinal}</sup> {month}
                </>
              );
            })()}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`font-semibold text-white`}>
          {isPositive ? "+" : isNegative ? "-" : ""}
          {formatCurrency(parseFloat(movement.amount), "USD")}
        </div>
      </div>
    </button>
  );
}
