import { supabase, type Transaction } from "./supabase";

export async function getTransactionStatus(
  txId: string
): Promise<Transaction | null> {
  const { data: transaction, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", txId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to get transaction: ${error.message}`);
  }

  return transaction;
}

export async function updateTransactionStatus(
  txId: string,
  status: Transaction["status"],
  txHash?: string
): Promise<Transaction> {
  const updateData: Partial<Transaction> = { status };
  if (txHash) {
    updateData.tx_hash = txHash;
  }

  const { data: transaction, error } = await supabase
    .from("transactions")
    .update(updateData)
    .eq("id", txId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update transaction: ${error.message}`);
  }

  return transaction;
}

export async function createTransaction(data: {
  recipient_id: string;
  chain: string;
  amount: string;
  token: string;
}): Promise<Transaction> {
  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert({
      ...data,
      status: "pending",
      tx_hash: null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create transaction: ${error.message}`);
  }

  return transaction;
}

