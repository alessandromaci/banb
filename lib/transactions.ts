import { supabase, type Transaction as DBTransaction } from "./supabase";

/**
 * Re-exported Transaction type from supabase module.
 * @typedef {DBTransaction} Transaction
 */
export type Transaction = DBTransaction;

/**
 * Retrieves all transactions for a specific profile.
 * Returns both sent and received transactions in a single query.
 *
 * @async
 * @function getTransactionsByProfile
 * @param {string} profileId - The UUID of the profile to fetch transactions for
 * @returns {Promise<Transaction[]>} Array of transactions with recipient details
 * @throws {Error} If the database query fails
 *
 * @example
 * const transactions = await getTransactionsByProfile('user-uuid-123');
 * console.log(`Found ${transactions.length} transactions`);
 */
export async function getTransactionsByProfile(
  profileId: string
): Promise<Transaction[]> {
  // Get recipients linked to this profile
  const { data: recipients } = await supabase
    .from("recipients")
    .select("id")
    .eq("profile_id", profileId);

  const recipientIds = recipients?.map((r) => r.id) || [];

  // Get transactions where user is sender OR recipient
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      *,
      recipient:recipients(name, profile_id, external_address)
    `
    )
    .or(
      `sender_profile_id.eq.${profileId},recipient_id.in.(${recipientIds.join(
        ","
      )})`
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return data || [];
}

/**
 * Retrieves recent transactions for a profile with a configurable limit.
 * Returns the most recent transactions ordered by creation date.
 *
 * @async
 * @function getRecentTransactions
 * @param {string} profileId - The UUID of the profile to fetch transactions for
 * @param {number} [limit=5] - Maximum number of transactions to return (default: 5)
 * @returns {Promise<Transaction[]>} Array of recent transactions with recipient details
 * @throws {Error} If the database query fails
 *
 * @example
 * const recentTxs = await getRecentTransactions('user-uuid-123', 10);
 */
export async function getRecentTransactions(
  profileId: string,
  limit: number = 5
): Promise<Transaction[]> {
  // Get recipients linked to this profile
  const { data: recipients } = await supabase
    .from("recipients")
    .select("id")
    .eq("profile_id", profileId);

  const recipientIds = recipients?.map((r) => r.id) || [];

  // Get transactions where user is sender OR recipient
  const query = supabase
    .from("transactions")
    .select(
      `
      *,
      recipient:recipients(name, profile_id, external_address)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  // If user has recipients, include transactions where they're the recipient
  if (recipientIds.length > 0) {
    query.or(
      `sender_profile_id.eq.${profileId},recipient_id.in.(${recipientIds.join(
        ","
      )})`
    );
  } else {
    // Otherwise just get sent transactions
    query.eq("sender_profile_id", profileId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch recent transactions: ${error.message}`);
  }

  return data || [];
}

/**
 * Retrieves only transactions sent by the specified profile.
 *
 * @async
 * @function getSentTransactions
 * @param {string} profileId - The UUID of the profile to fetch sent transactions for
 * @returns {Promise<Transaction[]>} Array of sent transactions with recipient details
 * @throws {Error} If the database query fails
 *
 * @example
 * const sentTxs = await getSentTransactions('user-uuid-123');
 */
export async function getSentTransactions(
  profileId: string
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      *,
      recipient:recipients(name, profile_id, external_address)
    `
    )
    .eq("sender_profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch sent transactions: ${error.message}`);
  }

  return data || [];
}

/**
 * Retrieves only transactions received by the specified profile.
 *
 * @async
 * @function getReceivedTransactions
 * @param {string} profileId - The UUID of the profile to fetch received transactions for
 * @returns {Promise<Transaction[]>} Array of received transactions with sender details
 * @throws {Error} If the database query fails
 *
 * @example
 * const receivedTxs = await getReceivedTransactions('user-uuid-123');
 */
export async function getReceivedTransactions(
  profileId: string
): Promise<Transaction[]> {
  // Get recipients linked to this profile
  const { data: recipients } = await supabase
    .from("recipients")
    .select("id")
    .eq("profile_id", profileId);

  const recipientIds = recipients?.map((r) => r.id) || [];

  if (recipientIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      *,
      sender:profiles!transactions_sender_profile_id_fkey(name, handle)
    `
    )
    .in("recipient_id", recipientIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch received transactions: ${error.message}`);
  }

  return data || [];
}

