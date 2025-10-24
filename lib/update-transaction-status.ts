"use client";

import { supabase } from "./supabase";

/**
 * EIP-5792 GetCallsStatus response structure
 * Reference: https://docs.metamask.io/wallet/how-to/send-transactions/send-batch-transactions
 */
interface CallsStatusResponse {
  version: string; // API version (e.g., "2.0.0")
  chainId: string; // Chain ID
  id: string; // Batch ID
  status: number; // Status code: 200 = confirmed, others = pending
  atomic?: boolean; // Whether calls were executed atomically
  receipts?: Array<{
    logs: Array<{
      address: string;
      data: string;
      topics: string[];
    }>;
    status: string; // "0x1" = success, "0x0" = failed
    blockHash: string;
    blockNumber: string;
    gasUsed: string;
    transactionHash: string;
  }>;
}

/**
 * Check the status of a call batch using window.ethereum and update the database.
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
    // Get ethereum provider from window
    const ethereum = (
      window as {
        ethereum?: {
          request: (args: {
            method: string;
            params: unknown[];
          }) => Promise<unknown>;
        };
      }
    ).ethereum;

    if (!ethereum) {
      console.warn("No ethereum provider found");
      return null;
    }

    // Get the status of the call batch using EIP-5792
    const status = (await ethereum.request({
      method: "wallet_getCallsStatus",
      params: [batchId],
    })) as CallsStatusResponse;

    // Check if the transaction is confirmed (status code 200)
    // Reference: https://docs.metamask.io/wallet/how-to/send-transactions/send-batch-transactions
    if (
      status.status === 200 &&
      status.receipts &&
      status.receipts.length > 0
    ) {
      const receipt = status.receipts[0];
      const realTxHash = receipt.transactionHash;
      const isSuccess = receipt.status === "0x1"; // 0x1 = success, 0x0 = failure

      console.log(`Batch transaction confirmed! TX Hash: ${realTxHash}`);

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
    console.log(
      `Batch transaction still pending. Status code: ${status.status}`
    );
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

/**
 * Poll a regular transaction (non-batch) until it's confirmed on-chain.
 * This is for sequential transactions that return a direct tx hash.
 *
 * @param txHash - The transaction hash
 * @param movementId - The movement ID to update
 * @param maxAttempts - Maximum number of attempts (default: 30)
 * @param intervalMs - Interval between checks in milliseconds (default: 2000)
 */
export async function pollRegularTransactionStatus(
  txHash: string,
  movementId: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<void> {
  console.log(`Polling regular transaction: ${txHash}`);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Check transaction receipt using window.ethereum
      const ethereum = (
        window as {
          ethereum?: {
            request: (args: {
              method: string;
              params: unknown[];
            }) => Promise<unknown>;
          };
        }
      ).ethereum;

      if (!ethereum) {
        console.warn("No ethereum provider found");
        return;
      }

      const receipt = await ethereum.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      });

      if (
        receipt &&
        typeof receipt === "object" &&
        "status" in receipt &&
        receipt.status
      ) {
        const isSuccess = receipt.status === "0x1";

        console.log(
          `Transaction ${txHash} ${isSuccess ? "confirmed" : "failed"}`
        );

        // Update the movement status in database
        const { error } = await supabase
          .from("investment_movements")
          .update({
            status: isSuccess ? "confirmed" : "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", movementId);

        if (error) {
          console.error("Failed to update movement status:", error);
        }

        return; // Done
      }

      // Still pending, wait and try again
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    } catch (error) {
      console.error("Error checking transaction receipt:", error);
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  console.warn(`Regular transaction polling timed out for: ${txHash}`);
}
