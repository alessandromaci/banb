import { supabase, type InvestmentMovement } from "./supabase";

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
    // Get all investments for the profile with retry logic
    let investments, investmentsError;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const result = await supabase
          .from("investments")
          .select("*")
          .eq("profile_id", profileId)
          .in("status", ["active", "pending"])
          .order("created_at", { ascending: false });

        investments = result.data;
        investmentsError = result.error;
        break;
      } catch (networkError) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.warn(
            `Network error fetching investments (attempt ${retryCount}):`,
            networkError
          );
          return []; // Return empty array instead of throwing
        }
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (investmentsError) {
      console.warn("Supabase error fetching investments:", investmentsError);
      return []; // Return empty array instead of throwing
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
    let data, error;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const result = await supabase
          .from("investment_movements")
          .select("*")
          .eq("profile_id", profileId)
          .order("created_at", { ascending: false })
          .limit(limit);

        data = result.data;
        error = result.error;
        break;
      } catch (networkError) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.warn(
            `Network error fetching investment history (attempt ${retryCount}):`,
            networkError
          );
          return []; // Return empty array instead of throwing
        }
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (error) {
      console.warn("Supabase error fetching investment history:", error);
      return []; // Return empty array instead of throwing
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
  metadata?: Record<string, unknown>;
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