/**
 * Groups an array of transactions by their creation date.
 * Useful for displaying transactions in a timeline or grouped list view.
 *
 * @function groupTransactionsByDate
 * @param {Transaction[]} transactions - Array of transactions to group
 * @returns {Record<string, Transaction[]>} Object with date strings as keys and transaction arrays as values
 *
 * @example
 * const grouped = groupTransactionsByDate(transactions);
 * // Returns: { "January 15, 2025": [...], "January 14, 2025": [...] }
 */
export function groupTransactionsByDate(
  transactions: Transaction[]
): Record<string, Transaction[]> {
  const grouped: Record<string, Transaction[]> = {};

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
 * Formats a transaction amount with currency symbol.
 * Handles negative amounts and formats to 2 decimal places.
 *
 * @function formatTransactionAmount
 * @param {string | number} amount - The transaction amount to format
 * @param {string} [token="USDC"] - The token/currency symbol (default: "USDC")
 * @returns {string} Formatted amount string (e.g., "123.45 USDC" or "-50.00 USDC")
 *
 * @example
 * formatTransactionAmount(123.456, "USDC") // Returns: "123.46 USDC"
 * formatTransactionAmount(-50, "ETH") // Returns: "-50.00 ETH"
 */
export function formatTransactionAmount(
  amount: string | number,
  token: string = "USDC"
): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  const prefix = numAmount < 0 ? "-" : "";
  const absAmount = Math.abs(numAmount);

  return `${prefix}${absAmount.toFixed(2)} ${token}`;
}

/**
 * Creates a new transaction in the database.
 * Initializes the transaction with "pending" status.
 *
 * @async
 * @function createTransaction
 * @param {Object} data - Transaction data
 * @param {string} data.recipient_id - UUID of the recipient from recipients table
 * @param {string} data.chain - Blockchain network name (e.g., "base")
 * @param {string} data.amount - Transaction amount as string
 * @param {string} data.token - Token symbol (e.g., "USDC")
 * @param {string} [data.sender_profile_id] - UUID of the sender profile (required)
 * @returns {Promise<Transaction>} The created transaction object
 * @throws {Error} If sender_profile_id is missing or database insert fails
 *
 * @example
 * const tx = await createTransaction({
 *   recipient_id: 'recipient-uuid',
 *   chain: 'base',
 *   amount: '100.00',
 *   token: 'USDC',
 *   sender_profile_id: 'sender-uuid'
 * });
 */
export async function createTransaction(data: {
  recipient_id: string;
  chain: string;
  amount: string;
  token: string;
  sender_profile_id?: string; // Made optional for now, should be required
}): Promise<Transaction> {
  // TODO: Get sender_profile_id from auth context
  // For now, we'll need to pass it explicitly or get it from the caller
  if (!data.sender_profile_id) {
    throw new Error("sender_profile_id is required to create a transaction");
  }

  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert({
      sender_profile_id: data.sender_profile_id,
      recipient_id: data.recipient_id,
      chain: data.chain,
      amount: data.amount,
      token: data.token,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create transaction: ${error.message}`);
  }

  return transaction;
}

/**
 * Updates the status of an existing transaction.
 * Optionally updates the blockchain transaction hash.
 *
 * @async
 * @function updateTransactionStatus
 * @param {string} transactionId - UUID of the transaction to update
 * @param {"pending" | "sent" | "success" | "failed"} status - New transaction status
 * @param {string} [txHash] - Optional blockchain transaction hash
 * @returns {Promise<Transaction>} The updated transaction object
 * @throws {Error} If the database update fails
 *
 * @example
 * await updateTransactionStatus('tx-uuid', 'success', '0x123abc...');
 */
export async function updateTransactionStatus(
  transactionId: string,
  status: "pending" | "sent" | "success" | "failed",
  txHash?: string
): Promise<Transaction> {
  const updates: {
    status: "pending" | "sent" | "success" | "failed";
    tx_hash?: string;
  } = { status };
  if (txHash) {
    updates.tx_hash = txHash;
  }

  const { data, error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", transactionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update transaction: ${error.message}`);
  }

  return data;
}

/**
 * Retrieves a single transaction by its ID.
 *
 * @async
 * @function getTransactionStatus
 * @param {string} transactionId - UUID of the transaction to retrieve
 * @returns {Promise<Transaction | null>} The transaction object or null if not found
 * @throws {Error} If the database query fails (excluding not found errors)
 *
 * @example
 * const tx = await getTransactionStatus('tx-uuid-123');
 * if (tx) console.log(`Status: ${tx.status}`);
 */
export async function getTransactionStatus(
  transactionId: string
): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from("transactions")
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
