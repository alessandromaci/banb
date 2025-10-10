"use client";

import React, { useState, useCallback } from "react";
import {
  useSendTransaction,
  useWaitForTransactionReceipt,
  useSimulateContract,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { parseUnits } from "viem";
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

  const { sendTransaction, data: txHash } = useSendTransaction();

  const executePayment = useCallback(
    async (data: CryptoPaymentData): Promise<CryptoPaymentResult> => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Create transaction record in Supabase with pending status
        const transaction = await createTransaction({
          recipient_id: data.recipientId,
          chain: data.chain,
          amount: data.amount,
          token: data.token,
        });

        let hash: string;

        // 2. Determine if this is a USDC payment or native ETH
        if (data.token === "USDC" && data.tokenAddress) {
          // USDC ERC20 transfer - for now, throw error as this needs UI integration
          throw new Error(
            "USDC payments require UI integration with approve + transfer flow"
          );
        } else {
          // Native ETH transfer
          await sendTransaction({
            to: data.to as `0x${string}`,
            value: parseUnits(data.amount, 18), // ETH has 18 decimals
          });

          // Wait for txHash to be available
          if (!txHash) {
            throw new Error("Transaction hash not available");
          }
          hash = txHash;
        }

        // 3. Update transaction with hash and sent status
        await updateTransactionStatus(transaction.id, "sent", hash);

        return {
          hash,
          txId: transaction.id,
          status: "sent",
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Payment failed";
        setError(errorMessage);

        // Update transaction status to failed if we have a transaction record
        if (data.recipientId) {
          try {
            await updateTransactionStatus(data.recipientId, "failed");
          } catch (updateError) {
            console.error("Failed to update transaction status:", updateError);
          }
        }

        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [sendTransaction, txHash]
  );

  return {
    executePayment,
    isLoading,
    error,
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

// Hook for USDC balance checking
export function useUSDCBalance(address?: `0x${string}`) {
  const {
    data: balance,
    isLoading,
    error,
  } = useReadContract({
    address: USDC_BASE_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    balance,
    isLoading,
    error,
    formattedBalance: balance
      ? (Number(balance) / Math.pow(10, USDC_DECIMALS)).toFixed(6)
      : "0",
  };
}

// Hook for USDC allowance checking
export function useUSDCAllowance(
  owner?: `0x${string}`,
  spender?: `0x${string}`
) {
  const {
    data: allowance,
    isLoading,
    error,
  } = useReadContract({
    address: USDC_BASE_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!owner && !!spender,
    },
  });

  return {
    allowance,
    isLoading,
    error,
    formattedAllowance: allowance
      ? (Number(allowance) / Math.pow(10, USDC_DECIMALS)).toFixed(6)
      : "0",
  };
}

// Hook for USDC approve transaction
export function useUSDCApprove() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract } = useWriteContract();

  const approve = useCallback(
    async (spender: `0x${string}`, amount: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const amountInWei = parseUnits(amount, USDC_DECIMALS);

        await writeContract({
          address: USDC_BASE_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [spender, amountInWei],
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Approve failed";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [writeContract]
  );

  return {
    approve,
    isLoading,
    error,
  };
}

// Hook for USDC transfer transaction
export function useUSDCTransfer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract } = useWriteContract();

  const transfer = useCallback(
    async (to: `0x${string}`, amount: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const amountInWei = parseUnits(amount, USDC_DECIMALS);

        await writeContract({
          address: USDC_BASE_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [to, amountInWei],
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Transfer failed";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [writeContract]
  );

  return {
    transfer,
    isLoading,
    error,
  };
}

// Hook for USDC approve + transfer flow
export function useUSDCPayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<
    "idle" | "approving" | "transferring" | "completed"
  >("idle");

  const {
    approve,
    isLoading: isApproving,
    error: approveError,
  } = useUSDCApprove();
  const {
    transfer,
    isLoading: isTransferring,
    error: transferError,
  } = useUSDCTransfer();

  const executePayment = useCallback(
    async (to: `0x${string}`, amount: string) => {
      setIsLoading(true);
      setError(null);
      setStep("approving");

      try {
        // Step 1: Approve USDC spending
        await approve(to, amount);
        setStep("transferring");

        // Step 2: Transfer USDC
        await transfer(to, amount);
        setStep("completed");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "USDC payment failed";
        setError(errorMessage);
        setStep("idle");
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [approve, transfer]
  );

  return {
    executePayment,
    isLoading: isLoading || isApproving || isTransferring,
    error: error || approveError || transferError,
    step,
  };
}
