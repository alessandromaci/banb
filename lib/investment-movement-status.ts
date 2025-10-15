"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

export interface InvestmentMovementStatus {
  id: string;
  profile_id: string;
  investment_id: string;
  movement_type: string;
  amount: string;
  token: string;
  chain: string;
  status: "pending" | "confirmed" | "failed";
  tx_hash: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useInvestmentMovementStatus(movementId: string) {
  const [movement, setMovement] = useState<InvestmentMovementStatus | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovement = useCallback(async () => {
    if (!movementId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("investment_movements")
        .select("*")
        .eq("id", movementId)
        .single();

      if (error) {
        throw new Error(
          `Failed to fetch investment movement: ${error.message}`
        );
      }

      setMovement(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch investment movement";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [movementId]);

  useEffect(() => {
    fetchMovement();
  }, [fetchMovement]);

  return {
    movement,
    isLoading,
    error,
    refetch: fetchMovement,
  };
}
