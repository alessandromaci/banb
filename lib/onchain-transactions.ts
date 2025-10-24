/**
 * @fileoverview Onchain transaction fetching via Basescan API.
 * Provides functions to fetch transaction history directly from the Base blockchain.
 */

import { supabase } from "./supabase";
import { getAddress } from "viem";

/**
 * Onchain transaction data from Basescan API.
 */
export interface OnchainTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  tokenDecimal: string;
  timeStamp: string;
  confirmations: string;
  isError: string;
}

/**
 * Formatted onchain transaction for display.
 */
export interface FormattedOnchainTransaction {
  tx_hash: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  date: string;
  direction: "in" | "out";
  status: "confirmed" | "failed";
}

/**
 * Fetches onchain transactions for a user's primary account address.
 * Uses Basescan API to get normal ETH transactions and all ERC20 token transfers.
 * 
 * @param {string} profileId - User profile ID
 * @param {number} [limit=5] - Number of transactions to return (default: 5)
 * @returns {Promise<FormattedOnchainTransaction[]>} Array of formatted transactions
 * @throws {Error} If API call fails or account not found
 * 
 * @example
 * ```typescript
 * const txs = await fetchOnchainTransactions(profileId, 5);
 * txs.forEach(tx => {
 *   console.log(`${tx.direction}: ${tx.amount} ${tx.token} - ${tx.date}`);
 * });
 * ```
 */
