"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InvestmentMovementCard } from "@/components/ui/investment-movement-card";
import { getInvestmentHistory } from "@/lib/investment-movements";
import { useUser } from "@/lib/user-context";

/**
 * Investment movements page displaying all investment-related transactions.
 * Shows deposits, withdrawals, rewards, and fees with filtering and search capabilities.
 *
 * @returns {JSX.Element} Investment movements page component
 */
export default function InvestmentMovementsPage() {
  const router = useRouter();
  const { profile } = useUser();
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovements = async () => {
      if (!profile?.id) return;

      try {
        setLoading(true);
        setError(null);
        const data = await getInvestmentHistory(profile.id, 50); // Get more movements
        setMovements(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch movements"
        );
        console.error("Failed to fetch investment movements:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#3B1EFF] via-[#5B3FFF] to-[#1A0F3D] text-white">
        <div className="mx-auto max-w-md">
          <div className="pt-3 px-6 pb-6">
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">Investment Movements</h1>
            </div>
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-white/60" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#3B1EFF] via-[#5B3FFF] to-[#1A0F3D] text-white">
        <div className="mx-auto max-w-md">
          <div className="pt-3 px-6 pb-6">
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">Investment Movements</h1>
            </div>
            <Card className="bg-[#2A1F4D]/80 backdrop-blur-sm border-0 rounded-3xl p-6">
              <div className="text-center py-8">
                <p className="text-red-400 mb-4">Error: {error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-white/10 text-white hover:bg-white/20"
                >
                  Retry
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3B1EFF] via-[#5B3FFF] to-[#1A0F3D] text-white">
      <div className="mx-auto max-w-md">
        <div className="pt-3 px-6 pb-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Investment Movements</h1>
          </div>

          {/* Movements List */}
          <Card className="bg-[#2A1F4D]/80 backdrop-blur-sm border-0 rounded-3xl p-5 shadow-xl">
            <div className="space-y-4">
              {movements.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <p>No investment activity yet</p>
                </div>
              ) : (
                movements.map((movement) => (
                  <InvestmentMovementCard
                    key={movement.id}
                    movement={movement}
                  />
                ))
              )}
            </div>
          </Card>

          {/* Bottom Spacer */}
          <div className="h-20" />
        </div>
      </div>
    </div>
  );
}
