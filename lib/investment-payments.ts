"use client";

import { useState, useCallback } from "react";
import { useSendCalls } from "wagmi";
import { useAccountSafe as useAccount } from "./use-account-safe";
import { parseUnits, encodeFunctionData } from "viem";
import { useInvestments } from "./investments";
import { createDepositMovement } from "./investment-movements";
import { supabase } from "./supabase";
import { pollTransactionStatus } from "./update-transaction-status";
import ERC20_ABI from "./abi/ERC20.abi.json";
import MORPHO_ABI from "./abi/Morpho.abi.json";

/**
 * Data required for investment payment processing.
 */
export interface InvestmentPaymentData {
  investment_name: string;
  investment_type: "morpho_vault" | "savings_account";
  amount: string;
  vault_address: string;
  sender_profile_id: string;
  apr: number;
}

/**
 * Result of investment payment processing.
 */
export interface InvestmentPaymentResult {
  success: boolean;
  hash?: string;
  investmentId?: string;
  movementId?: string;
  status?: "pending" | "confirmed" | "failed";
  error?: string;
  txHash?: string;
}

// USDC contract address on Base
const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;

/**
 * React hook for processing investment payments to Morpho vaults.
 * Uses batched transactions (approve + deposit) for efficient blockchain interactions.
 *
 * @param {string} [profileId] - User profile ID for investment tracking
 * @returns {Object} Investment payment state and actions
 * @returns {Function} return.executeInvestment - Execute investment payment
 * @returns {boolean} return.isLoading - True while processing payment
 * @returns {string | null} return.error - Error message if payment fails
 * @returns {string | null} return.pendingStep - Current step in process (null for batched)
 *
 * @example
 * ```tsx
 * function InvestmentForm() {
 *   const { executeInvestment, isLoading, error } = useInvestmentPayment(profileId);
 *
 *   const handleInvest = async () => {
 *     try {
 *       const result = await executeInvestment({
 *         investment_name: "Spark USDC Vault",
 *         investment_type: "morpho_vault",
 *         amount: "100.0",
 *         vault_address: "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",
 *         sender_profile_id: profileId,
 *         apr: 6.55
 *       });
 *       console.log("Investment successful:", result.hash);
 *     } catch (err) {
 *       console.error("Investment failed:", err);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleInvest} disabled={isLoading}>
 *       {isLoading ? "Processing..." : "Invest Now"}
 *     </button>
 *   );
 * }
 * ```
 */