export async function fetchOnchainTransactions(
  profileId: string,
  limit: number = 5
): Promise<FormattedOnchainTransaction[]> {
  try {
    // Get user's primary account address - try primary first, fallback to any active account
    const { data: primaryAccount, error: primaryError } = await supabase
      .from("accounts")
      .select("address, name, network")
      .eq("profile_id", profileId)
      .eq("is_primary", true)
      .eq("status", "active")
      .eq("network", "base")
      .single();

    let account = primaryAccount;

    // Fallback: try to get any active Base account if primary not found
    if (primaryError || !account) {
      console.log("[fetchOnchainTransactions] Primary account not found, trying any Base account");
      const { data: anyAccount, error: anyError } = await supabase
        .from("accounts")
        .select("address, name, network")
        .eq("profile_id", profileId)
        .eq("status", "active")
        .eq("network", "base")
        .limit(1)
        .single();
      
      if (anyError || !anyAccount) {
        console.error("[fetchOnchainTransactions] No Base accounts found for profile:", profileId);
        throw new Error("No Base account found for this profile. Please connect a wallet first.");
      }
      
      account = anyAccount;
    }

    // Ensure address is checksummed (proper format for API calls)
    let address: string;
    try {
      address = getAddress(account.address);
      console.log(`[fetchOnchainTransactions] Checksummed address: ${address}`);
    } catch (e) {
      // If checksumming fails, use as-is
      address = account.address;
      console.log(`[fetchOnchainTransactions] Using non-checksummed address: ${address}`);
    }

    console.log(`[fetchOnchainTransactions] Using account: ${account.name || 'Unknown'} (${address}) on ${account.network}`);

    // Use Etherscan v2 API with chainid for Base (chainid=8453)
    const apiKey = process.env.ETHERSCAN_API_KEY || "YourApiKeyToken";
    const baseUrl = "https://api.etherscan.io/v2/api";
    const chainId = 8453; // Base mainnet chain ID

    console.log(`[fetchOnchainTransactions] Fetching onchain transactions for address: ${address}`);
    console.log(`[fetchOnchainTransactions] Using Etherscan v2 API for Base (chainId: ${chainId})`);

    // Fetch both normal ETH transactions and all ERC20 token transfers in parallel
    const [normalTxResponse, tokenTxResponse] = await Promise.all([
      // Normal ETH transactions using Etherscan v2 API
      fetch(
        `${baseUrl}?chainid=${chainId}&module=account&action=txlist&address=${address}&page=1&offset=${limit * 2}&sort=desc&apikey=${apiKey}`
      ),
      // All ERC20 token transfers using Etherscan v2 API (no contract filter = all tokens)
      fetch(
        `${baseUrl}?chainid=${chainId}&module=account&action=tokentx&address=${address}&page=1&offset=${limit * 2}&sort=desc&apikey=${apiKey}`
      ),
    ]);

    console.log(`[fetchOnchainTransactions] API URLs:`, {
      normalTx: `${baseUrl}?chainid=${chainId}&module=account&action=txlist&address=${address}&page=1&offset=${limit * 2}&sort=desc`,
      tokenTx: `${baseUrl}?chainid=${chainId}&module=account&action=tokentx&address=${address}&page=1&offset=${limit * 2}&sort=desc`
    });

    if (!normalTxResponse.ok || !tokenTxResponse.ok) {
      throw new Error(`Basescan API error: ${normalTxResponse.status}`);
    }

    const [normalTxData, tokenTxData] = await Promise.all([
      normalTxResponse.json(),
      tokenTxResponse.json(),
    ]);

    console.log(`[fetchOnchainTransactions] Normal TX API response:`, {
      status: normalTxData.status,
      message: normalTxData.message,
      resultCount: normalTxData.result?.length || 0
    });
    console.log(`[fetchOnchainTransactions] Token TX API response:`, {
      status: tokenTxData.status,
      message: tokenTxData.message,
      resultCount: tokenTxData.result?.length || 0
    });

    const allTransactions: FormattedOnchainTransaction[] = [];

    // Process normal ETH transactions
    if (normalTxData.status === "1" && normalTxData.result) {
      const normalTxs: Array<{
        hash: string;
        from: string;
        to: string;
        value: string;
        timeStamp: string;
        isError: string;
      }> = normalTxData.result;

      normalTxs.forEach((tx) => {
        const isIncoming = tx.to.toLowerCase() === address.toLowerCase();
        const value = parseFloat(tx.value) / 1e18; // ETH has 18 decimals

        // Only include transactions with value > 0
        if (value > 0) {
          allTransactions.push({
            tx_hash: tx.hash,
            from: tx.from,
            to: tx.to,
            amount: value.toFixed(6),
            token: "ETH",
            date: new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString(),
            direction: isIncoming ? "in" : "out",
            status: tx.isError === "0" ? "confirmed" : "failed",
          });
        }
      });
    }

    // Process ERC20 token transactions
    if (tokenTxData.status === "1" && tokenTxData.result) {
      const tokenTxs: OnchainTransaction[] = tokenTxData.result;

      tokenTxs.forEach((tx) => {
        const isIncoming = tx.to.toLowerCase() === address.toLowerCase();
        const decimals = parseInt(tx.tokenDecimal || "18");
        const value = parseFloat(tx.value) / Math.pow(10, decimals);

        allTransactions.push({
          tx_hash: tx.hash,
          from: tx.from,
          to: tx.to,
          amount: value.toFixed(decimals <= 6 ? 2 : 6),
          token: tx.tokenSymbol || "UNKNOWN",
          date: new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString(),
          direction: isIncoming ? "in" : "out",
          status: tx.isError === "0" ? "confirmed" : "failed",
        });
      });
    }

    // Sort all transactions by timestamp (most recent first)
    allTransactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    // Return only the requested limit
    const result = allTransactions.slice(0, limit);

    console.log(`Successfully fetched ${result.length} onchain transactions (${allTransactions.length} total before limit)`);
    return result;
  } catch (error) {
    console.error("[fetchOnchainTransactions] Error:", error);
    throw error;
  }
}

/**
 * Gets the Base explorer URL for an address.
 * 
 * @param {string} address - Wallet address
 * @returns {string} Base explorer URL
 */
export function getBasescanAddressUrl(address: string): string {
  return `https://basescan.org/address/${address}`;
}

/**
 * Gets the Base explorer URL for a transaction.
 * 
 * @param {string} txHash - Transaction hash
 * @returns {string} Base explorer URL
 */
export function getBasescanTxUrl(txHash: string): string {
  return `https://basescan.org/tx/${txHash}`;
}
