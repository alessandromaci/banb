/**
 * @fileoverview Account management functions for multi-wallet support.
 * Provides functions to create, update, retrieve, and manage user accounts.
 * Each profile can have multiple accounts (spending, investment, savings).
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, type Account } from "./supabase";

/**
 * Data required to create a new account.
 */
export interface CreateAccountData {
  profile_id: string;
  name: string;
  type: "spending" | "investment" | "savings";
  address: string;
  network: string;
  is_primary?: boolean;
}

/**
 * Data for updating an existing account.
 */
export interface UpdateAccountData {
  name?: string;
  balance?: string;
  status?: "active" | "inactive";
  is_primary?: boolean;
}

/**
 * Creates a new account for a user profile.
 *
 * @param {CreateAccountData} data - Account creation data
 * @returns {Promise<Account>} Created account object
 * @throws {Error} If account creation fails
 *
 * @example
 * ```typescript
 * const account = await createAccount({
 *   profile_id: currentUser.id,
 *   name: "Spending Account",
 *   type: "spending",
 *   address: "0x1234...",
 *   network: "base",
 *   is_primary: false
 * });
 * ```
 */
export async function createAccount(data: CreateAccountData): Promise<Account> {
  const { data: account, error } = await supabase
    .from("accounts")
    .insert({
      profile_id: data.profile_id,
      name: data.name,
      type: data.type,
      address: data.address.toLowerCase(),
      network: data.network,
      is_primary: data.is_primary || false,
      balance: "0",
      status: "active",
    })
    .select()
    .single();

  if (error) {
    // Check for unique constraint violation
    if (error.code === "23505") {
      throw new Error("This wallet is already connected to your account");
    }
    throw new Error(`Failed to create account: ${error.message}`);
  }

  return account;
}

/**
 * Retrieves all accounts for a profile.
 *
 * @param {string} profileId - UUID of the profile
 * @param {boolean} [activeOnly=true] - If true, returns only active accounts
 * @returns {Promise<Account[]>} Array of accounts
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * const accounts = await getAccountsByProfile(currentUser.id);
 * const allAccounts = await getAccountsByProfile(currentUser.id, false);
 * ```
 */
