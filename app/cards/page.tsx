"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";

export default function CardsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <Link href="/home">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Cards</h1>
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="p-6">
          <Card className="bg-gradient-to-br from-purple-600 to-blue-600 border-0 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
            <p className="text-white/80">
              Card functionality coming soon — virtual and physical cards for
              expenses.
            </p>
          </Card>

          <div className="mt-6 space-y-3 text-sm text-white/60">
            <p>🎯 Virtual cards for online purchases</p>
            <p>💳 Physical cards delivered to your door</p>
            <p>🔒 Secure and encrypted transactions</p>
            <p>📊 Real-time spending tracking</p>
          </div>
        </div>
      </div>
    </div>
  );
}
