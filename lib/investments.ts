"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, type Investment } from "./supabase";
import {
  createDepositMovement,
  getInvestmentSummary as getInvestmentSummaryFromMovements,
} from "./investment-movements";

/**
 * Investment option configuration for available investment opportunities.
 */
export interface InvestmentOption {
  id: string;
  name: string;
  description: string;
  apr: number;
  logo: string;
  vault_address?: string;
  type: "morpho_vault" | "savings_account";
}

/**
 * Available investment options with real Morpho vault addresses.
 * These represent actual investment opportunities users can choose from.
 */
export const INVESTMENT_OPTIONS: InvestmentOption[] = [
  {
    id: "morpho-vault-1",
    name: "Spark USDC Vault",
    description:
      "Spark blue-chip USDC vault. Lending against the lowest risk crypto and real-world assets (RWAs). Curated by SparkDAO which allocates billions in assets across all of DeFi. See: https://data.spark.fi/spark-liquidity-layer",
    apr: 6.55,
    logo: "/morpho.svg",
    vault_address: "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",
    type: "morpho_vault",
  },
  {
    id: "morpho-vault-2",
    name: "Steakhouse USDC Vault",
    description:
      "The Steakhouse USDC vault aims to optimize yields by lending USDC against blue chip crypto and real world asset (RWA) collateral markets, depending on market conditions.",
    apr: 5.59,
    logo: "/morpho.svg",
    vault_address: "0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183",
    type: "morpho_vault",
  },
  {
    id: "morpho-vault-3",
    name: "Seamless USDC Vault",
    description:
      "The Seamless USDC Vault curated by Gauntlet is intended to optimize risk-adjusted yield across high-demand collateral markets on Base.",
    apr: 6.99,
    logo: "/morpho.svg",
    vault_address: "0x616a4E1db48e22028f6bbf20444Cd3b8e3273738",
    type: "morpho_vault",
  },
];

/**
 * React hook to manage user investments and investment operations.
 * Provides CRUD operations for investments and tracks investment status.
 *
 * @param {string} [profileId] - User profile ID for investment tracking
 * @returns {Object} Investment management state and actions
 * @returns {Investment[]} return.investments - Array of user investments
 * @returns {boolean} return.isLoading - True while fetching investments
 * @returns {string | null} return.error - Error message if fetch failed
 * @returns {Function} return.createInvestment - Create new investment
 * @returns {Function} return.updateInvestmentStatus - Update investment status
 * @returns {Function} return.getInvestmentSummary - Get investment summary
 *
 * @example
 * ```tsx
 * function InvestmentDashboard() {
 *   const { investments, isLoading, createInvestment } = useInvestments(profileId);
 *
 *   const handleInvest = async () => {
 *     try {
 *       await createInvestment({
 *         profile_id: profileId,
 *         investment_name: "Spark USDC Vault",
 *         investment_type: "morpho_vault",
 *         amount_invested: "100.0",
 *         apr: 6.55,
 *         vault_address: "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A"
 *       });
 *     } catch (err) {
 *       console.error("Investment creation failed:", err);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {investments.map(investment => (
 *         <div key={investment.id}>{investment.investment_name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useInvestments(profileId?: string) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId) return;

    const fetchInvestments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("investments")
          .select("*")
          .eq("profile_id", profileId)
          .order("created_at", { ascending: false });

        if (error) {
          throw new Error(`Failed to fetch investments: ${error.message}`);
        }

        setInvestments(data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch investments"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestments();
  }, [profileId]);

  const createInvestment = async (data: {
    profile_id: string;
    investment_name: string;
    investment_type: "morpho_vault" | "savings_account";
    amount_invested: string;
    apr: number;
    vault_address?: string;
    tx_hash?: string;
  }): Promise<Investment> => {
    // Create the investment record
    const { data: investment, error } = await supabase
      .from("investments")
      .insert({
        ...data,
        current_rewards: "0",
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create investment: ${error.message}`);
    }

    // Create the corresponding deposit movement
    try {
      await createDepositMovement({
        profile_id: data.profile_id,
        investment_id: investment.id,
        amount: data.amount_invested,
        tx_hash: data.tx_hash,
        metadata: {
          vault_address: data.vault_address,
          investment_type: data.investment_type,
        },
      });
    } catch (movementError) {
      // Don't throw here - the investment was created successfully
      // Movement creation failure is not critical
    }

    setInvestments((prev) => [investment, ...prev]);
    return investment;
  };

  const updateInvestmentStatus = async (
    investmentId: string,
    status: Investment["status"],
    currentRewards?: string
  ): Promise<Investment> => {
    const updates: { status: string; current_rewards?: string } = { status };
    if (currentRewards !== undefined) {
      updates.current_rewards = currentRewards;
    }

    const { data, error } = await supabase
      .from("investments")
      .update(updates)
      .eq("id", investmentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update investment: ${error.message}`);
    }

    setInvestments((prev) =>
      prev.map((inv) => (inv.id === investmentId ? data : inv))
    );

    return data;
  };

  const fetchInvestmentSummary = useCallback(async () => {
    if (!profileId) return null;

    try {
      return await getInvestmentSummaryFromMovements(profileId);
    } catch (err) {
      return null;
    }
  }, [profileId]);

  return {
    investments,
    isLoading,
    error,
    createInvestment,
    updateInvestmentStatus,
    getInvestmentSummary: fetchInvestmentSummary,
  };
}

/**
 * Get all available investment options.
 *
 * @returns {InvestmentOption[]} Array of investment options
 */
export function getInvestmentOptions(): InvestmentOption[] {
  return INVESTMENT_OPTIONS;
}

/**
 * Get a specific investment option by ID.
 *
 * @param {string} id - Investment option ID
 * @returns {InvestmentOption | undefined} Investment option or undefined if not found
 */
export function getInvestmentOption(id: string): InvestmentOption | undefined {
  return INVESTMENT_OPTIONS.find((option) => option.id === id);
}
