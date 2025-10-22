/**
 * @fileoverview Account transaction management functions.
 * Provides functions to create, update, retrieve, and manage transactions for accounts.
 */

"use client";

import { supabase, type AccountTransaction } from "./supabase";

/**
 * Data required to create a new account transaction.
 */
export interface CreateAccountTransactionData {
  account_id: string;
  amount: string;
  direction: "in" | "out";
  counterparty?: string;
  counterparty_name?: string;
  tx_hash?: string;
  token_symbol?: string;
  network: string;
  status?: "pending" | "confirmed" | "failed";
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates a new account transaction.
 *
 * @param {CreateAccountTransactionData} data - Transaction creation data
 * @returns {Promise<AccountTransaction>} Created transaction object
 * @throws {Error} If transaction creation fails
 *
 * @example
 * ```typescript
 * const transaction = await createAccountTransaction({
 *   account_id: accountId,
 *   amount: "100.00",
 *   direction: "out",
 *   counterparty: "0x5678...",
 *   counterparty_name: "John Doe",
 *   token_symbol: "USDC",
 *   network: "base",
 *   status: "pending"
 * });
 * ```
 */
export async function createAccountTransaction(
  data: CreateAccountTransactionData
): Promise<AccountTransaction> {
  const { data: transaction, error } = await supabase
    .from("account_transactions")
    .insert({
      account_id: data.account_id,
      amount: data.amount,
      direction: data.direction,
      counterparty: data.counterparty || null,
      counterparty_name: data.counterparty_name || null,
      tx_hash: data.tx_hash || null,
      token_symbol: data.token_symbol || "USDC",
      network: data.network,
      status: data.status || "pending",
      description: data.description || null,
      metadata: data.metadata || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create transaction: ${error.message}`);
  }

  return transaction;
}

/**
 * Retrieves all transactions for an account.
 *
 * @param {string} accountId - UUID of the account
 * @param {number} [limit] - Optional limit for number of transactions
 * @returns {Promise<AccountTransaction[]>} Array of transactions
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * const transactions = await getTransactionsByAccount(accountId);
 * const recentTxs = await getTransactionsByAccount(accountId, 10);
 * ```
 */
export async function getTransactionsByAccount(
  accountId: string,
  limit?: number
): Promise<AccountTransaction[]> {
  let query = supabase
    .from("account_transactions")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return data || [];
}

/**
 * Retrieves a single transaction by ID.
 *
 * @param {string} transactionId - UUID of the transaction
 * @returns {Promise<AccountTransaction | null>} Transaction if found, null otherwise
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * const transaction = await getAccountTransactionById(txId);
 * ```
 */
export async function getAccountTransactionById(
  transactionId: string
): Promise<AccountTransaction | null> {
  const { data, error } = await supabase
    .from("account_transactions")
    .select("*")
    .eq("id", transactionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to get transaction: ${error.message}`);
  }

  return data;
}

/**
 * Retrieves transaction by blockchain hash.
 *
 * @param {string} txHash - Blockchain transaction hash
 * @returns {Promise<AccountTransaction | null>} Transaction if found, null otherwise
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * const transaction = await getAccountTransactionByHash("0x1234...");
 * ```
 */
export async function getAccountTransactionByHash(
  txHash: string
): Promise<AccountTransaction | null> {
  const { data, error } = await supabase
    .from("account_transactions")
    .select("*")
    .eq("tx_hash", txHash)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to get transaction: ${error.message}`);
  }

  return data;
}

/**
 * Updates a transaction's status and optionally adds the blockchain transaction hash.
 *
 * @param {string} transactionId - UUID of the transaction to update
 * @param {"pending" | "confirmed" | "failed"} status - New status
 * @param {string} [txHash] - Blockchain transaction hash (optional)
 * @returns {Promise<AccountTransaction>} Updated transaction object
 * @throws {Error} If update fails
 *
 * @example
 * ```typescript
 * await updateAccountTransactionStatus(txId, "confirmed", "0x1234...");
 * ```
 */
export async function updateAccountTransactionStatus(
  transactionId: string,
  status: "pending" | "confirmed" | "failed",
  txHash?: string
): Promise<AccountTransaction> {
  const updates: {
    status: "pending" | "confirmed" | "failed";
    tx_hash?: string;
  } = { status };

  if (txHash) {
    updates.tx_hash = txHash;
  }

  const { data, error } = await supabase
    .from("account_transactions")
    .update(updates)
    .eq("id", transactionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update transaction: ${error.message}`);
  }

  if (!data) {
    throw new Error("Transaction not found or update failed");
  }

  return data;
}

/**
 * Retrieves recent transactions across all accounts for a profile.
 *
 * @param {string} profileId - UUID of the profile
 * @param {number} [limit=10] - Maximum number of transactions to return
 * @returns {Promise<Array<AccountTransaction & { account: { name: string, type: string } }>>} Array of transactions with account info
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * const recentTxs = await getRecentAccountTransactions(profileId, 5);
 * ```
 */
export async function getRecentAccountTransactions(
  profileId: string,
  limit: number = 10
): Promise<
  Array<AccountTransaction & { account: { name: string; type: string } }>
> {
  const { data, error } = await supabase
    .from("account_transactions")
    .select(
      `
      *,
      account:accounts!inner(name, type, profile_id)
    `
    )
    .eq("account.profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch recent transactions: ${error.message}`);
  }

  return (data as Array<AccountTransaction & { account: { name: string; type: string } }>) || [];
}

/**
 * Groups account transactions by date.
 *
 * @param {AccountTransaction[]} transactions - Array of transactions to group
 * @returns {Record<string, AccountTransaction[]>} Object with date strings as keys
 *
 * @example
 * ```typescript
 * const grouped = groupAccountTransactionsByDate(transactions);
 * // { "October 15, 2025": [...], "October 14, 2025": [...] }
 * ```
 */
export function groupAccountTransactionsByDate(
  transactions: AccountTransaction[]
): Record<string, AccountTransaction[]> {
  const grouped: Record<string, AccountTransaction[]> = {};

  transactions.forEach((tx) => {
    const date = new Date(tx.created_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(tx);
  });

  return grouped;
}

/**
 * Calculates total incoming and outgoing amounts for an account.
 *
 * @param {string} accountId - UUID of the account
 * @returns {Promise<{ totalIn: number, totalOut: number, net: number }>} Transaction totals
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * const totals = await getAccountTransactionTotals(accountId);
 * console.log(`Net: $${totals.net}`);
 * ```
 */
export async function getAccountTransactionTotals(
  accountId: string
): Promise<{ totalIn: number; totalOut: number; net: number }> {
  const transactions = await getTransactionsByAccount(accountId);

  const totalIn = transactions
    .filter((tx) => tx.direction === "in" && tx.status === "confirmed")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const totalOut = transactions
    .filter((tx) => tx.direction === "out" && tx.status === "confirmed")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  return {
    totalIn,
    totalOut,
    net: totalIn - totalOut,
  };
}

/**
 * Formats a transaction amount with sign and currency symbol.
 *
 * @param {AccountTransaction} transaction - Transaction to format
 * @returns {string} Formatted amount (e.g., "+$100.00", "-$50.00")
 *
 * @example
 * ```typescript
 * const formatted = formatAccountTransactionAmount(transaction);
 * // "+$100.00" for incoming, "-$50.00" for outgoing
 * ```
 */
export function formatAccountTransactionAmount(
  transaction: AccountTransaction
): string {
  const amount = parseFloat(transaction.amount);
  const sign = transaction.direction === "in" ? "+" : "-";
  const symbol = "$"; // Default to USD, can be extended for other currencies

  return `${sign}${symbol}${amount.toFixed(2)}`;
}
