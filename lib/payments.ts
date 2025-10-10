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

export interface CryptoPaymentData {
  recipientId: string;
  amount: string;
  token: string;
  chain: string;
  to: string;
  tokenAddress?: string; // USDC contract address
  decimals?: number; // Token decimals (6 for USDC)
}

export interface CryptoPaymentResult {
  hash: string;
  txId: string;
  status: "pending" | "sent" | "success" | "failed";
}

// USDC contract address on Base
const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;

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
    if (txHash) {
      console.log("[useCryptoPayment] Transaction hash available", {
        txHash,
        isConfirming,
        isConfirmed,
      });
    }
  }, [txHash, isConfirming, isConfirmed]);

  const executePayment = useCallback(
    async (data: CryptoPaymentData): Promise<CryptoPaymentResult> => {
      console.log(
        "[executePayment] ========== PAYMENT EXECUTION STARTED =========="
      );
      console.log("[executePayment] Payment details:", {
        recipientId: data.recipientId,
        recipientAddress: data.to,
        amount: data.amount,
        token: data.token,
        chain: data.chain,
      });
      console.log(
        "[executePayment] User wallet address:",
        userAddress || "NOT CONNECTED"
      );

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
        console.log(
          "[executePayment] Step 1: Creating transaction in database"
        );
        const transaction = await createTransaction({
          recipient_id: data.recipientId,
          chain: data.chain,
          amount: data.amount,
          token: data.token,
        });
        console.log(
          "[executePayment] ✓ Transaction created in DB:",
          transaction.id
        );
        setTransactionId(transaction.id);

        // 2. Prepare transaction parameters
        const amountWei = parseUnits(data.amount, USDC_DECIMALS);
        console.log(
          "[executePayment] Step 2: Preparing transaction parameters"
        );
        console.log("[executePayment] Transfer details:", {
          contract: USDC_BASE_ADDRESS,
          to: data.to,
          amount: data.amount,
          amountWei: amountWei.toString(),
        });

        // 3. Execute the transaction (skipping simulation due to connector limitations)
        console.log(
          "[executePayment] Step 3: Executing blockchain transaction..."
        );
        const hash = await writeContractAsync({
          address: USDC_BASE_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [data.to as `0x${string}`, amountWei],
          chainId: base.id,
        });
        console.log("[executePayment] ✓ Transaction submitted! Hash:", hash);

        if (!hash) {
          console.error("[executePayment] ❌ No transaction hash returned");
          throw new Error("Transaction hash not available");
        }

        // 4. Update transaction with hash and sent status
        console.log(
          "[executePayment] Step 4: Updating database with transaction hash"
        );
        await updateTransactionStatus(transaction.id, "sent", hash);
        console.log("[executePayment] ✓ Database updated");

        console.log(
          "[executePayment] ========== ✓ PAYMENT COMPLETED SUCCESSFULLY =========="
        );
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
            console.log(
              "[executePayment] Marking transaction as failed in database"
            );
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
        console.log(
          "[executePayment] ========== EXECUTION FINISHED =========="
        );
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

// Utility: Get USDC balance for an address (can be used for UI display)
export function useUSDCBalance(address?: `0x${string}`) {
  const { data: balance } = useReadContract({
    address: USDC_BASE_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    chainId: base.id,
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    balance,
    formattedBalance: balance
      ? (Number(balance) / Math.pow(10, USDC_DECIMALS)).toFixed(2)
      : "0",
  };
}
