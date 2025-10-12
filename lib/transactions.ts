import { supabase, type Transaction as DBTransaction } from "./supabase";

// Re-export the database transaction type
export type Transaction = DBTransaction;

/**
 * Get all transactions for a profile (sent OR received)
 * Profile-centric: Gets transactions where user is sender OR recipient
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
 * Get recent transactions for a profile (limited)
 * Profile-centric: Gets recent transactions where user is sender OR recipient
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
 * Get sent transactions only
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
 * Get received transactions only
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
 * Group transactions by date
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
 * Format transaction amount with currency
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
 * Create a new transaction
 * NOTE: This function requires sender_profile_id but we get it from the current user context
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
 * Update transaction status
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
 * Get transaction by ID
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
