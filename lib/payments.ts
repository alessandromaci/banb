/**
 * @fileoverview Crypto payment execution and transaction monitoring.
 * Provides React hooks for executing USDC payments on Base chain and tracking transaction status.
 * Integrates wagmi for blockchain interactions and Supabase for transaction persistence.
 */

"use client";

import React, { useState, useCallback } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { parseUnits } from "viem";
import { base } from "wagmi/chains";
import { createTransaction, updateTransactionStatus } from "./transactions";
import type { Transaction } from "./supabase";
import ERC20_ABI from "./abi/ERC20.abi.json";

/**
 * Data required to execute a crypto payment.
 *
 * @interface CryptoPaymentData
 * @property {string} recipientId - Recipient ID from recipients table
 * @property {string} amount - Amount to send as string (e.g., "100.50")
 * @property {string} token - Token symbol (e.g., "USDC")
 * @property {string} chain - Blockchain network (e.g., "base")
 * @property {string} to - Recipient's wallet address
 * @property {string} sender_profile_id - Current user's profile ID (required)
 * @property {string} [tokenAddress] - Token contract address (optional, defaults to USDC)
 * @property {number} [decimals] - Token decimals (optional, defaults to 6 for USDC)
 */
export interface CryptoPaymentData {
  recipientId: string;
  amount: string;
  token: string;
  chain: string;
  to: string;
  sender_profile_id: string;
  tokenAddress?: string;
  decimals?: number;
}

/**
 * Result returned after executing a crypto payment.
 *
 * @interface CryptoPaymentResult
 * @property {string} hash - Blockchain transaction hash
 * @property {string} txId - Database transaction ID (UUID)
 * @property {"pending" | "sent" | "success" | "failed"} status - Transaction status
 */
export interface CryptoPaymentResult {
  hash: string;
  txId: string;
  status: "pending" | "sent" | "success" | "failed";
}

/**
 * USDC contract address on Base mainnet.
 * @constant {string}
 */
const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

/**
 * USDC token decimals (6 decimals).
 * @constant {number}
 */
const USDC_DECIMALS = 6;

/**
 * React hook for executing crypto payments.
 * Handles the complete payment flow: database record creation, blockchain transaction,
 * and status updates. Monitors transaction confirmation automatically.
 *
 * @returns {Object} Payment execution state and function
 * @returns {function} return.executePayment - Function to execute a payment
 * @returns {boolean} return.isLoading - True while payment is processing
 * @returns {string | undefined} return.error - Error message if payment failed
 *
 * @example
 * ```tsx
 * function PaymentButton() {
 *   const { executePayment, isLoading, error } = useCryptoPayment();
 *
 *   const handlePay = async () => {
 *     try {
 *       const result = await executePayment({
 *         recipientId: recipient.id,
 *         amount: "100.00",
 *         token: "USDC",
 *         chain: "base",
 *         to: recipient.external_address,
 *         sender_profile_id: currentUser.id
 *       });
 *       console.log(`Payment sent: ${result.hash}`);
 *     } catch (err) {
 *       console.error("Payment failed:", err);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handlePay} disabled={isLoading}>
 *       {isLoading ? "Processing..." : "Pay"}
 *     </button>
 *   );
 * }
 * ```
 */
