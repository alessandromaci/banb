"use client";

import { useState, useEffect } from "react";
import { supabase, type InvestmentMovement } from "./supabase";

/**
 * React hook to manage investment movements for a user.
 * Fetches and manages investment movements (deposits, withdrawals, rewards) from Supabase.
 *
 * @param {string} profileId - User profile ID to fetch movements for
 * @returns {Object} Investment movements state and actions
 * @returns {InvestmentMovement[]} return.movements - Array of investment movements
 * @returns {boolean} return.isLoading - True while fetching movements
 * @returns {string | null} return.error - Error message if fetch failed
 * @returns {Function} return.createMovement - Function to create new movement
 * @returns {Function} return.updateMovementStatus - Function to update movement status
 *
 * @example
 * ```tsx
 * function InvestmentHistory() {
 *   const { movements, isLoading, error, createMovement } = useInvestmentMovements(profileId);
 *
 *   if (isLoading) return <div>Loading movements...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   return (
 *     <div>
 *       {movements.map(movement => (
 *         <div key={movement.id}>{movement.amount} {movement.token}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useInvestmentMovements(profileId?: string) {
  const [movements, setMovements] = useState<InvestmentMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId) return;

    const fetchMovements = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("investment_movements")
          .select("*")
          .eq("profile_id", profileId)
          .order("created_at", { ascending: false });

        if (error) {
          throw new Error(
            `Failed to fetch investment movements: ${error.message}`
          );
        }

        setMovements(data || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch investment movements"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovements();
  }, [profileId]);

  const createMovement = async (data: {
    profile_id: string;
    investment_id: string;
    movement_type: "deposit" | "withdrawal" | "reward" | "fee";
    amount: string;
    token?: string;
    tx_hash?: string;
    chain?: string;
    metadata?: Record<string, any>;
  }): Promise<InvestmentMovement> => {
    const { data: movement, error } = await supabase
      .from("investment_movements")
      .insert({
        ...data,
        token: data.token || "USDC",
        chain: data.chain || "base",
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create investment movement: ${error.message}`);
    }

    setMovements((prev) => [movement, ...prev]);
    return movement;
  };

  const updateMovementStatus = async (
    movementId: string,
    status: "pending" | "confirmed" | "failed",
    txHash?: string
  ): Promise<InvestmentMovement> => {
    const updates: any = { status };
    if (txHash) {
      updates.tx_hash = txHash;
    }

    const { data, error } = await supabase
      .from("investment_movements")
      .update(updates)
      .eq("id", movementId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update investment movement: ${error.message}`);
    }

    setMovements((prev) =>
      prev.map((mov) => (mov.id === movementId ? data : mov))
    );

    return data;
  };

  return {
    movements,
    isLoading,
    error,
    createMovement,
    updateMovementStatus,
  };
}

/**
 * Get investment movements for a specific investment.
 *
 * @param {string} investmentId - Investment ID to fetch movements for
 * @returns {Promise<InvestmentMovement[]>} Array of investment movements
 * @throws {Error} If database query fails
 */
