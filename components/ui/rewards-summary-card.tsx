"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

/**
 * Props for the RewardsSummaryCard component.
 */
interface RewardsSummaryCardProps {
  totalRewards: number;
  monthlyRewards: number;
  apr: number;
  investmentId?: string; // Optional investment ID for API calls
  chartData?: Array<{ day: number; value: number }>; // Optional pre-processed chart data
}

/**
 * Rewards summary card component displaying investment rewards with modern chart.
 * Shows monthly rewards on top, all-time rewards in bottom left, and progress chart in bottom right.
 *
 * @param {RewardsSummaryCardProps} props - Component props
 * @returns {JSX.Element} Rewards summary card component
 */
export function RewardsSummaryCard({
  totalRewards,
  monthlyRewards,
  apr,
  investmentId,
  chartData: providedChartData,
}: RewardsSummaryCardProps) {
  // Use provided chart data or fallback to mock data
  const chartData = providedChartData || [
    { day: 1, value: 0 },
    { day: 2, value: 0.5 },
    { day: 3, value: 1.2 },
    { day: 4, value: 0.8 },
    { day: 5, value: 1.5 },
    { day: 6, value: 2.1 },
    { day: 7, value: 1.8 },
    { day: 8, value: 2.3 },
    { day: 9, value: 2.8 },
    { day: 10, value: 3.2 },
    { day: 11, value: 2.9 },
    { day: 12, value: 3.5 },
    { day: 13, value: 4.1 },
    { day: 14, value: 3.8 },
    { day: 15, value: 4.3 },
    { day: 16, value: 4.8 },
    { day: 17, value: 5.2 },
    { day: 18, value: 4.9 },
    { day: 19, value: 5.5 },
    { day: 20, value: 6.1 },
    { day: 21, value: 5.8 },
    { day: 22, value: 6.3 },
    { day: 23, value: 6.8 },
    { day: 24, value: 7.2 },
    { day: 25, value: 6.9 },
    { day: 26, value: 7.5 },
    { day: 27, value: 8.1 },
    { day: 28, value: 7.8 },
    { day: 29, value: 8.3 },
    { day: 30, value: Math.max(monthlyRewards, 8.3) }, // Ensure smooth ending
  ];

  const maxValue = Math.max(...chartData.map((d) => d.value));
  const minValue = Math.min(...chartData.map((d) => d.value));

  return (
    <Card className="bg-[#2A1F4D]/80 backdrop-blur-sm border-0 p-6 mb-4">
      {/* Top Section - Monthly Rewards */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-white font-medium">Rewards this month</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-green-400 font-bold text-2xl">
            +{formatCurrency(monthlyRewards, "USD")}
          </div>
        </div>
      </div>

      {/* Bottom Section - All Time Rewards + Chart */}
      <div className="flex items-end gap-4">
        {/* Bottom Left - All Time Rewards (1/4) */}
        <div className="flex-1">
          <div className="text-white/70 text-sm mb-1">All time</div>
          <div className="text-green-400 font-bold text-xl">
            {formatCurrency(totalRewards, "USD")}
          </div>
        </div>

        {/* Bottom Right - Chart (3/4) */}
        <div className="flex-[3] h-16">
          <div className="relative h-14 w-full">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
            >
              {/* Gradient definition */}
              <defs>
                <linearGradient
                  id="chartGradient"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Area chart */}
              <path
                d={`M 0,${40 - (chartData[0].value / maxValue) * 40} ${chartData
                  .map((point, index) => {
                    const x = (index / (chartData.length - 1)) * 100;
                    const y = 40 - (point.value / maxValue) * 40;
                    return `L ${x},${y}`;
                  })
                  .join(" ")} L 100,40 L 0,40 Z`}
                fill="url(#chartGradient)"
              />

              {/* Line chart */}
              <path
                d={`M 0,${40 - (chartData[0].value / maxValue) * 40} ${chartData
                  .map((point, index) => {
                    const x = (index / (chartData.length - 1)) * 100;
                    const y = 40 - (point.value / maxValue) * 40;
                    return `L ${x},${y}`;
                  })
                  .join(" ")}`}
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </Card>
  );
}
