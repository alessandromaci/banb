/**
 * @fileoverview Hook for using the selected account in transaction flows.
 * Provides utilities for checking account balance, validating transactions, etc.
 */

"use client";

import { useMemo } from "react";
import { useSelectedAccount } from "./account-context";
import { useUser } from "./user-context";
import { type Account } from "./supabase";

/**
 * Hook for transaction-related account operations.
 *
 * @returns Transaction account utilities
 *
 * @example
 * ```tsx
 * function SendPaymentPage() {
 *   const {
 *     account,
 *     hasAccount,
 *     balance,
 *     canAfford,
 *     accountAddress
 *   } = useTransactionAccount();
 *
 *   if (!hasAccount) {
 *     return <div>Please select an account</div>;
 *   }
 *
 *   const handleSend = async (amount: string) => {
 *     if (!canAfford(amount)) {
 *       toast.error("Insufficient balance");
 *       return;
 *     }
 *     // Proceed with transaction using accountAddress
 *   };
 * }
 * ```
 */
export function useTransactionAccount() {
  const { selectedAccount } = useSelectedAccount();
  const { profile } = useUser();

  const hasAccount = useMemo(() => {
    return selectedAccount !== null;
  }, [selectedAccount]);

  const balance = useMemo(() => {
    if (!selectedAccount) return 0;
    return parseFloat(selectedAccount.balance);
  }, [selectedAccount]);

  const accountAddress = useMemo(() => {
    return selectedAccount?.address || null;
  }, [selectedAccount]);

  const accountNetwork = useMemo(() => {
    return selectedAccount?.network || "base";
  }, [selectedAccount]);

  /**
   * Checks if the account can afford a transaction.
   *
   * @param amount - Transaction amount as string
   * @returns True if account has sufficient balance
   */
  const canAfford = (amount: string | number): boolean => {
    const amountNum = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(amountNum)) return false;
    return balance >= amountNum;
  };

  /**
   * Gets formatted balance string.
   *
   * @returns Formatted balance (e.g., "1,234.56")
   */
  const formattedBalance = useMemo(() => {
    return balance.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [balance]);

  /**
   * Validates if account is ready for transactions.
   *
   * @returns Object with validation result and error message
   */
  const validateAccount = (): { valid: boolean; error?: string } => {
    if (!profile) {
      return { valid: false, error: "User profile not found" };
    }

    if (!selectedAccount) {
      return { valid: false, error: "No account selected" };
    }

    if (selectedAccount.status !== "active") {
      return { valid: false, error: "Account is not active" };
    }

    if (selectedAccount.type === "investment") {
      return { valid: false, error: "Cannot send from investment accounts" };
    }

    return { valid: true };
  };

  return {
    account: selectedAccount,
    hasAccount,
    balance,
    formattedBalance,
    accountAddress,
    accountNetwork,
    canAfford,
    validateAccount,
    profile,
  };
}
