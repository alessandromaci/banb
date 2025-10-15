"use client";

import { Porto } from "porto";
import { supabase } from "./supabase";

const { provider } = Porto.create();

/**
 * Check the status of a call batch using Porto provider and update the database.
 *
 * @param batchId - The batch ID from sendCallsAsync
 * @param movementId - The movement ID to update
 * @returns Promise with the real transaction hash if confirmed
 */
export async function updateTransactionStatus(
  batchId: string,
  movementId: string
): Promise<string | null> {
  try {
    // Get the status of the call batch using Porto provider
    const status = await provider.request({
      method: "wallet_getCallsStatus",
      params: [batchId],
    });

    // Check if the transaction is confirmed (status 200 = success)
    if (
      status.status === 200 &&
      status.receipts &&
      status.receipts.length > 0
    ) {
      const receipt = status.receipts[0];
      const realTxHash = receipt.transactionHash;
      const isSuccess = receipt.status === "0x1"; // 0x1 = success, 0x0 = failure

      // Update the movement record with the real transaction hash and success status
      const { error } = await supabase
        .from("investment_movements")
        .update({
          tx_hash: realTxHash,
          status: isSuccess ? "confirmed" : "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", movementId);

      if (error) {
        console.error("Failed to update transaction status:", error);
        return null;
      }

      return realTxHash;
    }

    // If still pending, return null (will be checked again later)
    return null;
  } catch (error) {
    console.error("Error checking transaction status:", error);
    return null;
  }
}

/**
 * Poll the transaction status until it's confirmed.
 *
 * @param batchId - The batch ID from sendCallsAsync
 * @param movementId - The movement ID to update
 * @param maxAttempts - Maximum number of attempts (default: 30)
 * @param intervalMs - Interval between checks in milliseconds (default: 2000)
 * @returns Promise with the real transaction hash when confirmed
 */
export async function pollTransactionStatus(
  batchId: string,
  movementId: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<string | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const txHash = await updateTransactionStatus(batchId, movementId);

    if (txHash) {
      return txHash;
    }

    // Wait before next attempt
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  console.warn("Transaction status polling timed out");
  return null;
}