export async function getAccountsByProfile(
  profileId: string,
  activeOnly: boolean = true
): Promise<Account[]> {
  let query = supabase
    .from("accounts")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (activeOnly) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch accounts: ${error.message}`);
  }

  return data || [];
}

/**
 * Retrieves a single account by ID.
 *
 * @param {string} accountId - UUID of the account
 * @returns {Promise<Account | null>} Account if found, null otherwise
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * const account = await getAccountById(accountId);
 * if (account) {
 *   console.log(`Account: ${account.name}`);
 * }
 * ```
 */
export async function getAccountById(
  accountId: string
): Promise<Account | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to get account: ${error.message}`);
  }

  return data;
}

/**
 * Retrieves account by wallet address.
 *
 * @param {string} address - Wallet address
 * @param {string} [profileId] - Optional profile ID to filter by
 * @returns {Promise<Account | null>} Account if found, null otherwise
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * const account = await getAccountByAddress("0x1234...");
 * const userAccount = await getAccountByAddress("0x1234...", currentUser.id);
 * ```
 */
export async function getAccountByAddress(
  address: string,
  profileId?: string
): Promise<Account | null> {
  let query = supabase
    .from("accounts")
    .select("*")
    .eq("address", address.toLowerCase())
    .eq("status", "active");

  if (profileId) {
    query = query.eq("profile_id", profileId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to get account: ${error.message}`);
  }

  return data;
}

/**
 * Gets the primary account for a profile.
 *
 * @param {string} profileId - UUID of the profile
 * @returns {Promise<Account | null>} Primary account if found, null otherwise
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * const primaryAccount = await getPrimaryAccount(currentUser.id);
 * ```
 */
export async function getPrimaryAccount(
  profileId: string
): Promise<Account | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_primary", true)
    .eq("status", "active")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to get primary account: ${error.message}`);
  }

  return data;
}

/**
 * Updates an account.
 *
 * @param {string} accountId - UUID of the account to update
 * @param {UpdateAccountData} data - Update data
 * @returns {Promise<Account>} Updated account object
 * @throws {Error} If update fails
 *
 * @example
 * ```typescript
 * const updated = await updateAccount(accountId, {
 *   name: "New Account Name",
 *   balance: "1000.50"
 * });
 * ```
 */
export async function updateAccount(
  accountId: string,
  data: UpdateAccountData
): Promise<Account> {
  const { data: account, error } = await supabase
    .from("accounts")
    .update(data)
    .eq("id", accountId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update account: ${error.message}`);
  }

  if (!account) {
    throw new Error("Account not found or update failed");
  }

  return account;
}

/**
 * Updates account balance.
 *
 * @param {string} accountId - UUID of the account
 * @param {string} balance - New balance as string
 * @returns {Promise<Account>} Updated account object
 * @throws {Error} If update fails
 *
 * @example
 * ```typescript
 * await updateAccountBalance(accountId, "1234.56");
 * ```
 */
export async function updateAccountBalance(
  accountId: string,
  balance: string
): Promise<Account> {
  return updateAccount(accountId, { balance });
}

/**
 * Sets an account as primary and unsets other primary accounts for the profile.
 *
 * @param {string} accountId - UUID of the account to set as primary
 * @returns {Promise<Account>} Updated primary account
 * @throws {Error} If update fails
 *
 * @example
 * ```typescript
 * await setPrimaryAccount(newPrimaryAccountId);
 * ```
 */
export async function setPrimaryAccount(accountId: string): Promise<Account> {
  // Get the account to find profile_id
  const account = await getAccountById(accountId);
  if (!account) {
    throw new Error("Account not found");
  }

  // Unset all primary accounts for this profile
  await supabase
    .from("accounts")
    .update({ is_primary: false })
    .eq("profile_id", account.profile_id);

  // Set this account as primary
  return updateAccount(accountId, { is_primary: true });
}

/**
 * Soft deletes an account by setting status to inactive.
 *
 * @param {string} accountId - UUID of the account to deactivate
 * @returns {Promise<void>}
 * @throws {Error} If deactivation fails
 *
 * @example
 * ```typescript
 * await deactivateAccount(accountId);
 * ```
 */
export async function deactivateAccount(accountId: string): Promise<void> {
  const { error } = await supabase
    .from("accounts")
    .update({ status: "inactive" })
    .eq("id", accountId);

  if (error) {
    throw new Error(`Failed to deactivate account: ${error.message}`);
  }
}

/**
 * React hook to manage user accounts.
 * Provides CRUD operations for accounts and tracks account state.
 *
 * @param {string} [profileId] - User profile ID for account management
 * @returns {Object} Account management state and actions
 *
 * @example
 * ```typescript
 * function AccountManager() {
 *   const { accounts, isLoading, createAccount, refreshAccounts } =
 *     useAccounts(profileId);
 *
 *   const handleAddAccount = async () => {
 *     await createAccount({
 *       profile_id: profileId,
 *       name: "New Account",
 *       type: "spending",
 *       address: "0x1234...",
 *       network: "base"
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       {accounts.map(account => (
 *         <div key={account.id}>{account.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAccounts(profileId?: string) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!profileId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getAccountsByProfile(profileId);
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch accounts");
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const addAccount = async (data: CreateAccountData): Promise<Account> => {
    const account = await createAccount(data);
    setAccounts((prev) => [account, ...prev]);
    return account;
  };

  const updateAccountById = async (
    accountId: string,
    data: UpdateAccountData
  ): Promise<Account> => {
    const account = await updateAccount(accountId, data);
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? account : acc))
    );
    return account;
  };

  const removeAccount = async (accountId: string): Promise<void> => {
    await deactivateAccount(accountId);
    setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
  };

  return {
    accounts,
    isLoading,
    error,
    createAccount: addAccount,
    updateAccount: updateAccountById,
    deactivateAccount: removeAccount,
    refreshAccounts: fetchAccounts,
    primaryAccount: accounts.find((acc) => acc.is_primary) || null,
  };
}