export function useCryptoPayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const { address: userAddress } = useAccount();

  const {
    data: txHash,
    writeContractAsync,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
      query: {
        enabled: !!txHash,
      },
    });

  // Log transaction hash when available
  React.useEffect(() => {
    // Handle transaction confirmation
  }, [txHash, isConfirming, isConfirmed]);

  /**
   * Executes a crypto payment with the provided data.
   * Creates database record, executes blockchain transaction, and updates status.
   *
   * @async
   * @param {CryptoPaymentData} data - Payment data
   * @returns {Promise<CryptoPaymentResult>} Payment result with hash and transaction ID
   * @throws {Error} If wallet not connected
   * @throws {Error} If blockchain transaction fails
   */
  const executePayment = useCallback(
    async (data: CryptoPaymentData): Promise<CryptoPaymentResult> => {
      if (!userAddress) {
        const err =
          "Wallet not connected. Please connect your wallet to continue.";
        console.error("[executePayment] ❌ BLOCKED:", err);
        setError(err);
        throw new Error(err);
      }

      setIsLoading(true);
      setError(null);

      try {
        // 1. Create transaction record in Supabase with pending status
        const transaction = await createTransaction({
          sender_profile_id: data.sender_profile_id,
          recipient_id: data.recipientId,
          chain: data.chain,
          amount: data.amount,
          token: data.token,
        });
        setTransactionId(transaction.id);

        // 2. Prepare transaction parameters
        const amountWei = parseUnits(data.amount, USDC_DECIMALS);
        console.log("[executePayment] Transfer details:", {
          contract: USDC_BASE_ADDRESS,
          to: data.to,
          amount: data.amount,
          amountWei: amountWei.toString(),
        });

        // 3. Execute the transaction (skipping simulation due to connector limitations)
        const hash = await writeContractAsync({
          address: USDC_BASE_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [data.to as `0x${string}`, amountWei],
          chainId: base.id,
        });
        if (!hash) {
          console.error("[executePayment] ❌ No transaction hash returned");
          throw new Error("Transaction hash not available");
        }

        // 4. Update transaction with hash and sent status
        // Add a small delay to ensure transaction is fully committed
        await new Promise((resolve) => setTimeout(resolve, 1000));

        try {
          await updateTransactionStatus(transaction.id, "sent", hash);
        } catch (updateError) {
          console.error(
            "[executePayment] ❌ Failed to update transaction:",
            updateError
          );
          // Don't throw here - the transaction was successful on-chain
          // Just log the error and continue
        }
        return {
          hash,
          txId: transaction.id,
          status: "sent",
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Payment failed";
        console.error(
          "[executePayment] ========== ❌ PAYMENT FAILED =========="
        );
        console.error("[executePayment] Error:", errorMessage);
        console.error("[executePayment] Full error:", err);
        setError(errorMessage);

        // Update transaction status to failed if we have a transaction record
        if (transactionId) {
          try {
            await updateTransactionStatus(transactionId, "failed");
          } catch (updateError) {
            console.error(
              "[executePayment] Could not update DB status:",
              updateError
            );
          }
        }

        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [userAddress, writeContractAsync, transactionId]
  );

  return {
    executePayment,
    isLoading: isLoading || isWritePending || isConfirming,
    error: error || writeError?.message,
  };
}

/**
 * React hook for monitoring transaction status.
 * Fetches transaction details and automatically updates status when blockchain confirmation is received.
 *
 * @param {string | null} txId - Transaction ID to monitor (UUID)
 * @returns {Object} Transaction monitoring state
 * @returns {Transaction | null} return.transaction - Current transaction object
 * @returns {boolean} return.isLoading - True while fetching or waiting for confirmation
 * @returns {string | null} return.error - Error message if fetch failed
 * @returns {function} return.refetch - Function to manually refetch transaction
 *
 * @example
 * ```tsx
 * function TransactionStatus({ txId }: { txId: string }) {
 *   const { transaction, isLoading, error, refetch } = useTransactionStatus(txId);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!transaction) return <div>Transaction not found</div>;
 *
 *   return (
 *     <div>
 *       <p>Status: {transaction.status}</p>
 *       <p>Amount: {transaction.amount} {transaction.token}</p>
 *       {transaction.tx_hash && (
 *         <a href={`https://basescan.org/tx/${transaction.tx_hash}`}>
 *           View on Explorer
 *         </a>
 *       )}
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTransactionStatus(txId: string | null) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: receipt, isLoading: isWaitingForReceipt } =
    useWaitForTransactionReceipt({
      hash: transaction?.tx_hash as `0x${string}` | undefined,
    });

  // Update transaction status when receipt is received
  React.useEffect(() => {
    if (receipt && transaction?.status === "sent") {
      updateTransactionStatus(transaction.id, "success")
        .then(setTransaction)
        .catch((err) => setError(err.message));
    }
  }, [receipt, transaction]);

  const fetchTransaction = useCallback(async () => {
    if (!txId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { getTransactionStatus } = await import("./transactions");
      const tx = await getTransactionStatus(txId);
      setTransaction(tx);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch transaction";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [txId]);

  React.useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  return {
    transaction,
    isLoading: isLoading || isWaitingForReceipt,
    error,
    refetch: fetchTransaction,
  };
}

/**
 * React hook to fetch USDC balance for a wallet address.
 * Reads from the USDC contract on Base chain and formats the balance.
 *
 * @param {`0x${string}`} [address] - Wallet address to check balance for
 * @returns {Object} Balance state
 * @returns {string | undefined} return.formattedBalance - Formatted balance with 2 decimals (e.g., "100.50")
 * @returns {boolean} return.isLoading - True while fetching balance
 * @returns {boolean} return.isError - True if fetch failed
 *
 * @example
 * ```tsx
 * function WalletBalance() {
 *   const { address } = useAccount();
 *   const { formattedBalance, isLoading, isError } = useUSDCBalance(address);
 *
 *   if (isLoading) return <div>Loading balance...</div>;
 *   if (isError) return <div>Error loading balance</div>;
 *
 *   return <div>USDC Balance: ${formattedBalance}</div>;
 * }
 * ```
 */
export function useUSDCBalance(address?: `0x${string}`) {
  let balance: bigint | undefined;
  let balanceError: Error | null = null;
  let isLoading = false;

  try {
    const result = useReadContract({
      address: USDC_BASE_ADDRESS as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      chainId: base.id,
      args: address ? [address] : undefined,
      query: {
        enabled: !!address,
      },
    });
    balance = result.data;
    balanceError = result.error;
    isLoading = result.isLoading;
  } catch (error) {
    // WagmiProvider not available yet, return safe defaults
    balance = undefined;
    balanceError = null;
    isLoading = false;
  }

  return {
    formattedBalance:
      balance !== undefined
        ? (Number(balance) / Math.pow(10, USDC_DECIMALS)).toFixed(2)
        : undefined,
    isLoading,
    isError: !!balanceError,
  };
}