export async function getInvestmentMovements(
  investmentId: string
): Promise<InvestmentMovement[]> {
  const { data, error } = await supabase
    .from("investment_movements")
    .select("*")
    .eq("investment_id", investmentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch investment movements: ${error.message}`);
  }

  return data || [];
}

/**
 * Get total invested amount for a profile using database function.
 *
 * @param {string} profileId - User profile ID
 * @returns {Promise<number>} Total amount invested
 * @throws {Error} If database query fails
 */
export async function getTotalInvestedAmount(
  profileId: string
): Promise<number> {
  const { data, error } = await supabase.rpc("get_total_invested_amount", {
    user_profile_id: profileId,
  });

  if (error) {
    throw new Error(`Failed to get total invested amount: ${error.message}`);
  }

  return data || 0;
}

/**
 * Get total rewards earned for a profile using database function.
 *
 * @param {string} profileId - User profile ID
 * @returns {Promise<number>} Total rewards earned
 * @throws {Error} If database query fails
 */
export async function getTotalRewardsEarned(
  profileId: string
): Promise<number> {
  const { data, error } = await supabase.rpc("get_total_rewards_earned", {
    user_profile_id: profileId,
  });

  if (error) {
    throw new Error(`Failed to get total rewards earned: ${error.message}`);
  }

  return data || 0;
}

/**
 * Get investment summary for a profile (total invested + rewards).
 *
 * @param {string} profileId - User profile ID
 * @returns {Promise<Object>} Investment summary
 * @returns {number} return.totalInvested - Total amount invested
 * @returns {number} return.totalRewards - Total rewards earned
 * @returns {number} return.totalValue - Combined total value
 */
export async function getInvestmentSummary(profileId: string) {
  const [totalInvested, totalRewards] = await Promise.all([
    getTotalInvestedAmount(profileId),
    getTotalRewardsEarned(profileId),
  ]);

  return {
    totalInvested,
    totalRewards,
    totalValue: totalInvested + totalRewards,
  };
}

/**
 * Get investment summary by vault/account for UI display.
 * Returns both active and pending investments to show in the investment account view.
 *
 * @param {string} profileId - User profile ID
 * @returns {Promise<Array>} Array of investment account summaries
 * @returns {string} return[].vault_address - Vault contract address
 * @returns {number} return[].total_invested - Total amount invested
 * @returns {number} return[].total_rewards - Total rewards earned
 * @returns {number} return[].total_value - Combined total value
 * @returns {string} return[].investment_name - Name of the investment
 * @returns {string} return[].investment_id - Investment ID
 * @returns {number} return[].apr - Annual percentage rate
 * @returns {string} return[].status - Investment status (active/pending)
 */
export async function getInvestmentSummaryByVault(profileId: string) {
  try {
    // Get all investments for the profile
    const { data: investments, error: investmentsError } = await supabase
      .from("investments")
      .select("*")
      .eq("profile_id", profileId)
      .in("status", ["active", "pending"])
      .order("created_at", { ascending: false });

    if (investmentsError) {
      throw new Error(`Failed to get investments: ${investmentsError.message}`);
    }

    if (!investments || investments.length === 0) {
      return [];
    }

    // For each investment, get the total from movements
    const transformedData = await Promise.all(
      investments.map(async (investment) => {
        // Get all deposit movements for this investment
        const { data: movements, error: movementsError } = await supabase
          .from("investment_movements")
          .select("amount, movement_type")
          .eq("investment_id", investment.id)
          .eq("movement_type", "deposit");

        if (movementsError) {
          console.error(
            "Failed to get movements for investment:",
            investment.id,
            movementsError
          );
          // Fallback to investment amount if movements query fails
          return {
            vault_address: investment.vault_address,
            total_invested: parseFloat(investment.amount_invested),
            total_rewards: parseFloat(investment.current_rewards),
            total_value:
              parseFloat(investment.amount_invested) +
              parseFloat(investment.current_rewards),
            investment_count: 1,
            investment_name: investment.investment_name,
            investment_id: investment.id,
            apr: investment.apr,
            status: investment.status,
          };
        }

        // Calculate total from movements
        const totalFromMovements =
          movements?.reduce((sum, movement) => {
            return sum + parseFloat(movement.amount);
          }, 0) || 0;

        return {
          vault_address: investment.vault_address,
          total_invested: totalFromMovements,
          total_rewards: parseFloat(investment.current_rewards),
          total_value:
            totalFromMovements + parseFloat(investment.current_rewards),
          investment_count: 1,
          investment_name: investment.investment_name,
          investment_id: investment.id,
          apr: investment.apr,
          status: investment.status,
        };
      })
    );

    return transformedData;
  } catch (error) {
    console.error("Error in getInvestmentSummaryByVault:", error);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
}

/**
 * Get investment history for a profile (movements/transactions).
 *
 * @param {string} profileId - User profile ID
 * @param {number} limit - Maximum number of records to return (default: 50)
 * @returns {Promise<InvestmentMovement[]>} Array of investment movements
 */
export async function getInvestmentHistory(
  profileId: string,
  limit: number = 50
) {
  try {
    const { data, error } = await supabase
      .from("investment_movements")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get investment history: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
}

/**
 * Create a deposit movement when user invests in a vault.
 *
 * @param {Object} data - Deposit movement data
 * @param {string} data.profile_id - User profile ID
 * @param {string} data.investment_id - Investment ID
 * @param {string} data.amount - Amount deposited
 * @param {string} [data.tx_hash] - Transaction hash
 * @param {Object} [data.metadata] - Additional metadata
 * @returns {Promise<InvestmentMovement>} Created deposit movement
 * @throws {Error} If database insert fails
 */
export async function createDepositMovement(data: {
  profile_id: string;
  investment_id: string;
  amount: string;
  tx_hash?: string;
  metadata?: Record<string, any>;
}): Promise<InvestmentMovement> {
  return await supabase
    .from("investment_movements")
    .insert({
      ...data,
      movement_type: "deposit",
      token: "USDC",
      chain: "base",
      status: "pending",
    })
    .select()
    .single()
    .then(({ data, error }) => {
      if (error)
        throw new Error(`Failed to create deposit movement: ${error.message}`);
      return data;
    });
}

/**
 * Create a reward movement when user earns rewards from investments.
 *
 * @param {Object} data - Reward movement data
 * @param {string} data.profile_id - User profile ID
 * @param {string} data.investment_id - Investment ID
 * @param {string} data.amount - Reward amount
 * @param {Object} [data.metadata] - Additional metadata
 * @returns {Promise<InvestmentMovement>} Created reward movement
 * @throws {Error} If database insert fails
 */
export async function createRewardMovement(data: {
  profile_id: string;
  investment_id: string;
  amount: string;
  metadata?: Record<string, any>;
}): Promise<InvestmentMovement> {
  return await supabase
    .from("investment_movements")
    .insert({
      ...data,
      movement_type: "reward",
      token: "USDC",
      chain: "base",
      status: "confirmed", // Rewards are typically confirmed immediately
    })
    .select()
    .single()
    .then(({ data, error }) => {
      if (error)
        throw new Error(`Failed to create reward movement: ${error.message}`);
      return data;
    });
}
