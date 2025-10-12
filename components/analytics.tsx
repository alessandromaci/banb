"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, TrendingUp, TrendingDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function AnalyticsPage() {
  const router = useRouter();

  const chartData = [
    { month: "Jan", balance: 1800 },
    { month: "Feb", balance: 2100 },
    { month: "Mar", balance: 1950 },
    { month: "Apr", balance: 2300 },
    { month: "May", balance: 2200 },
    { month: "Jun", balance: 2450 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3B1EFF] via-[#5B3FFF] to-[#1A0F3D] text-white">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 mb-6">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => router.back()}
            className="h-10 w-10 rounded-full text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Analytics</h1>
          <div className="w-10" />
        </div>

        {/* Chart */}
        <div className="px-6 mb-8">
          <Card className="bg-[#2A1F4D]/80 backdrop-blur-sm border-0 rounded-3xl p-6">
            <h2 className="text-lg font-semibold mb-6">Balance Over Time</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="month"
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A0F3D",
                    border: "none",
                    borderRadius: "12px",
                    color: "white",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#7B4CFF"
                  strokeWidth={3}
                  dot={{ fill: "#7B4CFF", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="px-6 grid grid-cols-2 gap-4">
          <Card className="bg-[#2A1F4D]/80 backdrop-blur-sm border-0 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-400" />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">$487.50</div>
            <div className="text-sm text-white/60">Total Expenses</div>
            <div className="text-xs text-white/50 mt-1">Last 30 days</div>
          </Card>

          <Card className="bg-[#2A1F4D]/80 backdrop-blur-sm border-0 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">+11.4%</div>
            <div className="text-sm text-white/60">Balance Growth</div>
            <div className="text-xs text-white/50 mt-1">vs last month</div>
          </Card>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
