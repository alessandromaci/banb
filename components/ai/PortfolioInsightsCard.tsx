"use client";

import { type PortfolioInsights } from "@/lib/ai-agent";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, DollarSign, Users, BarChart3 } from "lucide-react";
import React from "react";

interface PortfolioInsightsCardProps {
  insights: PortfolioInsights;
}

/**
 * Portfolio Insights Card Component
 * 
 * Displays AI-generated portfolio insights including spending metrics,
 * top recipients, spending trends, and average transaction amounts.
 * 
 * @component
 * @param {PortfolioInsights} insights - Portfolio insights data
 * 
 * @example
 * ```tsx
 * const insights = {
 *   totalSpent: "450.00",
 *   topRecipients: [
 *     { name: "Alice", amount: "200.00" },
 *     { name: "Bob", amount: "150.00" }
 *   ],
 *   spendingTrend: "increasing",
 *   averageTransaction: "75.00"
 * };
 * 
 * <PortfolioInsightsCard insights={insights} />
 * ```
 */
export function PortfolioInsightsCard({ insights }: PortfolioInsightsCardProps) {
  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Portfolio Insights</h3>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Spent */}
        <MetricCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Total Spent"
          value={`$${insights.totalSpent}`}
          description="All-time spending"
        />

        {/* Average Transaction */}
        <MetricCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Average Transaction"
          value={`$${insights.averageTransaction}`}
          description="Per transaction"
        />
      </div>

      {/* Spending Trend */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium">Spending Trend</h4>
        </div>
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center gap-3">
            {getTrendIcon(insights.spendingTrend)}
            <div>
              <p className="text-sm font-medium capitalize">
                {insights.spendingTrend}
              </p>
              <p className="text-xs text-muted-foreground">
                {getTrendDescription(insights.spendingTrend)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Recipients */}
      {insights.topRecipients.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Top Recipients</h4>
          </div>
          <div className="space-y-2">
            {insights.topRecipients.map((recipient, index) => (
              <RecipientBar
                key={index}
                name={recipient.name}
                amount={recipient.amount}
                rank={index + 1}
                maxAmount={parseFloat(insights.topRecipients[0].amount)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {insights.topRecipients.length === 0 && (
        <div className="text-center py-6">
          <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No transaction data available yet
          </p>
        </div>
      )}
    </Card>
  );
}

/**
 * Metric Card Component
 * Displays a single metric with icon, label, value, and description.
 */
function MetricCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card className="p-4 bg-muted/50">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold truncate">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Recipient Bar Component
 * Displays a recipient with a visual bar representing their spending amount.
 */
function RecipientBar({
  name,
  amount,
  rank,
  maxAmount,
}: {
  name: string;
  amount: string;
  rank: number;
  maxAmount: number;
}) {
  const percentage = (parseFloat(amount) / maxAmount) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground w-4">
            #{rank}
          </span>
          <span className="font-medium">{name}</span>
        </div>
        <span className="text-muted-foreground">${amount}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Get trend icon based on spending trend
 */
function getTrendIcon(trend: "increasing" | "decreasing" | "stable") {
  switch (trend) {
    case "increasing":
      return (
        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/20">
          <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-500" />
        </div>
      );
    case "decreasing":
      return (
        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950/20">
          <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-500" />
        </div>
      );
    case "stable":
      return (
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/20">
          <Minus className="h-5 w-5 text-blue-600 dark:text-blue-500" />
        </div>
      );
  }
}

/**
 * Get trend description text
 */
function getTrendDescription(trend: "increasing" | "decreasing" | "stable"): string {
  switch (trend) {
    case "increasing":
      return "Your spending has increased compared to earlier periods";
    case "decreasing":
      return "Your spending has decreased compared to earlier periods";
    case "stable":
      return "Your spending has remained relatively consistent";
  }
}
