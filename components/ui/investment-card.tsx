"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Investment } from "@/lib/supabase";

/**
 * Props for the InvestmentCard component.
 */
interface InvestmentCardProps {
  investment: Investment;
  onWithdraw?: (investment: Investment) => void;
}

/**
 * Investment card component displaying investment details and performance.
 * Shows total value, invested amount, rewards, APR, and withdraw button.
 *
 * @param {InvestmentCardProps} props - Component props
 * @returns {JSX.Element} Investment card component
 */
export function InvestmentCard({
  investment,
  onWithdraw,
}: InvestmentCardProps) {
  const totalValue =
    parseFloat(investment.amount_invested) +
    parseFloat(investment.current_rewards);
  const isPositiveReturn = parseFloat(investment.current_rewards) > 0;

  return (
    <Card className="bg-white/5 border-white/10 p-6 hover:bg-white/10 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {investment.investment_name}
            </h3>
            <p className="text-sm text-white/60">
              {investment.investment_type === "morpho_vault"
                ? "Morpho Vault"
                : "Savings Account"}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            ${totalValue.toFixed(2)}
          </div>
          <div className="text-sm text-white/60">Total Value</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm text-white/60 mb-1">Invested</div>
          <div className="text-lg font-semibold text-white">
            ${parseFloat(investment.amount_invested).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-sm text-white/60 mb-1">Rewards</div>
          <div
            className={`text-lg font-semibold flex items-center gap-1 ${
              isPositiveReturn ? "text-green-400" : "text-white"
            }`}
          >
            {isPositiveReturn ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            ${parseFloat(investment.current_rewards).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-white/60">APR</div>
          <div className="text-lg font-semibold text-green-400">
            {investment.apr}%
          </div>
        </div>

        <Button
          onClick={() => onWithdraw?.(investment)}
          disabled
          variant="outline"
          size="sm"
          className="bg-white/5 border-white/20 text-white/60 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Withdraw
        </Button>
      </div>
    </Card>
  );
}
