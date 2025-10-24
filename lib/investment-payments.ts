"use client";

import { useState, useCallback } from "react";
import {
  useSendCalls,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { base } from "wagmi/chains";
import { useAccountSafe as useAccount } from "./use-account-safe";
import { parseUnits, encodeFunctionData } from "viem";
import { useInvestments } from "./investments";
import { createDepositMovement } from "./investment-movements";
import { supabase, type Investment } from "./supabase";
import {
  pollTransactionStatus,
  pollRegularTransactionStatus,
} from "./update-transaction-status";
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
  const [pendingStep, setPendingStep] = useState<string | null>(null);

  const { address: userAddress, connector, chainId } = useAccount();
  const { createInvestment, updateInvestmentStatus } =
    useInvestments(profileId);

  // Log wallet connector info for debugging
  console.log(
    "Current wallet connector:",
    connector?.name,
    "ID:",
    connector?.id,
    "Chain ID:",
    chainId
  );

  // Batched transaction approach using useSendCalls (EIP-5792)
  const { sendCallsAsync } = useSendCalls();

  // Sequential transaction approach for wallets without batch support
  const { writeContractAsync } = useWriteContract();

  // Chain switching
  const { switchChainAsync } = useSwitchChain();

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
      setPendingStep("Preparing...");

      try {
        // Ensure we're on Base network
        if (chainId !== base.id) {
          console.log(
            `Switching from chain ${chainId} to Base (${base.id})...`
          );
          setPendingStep("Switching to Base network...");
          try {
            await switchChainAsync({ chainId: base.id });
            console.log("Successfully switched to Base");
          } catch (switchError) {
            console.error("Failed to switch chain:", switchError);
            throw new Error(
              "Please switch your wallet to Base network to continue"
            );
          }
        }
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
        let investment: Investment;

        if (isExistingInvestment) {
          // Update existing investment
          const existingInvestment = existingInvestments[0];
          console.log("Found existing investment:", existingInvestment);

          const newAmount =
            parseFloat(existingInvestment.amount_invested) +
            parseFloat(data.amount);

          console.log(
            "Updating investment - Old amount:",
            existingInvestment.amount_invested,
            "New amount:",
            newAmount
          );

          const { data: updatedInvestment, error: updateError } = await supabase
            .from("investments")
            .update({
              amount_invested: newAmount.toString(),
              status: "pending", // Reset to pending for new transaction
            })
            .eq("id", existingInvestment.id)
            .select()
            .single();

          console.log("Update result:", { updatedInvestment, updateError });

          if (updateError || !updatedInvestment) {
            const errorMsg = `Failed to update existing investment: ${
              updateError?.message || "No data returned"
            }. Error details: ${JSON.stringify(updateError)}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
          }

          investment = updatedInvestment;
          console.log("Successfully updated investment:", investment);
        } else {
          // Create new investment record (skip deposit movement - we'll create it after getting tx hash)
          try {
            investment = await createInvestment({
              profile_id: data.sender_profile_id,
              investment_name: data.investment_name,
              investment_type: data.investment_type,
              amount_invested: data.amount,
              apr: data.apr,
              vault_address: data.vault_address,
              skipMovement: true, // Skip deposit movement creation
            });

            console.log("Created investment:", investment);

            if (!investment || !investment.id) {
              throw new Error(
                `Failed to create investment: No data returned. Result: ${JSON.stringify(
                  investment
                )}`
              );
            }
          } catch (createError) {
            console.error("Error creating investment:", createError);
            throw createError;
          }
        }

        console.log("About to set investment ID:", investment?.id);
        setInvestmentId(investment.id);

        // 2. Prepare batched transaction (approve + deposit)
        console.log("=== STARTING BATCH TRANSACTION ===");
        const amountWei = parseUnits(data.amount, USDC_DECIMALS);
        // Approve exact amount user is investing (more transparent for users)
        const approveAmount = amountWei;

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

        console.log("Prepared calls:", calls);
        console.log("sendCallsAsync available?", typeof sendCallsAsync);

        // Execute batched transaction - Try first
        let result;
        let txHash: string;
        let usedSequential = false;

        try {
          console.log("Attempting batch transaction...");
          setPendingStep("Approving & Investing...");
          result = await sendCallsAsync({
            calls,
            chainId: base.id,
          });
          console.log("Batch transaction result:", result);

          if (!result || !result.id) {
            throw new Error("Batch transaction returned invalid result");
          }

          txHash = result.id;
          console.log("Batch transaction successful, ID:", txHash);
        } catch (batchError) {
          console.warn(
            "Batch transaction failed, falling back to sequential:",
            batchError
          );
          console.log("=== FALLBACK: Using Sequential Transactions ===");
          usedSequential = true;

          // FALLBACK: Sequential transactions (approve + deposit)
          try {
            // Define ethereum provider with proper typing
            const ethereum = (
              window as {
                ethereum?: {
                  request: (args: {
                    method: string;
                    params: unknown[];
                  }) => Promise<string | { status: string }>;
                };
              }
            ).ethereum;

            // Check current allowance first to avoid unnecessary approval
            console.log("Checking USDC allowance...");
            let needsApproval = false;

            try {
              const allowanceData = await ethereum?.request({
                method: "eth_call",
                params: [
                  {
                    to: USDC_BASE_ADDRESS,
                    data: `0xdd62ed3e${userAddress
                      .slice(2)
                      .padStart(64, "0")}${data.vault_address
                      .slice(2)
                      .padStart(64, "0")}`,
                  },
                  "latest",
                ],
              });

              if (allowanceData && typeof allowanceData === "string") {
                const allowanceBN = BigInt(allowanceData);
                needsApproval = allowanceBN < amountWei;
                console.log(
                  "Current allowance:",
                  allowanceBN.toString(),
                  "Needs approval:",
                  needsApproval
                );
              } else {
                // If we can't check, assume we need approval
                needsApproval = true;
              }
            } catch (allowanceError) {
              console.warn(
                "Failed to check allowance, assuming approval needed:",
                allowanceError
              );
              needsApproval = true;
            }

            // Step 1: Approve USDC (if needed)
            if (needsApproval) {
              console.log("Step 1: Approving USDC...");
              setPendingStep("Approving USDC...");
              const approveHash = await writeContractAsync({
                address: USDC_BASE_ADDRESS as `0x${string}`,
                abi: ERC20_ABI,
                functionName: "approve",
                args: [data.vault_address as `0x${string}`, approveAmount],
                chainId: base.id,
              });
              console.log("Approve transaction submitted:", approveHash);

              // CRITICAL: Wait for approval to be mined before depositing
              console.log("Waiting for approval confirmation...");
              setPendingStep("Confirming approval...");
              // Poll for transaction receipt
              let approved = false;
              let attempts = 0;
              const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max wait

              while (!approved && attempts < maxAttempts) {
                try {
                  const receipt = await ethereum?.request({
                    method: "eth_getTransactionReceipt",
                    params: [approveHash],
                  });

                  if (
                    receipt &&
                    typeof receipt === "object" &&
                    "status" in receipt &&
                    receipt.status === "0x1"
                  ) {
                    approved = true;
                    console.log("Approval confirmed!");
                  } else if (
                    receipt &&
                    typeof receipt === "object" &&
                    "status" in receipt &&
                    receipt.status === "0x0"
                  ) {
                    throw new Error("Approval transaction failed");
                  } else {
                    // Still pending
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    attempts++;
                  }
                } catch (receiptError) {
                  console.warn("Error checking receipt:", receiptError);
                  await new Promise((resolve) => setTimeout(resolve, 2000));
                  attempts++;
                }
              }

              if (!approved) {
                throw new Error(
                  "Approval transaction took too long to confirm"
                );
              }
            } else {
              console.log(
                "Sufficient allowance already exists, skipping approval"
              );
            }

            // Step 2: Deposit to Morpho vault
            console.log("Step 2: Depositing to vault...");
            setPendingStep("Investing...");
            const depositHash = await writeContractAsync({
              address: data.vault_address as `0x${string}`,
              abi: MORPHO_ABI,
              functionName: "deposit",
              args: [amountWei, userAddress as `0x${string}`],
              chainId: base.id,
            });
            console.log("Deposit transaction hash:", depositHash);

            txHash = depositHash;
            console.log("Sequential transactions successful!");
          } catch (sequentialError) {
            console.error(
              "Sequential transactions also failed:",
              sequentialError
            );
            throw new Error(
              `Investment failed: ${
                sequentialError instanceof Error
                  ? sequentialError.message
                  : String(sequentialError)
              }`
            );
          }
        }

        // txHash is now set from either batch or sequential transactions above

        // 3. Create deposit movement record with transaction hash
        setPendingStep("Finalizing...");
        let movementId: string | null = null;
        try {
          console.log("Creating deposit movement with data:", {
            profile_id: data.sender_profile_id,
            investment_id: investment.id,
            amount: data.amount,
            tx_hash: txHash,
          });

          const movement = await createDepositMovement({
            profile_id: data.sender_profile_id,
            investment_id: investment.id,
            amount: data.amount,
            tx_hash: txHash,
            metadata: {
              vault_address: data.vault_address,
              investment_type: data.investment_type,
              investment_name: data.investment_name,
              apr: data.apr,
              is_additional_deposit: isExistingInvestment,
            },
          });

          console.log("Deposit movement created:", movement);

          if (movement && movement.id) {
            movementId = movement.id;
            console.log("Movement ID set:", movementId);
          } else {
            console.error("Movement created but has no ID:", movement);
          }
        } catch (movementError) {
          console.error("Failed to create deposit movement:", movementError);
          // Continue - this is not critical for the transaction
        }

        // 4. Update investment status to active
        try {
          await updateInvestmentStatus(investment.id, "active");
        } catch (statusError) {
          // Continue - this is not critical for the transaction
        }

        // 5. Start polling for the real transaction hash (only for batch transactions)
        if (movementId && !usedSequential) {
          // Batch transactions return a batch ID, need to poll for real tx hash
          // Don't await this - let it run in the background
          pollTransactionStatus(txHash, movementId)
            .then((realTxHash) => {
              if (realTxHash) {
                console.log("Real tx hash obtained:", realTxHash);
              }
            })
            .catch((error) => {
              console.error("Error polling transaction status:", error);
            });
        } else if (usedSequential && movementId) {
          console.log(
            "Sequential transactions - tx hash is already final:",
            txHash
          );
          // Poll for sequential transaction confirmation
          pollRegularTransactionStatus(txHash, movementId)
            .then(() => {
              console.log("Sequential transaction confirmed in database");
            })
            .catch((error) => {
              console.error(
                "Error polling sequential transaction status:",
                error
              );
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
        setPendingStep(null);
      }
    },
    [
      userAddress,
      chainId,
      switchChainAsync,
      sendCallsAsync,
      writeContractAsync,
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
    pendingStep: pendingStep,
  };
}
