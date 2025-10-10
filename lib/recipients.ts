import { supabase, type Recipient } from "./supabase";

export interface AddRecipientData {
  name: string;
  wallets: {
    address: string;
    network: string;
  }[];
}

export async function addRecipient(data: AddRecipientData): Promise<Recipient> {
  const { data: recipient, error } = await supabase
    .from("recipients")
    .insert({
      name: data.name,
      status: "active",
      wallets: data.wallets,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add recipient: ${error.message}`);
  }

  return recipient;
}

export async function getRecipient(id: string): Promise<Recipient | null> {
  const { data: recipient, error } = await supabase
    .from("recipients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to get recipient: ${error.message}`);
  }

  return recipient;
}

