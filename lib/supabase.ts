import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  name: string;
  handle: string;
  wallet_address: string;
  balance: string;
  created_at: string;
  updated_at: string;
}

export interface Recipient {
  id: string;
  name: string;
  status: "active" | "inactive";
  wallets: {
    address: string;
    network: string;
  }[];
  created_at: string;
}

export interface Transaction {
  id: string;
  recipient_id: string;
  tx_hash: string | null;
  chain: string;
  amount: string;
  token: string;
  status: "pending" | "sent" | "success" | "failed";
  created_at: string;
}