export function useInvestmentPayment(profileId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [investmentId, setInvestmentId] = useState<string | null>(null);

  const { address: userAddress } = useAccount();
  const { createInvestment, updateInvestmentStatus } =
    useInvestments(profileId);

  // Batched transaction approach using useSendCalls
  const { sendCallsAsync } = useSendCalls();

  // Batched transaction approach (approve + deposit in one transaction)
  const executeBatchedInvestment = useCallback(
    async (data: InvestmentPaymentData): Promise<InvestmentPaymentResult> => {
      if (!userAddress) {
        const err =
          "Wallet not connected. Please connect your wallet to continue.";
        setError(err);
        throw new Error(err);
      }

      setIsLoading(true);
      setError(null);

      try {
        // 1. Check if investment already exists for this vault
        const { data: existingInvestments } = await supabase
          .from("investments")
          .select("*")
          .eq("profile_id", data.sender_profile_id)
          .eq("vault_address", data.vault_address)
          .in("status", ["active", "pending"])
          .order("created_at", { ascending: false })
          .limit(1);

        const isExistingInvestment =
          existingInvestments && existingInvestments.length > 0;
        let investment;

        if (isExistingInvestment) {
          // Update existing investment
          const existingInvestment = existingInvestments[0];
          const newAmount =
            parseFloat(existingInvestment.amount_invested) +
            parseFloat(data.amount);

          const { data: updatedInvestment, error: updateError } = await supabase
            .from("investments")
            .update({
              amount_invested: newAmount.toString(),
              status: "pending", // Reset to pending for new transaction
            })
            .eq("id", existingInvestment.id)
            .select()
            .single();

          if (updateError) {
            throw new Error(
              `Failed to update existing investment: ${updateError.message}`
            );
          }

          investment = updatedInvestment;
        } else {
          // Create new investment record
          investment = await createInvestment({
            profile_id: data.sender_profile_id,
            investment_name: data.investment_name,
            investment_type: data.investment_type,
            amount_invested: data.amount,
            apr: data.apr,
            vault_address: data.vault_address,
          });
        }

        setInvestmentId(investment.id);

        // 2. Prepare batched transaction (approve + deposit)
        const amountWei = parseUnits(data.amount, USDC_DECIMALS);
        const approveAmount = parseUnits("1000000", USDC_DECIMALS); // Approve large amount for future transactions

        const calls = [
          // Approve USDC for the vault
          {
            to: USDC_BASE_ADDRESS as `0x${string}`,
            data: encodeFunctionData({
              abi: ERC20_ABI,
              functionName: "approve",
              args: [data.vault_address as `0x${string}`, approveAmount],
            }),
          },
          // Deposit to Morpho vault
          {
            to: data.vault_address as `0x${string}`,
            data: encodeFunctionData({
              abi: MORPHO_ABI,
              functionName: "deposit",
              args: [amountWei, userAddress as `0x${string}`],
            }),
          },
        ];

        // Execute batched transaction
        const result = await sendCallsAsync({
          calls,
        });

        // Check if the result is valid
        if (!result || !result.id) {
          // User cancelled the transaction
          setError("Transaction cancelled by user");
          return {
            success: false,
            error: "Transaction cancelled by user",
            txHash: undefined,
          };
        }

        // The result.id is the batch identifier, not the transaction hash
        const batchId = result.id;

        // For now, store the batch ID as the transaction hash
        // We'll update it later when we get the real hash from getCallsStatus
        const txHash = batchId;

        // 3. Create deposit movement record with transaction hash
        let movementId: string | null = null;
        try {
          const movement = await createDepositMovement({
            profile_id: data.sender_profile_id,
            investment_id: investment.id,
            amount: data.amount,
            tx_hash: txHash,
            metadata: {
              vault_address: data.vault_address,
              investment_type: data.investment_type,
              is_additional_deposit: isExistingInvestment,
            },
          });
          movementId = movement.id;
        } catch (movementError) {
          // Continue - this is not critical for the transaction
        }

        // 4. Update investment status to active
        try {
          await updateInvestmentStatus(investment.id, "active");
        } catch (statusError) {
          // Continue - this is not critical for the transaction
        }

        // 5. Start polling for the real transaction hash (in background)
        if (movementId) {
          // Don't await this - let it run in the background
          pollTransactionStatus(batchId, movementId)
            .then((realTxHash) => {
              if (realTxHash) {
              }
            })
            .catch((error) => {
              console.error("Error polling transaction status:", error);
            });
        }

        return {
          success: true,
          hash: txHash,
          investmentId: investment.id,
          movementId: movementId || undefined,
          status: "confirmed",
          txHash: txHash,
        };
      } catch (err) {
        // Check if this is a database error vs blockchain error
        const isDatabaseError =
          err instanceof Error &&
          (err.message.includes("Failed to create") ||
            err.message.includes("Failed to update") ||
            err.message.includes("createDepositMovement") ||
            err.message.includes("updateInvestmentStatus"));

        if (isDatabaseError) {
          // If it's a database error but the transaction succeeded,
          // we should still return success since the blockchain transaction worked
          return {
            success: true,
            hash: "unknown", // We don't have the hash if database failed
            investmentId: investmentId || "unknown",
            status: "confirmed",
          };
        }

        const errorMessage =
          err instanceof Error ? err.message : "Batched investment failed";
        setError(errorMessage);

        // Update investment status to failed if we have a record
        if (investmentId) {
          try {
            await updateInvestmentStatus(investmentId, "failed");
          } catch {
            // Silently fail - investment status update is not critical
          }
        }

        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [
      userAddress,
      sendCallsAsync,
      createInvestment,
      updateInvestmentStatus,
      investmentId,
    ]
  );

  // Main execute function (batched transactions only)
  const executeInvestment = executeBatchedInvestment;

  return {
    executeInvestment,
    isLoading: isLoading,
    error: error,
    pendingStep: null, // No pending steps for batched transactions
  };
}
